import React, { useState, useRef, useMemo, useEffect } from 'react';
import { CheckCircle, BrainCircuit, FileSpreadsheet, FileText, XCircle, ShieldCheck, Zap, Loader2, Play, BookOpen, UploadCloud, X, Building2, ChevronRight } from 'lucide-react';
import StatsCards from './components/StatsCards';
import RiskTable from './components/RiskTable';
import TamperingTable from './components/TamperingTable';
import InconsistentTable from './components/InconsistentTable';
import Rule120Table from './components/Rule120Table';
import GeoRiskTable from './components/GeoRiskTable';
import BuildingAnalysisTable from './components/BuildingAnalysisTable';
import HotspotPanel from './components/HotspotPanel';
import AiReportView from './components/AiReportView';
import Sidebar from './components/Sidebar';
import DashboardChart from './components/DashboardChart';
import ExplainerModal from './components/ExplainerModal';
import { generateDemoData, createBaseRiskScore, applyTamperingAnalysis, applyInconsistencyAnalysis, applyRule120Analysis, applyGeoAnalysis, analyzeBuildingConsumption } from './utils/fraudEngine';
import { generateComprehensiveReport } from './services/geminiService';
import { RiskScore, EngineStats, Subscriber, ReferenceLocation, AnalysisStatus, BuildingRisk } from './types';
import * as XLSX from 'xlsx';
import { processFiles } from './utils/dataLoader';

