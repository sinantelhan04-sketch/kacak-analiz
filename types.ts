

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
  muhatapNo: string; 
  baglantiNesnesi?: string; // ADDED
  relatedMuhatapNos: string[]; 
  address: string; // Still kept for display if available
  location: {
    lat: number;
    lng: number;
  };
  city?: string;      // NEW: Parsed from Excel
  district?: string;  // NEW: Parsed from Excel
  aboneTipi: 'Residential' | 'Commercial' | 'Industrial';
  rawAboneTipi?: string;
  consumption: MonthlyData;
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
      jan: number;
      feb: number;
      mar: number;
  };
  inconsistentData: {
    hasWinterDrop: boolean; 
    dropDetails: string[]; 
    isSemesterSuspect: boolean; 
    volatilityScore: number;
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
  buildingAnomaly: boolean; // NEW flag
}