export interface MonthlyData {
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
}

export interface Subscriber {
  tesisatNo: string;
  muhatapNo: string; // Primary/Current display value
  relatedMuhatapNos: string[]; // History of all Muhataps seen on this Tesisat (e.g. tenant changes)
  address: string;
  aboneTipi: 'Residential' | 'Commercial' | 'Industrial';
  consumption: MonthlyData;
  isVacant: boolean;
}

export interface RiskScore {
  tesisatNo: string;
  muhatapNo: string;
  address: string;
  aboneTipi: string;
  totalScore: number;
  breakdown: {
    referenceMatch: number;
    consumptionAnomaly: number;
    trendInconsistency: number;
    geoRisk: number;
  };
  riskLevel: 'Seviye 1 (Kritik)' | 'Seviye 2 (Yüksek)' | 'Seviye 3 (Orta)' | 'Düşük';
  reason: string;
  heatingSensitivity: number; // Ratio
  seasonalStats: {
    winterAvg: number;
    summerAvg: number;
  };
  isTamperingSuspect: boolean; // Specific flag for "Winter approx Summer" logic
  is120RuleSuspect: boolean; // Specific flag for "10 < Jan, Feb < 120" logic
  rule120Data?: {
      jan: number;
      feb: number;
  };
  inconsistentData: {
    hasWinterDrop: boolean; // True if drops occur in Nov, Dec, or Jan
    dropDetails: string[]; // e.g. "Kasım -> Aralık Düşüşü"
    isSemesterSuspect: boolean; // True if drop is ONLY in Feb (Jan -> Feb)
    volatilityScore: number;
  };
}

export interface Hotspot {
  street: string;
  count: number;
  avgScore: number;
}

export interface EngineStats {
  totalScanned: number;
  level1Count: number; // Critical
  level2Count: number; // High
  level3Count: number; // Medium/Low
}