
export interface ResolvedLocation {
  lat: number;
  lng: number;
  district: string;
  city: string;
  country: string;
  fullName?: string;
}

export const resolveLocationOSM = async (
  lat: number,
  lng: number
): Promise<ResolvedLocation | null> => {
  // Nominatim requires identification. In a browser, we can't set User-Agent,
  // so we use the 'email' parameter as an alternative identification method.
  const email = 'kacak-analiz@example.com'; 
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1&accept-language=tr&email=${encodeURIComponent(email)}`;

  try {
    const response = await window.fetch(url);
    
    if (!response.ok) {
        if (response.status === 429) {
            console.warn("Nominatim rate limit exceeded");
        }
        return null;
    }

    const data = await response.json();

    if (data && data.address) {
      const addr = data.address;
      // Matching user's Python script priority:
      const district = addr.town || addr.county || addr.city_district || addr.suburb || addr.residential || "";
      const city = addr.city || addr.province || addr.state || "";
      const country = addr.country || "";
      const fullName = data.display_name;

      return { lat, lng, district, city, country, fullName };
    }
    return null;
  } catch (error) {
    console.error("OSM Nominatim error:", error);
    return null;
  }
};
