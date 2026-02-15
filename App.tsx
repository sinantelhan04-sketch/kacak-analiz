import React, { useState, useRef, useMemo, useEffect } from 'react';
import { CheckCircle, BrainCircuit, FileSpreadsheet, FileText, XCircle, ShieldCheck, Zap, Loader2, Play, BookOpen, UploadCloud, X, Building2, ChevronRight, Command } from 'lucide-react';
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
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 p-8 text-center hover:shadow-md transition-shadow">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-5 ${color} bg-opacity-10 border border-slate-100`}>
              <Icon className={`h-8 w-8 ${color.replace('bg-', 'text-')}`} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
          <p className="text-slate-500 max-w-sm mb-6 text-sm">{desc}</p>
          <button 
              onClick={() => handleRunModuleAnalysis(moduleName)}
              disabled={!!runningAnalysis}
              className={`px-6 py-2.5 rounded-lg font-semibold text-white shadow-sm hover:shadow flex items-center gap-2 transition-all
                  bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
              {runningAnalysis === moduleName ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" /> Analiz Ediliyor...
                  </>
              ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" /> Analizi Başlat
                  </>
              )}
          </button>
      </div>
  );

  // --- VIEW RENDER ---
  if (appStage === 'setup') {
     return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6">
            
            <div className="flex flex-col items-center justify-center w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-slate-200 p-10">
                 {/* Error Msg */}
                 {validationError && (
                    <div className="w-full mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                            <p className="text-sm font-medium text-red-700">{validationError}</p>
                        </div>
                        <button onClick={() => setValidationError(null)} className="text-slate-400 hover:text-slate-600"><XCircle className="h-5 w-5" /></button>
                    </div>
                )}
                
                <div className="text-center mb-10">
                     <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="bg-primary-50 rounded-xl p-3 border border-primary-100">
                            <ShieldCheck className="h-10 w-10 text-primary-600" />
                        </div>
                    </div>
                    <h1 className="font-bold text-3xl text-slate-900 mb-2 tracking-tight">
                        Kaçak<span className="text-primary-600">Kontrol</span> Pro
                    </h1>
                    <p className="text-slate-500 text-lg">
                        Yüksek performanslı veri analiz platformu.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
                    <div 
                        onClick={() => fileInputRefA.current?.click()}
                        className={`group relative h-60 bg-slate-50 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden
                        ${files.a ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-primary-500 hover:bg-white'}`}
                    >
                        <input type="file" ref={fileInputRefA} onChange={(e) => handleFileSelect('a', e)} className="hidden" accept=".csv, .xlsx, .xls" />
                        
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-all ${files.a ? 'bg-green-500 text-white' : 'bg-white text-slate-400 border border-slate-200 group-hover:text-primary-600'}`}>
                            {files.a ? <CheckCircle className="h-8 w-8" /> : <UploadCloud className="h-8 w-8" />}
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-1">Referans Listesi</h3>
                        <p className="text-xs text-slate-500 max-w-[200px] text-center">
                            {files.a ? <span className="text-green-700 font-medium">{files.a}</span> : 'Sabıkalı abone ve tesisat numaralarını içeren dosya.'}
                        </p>
                    </div>

                    <div 
                        onClick={() => fileInputRefB.current?.click()}
                         className={`group relative h-60 bg-slate-50 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden
                        ${files.b ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-primary-500 hover:bg-white'}`}
                    >
                        <input type="file" ref={fileInputRefB} onChange={(e) => handleFileSelect('b', e)} className="hidden" accept=".csv, .xlsx, .xls" />
                        
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-all ${files.b ? 'bg-green-500 text-white' : 'bg-white text-slate-400 border border-slate-200 group-hover:text-primary-600'}`}>
                            {files.b ? <CheckCircle className="h-8 w-8" /> : <FileSpreadsheet className="h-8 w-8" />}
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-1">Tüketim Verisi</h3>
                        <p className="text-xs text-slate-500 max-w-[200px] text-center">
                             {files.b ? <span className="text-green-700 font-medium">{files.b}</span> : 'Aylık tüketim, adres ve abone bilgilerini içeren dosya.'}
                        </p>
                    </div>
                </div>

                {loadingProgress > 0 && (
                     <div className="w-full max-w-lg mb-8 bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                             <span>{loadingStatusText}</span>
                             <span>%{loadingProgress}</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                             <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: `${loadingProgress}%` }}></div>
                        </div>
                     </div>
                )}

                <button 
                    onClick={handleLoadData}
                    disabled={loadingProgress > 0 && loadingProgress < 100}
                    className="w-full max-w-sm bg-primary-600 hover:bg-primary-700 text-white font-bold text-base py-3.5 rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loadingProgress > 0 && loadingProgress < 100 ? (
                        <Loader2 className="animate-spin h-5 w-5" /> 
                    ) : (
                        <>
                            Analizi Başlat <ChevronRight className="h-5 w-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
      );
  }

  // --- DASHBOARD LAYOUT ---
  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden text-slate-900">
        
        <ExplainerModal isOpen={showExplainer} onClose={() => setShowExplainer(false)} />
        <Sidebar 
            currentView={dashboardView} 
            setView={setDashboardView} 
            onExport={handleExportResults}
            onReset={handleReset}
            level1Count={stats.level1Count}
        />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
            
            {/* Header */}
            <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 sticky top-0 z-30 shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">
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
                            <div className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md text-[11px] font-medium text-slate-500 flex items-center gap-1.5" title="İşlenen veri satırı">
                                <FileText className="h-3 w-3" />
                                {duplicateInfo.totalRows.toLocaleString()} Satır
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShowExplainer(true)}
                      className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Nasıl Çalışır?"
                    >
                      <BookOpen className="h-5 w-5" />
                    </button>

                    <button 
                        onClick={handleAiInsights}
                        disabled={isGeneratingReport || riskData.length === 0}
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${
                            aiReport 
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-primary-500 hover:text-primary-600 disabled:opacity-50'
                        }`}
                    >
                         <BrainCircuit className="h-4 w-4" />
                         {isGeneratingReport ? 'Analiz Ediliyor...' : aiReport ? 'Raporu Aç' : 'AI Analiz'}
                    </button>
                    
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    
                    <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                        <div className="text-xs font-semibold text-slate-600">
                            {rawSubscribers.length.toLocaleString()} <span className="text-slate-400 font-normal">Abone</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
                <div className="mb-6">
                    <StatsCards stats={stats} />
                </div>
                
                {/* GENERAL VIEW (Always shows current state) */}
                {dashboardView === 'general' && (
                    <div>
                        {/* Standard Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 h-[400px]">
                            
                            {/* CHART */}
                            <div className="lg:col-span-2 h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <DashboardChart topRisk={filteredRiskData[0] || null} />
                            </div>

                            {/* MAP */}
                            <div className="h-full lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-1">
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
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                            <Building2 className="h-6 w-6 text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 text-sm font-medium mb-4">Harita analizi henüz başlatılmadı.</p>
                                        <button 
                                            onClick={() => setDashboardView('georisk')}
                                            className="text-primary-600 hover:underline text-sm font-semibold"
                                        >
                                            Harita Modülüne Git &rarr;
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                         <div className="min-h-[500px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <RiskTable data={filteredRiskData} />
                         </div>
                    </div>
                )}

                {/* AI REPORT VIEW */}
                {dashboardView === 'ai-report' && (
                    <div className="h-full">
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
                    <div className="h-full">
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
                                <div className="mb-6 h-[400px] bg-white rounded-xl shadow-sm border border-slate-200 p-1">
                                    <HotspotPanel 
                                        riskData={riskData} 
                                        referenceLocations={refLocations}
                                        selectedDistrict={selectedDistrict}
                                        onDistrictSelect={setSelectedDistrict}
                                        detectedCity={detectedCity}
                                        availableDistricts={availableDistricts}
                                    />
                                </div>
                                <div className="h-[500px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                        <GeoRiskTable data={filteredRiskData.filter(r => r.breakdown.geoRisk > 0)} />
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* BUILDING ANALYSIS VIEW (NEW) */}
                {dashboardView === 'building' && (
                    <div className="h-full">
                        {!analysisStatus.buildingAnomaly ? (
                             <AnalysisStarter 
                                title="Bina Tüketim Analizi"
                                desc="Aynı binada oturan (aynı koordinat) en az 4 komşunun kış tüketim medyanını hesaplar ve bu ortalamadan %60 sapan daireleri listeler."
                                icon={Building2}
                                color="bg-indigo-500"
                                moduleName="buildingAnomaly"
                             />
                        ) : (
                            <div className="h-full pb-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <BuildingAnalysisTable data={buildingRiskData} />
                            </div>
                        )}
                    </div>
                )}

                {/* TAMPERING VIEW */}
                {dashboardView === 'tampering' && (
                     <div className="h-full">
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
                                <div className="mb-6 h-[350px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <DashboardChart topRisk={getTopRiskForView(dashboardView)} />
                                </div>
                                <div className="h-[600px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <TamperingTable data={filteredRiskData.filter(r => r.isTamperingSuspect)} />
                                </div>
                            </>
                        )}
                     </div>
                )}
                
                {/* RULE 120 VIEW */}
                {dashboardView === 'rule120' && (
                    <div className="h-full">
                         {!analysisStatus.rule120 ? (
                            <AnalysisStarter 
                                title="120 sm³ Kuralı Analizi"
                                desc="Ocak ve Şubat aylarının her ikisinde de 120 sm³ altında tüketim yapan, ancak boş ev statüsünde olmayan (Toplam > 25) aboneleri tarar."
                                icon={Zap}
                                color="bg-primary-500"
                                moduleName="rule120"
                             />
                        ) : (
                            <div className="h-full pb-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <Rule120Table data={filteredRiskData.filter(r => r.is120RuleSuspect)} />
                            </div>
                        )}
                    </div>
                )}

                {/* INCONSISTENT VIEW */}
                {dashboardView === 'inconsistent' && (
                    <div className="h-full">
                        {!analysisStatus.inconsistent ? (
                            <AnalysisStarter 
                                title="Tutarsız Tüketim Analizi"
                                desc="Ani düşüşler, düz çizgi (sabit tüketim) ve sömestr tatili şüphelerini matematiksel trend eğimi ile analiz eder."
                                icon={Zap}
                                color="bg-pink-500"
                                moduleName="inconsistent"
                             />
                        ) : (
                            <div className="h-full pb-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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