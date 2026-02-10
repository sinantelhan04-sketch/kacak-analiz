import React, { useState, useRef, useMemo } from 'react';
import { Activity, CheckCircle, BrainCircuit, FileSpreadsheet, FileText, FileUp, XCircle, ShieldCheck, Zap, Download, Loader2, PlayCircle, BarChart3, Merge, BookOpen, ChevronRight, UploadCloud, Play } from 'lucide-react';
import StatsCards from './components/StatsCards';
import RiskTable from './components/RiskTable';
import TamperingTable from './components/TamperingTable';
import InconsistentTable from './components/InconsistentTable';
import Rule120Table from './components/Rule120Table';
import GeoRiskTable from './components/GeoRiskTable';
import HotspotPanel from './components/HotspotPanel';
import Sidebar from './components/Sidebar';
import DashboardChart from './components/DashboardChart';
import ExplainerModal from './components/ExplainerModal';
import { generateDemoData, normalizeId, createBaseRiskScore, applyTamperingAnalysis, applyInconsistencyAnalysis, applyRule120Analysis, applyGeoAnalysis } from './utils/fraudEngine';
import { generateExecutiveSummary } from './services/geminiService';
import { RiskScore, EngineStats, Hotspot, Subscriber, ReferenceLocation, MonthlyData, AnalysisStatus } from './types';
import * as XLSX from 'xlsx';

