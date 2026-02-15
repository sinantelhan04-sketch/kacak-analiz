import { Subscriber, RiskScore, BuildingRisk } from '../types';

// --- District Boundaries (Approximate Polygons for Istanbul) ---
// Format: [Lat, Lng]
export const ISTANBUL_DISTRICTS: Record<string, [number, number][]> = {
  'Fatih': [
    [41.025, 28.930], [41.028, 28.950], [41.020, 28.985], [41.002, 28.980], [41.000, 28.925], [41.010, 28.920]
  ],
  'Beyoğlu': [
    [41.045, 28.960], [41.040, 28.990], [41.025, 28.985], [41.025, 28.965], [41.035, 28.955]
  ],
  'Şişli': [
    [41.075, 28.985], [41.065, 29.005], [41.045, 28.995], [41.045, 28.970], [41.060, 28.960]
  ],
  'Beşiktaş': [
    [41.090, 29.015], [41.080, 29.030], [41.045, 29.045], [41.040, 29.000], [41.060, 28.990]
  ],
  'Kadıköy': [
    [41.010, 29.015], [41.005, 29.060], [40.955, 29.090], [40.955, 29.060], [40.980, 29.020]
  ],
  'Üsküdar': [
    [41.070, 29.040], [41.060, 29.090], [41.020, 29.090], [41.005, 29.020], [41.025, 29.000]
  ],
  'Ümraniye': [
    [41.050, 29.080], [41.050, 29.170], [40.990, 29.170], [41.000, 29.080]
  ],
  'Ataşehir': [
    [41.000, 29.080], [41.000, 29.160], [40.970, 29.160], [40.970, 29.090]
  ],
  'Maltepe': [
    [40.970, 29.100], [40.970, 29.160], [40.920, 29.160], [40.920, 29.100]
  ],
  'Bakırköy': [
    [41.000, 28.880], [41.000, 28.830], [40.960, 28.830], [40.960, 28.880]
  ],
  'Zeytinburnu': [
    [41.015, 28.925], [41.015, 28.880], [40.985, 28.880], [40.985, 28.920]
  ],
  'Esenyurt': [
    [41.060, 28.640], [41.060, 28.700], [41.015, 28.700], [41.015, 28.640]
  ],
  'Başakşehir': [
    [41.130, 28.740], [41.130, 28.830], [41.060, 28.830], [41.060, 28.740]
  ]
};

// Ray-casting algorithm for Point in Polygon
const isPointInPolygon = (lat: number, lng: number, polygon: [number, number][]) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    
    const intersect = ((yi > lng) !== (yj > lng))
        && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

const identifyDistrictGeometric = (lat: number, lng: number): string => {
  for (const [name, poly] of Object.entries(ISTANBUL_DISTRICTS)) {
    if (isPointInPolygon(lat, lng, poly)) return name;
  }
  return 'Diğer';
};

// --- DATA NORMALIZATION (Pandas Style) ---
export const normalizeId = (id: any): string => {
  if (id === null || id === undefined) return "";
  return String(id).trim().toUpperCase();
};

// --- STATISTICAL HELPERS ---
const getWinterAvg = (data: any) => (data.dec + data.jan + data.feb) / 3;
const getSummerAvg = (data: any) => (data.jun + data.jul + data.aug) / 3;

const getStandardDeviation = (array: number[]) => {
  const n = array.length;
  if (n === 0) return 0;
  const mean = array.reduce((a, b) => a + b) / n;
  return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
};

const calculateMedian = (values: number[]): number => {
    if (values.length === 0) return 0;
    values.sort((a, b) => a - b);
    const half = Math.floor(values.length / 2);
    if (values.length % 2) return values[half];
    return (values[half - 1] + values[half]) / 2.0;
};

const calculateTrendSlope = (values: number[]) => {
    const n = values.length;
    if (n < 2) return 0;
    const x = Array.from({length: n}, (_, i) => i);
    const y = values;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope; 
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; 
  const phi1 = lat1 * Math.PI/180;
  const phi2 = lat2 * Math.PI/180;
  const deltaPhi = (lat2-lat1) * Math.PI/180;
  const deltaLambda = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; 
}

