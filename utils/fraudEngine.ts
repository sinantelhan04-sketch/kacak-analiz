import { Subscriber, RiskScore, Hotspot, EngineStats } from '../types';

// --- Helper Math ---

const getWinterAvg = (data: any) => (data.dec + data.jan + data.feb) / 3;
const getSummerAvg = (data: any) => (data.jun + data.jul + data.aug) / 3;

const getStandardDeviation = (array: number[]) => {
  const n = array.length;
  if (n === 0) return 0;
  const mean = array.reduce((a, b) => a + b) / n;
  return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
};

// --- Core Algorithm ---

export const analyzeSubscriber = (
    sub: Subscriber, 
    fraudMuhatapIds: Set<string>,
    fraudTesisatIds: Set<string>,
    highRiskStreets: string[] = []
): RiskScore => {
  let score = 0;
  let breakdown = {
    referenceMatch: 0,
    consumptionAnomaly: 0,
    trendInconsistency: 0,
    geoRisk: 0
  };
  const reasons: string[] = [];

  const winterVals = [sub.consumption.dec, sub.consumption.jan, sub.consumption.feb];
  const winterAvg = getWinterAvg(sub.consumption);
  const summerAvg = getSummerAvg(sub.consumption);

  // --- 1. REFERANS KONTROLÜ (KRİTİK MANTIK) ---
  const foundFraudMuhatap = sub.relatedMuhatapNos.find(m => fraudMuhatapIds.has(m));
  const isMuhatapMatch = !!foundFraudMuhatap;
  const isTesisatMatch = sub.tesisatNo && fraudTesisatIds.has(sub.tesisatNo);
  const displayMuhatap = foundFraudMuhatap || sub.muhatapNo;

  if (isMuhatapMatch) {
    breakdown.referenceMatch += 50;
    score += 50;
    reasons.push('RİSKLİ ABONE (Kara Liste)');
  } 
  if (isTesisatMatch) {
    breakdown.referenceMatch += 20;
    score += 20;
    reasons.push('UYARI: Tesisatta Geçmiş Müdahale');
  }

  // --- 2. TÜKETİM ANOMALİLERİ & MEVSİMSELLİK (YENİ KRİTER) ---
  
  // Isınma Hassasiyeti (Kat Sayısı)
  const heatingRatio = winterAvg / (summerAvg + 0.1);

  // Kriter: Yaz ve Kış "Aynı Seviyelerde" (veya yakın) ise.
  const isSeasonalFlat = (winterAvg > 30) && (heatingRatio < 4.0);
  
  const isTamperingSuspect = isSeasonalFlat;

  if (isSeasonalFlat) {
      breakdown.consumptionAnomaly += 30; 
      reasons.push('Mevsimsel Fark Yok (Şüpheli Müdahale)');
  }

  // 120 Kuralı (Genel Puanlama için - Dec, Jan, Feb > 0)
  const isUnder120Rule = (sub.consumption.dec < 120 && sub.consumption.dec > 0) &&
                         (sub.consumption.jan < 120 && sub.consumption.jan > 0) &&
                         (sub.consumption.feb < 120 && sub.consumption.feb > 0);
  
  if (isUnder120Rule) {
    const penalty = sub.aboneTipi === 'Commercial' ? 35 : 30;
    breakdown.consumptionAnomaly += penalty;
    reasons.push('120 Kuralı (Kışın Aşırı Düşük)');
  }
  
  score += Math.min(40, breakdown.consumptionAnomaly); 

  // --- 2.5 ÖZEL 120 KURALI (TAB İÇİN) ---
  // İstenen: Ocak ve Şubat < 120 sm3
  // Filtre: Her iki ay da 10 sm3 altındaysa DAHİL ETME (Vacant).
  // Yani: En az bir ay >= 10 olmalı.
  const jan = sub.consumption.jan;
  const feb = sub.consumption.feb;

  const isBelow120Both = (jan < 120 && feb < 120);
  const isBothBelow10 = (jan < 10 && feb < 10);
  
  const is120RuleSuspect = isBelow120Both && !isBothBelow10;

  // --- 3. TREND TUTARSIZLIĞI (Düzeltilmiş ve Genişletilmiş) ---
  const winterStd = getStandardDeviation(winterVals);
  
  // Düz Çizgi
  const isFlatline = winterStd < 1 && winterAvg > 10; 
  
  // Ani Düşüş (Klasik)
  const dropDec = sub.consumption.nov > 50 && sub.consumption.dec < (sub.consumption.nov * 0.4);
  const dropJan = sub.consumption.dec > 50 && sub.consumption.jan < (sub.consumption.dec * 0.4);
  const isSuddenDrop = dropDec || dropJan;

  if (isFlatline) {
    breakdown.trendInconsistency = 25;
    score += 25;
    reasons.push('Düz Çizgi (Sayaç Müdahalesi)');
  } else if (isSuddenDrop) {
    breakdown.trendInconsistency = 20;
    score += 20;
    reasons.push('Ani Tüketim Düşüşü');
  }

  // --- 4. COĞRAFİ RİSK (DİNAMİK) ---
  // Adres içinde riskli sokaklardan biri geçiyor mu?
  const isHighRiskGeo = highRiskStreets.some(street => sub.address.includes(street));
  
  if (isHighRiskGeo) {
    breakdown.geoRisk = 10;
    score += 10;
    reasons.push('Bölgesel Risk (Sıcak Bölge)');
  }

  // --- 5. DETAYLI KIŞ TUTARSIZLIK ANALİZİ (YENİ TAB İÇİN) ---
  const inconsistentData = {
      hasWinterDrop: false,
      dropDetails: [] as string[],
      isSemesterSuspect: false,
      volatilityScore: 0
  };

  const MIN_CONS = 40;
  const DROP_FACTOR = 0.85; // %15 düşüş

  // Kasım -> Aralık
  if (sub.consumption.nov > MIN_CONS && sub.consumption.dec < sub.consumption.nov * DROP_FACTOR) {
      inconsistentData.hasWinterDrop = true;
      inconsistentData.dropDetails.push(`Kasım(${sub.consumption.nov}) -> Aralık(${sub.consumption.dec})`);
  }
  
  // Aralık -> Ocak
  if (sub.consumption.dec > MIN_CONS && sub.consumption.jan < sub.consumption.dec * DROP_FACTOR) {
      inconsistentData.hasWinterDrop = true;
      inconsistentData.dropDetails.push(`Aralık(${sub.consumption.dec}) -> Ocak(${sub.consumption.jan})`);
  }

  // Ocak -> Şubat (Sömestr Riski)
  const janToFebDrop = sub.consumption.jan > MIN_CONS && sub.consumption.feb < sub.consumption.jan * 0.80; // Şubatta daha sert düşüş olabilir
  
  if (janToFebDrop) {
      const isPriorWinterNormal = !inconsistentData.hasWinterDrop; 
      
      if (isPriorWinterNormal) {
          inconsistentData.isSemesterSuspect = true;
          inconsistentData.dropDetails.push(`Ocak(${sub.consumption.jan}) -> Şubat(${sub.consumption.feb}) [Sömestr?]`);
      } else {
          inconsistentData.hasWinterDrop = true;
          inconsistentData.dropDetails.push(`Ocak(${sub.consumption.jan}) -> Şubat(${sub.consumption.feb})`);
      }
  }

  const diff1 = sub.consumption.dec - sub.consumption.nov;
  const diff2 = sub.consumption.jan - sub.consumption.dec;
  const diff3 = sub.consumption.feb - sub.consumption.jan;

  let switches = 0;
  if ((diff1 > 0 && diff2 < 0) || (diff1 < 0 && diff2 > 0)) switches++;
  if ((diff2 > 0 && diff3 < 0) || (diff2 < 0 && diff3 > 0)) switches++;
  
  if (switches >= 2 && winterAvg > MIN_CONS) {
      inconsistentData.volatilityScore = 1; 
      inconsistentData.hasWinterDrop = true; 
      inconsistentData.dropDetails.push("Kış Boyunca Aşırı Dalgalanma");
  }


  const finalScore = Math.min(100, score);
  
  let riskLevel: RiskScore['riskLevel'] = 'Düşük';
  if (finalScore >= 80) riskLevel = 'Seviye 1 (Kritik)';
  else if (finalScore >= 50) riskLevel = 'Seviye 2 (Yüksek)';
  else if (finalScore >= 25) riskLevel = 'Seviye 3 (Orta)';

  return {
    tesisatNo: sub.tesisatNo,
    muhatapNo: displayMuhatap,
    address: sub.address,
    aboneTipi: sub.aboneTipi,
    totalScore: finalScore,
    breakdown,
    riskLevel,
    reason: reasons.join(', ') || 'Normal',
    heatingSensitivity: heatingRatio,
    seasonalStats: {
        winterAvg: parseFloat(winterAvg.toFixed(1)),
        summerAvg: parseFloat(summerAvg.toFixed(1))
    },
    isTamperingSuspect,
    is120RuleSuspect,
    rule120Data: { jan, feb },
    inconsistentData
  };
};