const App: React.FC = () => {
  // Stages: setup (upload) -> dashboard (loaded but idle) -> analyzing (processing)
  const [appStage, setAppStage] = useState<'setup' | 'dashboard'>('setup');
  const [dashboardView, setDashboardView] = useState<'general' | 'tampering' | 'inconsistent' | 'rule120' | 'georisk'>('general');

  // DATA STATE
  const [rawSubscribers, setRawSubscribers] = useState<Subscriber[]>([]); // Holds parsed Excel data
  const [refMuhatapIds, setRefMuhatapIds] = useState<Set<string>>(new Set());
  const [refTesisatIds, setRefTesisatIds] = useState<Set<string>>(new Set());
  const [refLocations, setRefLocations] = useState<ReferenceLocation[]>([]); 

  // ANALYSIS RESULT STATE
  const [riskData, setRiskData] = useState<RiskScore[]>([]);
  const [stats, setStats] = useState<EngineStats>({ totalScanned: 0, level1Count: 0, level2Count: 0, level3Count: 0 });
  
  // ON-DEMAND ANALYSIS STATE
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>({
      reference: false,
      tampering: false,
      inconsistent: false,
      rule120: false,
      georisk: false
  });
  const [runningAnalysis, setRunningAnalysis] = useState<string | null>(null);

  // UI STATE
  const [aiReport, setAiReport] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showExplainer, setShowExplainer] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null); // FILTER STATE
  
  // Progress states
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingStatusText, setLoadingStatusText] = useState<string>("Hazırlanıyor...");
  const [isReadingFile, setIsReadingFile] = useState<'a' | 'b' | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<{totalRows: number, uniqueSubs: number} | null>(null);

  // File Refs for UI state (names)
  const fileInputRefA = useRef<HTMLInputElement>(null);
  const fileInputRefB = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<{a: string | null, b: string | null}>({ a: null, b: null });
  
  // Ref to store actual File objects for processing
  const fileObjects = useRef<{a: File | null, b: File | null}>({ a: null, b: null });

  // --- SMART FILE READER (Same as before) ---
  const readWorkbook = async (file: File): Promise<XLSX.WorkBook> => {
    const buffer = await file.arrayBuffer();
    if (file.name.toLowerCase().endsWith('.csv')) {
        const uint8Array = new Uint8Array(buffer);
        if (uint8Array.length >= 3 && uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
             const text = new TextDecoder('utf-8').decode(buffer);
             return XLSX.read(text, { type: 'string', dense: true });
        }
        try {
             const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
             return XLSX.read(text, { type: 'string', dense: true });
        } catch(e) {
             const text = new TextDecoder('windows-1254').decode(buffer);
             return XLSX.read(text, { type: 'string', dense: true });
        }
    }
    return XLSX.read(buffer, { dense: true });
  };

  // --- CHARACTER NORMALIZATION HELPER ---
  const normalizeTrChars = (str: string) => {
      if (!str) return "";
      return String(str).toLocaleLowerCase('tr')
          .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i')
          .replace(/i/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
          .replace(/Ğ/g, 'g').replace(/Ü/g, 'u').replace(/Ş/g, 's')
          .replace(/İ/g, 'i').replace(/Ö/g, 'o').replace(/Ç/g, 'c')
          .replace(/[^a-z0-9]/g, '');
  };

  // --- OPTIMIZED HELPER: Column Index Finder ---
  const getColIndex = (headers: any[], candidates: string[]): number => {
      if (!headers || !Array.isArray(headers)) return -1;
      const normalizedCandidates = candidates.map(c => normalizeTrChars(c));
      for (let i = 0; i < headers.length; i++) {
          const h = normalizeTrChars(String(headers[i]));
          if (normalizedCandidates.some(c => h.includes(c) || h === c)) return i;
      }
      return -1;
  };

  const normalizeRowData = (row: any[]): any[] => {
      if (row.length === 1 && typeof row[0] === 'string') {
          if (row[0].includes(',')) return row[0].split(',');
          if (row[0].includes(';')) return row[0].split(';');
          if (row[0].includes('\t')) return row[0].split('\t');
      }
      return row;
  };

  const getMonthKey = (val: any): keyof MonthlyData | null => {
        if (!val) return null;
        let s = String(val).trim();
        if (/^0?1(\.0)?$/.test(s)) return 'jan';
        if (/^0?2(\.0)?$/.test(s)) return 'feb';
        if (/^0?3(\.0)?$/.test(s)) return 'mar';
        if (/^0?4(\.0)?$/.test(s)) return 'apr';
        if (/^0?5(\.0)?$/.test(s)) return 'may';
        if (/^0?6(\.0)?$/.test(s)) return 'jun';
        if (/^0?7(\.0)?$/.test(s)) return 'jul';
        if (/^0?8(\.0)?$/.test(s)) return 'aug';
        if (/^0?9(\.0)?$/.test(s)) return 'sep';
        if (/^10(\.0)?$/.test(s)) return 'oct';
        if (/^11(\.0)?$/.test(s)) return 'nov';
        if (/^12(\.0)?$/.test(s)) return 'dec';
        s = normalizeTrChars(s);
        if (s.includes('oca') || s.includes('jan')) return 'jan';
        if (s.includes('sub') || s.includes('feb')) return 'feb';
        if (s.includes('mar')) return 'mar';
        if (s.includes('nis') || s.includes('apr')) return 'apr';
        if (s.includes('may')) return 'may';
        if (s.includes('haz') || s.includes('jun')) return 'jun';
        if (s.includes('tem') || s.includes('jul')) return 'jul';
        if (s.includes('agu') || s.includes('aug')) return 'aug';
        if (s.includes('eyl') || s.includes('sep')) return 'sep';
        if (s.includes('eki') || s.includes('oct')) return 'oct';
        if (s.includes('kas') || s.includes('nov')) return 'nov';
        if (s.includes('ara') || s.includes('dec')) return 'dec';
        return null;
  }

  const cleanVal = (val: any): string => {
      if (val === null || val === undefined) return '';
      let str = String(val).trim();
      str = str.replace(/['"]/g, '');
      if (str.endsWith('.0')) str = str.slice(0, -2);
      return str;
  };

  const parseNum = (val: any): number => {
      if (val === null || val === undefined) return 0;
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
          let s = val.trim().replace(/['"]/g, '');
          if (s === '') return 0;
          if (s.includes(',') && !s.includes('.')) s = s.replace(',', '.');
          return parseFloat(s) || 0;
      }
      return 0;
  };

  // --- FILE PARSING ---
  const processUploadedFiles = async (onProgress: (pct: number) => void): Promise<{ subscribers: Subscriber[], refMuhatapIds: Set<string>, refTesisatIds: Set<string>, refLocations: ReferenceLocation[], rawCount: number }> => {
    const fileA = fileObjects.current.a;
    const fileB = fileObjects.current.b;
    if (!fileA || !fileB) throw new Error("Dosyalar eksik.");

    onProgress(10);
    const wbA = await readWorkbook(fileA);
    const sheetA = wbA.Sheets[wbA.SheetNames[0]];
    const rawDataA = XLSX.utils.sheet_to_json<any[]>(sheetA, { header: 1 });
    
    const refMuhatapIds = new Set<string>();
    const refTesisatIds = new Set<string>();
    const refLocations: ReferenceLocation[] = [];

    if(rawDataA.length > 1) {
         const headersA = normalizeRowData(rawDataA[0]);
         const idxRefTesisat = getColIndex(headersA, ['tesisat', 'tesisatno', 'tesisat no']);
         const idxRefMuhatap = getColIndex(headersA, ['muhatap', 'muhatapno', 'muhatap no']);
         const idxRefLat = getColIndex(headersA, ['enlem', 'lat', 'latitude']);
         const idxRefLng = getColIndex(headersA, ['boylam', 'lng', 'long', 'longitude']);
         
         for(let i=1; i<rawDataA.length; i++){
             const row = normalizeRowData(rawDataA[i]);
             if(idxRefTesisat !== -1 && row[idxRefTesisat]) {
                 const tesisatId = normalizeId(row[idxRefTesisat]);
                 refTesisatIds.add(tesisatId);
                 if (idxRefLat !== -1 && idxRefLng !== -1) {
                    const lat = parseNum(row[idxRefLat]);
                    const lng = parseNum(row[idxRefLng]);
                    if (lat !== 0 && lng !== 0) {
                        refLocations.push({ id: cleanVal(row[idxRefTesisat]), lat, lng, type: 'Reference' });
                    }
                 }
             }
             if(idxRefMuhatap !== -1 && row[idxRefMuhatap]) {
                 refMuhatapIds.add(normalizeId(row[idxRefMuhatap]));
             }
         }
    }
    
    onProgress(30);
    const wbB = await readWorkbook(fileB);
    const subscriberMap = new Map<string, Subscriber>();
    let totalRows = 0;

    for (const sheetName of wbB.SheetNames) {
        const sheet = wbB.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
        if(rows.length < 2) continue;
        const headers = normalizeRowData(rows[0]);
        const idxId = getColIndex(headers, ['tesisat no', 'tesisat', 'tesisatno']);
        const idxMuhatap = getColIndex(headers, ['muhatap no', 'muhatap', 'muhatapno']);
        const idxType = getColIndex(headers, ['abone tipi', 'tip', 'abone', 'abonetipi']);
        const idxLat = getColIndex(headers, ['enlem', 'lat', 'latitude']);
        const idxLng = getColIndex(headers, ['boylam', 'lng', 'long', 'longitude']);
        const idxMonth = getColIndex(headers, ['ay', 'month', 'donem']);
        const idxCons = getColIndex(headers, ['sm3', 'tuketim', 'm3', 'sarfiyat']);
        
        const wideFormatMap: Partial<Record<keyof MonthlyData, number>> = {};
        if (idxMonth === -1 || idxCons === -1) {
            headers.forEach((h, i) => {
                const key = getMonthKey(h);
                if (key) wideFormatMap[key] = i;
            });
        }
        
        if(idxId === -1) continue;

        for(let i=1; i<rows.length; i++){
            const row = normalizeRowData(rows[i]);
            const rawId = cleanVal(row[idxId]);
            if(!rawId) continue;
            const id = normalizeId(rawId); 
            totalRows++;

            if(!subscriberMap.has(id)){
                const rawTypeStr = idxType !== -1 ? String(row[idxType]) : 'Mesken';
                let typeStr = rawTypeStr.toLowerCase();
                const isCommercial = typeStr.includes('ticar') || typeStr.includes('resmi') || typeStr.includes('sanayi');
                const initMuhatap = idxMuhatap !== -1 ? cleanVal(row[idxMuhatap]) : `M-${rawId}`;

                subscriberMap.set(id, {
                    tesisatNo: rawId, muhatapNo: initMuhatap, relatedMuhatapNos: [initMuhatap],
                    address: '', 
                    location: { lat: idxLat !== -1 ? parseNum(row[idxLat]) : 0, lng: idxLng !== -1 ? parseNum(row[idxLng]) : 0 },
                    aboneTipi: isCommercial ? 'Commercial' : 'Residential',
                    rawAboneTipi: rawTypeStr,
                    consumption: {jan:0, feb:0, mar:0, apr:0, may:0, jun:0, jul:0, aug:0, sep:0, oct:0, nov:0, dec:0},
                    isVacant: false
                });
            }
            const sub = subscriberMap.get(id)!;
            if (idxMuhatap !== -1) {
                const currentMuhatap = cleanVal(row[idxMuhatap]);
                if (currentMuhatap) {
                     const normCurrent = normalizeId(currentMuhatap);
                     const exists = sub.relatedMuhatapNos.some(m => normalizeId(m) === normCurrent);
                     if (!exists) sub.relatedMuhatapNos.push(currentMuhatap);
                }
            }
            if(idxMonth !== -1 && idxCons !== -1) {
                const monthKey = getMonthKey(row[idxMonth]);
                if (monthKey) sub.consumption[monthKey] = parseNum(row[idxCons]);
            } else {
                 (Object.keys(wideFormatMap) as Array<keyof MonthlyData>).forEach(mKey => {
                     const colIdx = wideFormatMap[mKey];
                     if (colIdx !== undefined && row[colIdx] !== undefined) sub.consumption[mKey] = parseNum(row[colIdx]);
                 });
            }
        }
    }
    const subscribers = Array.from(subscriberMap.values());
    onProgress(100);
    return { subscribers, refMuhatapIds, refTesisatIds, refLocations, rawCount: totalRows };
  };

  // --- STAGE 1: LOAD DATA & INITIALIZE BASE SCORES ---
  const handleLoadData = async () => {
    setValidationError(null);
    setLoadingProgress(0);
    setLoadingStatusText("Dosyalar Okunuyor...");
    setDuplicateInfo(null);
    setIsReadingFile('a'); 
    setAnalysisStatus({ reference: false, tampering: false, inconsistent: false, rule120: false, georisk: false });

    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        let subs: Subscriber[] = [];
        let rM: Set<string> = new Set();
        let rT: Set<string> = new Set();
        let rLocs: ReferenceLocation[] = [];
        let totalRows = 0;

        if (files.a && files.b && fileObjects.current.a && fileObjects.current.b) {
            const data = await processUploadedFiles((pct) => setLoadingProgress(pct));
            subs = data.subscribers;
            rM = data.refMuhatapIds;
            rT = data.refTesisatIds;
            rLocs = data.refLocations;
            totalRows = data.rawCount;
        } else {
            setLoadingProgress(50);
            const data = generateDemoData();
            subs = data.subscribers;
            rM = data.fraudMuhatapIds;
            rT = data.fraudTesisatIds;
            rLocs = subs.filter(s => data.fraudTesisatIds.has(s.tesisatNo) || s.relatedMuhatapNos.some(m => data.fraudMuhatapIds.has(m))).map(s => ({
                id: s.tesisatNo, lat: s.location.lat, lng: s.location.lng, type: 'Reference' as const
            }));
            totalRows = 500;
        }

        setLoadingProgress(80);
        setLoadingStatusText("Temel Veri Seti Oluşturuluyor...");
        
        // --- 1. RUN BASE ANALYSIS (Includes Reference Check) ---
        // This is fast enough to do on load
        let initialRisks = subs.map((sub) => createBaseRiskScore(sub, rM, rT));
        
        // Sort by initial score (Reference matches will be on top)
        initialRisks.sort((a,b) => b.totalScore - a.totalScore);

        setRawSubscribers(subs);
        setRefMuhatapIds(rM);
        setRefTesisatIds(rT);
        setRefLocations(rLocs); 
        setRiskData(initialRisks);
        updateStats(initialRisks);
        
        setAnalysisStatus(prev => ({ ...prev, reference: true }));
        setDuplicateInfo({ totalRows, uniqueSubs: subs.length });

        setLoadingProgress(100);
        setAppStage('dashboard'); 

    } catch (error: any) {
        console.error(error);
        setValidationError(error.message || "Yükleme sırasında hata oluştu.");
    } finally {
        setIsReadingFile(null);
    }
  };

  // --- ON-DEMAND ANALYSIS RUNNER ---
  const handleRunModuleAnalysis = async (module: keyof AnalysisStatus) => {
      if (analysisStatus[module]) return; // Already run
      
      setRunningAnalysis(module);
      
      // Allow UI to render loading state
      await new Promise(r => setTimeout(r, 100));

      setRiskData(prevData => {
          let updatedData = [...prevData];

          if (module === 'tampering') {
              updatedData = updatedData.map(item => applyTamperingAnalysis(item));
          } else if (module === 'rule120') {
              updatedData = updatedData.map(item => applyRule120Analysis(item));
          } else if (module === 'inconsistent') {
              updatedData = updatedData.map(item => applyInconsistencyAnalysis(item));
          } else if (module === 'georisk') {
              // Prepare high risk points from current known high scores + references
              const highRiskPoints = [
                  ...updatedData.filter(r => r.totalScore >= 80 && r.location.lat !== 0).map(r => r.location),
                  ...refLocations.map(r => ({ lat: r.lat, lng: r.lng }))
              ];
              // Ensure inconsistency data is present for the filter
              updatedData = updatedData.map(item => {
                  const withInconsistency = applyInconsistencyAnalysis(item);
                  return applyGeoAnalysis(withInconsistency, highRiskPoints);
              });
          }

          updatedData.sort((a, b) => b.totalScore - a.totalScore);
          updateStats(updatedData);
          return updatedData;
      });

      setAnalysisStatus(prev => ({ ...prev, [module]: true }));
      setRunningAnalysis(null);
  };

  const updateStats = (data: RiskScore[]) => {
      let l1=0, l2=0, l3=0;
      data.forEach(r => {
          if(r.riskLevel.includes('Seviye 1')) l1++;
          else if(r.riskLevel.includes('Seviye 2')) l2++;
          else if(r.riskLevel.includes('Seviye 3')) l3++;
      });
      setStats({
          totalScanned: data.length,
          level1Count: l1,
          level2Count: l2,
          level3Count: l3
      });
  };

  const handleReset = () => {
      setAppStage('setup');
      setRiskData([]);
      setRawSubscribers([]);
      setRefLocations([]);
      setStats({ totalScanned: 0, level1Count: 0, level2Count: 0, level3Count: 0 });
      setAiReport('');
      setAnalysisStatus({ reference: false, tampering: false, inconsistent: false, rule120: false, georisk: false });
      setFiles({ a: null, b: null });
      setDuplicateInfo(null);
      fileObjects.current = { a: null, b: null };
      setValidationError(null);
      if (fileInputRefA.current) fileInputRefA.current.value = '';
      if (fileInputRefB.current) fileInputRefB.current.value = '';
  };

  const handleAiInsights = async () => {
    if (riskData.length === 0) return;
    setIsGeneratingReport(true);
    const summary = await generateExecutiveSummary(riskData);
    setAiReport(summary);
    setIsGeneratingReport(false);
  };

  const handleExportResults = () => {
      if (riskData.length === 0) return;
      const ws = XLSX.utils.json_to_sheet(riskData.map(r => ({
          TesisatNo: r.tesisatNo,
          MuhatapNo: r.muhatapNo,
          RiskPuani: r.totalScore,
          Seviye: r.riskLevel,
          Enlem: r.location.lat,
          Boylam: r.location.lng,
          Adres: r.address
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "AnalizSonuclari");
      XLSX.writeFile(wb, "kacak_analiz_sonuclari.xlsx");
  };

  const handleFileSelect = async (type: 'a' | 'b', e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsReadingFile(type);
      await new Promise(r => setTimeout(r, 50));
      try {
        const workbook = await readWorkbook(file);
        if (type === 'a') {
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
            if (json.length === 0) throw new Error("Referans dosyası boş.");
            fileObjects.current.a = file;
        } else {
             if (workbook.SheetNames.length === 0) throw new Error("Dosya boş.");
             fileObjects.current.b = file;
        }
        setFiles(prev => ({ ...prev, [type]: file.name }));
      } catch (err: any) {
        setValidationError(err.message || "Dosya okunamadı.");
        e.target.value = ""; 
        setFiles(prev => ({ ...prev, [type]: null }));
        if (type === 'a') fileObjects.current.a = null;
        else fileObjects.current.b = null;
      } finally {
        setIsReadingFile(null);
      }
    }
  };
  
  // -- FILTERING LOGIC FOR DASHBOARD --
  const filteredRiskData = useMemo(() => {
      if (!selectedDistrict) return riskData;
      return riskData.filter(r => r.district === selectedDistrict);
  }, [riskData, selectedDistrict]);

  const getTopRiskForView = (view: typeof dashboardView): RiskScore | null => {
      let filtered: RiskScore[] = [];
      if (view === 'tampering') filtered = filteredRiskData.filter(r => r.isTamperingSuspect);
      else if (view === 'inconsistent') filtered = filteredRiskData.filter(r => r.inconsistentData.hasWinterDrop || r.inconsistentData.isSemesterSuspect);
      else filtered = filteredRiskData;
      return filtered.length > 0 ? filtered[0] : null;
  };

  // -- Analysis Starter Component --
  const AnalysisStarter = ({ 
      title, 
      desc, 
      icon: Icon, 
      color, 
      moduleName 
  }: { title: string, desc: string, icon: any, color: string, moduleName: keyof AnalysisStatus }) => (
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-[30px] border border-slate-200 shadow-sm p-8 text-center animate-slide-up">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${color} bg-opacity-10`}>
              <Icon className={`h-10 w-10 ${color.replace('bg-', 'text-')}`} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
          <p className="text-slate-500 max-w-md mb-8">{desc}</p>
          <button 
              onClick={() => handleRunModuleAnalysis(moduleName)}
              disabled={!!runningAnalysis}
              className={`px-8 py-3 rounded-full font-bold text-white shadow-lg transform transition-all active:scale-95 flex items-center gap-3
                  ${color.replace('bg-', 'bg-').replace('text-', '')} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
              {runningAnalysis === moduleName ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" /> Analiz Ediliyor...
                  </>
              ) : (
                  <>
                    <Play className="h-5 w-5 fill-current" /> Analizi Başlat
                  </>
              )}
          </button>
      </div>
  );

  // --- VIEW RENDER ---
  if (appStage === 'setup') {
     return (
        <div className="min-h-screen bg-[#F5F5F7] text-slate-900 flex flex-col relative overflow-hidden font-sans items-center justify-center">
            
            <div className="flex flex-col items-center justify-center min-h-[70vh] animate-slide-up relative z-10 w-full max-w-4xl px-6">
                 {/* Error Msg */}
                 {validationError && (
                    <div className="w-full mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-3 shadow-apple">
                        <div className="flex items-center gap-3">
                            <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                            <p className="text-sm font-medium text-red-700">{validationError}</p>
                        </div>
                        <button onClick={() => setValidationError(null)} className="text-slate-400 hover:text-slate-600"><XCircle className="h-5 w-5" /></button>
                    </div>
                )}
                
                <div className="text-center mb-12">
                     <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="bg-apple-blue rounded-2xl p-3 shadow-lg shadow-blue-500/30">
                            <ShieldCheck className="h-10 w-10 text-white" />
                        </div>
                        <span className="font-semibold text-4xl tracking-tight text-slate-900">Kaçak<span className="text-apple-blue">Kontrol</span></span>
                    </div>
                    <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed">
                        Yapay zeka destekli kaçak tespit ve analiz platformu. Veri setlerinizi yükleyerek analize başlayın.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-10">
                    <div 
                        onClick={() => !isReadingFile && fileInputRefA.current?.click()}
                        className={`group relative h-64 bg-white rounded-[24px] border border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center
                        ${files.a ? 'border-green-400 bg-green-50/30' : 'border-slate-300 hover:border-apple-blue hover:shadow-apple-hover'}
                        ${isReadingFile === 'a' ? 'opacity-80 pointer-events-none' : ''}`}
                    >
                        <input type="file" ref={fileInputRefA} onChange={(e) => handleFileSelect('a', e)} className="hidden" accept=".csv, .xlsx, .xls" />
                        
                        {isReadingFile === 'a' ? (
                            <Loader2 className="h-10 w-10 text-slate-400 animate-spin" />
                        ) : (
                            <>
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${files.a ? 'bg-green-100' : 'bg-slate-50 group-hover:bg-blue-50'}`}>
                                    {files.a ? <CheckCircle className="h-8 w-8 text-green-600" /> : <UploadCloud className="h-8 w-8 text-slate-400 group-hover:text-apple-blue" />}
                                </div>
                                <h3 className="font-semibold text-slate-900 mb-1">Referans Liste (Sabıkalı)</h3>
                                <p className="text-sm text-slate-500 max-w-[200px] text-center">{files.a ? files.a : 'Tesisat/Muhatap, Konum, Kara Liste...'}</p>
                            </>
                        )}
                    </div>

                    <div 
                        onClick={() => !isReadingFile && fileInputRefB.current?.click()}
                        className={`group relative h-64 bg-white rounded-[24px] border border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center
                        ${files.b ? 'border-green-400 bg-green-50/30' : 'border-slate-300 hover:border-apple-blue hover:shadow-apple-hover'}
                        ${isReadingFile === 'b' ? 'opacity-80 pointer-events-none' : ''}`}
                    >
                        <input type="file" ref={fileInputRefB} onChange={(e) => handleFileSelect('b', e)} className="hidden" accept=".csv, .xlsx, .xls" />
                        
                        {isReadingFile === 'b' ? (
                            <Loader2 className="h-10 w-10 text-slate-400 animate-spin" />
                        ) : (
                            <>
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${files.b ? 'bg-green-100' : 'bg-slate-50 group-hover:bg-blue-50'}`}>
                                    {files.b ? <CheckCircle className="h-8 w-8 text-green-600" /> : <FileSpreadsheet className="h-8 w-8 text-slate-400 group-hover:text-apple-blue" />}
                                </div>
                                <h3 className="font-semibold text-slate-900 mb-1">Hedef Liste (Tüketim)</h3>
                                <p className="text-sm text-slate-500 max-w-[200px] text-center">{files.b ? files.b : 'Tesisat, Muhatap, Abone Tipi, Ay, Sm3...'}</p>
                            </>
                        )}
                    </div>
                </div>

                {loadingProgress > 0 && loadingProgress < 100 && (
                     <div className="w-full max-w-md mb-8">
                        <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
                             <span>{loadingStatusText}</span>
                             <span>%{loadingProgress}</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                             <div className="h-full bg-apple-blue transition-all duration-300 ease-out" style={{ width: `${loadingProgress}%` }}></div>
                        </div>
                     </div>
                )}

                <button 
                    onClick={handleLoadData}
                    disabled={loadingProgress > 0 && loadingProgress < 100}
                    className="w-full max-w-sm bg-apple-blue hover:bg-blue-600 text-white font-semibold py-4 rounded-full shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loadingProgress > 0 && loadingProgress < 100 ? <Loader2 className="animate-spin h-5 w-5" /> : "Verileri Yükle"}
                </button>
            </div>
        </div>
      );
  }

  // --- DASHBOARD LAYOUT ---
  return (
    <div className="flex h-screen bg-[#F5F5F7] font-sans overflow-hidden text-slate-900">
        <ExplainerModal isOpen={showExplainer} onClose={() => setShowExplainer(false)} />
        <Sidebar 
            currentView={dashboardView} 
            setView={setDashboardView} 
            onExport={handleExportResults}
            onReset={handleReset}
            level1Count={stats.level1Count}
        />
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
            
            {/* Glassmorphic Header */}
            <header className="h-16 flex items-center justify-between px-8 border-b border-slate-200 bg-white/70 backdrop-blur-xl sticky top-0 z-30 shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                        {dashboardView === 'general' && 'Genel Bakış'}
                        {dashboardView === 'georisk' && 'Coğrafi Risk Haritası'}
                        {dashboardView === 'tampering' && 'Müdahale Analizi'}
                        {dashboardView === 'inconsistent' && 'Tutarsız Kış Tüketimi'}
                        {dashboardView === 'rule120' && '120 sm³ Kuralı'}
                    </h2>
                    {duplicateInfo && (
                        <div className="flex items-center gap-2">
                            <div className="px-2 py-1 bg-slate-100 rounded-md text-[10px] font-medium text-slate-500 flex items-center gap-1" title="İşlenen veri satırı">
                                <FileText className="h-3 w-3" />
                                {duplicateInfo.totalRows.toLocaleString()} Satır
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShowExplainer(true)}
                      className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                      title="Nasıl Çalışır?"
                    >
                      <BookOpen className="h-5 w-5" />
                    </button>

                    <button 
                        onClick={handleAiInsights}
                        disabled={isGeneratingReport || !!aiReport || riskData.length === 0}
                        className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-full transition-all border ${
                            aiReport 
                            ? 'bg-green-50 text-green-700 border-green-200 cursor-default'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-apple-blue hover:text-apple-blue disabled:opacity-50'
                        }`}
                    >
                         <BrainCircuit className="h-3.5 w-3.5" />
                         {isGeneratingReport ? 'Analiz Ediliyor...' : aiReport ? 'Rapor Hazır' : 'AI Analiz'}
                    </button>
                    
                    <div className="w-px h-6 bg-slate-300 mx-1"></div>
                    
                    <div className="text-xs font-medium text-slate-500">
                        {rawSubscribers.length.toLocaleString()} Abone
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="mb-8 animate-slide-up">
                    <StatsCards stats={stats} />
                </div>
                
                {/* GENERAL VIEW (Always shows current state) */}
                {dashboardView === 'general' && (
                    <div className="animate-slide-up" style={{animationDelay: '0.1s'}}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 h-[400px]">
                            <div className="lg:col-span-2 h-full">
                                <DashboardChart topRisk={filteredRiskData[0] || null} />
                            </div>
                            <div className="h-full">
                                {analysisStatus.georisk ? (
                                    <HotspotPanel 
                                        riskData={riskData} 
                                        referenceLocations={refLocations} 
                                        selectedDistrict={selectedDistrict}
                                        onDistrictSelect={setSelectedDistrict}
                                    />
                                ) : (
                                    <div className="h-full flex items-center justify-center bg-white rounded-[30px] border border-slate-200 shadow-sm p-6 text-center">
                                        <div className="text-slate-400 text-sm">Harita analizi için "Coğrafi Harita" menüsünden analizi başlatın.</div>
                                    </div>
                                )}
                            </div>
                        </div>
                         <div className="min-h-[500px]">
                            <RiskTable data={filteredRiskData} />
                         </div>
                    </div>
                )}

                {/* GEO RISK VIEW */}
                {dashboardView === 'georisk' && (
                    <div className="h-full animate-slide-up" style={{animationDelay: '0.1s'}}>
                        {!analysisStatus.georisk ? (
                             <AnalysisStarter 
                                title="Coğrafi Risk Analizi"
                                desc="Yüksek riskli abonelere yakın (10m) mesafedeki, tutarsız tüketim gösteren diğer aboneleri tarar."
                                icon={Zap}
                                color="bg-red-500"
                                moduleName="georisk"
                             />
                        ) : (
                            <>
                                <div className="mb-6 h-[500px]">
                                    <HotspotPanel 
                                        riskData={riskData} 
                                        referenceLocations={refLocations}
                                        selectedDistrict={selectedDistrict}
                                        onDistrictSelect={setSelectedDistrict}
                                    />
                                </div>
                                <div className="h-[500px]">
                                        <GeoRiskTable data={filteredRiskData.filter(r => r.breakdown.geoRisk > 0)} />
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* TAMPERING VIEW */}
                {dashboardView === 'tampering' && (
                     <div className="h-full animate-slide-up" style={{animationDelay: '0.1s'}}>
                        {!analysisStatus.tampering ? (
                            <AnalysisStarter 
                                title="Müdahale Analizi (Bypass)"
                                desc="Kış ve Yaz tüketim ortalamalarını karşılaştırarak ısıtma katsayısını hesaplar. Mevsimsel farkı olmayan (Bypass şüphesi) aboneleri tespit eder."
                                icon={Zap}
                                color="bg-orange-500"
                                moduleName="tampering"
                             />
                        ) : (
                            <>
                                <div className="mb-6 h-[350px]">
                                    <DashboardChart topRisk={getTopRiskForView(dashboardView)} />
                                </div>
                                <div className="h-[600px]">
                                    <TamperingTable data={filteredRiskData.filter(r => r.isTamperingSuspect)} />
                                </div>
                            </>
                        )}
                     </div>
                )}
                
                {/* RULE 120 VIEW */}
                {dashboardView === 'rule120' && (
                    <div className="h-full animate-slide-up" style={{animationDelay: '0.1s'}}>
                         {!analysisStatus.rule120 ? (
                            <AnalysisStarter 
                                title="120 sm³ Kuralı Analizi"
                                desc="Ocak ve Şubat aylarının her ikisinde de 120 sm³ altında tüketim yapan, ancak boş ev statüsünde olmayan (Toplam > 25) aboneleri tarar."
                                icon={Zap}
                                color="bg-blue-500"
                                moduleName="rule120"
                             />
                        ) : (
                            <div className="h-full pb-8">
                                <Rule120Table data={filteredRiskData.filter(r => r.is120RuleSuspect)} />
                            </div>
                        )}
                    </div>
                )}

                {/* INCONSISTENT VIEW */}
                {dashboardView === 'inconsistent' && (
                    <div className="h-full animate-slide-up" style={{animationDelay: '0.1s'}}>
                        {!analysisStatus.inconsistent ? (
                            <AnalysisStarter 
                                title="Tutarsız Tüketim Analizi"
                                desc="Ani düşüşler, düz çizgi (sabit tüketim) ve sömestr tatili şüphelerini matematiksel trend eğimi ile analiz eder."
                                icon={Zap}
                                color="bg-pink-500"
                                moduleName="inconsistent"
                             />
                        ) : (
                            <div className="h-full pb-8">
                                <InconsistentTable data={filteredRiskData.filter(r => r.inconsistentData.hasWinterDrop || r.inconsistentData.isSemesterSuspect)} />
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    </div>
  );
};

export default App;