// --- HELPER TO UPDATE TOTAL SCORE ---
const updateTotalScore = (score: RiskScore): RiskScore => {
    const total = Math.min(100, 
        score.breakdown.referenceMatch + 
        score.breakdown.consumptionAnomaly + 
        score.breakdown.trendInconsistency + 
        score.breakdown.geoRisk
    );

    let riskLevel: RiskScore['riskLevel'] = 'Düşük';
    if (total >= 80) riskLevel = 'Seviye 1 (Kritik)';
    else if (total >= 50) riskLevel = 'Seviye 2 (Yüksek)';
    else if (total >= 25) riskLevel = 'Seviye 3 (Orta)';

    return { ...score, totalScore: total, riskLevel };
};

// --- MODULAR ANALYSIS FUNCTIONS ---

// NEW: Building Consumption Analysis
export const analyzeBuildingConsumption = (subscribers: Subscriber[]): BuildingRisk[] => {
    // 1. Filtre: Sadece "Konut" (Kombi veya Merkezi)
    const validSubscribers = subscribers.filter(s => {
        const type = s.rawAboneTipi ? s.rawAboneTipi.toLocaleLowerCase('tr') : '';
        return type.includes('konut') && (type.includes('kombi') || type.includes('merkezi'));
    });

    // 2. Gruplama: Enlem ve Boylam TAMAMEN aynı olanlar (Noktadan sonraki tüm basamaklar dahil)
    const buildingMap = new Map<string, Subscriber[]>();
    
    validSubscribers.forEach(sub => {
        // Lat/Lng kontrolü: 0 veya boş (undefined/null) değerler atlanmalı.
        // Excel parsing sırasında boş hücreler 0 olarak dönebilir, bu yüzden 0 kontrolü de şart.
        if (!sub.location.lat || !sub.location.lng || sub.location.lat === 0 || sub.location.lng === 0) return;

        // Sayısal değerin string karşılığını kullanarak tam eşleşme yapıyoruz.
        // Bu sayede excel'den gelen tüm basamak hassasiyeti korunur (Floating point precision).
        const key = `${sub.location.lat}_${sub.location.lng}`;
        
        if (!buildingMap.has(key)) buildingMap.set(key, []);
        buildingMap.get(key)!.push(sub);
    });

    const buildingRisks: BuildingRisk[] = [];

    // 3. Her bina grubunu incele
    buildingMap.forEach((subs, key) => {
        
        // --- ADIM 2: "Temiz Abone" Filtresi ---
        // Ocak, Şubat ve Mart aylarının HEPSİNDE tüketim > 25 sm³ olmalı.
        // (Bu aynı zamanda 0 olanları da eler)
        const cleanSubscribers = subs.filter(s => {
            const j = s.consumption.jan;
            const f = s.consumption.feb;
            const m = s.consumption.mar;
            return j > 25 && f > 25 && m > 25;
        });

        // --- ADIM 3: Grup Büyüklüğü Kuralı ---
        // Referans alınacak "temiz" komşu sayısı en az 8 olmalı.
        if (cleanSubscribers.length < 8) return;

        // Referans Medyanı (Sadece temiz abonelerden)
        const cleanWinterAvgs = cleanSubscribers.map(s => (s.consumption.jan + s.consumption.feb + s.consumption.mar) / 3);
        const buildingMedian = calculateMedian(cleanWinterAvgs);
        
        // Sıfıra bölme hatası önlemi
        if (buildingMedian < 1) return;

        // --- ADIM 4: Şüpheli Tespiti (Tüm bina sakinleri taranır) ---
        subs.forEach(s => {
            const jan = s.consumption.jan;
            const feb = s.consumption.feb;
            const mar = s.consumption.mar;
            
            const personalAvg = (jan + feb + mar) / 3;

            // Kriter 1: Kendi ortalaması 25 ile 110 arasında olmalı
            const isInRiskRange = personalAvg > 25 && personalAvg < 110;

            // Kriter 2: Bina medyanının %60'ından küçük olmalı
            const isSignificantlyLow = personalAvg < (buildingMedian * 0.60);

            // Kriter 3: Hiçbir ay 0 olmamalı (Tamamen kapalı/boş daireleri elemek için)
            const isNonZero = jan > 0 && feb > 0 && mar > 0;

            if (isInRiskRange && isSignificantlyLow && isNonZero) {
                
                // Sapma Yüzdesi (Negatif değer çıkacaktır)
                // Örn: Abone=40, Medyan=100 -> Fark=-60 -> Sapma %-60
                const deviation = ((personalAvg - buildingMedian) / buildingMedian) * 100;

                buildingRisks.push({
                    tesisatNo: s.tesisatNo,
                    aboneTipi: s.rawAboneTipi || s.aboneTipi,
                    location: s.location,
                    personalWinterAvg: parseFloat(personalAvg.toFixed(1)),
                    buildingWinterMedian: parseFloat(buildingMedian.toFixed(1)),
                    deviationPercentage: parseFloat(deviation.toFixed(1)),
                    monthlyData: { jan, feb, mar },
                    neighborCount: cleanSubscribers.length // Referans alınan temiz komşu sayısı
                });
            }
        });
    });

    // Sıralama: Sapma yüzdesine göre (En küçükten büyüğe, yani en negatiften pozitife doğru)
    // Örn: -80%, -70%, -60% ...
    buildingRisks.sort((a, b) => a.deviationPercentage - b.deviationPercentage);

    return buildingRisks;
};