const App: React.FC = () => {
  // Stages: setup (upload) -> dashboard (loaded but idle) -> analyzing (processing)
  const [appStage, setAppStage] = useState<'setup' | 'dashboard'>('setup');
  const [dashboardView, setDashboardView] = useState<'general' | 'tampering' | 'inconsistent' | 'rule120' | 'georisk' | 'ai-report' | 'building'>('general');

  // DATA STATE
  const [rawSubscribers, setRawSubscribers] = useState<Subscriber[]>([]); // Holds parsed Excel data
  const [refMuhatapIds, setRefMuhatapIds] = useState<Set<string>>(new Set());
  const [refTesisatIds, setRefTesisatIds] = useState<Set<string>>(new Set());
  const [refLocations, setRefLocations] = useState<ReferenceLocation[]>([]); 

  // ANALYSIS RESULT STATE
  const [riskData, setRiskData] = useState<RiskScore[]>([]);
  const [buildingRiskData, setBuildingRiskData] = useState<BuildingRisk[]>([]); // New State for Building Module
  const [stats, setStats] = useState<EngineStats>({ totalScanned: 0, level1Count: 0, level2Count: 0, level3Count: 0 });
  const [detectedCity, setDetectedCity] = useState<string>('İSTANBUL');
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  
  // ON-DEMAND ANALYSIS STATE
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>({
      reference: false,
      tampering: false,
      inconsistent: false,
      rule120: false,
      georisk: false,
      buildingAnomaly: false
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

  // --- STAGE 1: LOAD DATA & INITIALIZE BASE SCORES ---
  const handleLoadData = async () => {
    setValidationError(null);
    setLoadingProgress(0);
    setLoadingStatusText("Hazırlanıyor...");
    setDuplicateInfo(null);
    setIsReadingFile('a'); // Just to show activity spinner
    setAnalysisStatus({ reference: false, tampering: false, inconsistent: false, rule120: false, georisk: false, buildingAnomaly: false });
    setBuildingRiskData([]);

    // Check if files are present
    if (!fileObjects.current.a || !fileObjects.current.b) {
        // Fallback to Demo Data if files missing
        if (!fileObjects.current.a && !fileObjects.current.b) {
             loadDemoData();
             return;
        }
        setValidationError("Lütfen her iki dosyayı da yükleyiniz.");
        setIsReadingFile(null);
        return;
    }

    // --- MAIN THREAD PROCESSING ---
    setLoadingStatusText("Veriler okunuyor...");
    
    try {
        const result = await processFiles(
            fileObjects.current.a, 
            fileObjects.current.b,
            (progress, status) => {
                setLoadingProgress(progress);
                setLoadingStatusText(status);
            }
        );
        
        finalizeDataLoad(result);

    } catch (err: any) {
        console.error("Processing Error:", err);
        setValidationError("Veri işleme sırasında hata oluştu: " + (err.message || "Bilinmeyen hata"));
        setLoadingProgress(0);
        setIsReadingFile(null);
    }
  };

  const loadDemoData = async () => {
      setLoadingProgress(10);
      setLoadingStatusText("Demo verisi oluşturuluyor...");
      
      // Simulate delay for effect
      await new Promise(r => setTimeout(r, 800));
      setLoadingProgress(50);
      
      const data = generateDemoData();
      const refLocs = data.subscribers
          .filter(s => data.fraudTesisatIds.has(s.tesisatNo) || s.relatedMuhatapNos.some(m => data.fraudMuhatapIds.has(m)))
          .map(s => ({
              id: s.tesisatNo, lat: s.location.lat, lng: s.location.lng, type: 'Reference' as const
          }));
          
      finalizeDataLoad({
          subscribers: data.subscribers,
          refMuhatapIds: data.fraudMuhatapIds,
          refTesisatIds: data.fraudTesisatIds,
          refLocations: refLocs,
          rawCount: 500
      });
  };

  const finalizeDataLoad = (data: { 
      subscribers: Subscriber[], 
      refMuhatapIds: Set<string>, 
      refTesisatIds: Set<string>, 
      refLocations: ReferenceLocation[],
      rawCount: number
  }) => {
      setLoadingProgress(95);
      setLoadingStatusText("Risk analizleri tamamlanıyor...");

      // --- RUN BASE ANALYSIS (Main Thread - Fast enough for scored data) ---
      const initialRisks = data.subscribers.map((sub) => createBaseRiskScore(sub, data.refMuhatapIds, data.refTesisatIds));
      
      // Sort by initial score
      initialRisks.sort((a,b) => b.totalScore - a.totalScore);

      // DETECT CITY AND DISTRICTS
      const cityCounts: Record<string, number> = {};
      const districtSet = new Set<string>();

      initialRisks.forEach(r => {
            if (r.city && r.city.trim()) {
                const c = r.city.toLocaleUpperCase('tr');
                cityCounts[c] = (cityCounts[c] || 0) + 1;
            }
            if (r.district && r.district.trim()) {
                districtSet.add(r.district.toLocaleUpperCase('tr'));
            }
      });

      let bestCity = 'İSTANBUL';
      let maxCount = 0;
      for (const [c, count] of Object.entries(cityCounts)) {
          if (count > maxCount) {
              maxCount = count;
              bestCity = c;
          }
      }
      
      setDetectedCity(bestCity);
      setAvailableDistricts(Array.from(districtSet).sort());
      
      setRawSubscribers(data.subscribers);
      setRefMuhatapIds(data.refMuhatapIds);
      setRefTesisatIds(data.refTesisatIds);
      setRefLocations(data.refLocations); 
      setRiskData(initialRisks);
      updateStats(initialRisks);
      
      setAnalysisStatus(prev => ({ ...prev, reference: true }));
      setDuplicateInfo({ totalRows: data.rawCount, uniqueSubs: data.subscribers.length });

      setLoadingProgress(100);
      setAppStage('dashboard'); 
      setIsReadingFile(null);
  };

  // --- ON-DEMAND ANALYSIS RUNNER ---
  const handleRunModuleAnalysis = async (module: keyof AnalysisStatus) => {
      if (analysisStatus[module]) return; // Already run
      
      setRunningAnalysis(module);
      
      // Allow UI to render loading state
      await new Promise(r => setTimeout(r, 100));

      // Separate logic for Building Anomaly since it returns a different type
      if (module === 'buildingAnomaly') {
          const results = analyzeBuildingConsumption(rawSubscribers);
          setBuildingRiskData(results);
          setAnalysisStatus(prev => ({ ...prev, buildingAnomaly: true }));
          setRunningAnalysis(null);
          return;
      }

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
              // Ensure Rule 120 analysis is done because Geo Analysis now depends on it
              updatedData = updatedData.map(item => {
                  const withRule120 = applyRule120Analysis(item);
                  return applyGeoAnalysis(withRule120, highRiskPoints);
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
      setBuildingRiskData([]);
      setStats({ totalScanned: 0, level1Count: 0, level2Count: 0, level3Count: 0 });
      setAiReport('');
      setAnalysisStatus({ reference: false, tampering: false, inconsistent: false, rule120: false, georisk: false, buildingAnomaly: false });
      setFiles({ a: null, b: null });
      setDuplicateInfo(null);
      setAvailableDistricts([]);
      setDetectedCity('İSTANBUL');
      fileObjects.current = { a: null, b: null };
      setValidationError(null);
      if (fileInputRefA.current) fileInputRefA.current.value = '';
      if (fileInputRefB.current) fileInputRefB.current.value = '';
  };

  const handleAiInsights = async () => {
    if (riskData.length === 0) return;
    setDashboardView('ai-report');
    setIsGeneratingReport(true);
    const summary = await generateComprehensiveReport(stats, riskData);
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
          Adres: r.address,
          Il: r.city,
          Ilce: r.district
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "AnalizSonuclari");
      XLSX.writeFile(wb, "kacak_analiz_sonuclari.xlsx");
  };

  const handleFileSelect = async (type: 'a' | 'b', e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Only set file object and name, do NOT read here
      if (type === 'a') fileObjects.current.a = file;
      else fileObjects.current.b = file;
      
      setFiles(prev => ({ ...prev, [type]: file.name }));
    }
  };
  
  // -- FILTERING LOGIC FOR DASHBOARD --
  const filteredRiskData = useMemo(() => {
      if (!selectedDistrict) return riskData;
      return riskData.filter(r => r.district === selectedDistrict);
  }, [riskData, selectedDistrict]);

  const getTopRiskForView = (view: typeof dashboardView): RiskScore | null => {
      let filtered: RiskScore[] = [];
      if (view === 'tampering') {
          filtered = filteredRiskData.filter(r => r.isTamperingSuspect);
          filtered.sort((a,b) => a.heatingSensitivity - b.heatingSensitivity);
      }
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
      <div className="h-full flex flex-col items-center justify-center glass-panel rounded-[30px] p-8 text-center animate-slide-up hover:shadow-apple-hover transition-all duration-500">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${color} bg-opacity-10 backdrop-blur-sm border border-white/50 shadow-inner`}>
              <Icon className={`h-10 w-10 ${color.replace('bg-', 'text-')}`} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">{title}</h2>
          <p className="text-slate-500 max-w-md mb-8 text-lg leading-relaxed">{desc}</p>
          <button 
              onClick={() => handleRunModuleAnalysis(moduleName)}
              disabled={!!runningAnalysis}
              className={`px-8 py-4 rounded-full font-bold text-white shadow-xl transform transition-all hover:scale-105 active:scale-95 flex items-center gap-3
                  ${color.replace('bg-', 'bg-').replace('text-', '')} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
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
            
            {/* Animated Mesh Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-40 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
                <div className="absolute bottom-[-20%] right-[20%] w-[500px] h-[500px] bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-3000"></div>
            </div>

            <div className="flex flex-col items-center justify-center min-h-[70vh] animate-slide-up relative z-10 w-full max-w-5xl px-6">
                 {/* Error Msg */}
                 {validationError && (
                    <div className="w-full mb-8 p-4 bg-red-50/90 backdrop-blur-md border border-red-200 rounded-2xl flex items-center justify-between gap-3 shadow-glass animate-slide-up">
                        <div className="flex items-center gap-3">
                            <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                            <p className="text-sm font-medium text-red-700">{validationError}</p>
                        </div>
                        <button onClick={() => setValidationError(null)} className="text-slate-400 hover:text-slate-600"><XCircle className="h-5 w-5" /></button>
                    </div>
                )}
                
                <div className="text-center mb-16 relative">
                     <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="bg-apple-blue rounded-3xl p-4 shadow-xl shadow-blue-500/20 backdrop-blur-md bg-opacity-90">
                            <ShieldCheck className="h-12 w-12 text-white" />
                        </div>
                    </div>
                    <h1 className="font-bold text-5xl tracking-tight text-slate-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                        Kaçak<span className="text-apple-blue">Kontrol</span> AI
                    </h1>
                    <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed font-medium">
                        Yeni nesil yapay zeka destekli dolandırıcılık tespit ve analiz platformu. Veri setlerinizi yükleyin, riskleri saniyeler içinde görün.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-12">
                    <div 
                        onClick={() => fileInputRefA.current?.click()}
                        className={`group relative h-72 glass-card rounded-[32px] border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center overflow-hidden
                        ${files.a ? 'border-green-400 bg-green-50/50' : 'border-slate-200 hover:border-apple-blue hover:shadow-2xl hover:-translate-y-1'}`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <input type="file" ref={fileInputRefA} onChange={(e) => handleFileSelect('a', e)} className="hidden" accept=".csv, .xlsx, .xls" />
                        
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300 shadow-sm ${files.a ? 'bg-green-500 text-white scale-110' : 'bg-white group-hover:bg-blue-50 text-slate-400 group-hover:text-apple-blue'}`}>
                            {files.a ? <CheckCircle className="h-10 w-10" /> : <UploadCloud className="h-10 w-10" />}
                        </div>
                        <h3 className="font-bold text-xl text-slate-800 mb-2">Referans Listesi</h3>
                        <p className="text-sm text-slate-500 max-w-[220px] text-center leading-snug">
                            {files.a ? <span className="text-green-600 font-medium">{files.a}</span> : 'Sabıkalı abone ve tesisat numaralarını içeren dosya.'}
                        </p>
                    </div>

                    <div 
                        onClick={() => fileInputRefB.current?.click()}
                         className={`group relative h-72 glass-card rounded-[32px] border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center overflow-hidden
                        ${files.b ? 'border-green-400 bg-green-50/50' : 'border-slate-200 hover:border-apple-blue hover:shadow-2xl hover:-translate-y-1'}`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <input type="file" ref={fileInputRefB} onChange={(e) => handleFileSelect('b', e)} className="hidden" accept=".csv, .xlsx, .xls" />
                        
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300 shadow-sm ${files.b ? 'bg-green-500 text-white scale-110' : 'bg-white group-hover:bg-blue-50 text-slate-400 group-hover:text-apple-blue'}`}>
                            {files.b ? <CheckCircle className="h-10 w-10" /> : <FileSpreadsheet className="h-10 w-10" />}
                        </div>
                        <h3 className="font-bold text-xl text-slate-800 mb-2">Tüketim Verisi</h3>
                        <p className="text-sm text-slate-500 max-w-[220px] text-center leading-snug">
                             {files.b ? <span className="text-green-600 font-medium">{files.b}</span> : 'Aylık tüketim, adres ve abone bilgilerini içeren dosya.'}
                        </p>
                    </div>
                </div>

                {loadingProgress > 0 && (
                     <div className="w-full max-w-lg mb-8 bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-slate-200 shadow-glass">
                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                             <span>{loadingStatusText}</span>
                             <span>%{loadingProgress}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                             <div className="h-full bg-apple-blue transition-all duration-500 ease-out relative" style={{ width: `${loadingProgress}%` }}>
                                <div className="absolute inset-0 bg-white/30 animate-[pulse_2s_infinite]"></div>
                             </div>
                        </div>
                     </div>
                )}

                <button 
                    onClick={handleLoadData}
                    disabled={loadingProgress > 0 && loadingProgress < 100}
                    className="w-full max-w-sm bg-apple-blue hover:bg-blue-600 text-white font-bold text-lg py-5 rounded-full shadow-xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                >
                    {loadingProgress > 0 && loadingProgress < 100 ? (
                        <Loader2 className="animate-spin h-6 w-6" /> 
                    ) : (
                        <>
                            Verileri Analiz Et <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </div>
        </div>
      );
  }

  // --- DASHBOARD LAYOUT ---
  return (
    <div className="flex h-screen bg-[#F5F5F7] font-sans overflow-hidden text-slate-900 relative">
        {/* Dashboard Animated Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-25">
             <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
             <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        </div>

        <ExplainerModal isOpen={showExplainer} onClose={() => setShowExplainer(false)} />
        <Sidebar 
            currentView={dashboardView} 
            setView={setDashboardView} 
            onExport={handleExportResults}
            onReset={handleReset}
            level1Count={stats.level1Count}
        />
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
            
            {/* Glassmorphic Header */}
            <header className="h-20 flex items-center justify-between px-8 bg-white/60 backdrop-blur-xl border-b border-white/20 sticky top-0 z-30 shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                        {dashboardView === 'general' && 'Genel Bakış'}
                        {dashboardView === 'ai-report' && 'Yapay Zeka Raporu'}
                        {dashboardView === 'georisk' && 'Coğrafi Risk Haritası'}
                        {dashboardView === 'building' && 'Bina Tüketimi (Komşu Analizi)'}
                        {dashboardView === 'tampering' && 'Müdahale Analizi'}
                        {dashboardView === 'inconsistent' && 'Tutarsız Kış Tüketimi'}
                        {dashboardView === 'rule120' && '120 sm³ Kuralı'}
                    </h2>
                    {duplicateInfo && (
                        <div className="flex items-center gap-2">
                            <div className="px-3 py-1 bg-white/50 border border-slate-200/50 backdrop-blur-sm rounded-full text-[11px] font-medium text-slate-500 flex items-center gap-1.5 shadow-sm" title="İşlenen veri satırı">
                                <FileText className="h-3 w-3" />
                                {duplicateInfo.totalRows.toLocaleString()} Satır
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShowExplainer(true)}
                      className="p-2.5 text-slate-500 hover:bg-white/60 hover:text-apple-blue rounded-full transition-all border border-transparent hover:border-slate-200 shadow-sm hover:shadow-md"
                      title="Nasıl Çalışır?"
                    >
                      <BookOpen className="h-5 w-5" />
                    </button>

                    <button 
                        onClick={handleAiInsights}
                        disabled={isGeneratingReport || riskData.length === 0}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full transition-all border shadow-sm ${
                            aiReport 
                            ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-purple-100'
                            : 'bg-white/80 backdrop-blur-sm text-slate-700 border-slate-200 hover:border-apple-blue hover:text-apple-blue hover:shadow-md disabled:opacity-50'
                        }`}
                    >
                         <BrainCircuit className="h-4 w-4" />
                         {isGeneratingReport ? 'Analiz Ediliyor...' : aiReport ? 'Raporu Aç' : 'AI Analiz'}
                    </button>
                    
                    <div className="w-px h-8 bg-slate-300/50 mx-2"></div>
                    
                    <div className="bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/40 shadow-sm">
                        <div className="text-xs font-semibold text-slate-600">
                            {rawSubscribers.length.toLocaleString()} <span className="text-slate-400 font-normal">Abone</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
                <div className="mb-8 animate-slide-up">
                    <StatsCards stats={stats} />
                </div>
                
                {/* GENERAL VIEW (Always shows current state) */}
                {dashboardView === 'general' && (
                    <div className="animate-slide-up" style={{animationDelay: '0.1s'}}>
                        {/* Standard Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 h-[450px]">
                            
                            {/* CHART */}
                            <div className="lg:col-span-2 h-full glass-panel rounded-[32px] shadow-sm hover:shadow-glass transition-all duration-500">
                                <DashboardChart topRisk={filteredRiskData[0] || null} />
                            </div>

                            {/* MAP */}
                            <div className="h-full lg:col-span-1 glass-panel rounded-[32px] shadow-sm hover:shadow-glass transition-all duration-500 p-1">
                                {analysisStatus.georisk ? (
                                    <HotspotPanel 
                                        riskData={riskData} 
                                        referenceLocations={refLocations} 
                                        selectedDistrict={selectedDistrict}
                                        onDistrictSelect={setSelectedDistrict}
                                        detectedCity={detectedCity}
                                        availableDistricts={availableDistricts}
                                    />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                            <Building2 className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 text-sm font-medium mb-4">Harita analizi henüz başlatılmadı.</p>
                                        <button 
                                            onClick={() => setDashboardView('georisk')}
                                            className="text-apple-blue hover:underline text-sm font-semibold"
                                        >
                                            Harita Modülüne Git &rarr;
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                         <div className="min-h-[500px] glass-panel rounded-[32px] shadow-sm">
                            <RiskTable data={filteredRiskData} />
                         </div>
                    </div>
                )}

                {/* AI REPORT VIEW */}
                {dashboardView === 'ai-report' && (
                    <div className="h-full animate-slide-up" style={{animationDelay: '0.1s'}}>
                        <AiReportView 
                            report={aiReport}
                            isGenerating={isGeneratingReport}
                            onGenerate={handleAiInsights}
                            stats={stats}
                            riskData={riskData}
                        />
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
                                <div className="mb-6 h-[500px] glass-panel rounded-[32px] p-1 shadow-glass">
                                    <HotspotPanel 
                                        riskData={riskData} 
                                        referenceLocations={refLocations}
                                        selectedDistrict={selectedDistrict}
                                        onDistrictSelect={setSelectedDistrict}
                                        detectedCity={detectedCity}
                                        availableDistricts={availableDistricts}
                                    />
                                </div>
                                <div className="h-[500px] glass-panel rounded-[32px] shadow-glass">
                                        <GeoRiskTable data={filteredRiskData.filter(r => r.breakdown.geoRisk > 0)} />
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* BUILDING ANALYSIS VIEW (NEW) */}
                {dashboardView === 'building' && (
                    <div className="h-full animate-slide-up" style={{animationDelay: '0.1s'}}>
                        {!analysisStatus.buildingAnomaly ? (
                             <AnalysisStarter 
                                title="Bina Tüketim Analizi"
                                desc="Aynı binada oturan (aynı koordinat) en az 4 komşunun kış tüketim medyanını hesaplar ve bu ortalamadan %60 sapan daireleri listeler."
                                icon={Building2}
                                color="bg-indigo-500"
                                moduleName="buildingAnomaly"
                             />
                        ) : (
                            <div className="h-full pb-8 glass-panel rounded-[32px] shadow-glass">
                                <BuildingAnalysisTable data={buildingRiskData} />
                            </div>
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
                                <div className="mb-6 h-[400px] glass-panel rounded-[32px] shadow-glass">
                                    <DashboardChart topRisk={getTopRiskForView(dashboardView)} />
                                </div>
                                <div className="h-[600px] glass-panel rounded-[32px] shadow-glass">
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
                            <div className="h-full pb-8 glass-panel rounded-[32px] shadow-glass">
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
                            <div className="h-full pb-8 glass-panel rounded-[32px] shadow-glass">
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