
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
  options: { signal?: AbortSignal; cacheTimeout?: number } = {}
): Promise<ResolvedLocation | null> => {
  // Çok basit bir in-memory cache (gerçek projede localStorage veya ayrı cache servisi olmalı)
  const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      // 24 saatlik cache süresi örneği
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        return parsed.data;
      }
      } catch {
        // ignore parse errors
      }
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", lat.toString());
  url.searchParams.set("lon", lng.toString());
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "tr");
  url.searchParams.set("zoom", "14");           // ilçe seviyesine yakınlaştırmak için
  // email yerine gerçekten çalışan User-Agent benzeri bir şey (Nominatim bunu daha çok dikkate alır)
  url.searchParams.set("email", "kacak-analiz@example.com");

  try {
    const response = await fetch(url, {
      signal: options.signal,
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
    sessionStorage.setItem(
      cacheKey,
      JSON.stringify({
        timestamp: Date.now(),
        data: result,
      })
    );

    return result;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return null; // kullanıcı iptal etti
    }
    console.error("[resolveLocationOSM]", err);
    return null;
  }
};