// --- Simülasyon Verisi Oluşturucu ---

export const generateDemoData = (): { subscribers: Subscriber[], fraudMuhatapIds: Set<string>, fraudTesisatIds: Set<string> } => {
  const subscribers: Subscriber[] = [];
  const fraudMuhatapIds = new Set<string>();
  const fraudTesisatIds = new Set<string>();
  
  const totalRecs = 500; 
  
  // Referans verileri oluştur
  for (let k = 0; k < 20; k++) fraudMuhatapIds.add(`M-REF-${k}`);
  for (let k = 0; k < 10; k++) fraudTesisatIds.add(`T-REF-${k}`);

  // Sokak İsimleri Havuzu
  const streets = ['Karanfil Sk', 'Papatya Sk', 'Lale Sk', 'Söğüt Sk', 'Menekşe Sk', 'Gül Sk', 'Cumhuriyet Cd', 'Atatürk Blv'];
  
  for (let i = 0; i < totalRecs; i++) {
    const id = 100000 + i;
    const isFraud = i < 60; // İlk 60 kayıt riskli olsun
    const isCommercial = Math.random() < 0.15;
    
    // Normal Tüketim (Kış Yüksek, Yaz Düşük)
    let data = {
      jan: 300, feb: 280, mar: 200, apr: 100, may: 50, jun: 20,
      jul: 15, aug: 15, sep: 30, oct: 80, nov: 150, dec: 290
    };
    
    if (isCommercial) Object.keys(data).forEach(k => { /* @ts-ignore */ data[k] *= 2.5; });

    // ÖZEL SENARYO: 5102605200 Benzeri (Kasım artış, Aralık düşüş)
    if (i === 10) {
        data.nov = 150; data.dec = 80; data.jan = 200;
    }

    // ÖZEL SENARYO: Sömestr
    if (i === 11) {
        data.nov = 150; data.dec = 250; data.jan = 280;
        data.feb = 100; data.mar = 220; 
    }

    // ÖZEL SENARYO: 120 Kuralı Adayı
    // Case 1: Jan 1, Feb 50 -> Include (One is > 10)
    if (i === 12) {
        data.jan = 1; data.feb = 50; data.dec = 150; 
    }
    // Case 2: Jan 5, Feb 8 -> Exclude (Both < 10)
    if (i === 13) {
        data.jan = 5; data.feb = 8; data.dec = 150;
    }
    // Case 3: Standard Suspicion
    if (i === 14) {
        data.jan = 60; data.feb = 60;
    }

    let muhatapNo = `M-${id}`;
    let tesisatNo = id.toString();
    const relatedMuhatapNos = [muhatapNo];
    
    // Adres Dağıtımı:
    // Riskli kayıtları belirli sokaklara yığalım ki "Bölgesel Risk" haritası çalışsın.
    // İlk 60 kayıt riskliydi. Bunların %80'ini 'Karanfil Sk' ve 'Lale Sk' üzerine koyalım.
    let streetName = streets[Math.floor(Math.random() * streets.length)];
    if (isFraud) {
        if (Math.random() < 0.8) {
            streetName = Math.random() > 0.5 ? 'Karanfil Sk' : 'Lale Sk'; // Hilekarlar burada yaşıyor
        }
    } else {
        // Normal vatandaşlar da buralarda yaşayabilir ama daha az yoğunlukta
    }

    let address = `${streetName}, No ${Math.floor(Math.random() * 100) + 1}`;


    if (isFraud) {
      const fraudType = Math.random();
      
      if (fraudType < 0.30) {
          // Bypass
          data.jun = 20; data.jul = 20; data.aug = 20;
          data.dec = 50; data.jan = 55; data.feb = 50;
      }
      else if (fraudType < 0.5) {
        const badMuhatap = `M-REF-${Math.floor(Math.random() * 20)}`;
        relatedMuhatapNos.push(badMuhatap); 
      }
      else if (fraudType < 0.7) {
        data.jan = 80; data.feb = 95; data.dec = 110; 
      }
      else {
        data.jan = 60; data.feb = 60; data.dec = 60;
      }
    }

    // Noise
    Object.keys(data).forEach(k => {
      // @ts-ignore
      data[k] = Math.max(0, Math.floor(data[k] * (0.9 + Math.random() * 0.2)));
    });

    subscribers.push({
      tesisatNo: tesisatNo,
      muhatapNo: muhatapNo,
      relatedMuhatapNos: relatedMuhatapNos,
      address: address,
      aboneTipi: isCommercial ? 'Commercial' : 'Residential',
      consumption: data,
      isVacant: false
    });
  }
  
  return { subscribers, fraudMuhatapIds, fraudTesisatIds };
};