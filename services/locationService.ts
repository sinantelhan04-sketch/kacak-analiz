
export interface ResolvedLocation {
  lat: number;
  lng: number;
  district: string;     // ilçe
  city: string;         // il
  province?: string;    // ekstra netlik için (isteğe bağlı)
  country: string;
  fullName?: string;
  confidence?: number;  // opsiyonel: Nominatim'in verdiği önem sırası
}

/**
 * Nominatim reverse geocoding ile koordinattan il/ilçe çözümler
 * NOT: Browser'da direkt çağırmak yerine backend proxy veya caching katmanı önerilir
 */
export const resolveLocationOSM = async (
  lat: number,
  lng: number,
  options: { cacheTimeout?: number } = {}
): Promise<ResolvedLocation | null> => {
  // Çok basit bir in-memory cache (gerçek projede localStorage veya ayrı cache servisi olmalı)
  const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = window.sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      // 24 saatlik cache süresi örneği
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        return parsed.data;
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", lat.toString());
  url.searchParams.set("lon", lng.toString());
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "tr");
  url.searchParams.set("zoom", "18");           // Sokak/Bina seviyesine kadar detay için
  // email yerine gerçekten çalışan User-Agent benzeri bir şey (Nominatim bunu daha çok dikkate alır)
  url.searchParams.set("email", "kacak-analiz@example.com");

  try {
    const response = await window.fetch(url, {
      headers: {
        // Nominatim kuralları: gerçek User-Agent koymak önemli
        "User-Agent": "KacakAnaliz/1.0 (kacak-analiz@example.com)",
        "Referer": window.location.origin, // ek güvenilirlik için
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("[Nominatim] Rate limit aşıldı → 1-2 dk bekleyin");
      }
      return null;
    }

    const data = await response.json();

    if (!data?.address) {
      return null;
    }

    const addr = data.address;

    // Türkiye için en iyi eşleşme sırası (2024-2025 tecrübesi)
    let district =
      addr.town ||
      addr.city_district ||
      addr.county ||
      addr.suburb ||
      addr.municipality ||
      addr.neighbourhood ||
      addr.quarter ||
      addr.village ||
      addr.hamlet ||
      addr.residential ||
      "";

    let city =
      addr.city ||
      addr.town ||
      addr.province ||
      addr.state_district ||
      addr.state ||
      "";

    // Bazı durumlarda il adı "state" içinde geliyor ama daha net "province" tercih edilmeli
    const province = addr.province || addr.state || "";

    // Çok küçük yerleşimlerde ilçe boş kalırsa ilçe = il yapma eğilimi (opsiyonel)
    if (!district && city && province && city === province) {
      district = city;
    }

    // Ağrı ilçeleri için özel düzeltme (Kullanıcı talebi)
    const agriIlceleri = ["merkez", "tutak", "patnos", "doğubayazıt", "diyadin", "taşlıçay", "hamur", "eleşkirt"];
    const isAgri = city.toLocaleLowerCase('tr-TR') === "ağrı" || province.toLocaleLowerCase('tr-TR') === "ağrı";
    
    if (isAgri) {
      const lowerFullName = (data.display_name || "").toLocaleLowerCase('tr-TR');
      const lowerDistrict = district.toLocaleLowerCase('tr-TR');
      
      let foundDistrict = "";
      for (const ilce of agriIlceleri) {
        if (lowerDistrict.includes(ilce) || lowerFullName.includes(ilce)) {
          // Özel büyük harf dönüşümü
          if (ilce === "doğubayazıt") foundDistrict = "Doğubayazıt";
          else if (ilce === "taşlıçay") foundDistrict = "Taşlıçay";
          else if (ilce === "eleşkirt") foundDistrict = "Eleşkirt";
          else foundDistrict = ilce.charAt(0).toLocaleUpperCase('tr-TR') + ilce.slice(1);
          break;
        }
      }
      
      if (foundDistrict) {
        district = foundDistrict;
      } else {
        // Eğer hiçbir ilçe bulunamadıysa ve Ağrı ise varsayılan olarak Merkez diyebiliriz
        // veya olduğu gibi bırakabiliriz. Şimdilik olduğu gibi bırakalım ama Merkez kontrolü ekleyelim.
        if (lowerFullName.includes("ağrı merkez") || lowerDistrict === "ağrı") {
           district = "Merkez";
        }
      }
    }

    const result: ResolvedLocation = {
      lat,
      lng,
      district: district.trim() || "—",
      city: city.trim() || "—",
      province: province.trim() || undefined,
      country: addr.country || "Türkiye",
      fullName: data.display_name,
      // Nominatim'in verdiği güven skoru (opsiyonel)
      confidence: data.importance ? Math.round(data.importance * 100) : undefined,
    };

    // Cache'e yaz
    window.sessionStorage.setItem(
      cacheKey,
      JSON.stringify({
        timestamp: Date.now(),
        data: result,
      })
    );

    return result;
  } catch (err) {
    if (err instanceof window.DOMException && err.name === "AbortError") {
      return null; // kullanıcı iptal etti
    }
    console.error("[resolveLocationOSM]", err);
    return null;
  }
};

/**
 * HGM Atlas API kullanarak koordinattan ilçe bilgisi bulur
 * Kullanıcı tarafından sağlanan API: https://atlas.harita.gov.tr/webservis/arama/reverse
 */
export const resolveLocationHGM = async (
  lat: number,
  lng: number
): Promise<ResolvedLocation | null> => {
  const apiKey = import.meta.env.VITE_HGM_ATLAS_API_KEY;
  if (!apiKey) return null;

  // Cache kontrolü
  const cacheKey = `hgm_rev_${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = window.sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        return parsed.data;
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  // Kullanıcı tarafından sağlanan URL yapısı:
  // https://atlas.harita.gov.tr/webservis/arama/reverse?lat={enlem}&lng={boylam}&apikey=[apiKey]
  const url = new URL("https://atlas.harita.gov.tr/webservis/arama/reverse");
  url.searchParams.set("lat", lat.toString());
  url.searchParams.set("lng", lng.toString());
  url.searchParams.set("apikey", apiKey);

  try {
    const response = await window.fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    
    // HGM Atlas reverse response formatı:
    // data.features[0].properties: { confidence, name, locality, county, region, type }
    const feature = data.features?.[0];
    const props = feature?.properties;
    
    if (!props) return null;

    const resolved: ResolvedLocation = {
      lat,
      lng,
      district: props.county || "—",
      city: props.region || "—",
      country: "Türkiye",
      fullName: [props.name, props.locality, props.county, props.region].filter(Boolean).join(", "),
      confidence: props.confidence ? Math.round(props.confidence * 100) : undefined
    };

    window.sessionStorage.setItem(
      cacheKey,
      JSON.stringify({
        timestamp: Date.now(),
        data: resolved,
      })
    );

    return resolved;
  } catch (err) {
    console.error("[resolveLocationHGM]", err);
    return null;
  }
};

/**
 * Birleşik lokasyon çözümleme fonksiyonu.
 * HGM Atlas API anahtarı varsa onu önceler, yoksa OSM Nominatim kullanır.
 */
export const resolveLocation = async (
  lat: number,
  lng: number
): Promise<ResolvedLocation | null> => {
  const hgmKey = import.meta.env.VITE_HGM_ATLAS_API_KEY;
  
  if (hgmKey) {
    const hgmResult = await resolveLocationHGM(lat, lng);
    if (hgmResult && hgmResult.district !== "—") {
      return hgmResult;
    }
  }
  
  return resolveLocationOSM(lat, lng);
};
