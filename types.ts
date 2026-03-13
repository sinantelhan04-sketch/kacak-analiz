

export interface MonthlyData {
  // Monthly keys (optional now)
  jan_23?: number; feb_23?: number; mar_23?: number; apr_23?: number; may_23?: number; jun_23?: number;
  jul_23?: number; aug_23?: number; sep_23?: number; oct_23?: number; nov_23?: number; dec_23?: number;
  jan_24?: number; feb_24?: number; mar_24?: number; apr_24?: number; may_24?: number; jun_24?: number;
  jul_24?: number; aug_24?: number; sep_24?: number; oct_24?: number; nov_24?: number; dec_24?: number;
  
  // Simplified keys
  pastYearTotal?: number;
  currentYearTotal?: number;
  isSimplified?: boolean;
}

export type MonthKey = keyof MonthlyData;

export interface Subscriber {
  tesisatNo: string;
  muhatapNo: string; 
  pastYearContractNo?: string;
  currentYearContractNo?: string;
  baglantiNesnesi?: string;
  relatedMuhatapNos: string[]; 
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  city?: string;
  district?: string;
  aboneTipi: 'Residential' | 'Commercial' | 'Industrial';
  rawAboneTipi?: string;
  consumption: MonthlyData;
  monthsPresent: MonthKey[];
  monthsWithMuhatap: MonthKey[];
  isVacant: boolean;
}

export interface ReferenceLocation {
  id: string;
  lat: number;
  lng: number;
  type: 'Reference';
}

export interface RiskScore {
  tesisatNo: string;
  muhatapNo: string;
  pastYearContractNo?: string;
  currentYearContractNo?: string;
  baglantiNesnesi?: string; // ADDED
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  city: string;          // NEW
  district: string;      
  neighborhood: string;  
  aboneTipi: string;
  rawAboneTipi?: string;
  consumption: MonthlyData; // Added actual consumption data here
  totalScore: number;
  breakdown: {
    referenceMatch: number;
    consumptionAnomaly: number;
    trendInconsistency: number;
    geoRisk: number;
    buildingAnomaly: number;
  };
  riskLevel: 'Seviye 1 (Kritik)' | 'Seviye 2 (Yüksek)' | 'Seviye 3 (Orta)' | 'Düşük';
  reason: string;
  heatingSensitivity: number; 
  seasonalStats: {
    winterAvg: number;
    summerAvg: number;
  };
  isTamperingSuspect: boolean; 
  is120RuleSuspect: boolean; 
  rule120Data?: {
      dec: number;
      jan: number;
      feb: number;
  };
  inconsistentData: {
    hasWinterDrop: boolean; 
    dropDetails: string[]; 
    isSemesterSuspect: boolean; 
    volatilityScore: number;
  };
  yoYAnalysis?: {
    winterChangePercent: number; // YoY change in winter consumption
    summerChangePercent: number; // YoY change in summer consumption
    isYoYSuspect: boolean;       // True if current year is significantly lower than previous
  };
}

// NEW: Interface for Building Consumption Analysis
export interface BuildingRisk {
  tesisatNo: string;
  baglantiNesnesi?: string; // ADDED
  aboneTipi: string;
  location: { lat: number, lng: number };
  personalWinterAvg: number;
  buildingWinterMedian: number;
  deviationPercentage: number; // (personal - median) / median * 100 (will be negative)
  monthlyData: { jan: number, feb: number, mar: number };
  neighborCount: number; // How many neighbors in the building
}

// NEW: Interface for Weather Analysis
export interface WeatherRiskResult {
    tesisatNo: string;
    baglantiNesnesi: string;
    location: { lat: number; lng: number };
    rawWinterAvg: number;
    normWinterAvg: number; // Normalized by HDD
    buildingNormMedian: number;
    deviationPercentage: number;
    monthlyData: { jan: number; feb: number; mar: number };
    hddUsed: { jan: number; feb: number; mar: number };
}

export interface Hotspot {
  street: string; // Can be used as Region ID
  count: number;
  avgScore: number;
  center: { lat: number; lng: number };
}

export interface EngineStats {
  totalScanned: number;
  level1Count: number; 
  level2Count: number; 
  level3Count: number; 
}

export interface AnalysisStatus {
  reference: boolean;
  tampering: boolean;
  inconsistent: boolean;
  rule120: boolean;
  georisk: boolean;
  buildingAnomaly: boolean;
  yoy: boolean; // NEW flag
}