// 1. BASE INITIALIZATION (With Reference Check)
export const createBaseRiskScore = (
    sub: Subscriber, 
    fraudMuhatapIds: Set<string>,
    fraudTesisatIds: Set<string>
): RiskScore => {
    // 1. 1. Try to use explicit district from Excel. 2. Fallback to geometric check.
    let district = sub.district;
    if (!district || district.trim() === '') {
        district = identifyDistrictGeometric(sub.location.lat, sub.location.lng);
    } else {
        // Normalize district name (Title Case)
        district = district.toLocaleUpperCase('tr');
    }

    const winterAvg = getWinterAvg(sub.consumption);
    const summerAvg = getSummerAvg(sub.consumption);
    const heatingRatio = winterAvg / (summerAvg + 0.1);

    const baseScore: RiskScore = {
        tesisatNo: sub.tesisatNo,
        muhatapNo: sub.muhatapNo,
        address: sub.address,
        location: sub.location,
        city: sub.city || 'Bilinmiyor',
        district: district,
        neighborhood: '',
        aboneTipi: sub.aboneTipi,
        rawAboneTipi: sub.rawAboneTipi,
        consumption: sub.consumption,
        totalScore: 0,
        breakdown: { referenceMatch: 0, consumptionAnomaly: 0, trendInconsistency: 0, geoRisk: 0 },
        riskLevel: 'Düşük',
        reason: '',
        heatingSensitivity: heatingRatio,
        seasonalStats: { winterAvg: parseFloat(winterAvg.toFixed(1)), summerAvg: parseFloat(summerAvg.toFixed(1)) },
        isTamperingSuspect: false,
        is120RuleSuspect: false,
        inconsistentData: { hasWinterDrop: false, dropDetails: [], isSemesterSuspect: false, volatilityScore: 0 }
    };

    // --- REFERENCE CHECK (Fast, Run immediately) ---
    const reasons: string[] = [];
    const normTesisat = normalizeId(sub.tesisatNo);
    const isMuhatapMatch = sub.relatedMuhatapNos.some(m => fraudMuhatapIds.has(normalizeId(m)));
    const isTesisatMatch = fraudTesisatIds.has(normTesisat);

    if (isMuhatapMatch) {
        baseScore.breakdown.referenceMatch += 50;
        reasons.push('RİSKLİ ABONE (Kara Liste)');
    } 
    if (isTesisatMatch) {
        baseScore.breakdown.referenceMatch += 20;
        reasons.push('UYARI: Tesisatta Geçmiş Müdahale');
    }
    
    baseScore.reason = reasons.join(', ');
    return updateTotalScore(baseScore);
};

