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
  relatedMuhatapNos: string[]; 
  address: string; // Still kept for display if available
  location: {
    lat: number;
    lng: number;
  };
  aboneTipi: 'Residential' | 'Commercial' | 'Industrial';
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
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  district: string;      
  neighborhood: string;  
  aboneTipi: string;
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
  };
  inconsistentData: {
    hasWinterDrop: boolean; 
    dropDetails: string[]; 
    isSemesterSuspect: boolean; 
    volatilityScore: number;
  };
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
}