// 2. TAMPERING ANALYSIS (Seasonal)
export const applyTamperingAnalysis = (score: RiskScore): RiskScore => {
    const allowedTypes = ["KONUT (KOMBİ)", "KONUT (MERKEZİ)"];
    const rawType = score.rawAboneTipi ? score.rawAboneTipi.toLocaleUpperCase('tr').trim() : '';

    if (!allowedTypes.includes(rawType)) {
        return score;
    }

    const isCommercial = score.aboneTipi === 'Commercial';
    const thresholdRatio = isCommercial ? 2.0 : 3.5;
    const minWinterCons = isCommercial ? 100 : 30;
    
    const winterAvg = score.seasonalStats.winterAvg;
    const heatingRatio = score.heatingSensitivity;

    const isSeasonalFlat = (winterAvg > minWinterCons) && (heatingRatio < thresholdRatio);
    
    const reasons = score.reason ? score.reason.split(', ') : [];
    let anomalyScore = score.breakdown.consumptionAnomaly;

    if (isSeasonalFlat) {
        if (!score.isTamperingSuspect) { 
            anomalyScore += 30;
            reasons.push('Mevsimsel Fark Yok (Bypass Şüphesi)');
        }
    }

    return updateTotalScore({
        ...score,
        isTamperingSuspect: isSeasonalFlat,
        breakdown: { ...score.breakdown, consumptionAnomaly: anomalyScore },
        reason: reasons.join(', ')
    });
};

// 3. RULE 120 ANALYSIS
export const applyRule120Analysis = (score: RiskScore): RiskScore => {
    const allowedTypes = ["KONUT (KOMBİ)", "KONUT (MERKEZİ)"];
    const rawType = score.rawAboneTipi ? score.rawAboneTipi.toLocaleUpperCase('tr').trim() : '';

    if (!allowedTypes.includes(rawType)) {
        return score;
    }

    if (!score.muhatapNo || score.muhatapNo.trim() === '') {
        return score;
    }

    const jan = score.consumption.jan;
    const feb = score.consumption.feb;
    const mar = score.consumption.mar;
    
    const isJanSuspect = jan > 25 && jan < 110;
    const isFebSuspect = feb > 25 && feb < 110;
    const isMarSuspect = mar > 25 && mar < 110;

    const is120RuleSuspect = isJanSuspect && isFebSuspect && isMarSuspect;

    const reasons = score.reason ? score.reason.split(', ') : [];
    let anomalyScore = score.breakdown.consumptionAnomaly;

    if (is120RuleSuspect) {
        if (!score.is120RuleSuspect) {
            let penalty = 30;
            const total = jan + feb + mar;
            if (total < 150) penalty = 45; 
            anomalyScore += penalty;
            reasons.push('120 Kuralı (Ocak-Şubat-Mart Şüpheli)');
        }
    }

    return updateTotalScore({
        ...score,
        is120RuleSuspect,
        rule120Data: { jan, feb, mar },
        breakdown: { ...score.breakdown, consumptionAnomaly: anomalyScore },
        reason: reasons.join(', ')
    });
};

// 4. INCONSISTENCY ANALYSIS (Trend/Slope)
export const applyInconsistencyAnalysis = (score: RiskScore): RiskScore => {
    const winterVals = [score.consumption.dec, score.consumption.jan, score.consumption.feb];
    const winterAvg = score.seasonalStats.winterAvg;
    const winterStd = getStandardDeviation(winterVals);
    const isCommercial = score.aboneTipi === 'Commercial';

    const isFlatline = winterStd < 1.5 && winterAvg > 10;
    const winterTrendVals = [score.consumption.nov, score.consumption.dec, score.consumption.jan, score.consumption.feb];
    const slope = calculateTrendSlope(winterTrendVals);
    const slopeLimit = isCommercial ? -50 : -15;
    const isSharpDecline = slope < slopeLimit && winterAvg > 20;

    const reasons = score.reason ? score.reason.split(', ') : [];
    let trendScore = score.breakdown.trendInconsistency;
    const inconsistentData = { ...score.inconsistentData };

    if (isFlatline && !reasons.includes('Düz Çizgi (Sabit Tüketim)')) {
        trendScore += 25;
        reasons.push('Düz Çizgi (Sabit Tüketim)');
    } else if (isSharpDecline && !reasons.some(r => r.includes('Ani Tüketim Düşüşü'))) {
        trendScore += 20;
        reasons.push(`Ani Tüketim Düşüşü (Eğim: ${slope.toFixed(1)})`);
    }

    const MIN_CONS = 40;
    const janToFebDrop = score.consumption.jan > MIN_CONS && score.consumption.feb < score.consumption.jan * 0.75; 
    
    if (janToFebDrop && !isCommercial) {
        const slopeBefore = calculateTrendSlope([score.consumption.nov, score.consumption.dec, score.consumption.jan]);
        if (slopeBefore > -5) {
            inconsistentData.isSemesterSuspect = true;
            inconsistentData.dropDetails.push(`Sömestr Şüphesi: Ocak(${score.consumption.jan}) -> Şubat(${score.consumption.feb})`);
        }
    }

    if (isSharpDecline || slope < -10) {
        inconsistentData.hasWinterDrop = true;
        inconsistentData.dropDetails.push(`Kış Trendi Düşüşte (Eğim: ${slope.toFixed(1)})`);
    }

    const winterCV = (winterStd / (winterAvg + 1));
    if (winterCV > 0.4 && winterAvg > MIN_CONS) {
        inconsistentData.volatilityScore = 1;
        inconsistentData.dropDetails.push("Aşırı Dalgalı Kış Tüketimi");
    }

    return updateTotalScore({
        ...score,
        inconsistentData,
        breakdown: { ...score.breakdown, trendInconsistency: trendScore },
        reason: reasons.join(', ')
    });
};

// 5. GEO RISK ANALYSIS (Heavy)
export const applyGeoAnalysis = (score: RiskScore, nearbyHighRiskPoints: {lat: number, lng: number}[]): RiskScore => {
    const allowedTypes = ["KONUT (KOMBİ)", "KONUT (MERKEZİ)"];
    const rawType = score.rawAboneTipi ? score.rawAboneTipi.toLocaleUpperCase('tr').trim() : '';

    if (!allowedTypes.includes(rawType)) {
        return score;
    }

    if (!score.muhatapNo || score.muhatapNo.trim() === '') {
        return score;
    }

    if (score.location.lat === 0 || nearbyHighRiskPoints.length === 0) return score;
    if (score.totalScore >= 80) return score;

    if (!score.is120RuleSuspect) return score;

    let geoScore = score.breakdown.geoRisk;
    const reasons = score.reason ? score.reason.split(', ') : [];

    let minDistance = 10000;
    for (const p of nearbyHighRiskPoints) {
        const d = calculateDistance(score.location.lat, score.location.lng, p.lat, p.lng);
        if (d < minDistance) minDistance = d;
    }
    
    if (minDistance < 10) { 
        if (geoScore === 0) { 
            geoScore = 15;
            reasons.push(`Konum Riski (${Math.floor(minDistance)}m yakında şüpheli)`);
        }
    }

    return updateTotalScore({
        ...score,
        breakdown: { ...score.breakdown, geoRisk: geoScore },
        reason: reasons.join(', ')
    });
};

// --- DEMO DATA GENERATOR ---
export const generateDemoData = (): { subscribers: Subscriber[], fraudMuhatapIds: Set<string>, fraudTesisatIds: Set<string> } => {
  const subscribers: Subscriber[] = [];
  const fraudMuhatapIds = new Set<string>();
  const fraudTesisatIds = new Set<string>();
  
  const totalRecs = 500; 
  
  for (let k = 0; k < 20; k++) fraudMuhatapIds.add(`M-REF-${k}`);
  for (let k = 0; k < 10; k++) fraudTesisatIds.add(`T-REF-${k}`);

  const getRandomPointInDistrict = (name: string) => {
      const poly = ISTANBUL_DISTRICTS[name];
      if (!poly) return { lat: 41.0082, lng: 28.9784 };
      const minLat = Math.min(...poly.map(p => p[0]));
      const maxLat = Math.max(...poly.map(p => p[0]));
      const minLng = Math.min(...poly.map(p => p[1]));
      const maxLng = Math.max(...poly.map(p => p[1]));
      let lat = 0, lng = 0;
      for(let i=0; i<10; i++) {
           lat = minLat + Math.random() * (maxLat - minLat);
           lng = minLng + Math.random() * (maxLng - minLng);
           if (isPointInPolygon(lat, lng, poly)) return { lat, lng };
      }
      return { lat: (minLat+maxLat)/2, lng: (minLng+maxLng)/2 };
  };

  const districtNames = Object.keys(ISTANBUL_DISTRICTS);

  for (let i = 0; i < totalRecs; i++) {
    const id = 100000 + i;
    const isFraud = i < 60; 
    const isCommercial = Math.random() < 0.15;
    const district = districtNames[i % districtNames.length];
    
    // Make sure some people live in the same building for demo purposes
    // Every 5th person shares location with 4th person
    let loc = getRandomPointInDistrict(district);
    if (i > 5 && i % 5 !== 0) {
        loc = subscribers[i-1].location;
    }

    let data = {
      jan: 300, feb: 280, mar: 200, apr: 100, may: 50, jun: 20,
      jul: 15, aug: 15, sep: 30, oct: 80, nov: 150, dec: 290
    };
    if (isCommercial) {
        (Object.keys(data) as Array<keyof typeof data>).forEach(k => {
            data[k] *= 2.5; 
        });
    }

    if (i === 12) { 
        data.jan = 35; data.feb = 50; data.mar = 40; 
        data.dec = 150; 
    }
    if (i === 13) { 
        data.jan = 95; data.feb = 100; data.mar = 90; 
        data.dec = 150; 
    }

    let muhatapNo = `M-${id}`;
    let tesisatNo = id.toString();
    const relatedMuhatapNos = [muhatapNo];
    
    if (isFraud) {
      const fraudType = Math.random();
      if (fraudType < 0.30) {
          data.jun = 20; data.jul = 20; data.aug = 20;
          data.dec = 50; data.jan = 55; data.feb = 50;
      }
      else if (fraudType < 0.5) {
        const badMuhatap = `M-REF-${Math.floor(Math.random() * 20)}`;
        relatedMuhatapNos.push(badMuhatap); 
      }
      else {
        data.jan = 60; data.feb = 60; data.dec = 60;
      }
    }
    
    (Object.keys(data) as Array<keyof typeof data>).forEach(k => {
        data[k] = Math.max(0, Math.floor(data[k] * (0.9 + Math.random() * 0.2)));
    });

    subscribers.push({
      tesisatNo: tesisatNo,
      muhatapNo: muhatapNo,
      relatedMuhatapNos: relatedMuhatapNos,
      address: `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`,
      location: loc,
      city: 'İSTANBUL', // Demo data is istanbul
      district: district,
      aboneTipi: isCommercial ? 'Commercial' : 'Residential',
      rawAboneTipi: isCommercial ? 'TİCARİ İŞLETME' : (Math.random() < 0.2 ? 'KONUT (MERKEZİ)' : 'KONUT (KOMBİ)'), 
      consumption: data,
      isVacant: false
    });
  }
  return { subscribers, fraudMuhatapIds, fraudTesisatIds };
};