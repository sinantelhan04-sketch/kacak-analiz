

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { CheckCircle, BrainCircuit, FileSpreadsheet, FileText, XCircle, ShieldCheck, Zap, Loader2, Play, BookOpen, UploadCloud, X, Building2, ChevronRight, Command } from 'lucide-react';
import StatsCards from './components/StatsCards';
import RiskTable from './components/RiskTable';
import TamperingTable from './components/TamperingTable';
import InconsistentTable from './components/InconsistentTable';
import Rule120Table from './components/Rule120Table';
import GeoRiskTable from './components/GeoRiskTable';
import BuildingAnalysisTable from './components/BuildingAnalysisTable';
import WeatherAnalysisView from './components/WeatherAnalysisView';
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
  const [dashboardView, setDashboardView] = useState<'general' | 'tampering' | 'inconsistent' | 'rule120' | 'georisk' | 'ai-report' | 'building' | 'weather'>('general');

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

  // -- Analysis Starter Component (Apple Style) --
  const AnalysisStarter = ({ 
      title, 
      desc, 
      icon: Icon, 
      color, 
      moduleName 
  }: { title: string, desc: string, icon: any, color: string, moduleName: keyof AnalysisStatus }) => (
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-[32px] shadow-apple p-12 text-center transition-all duration-300 hover:shadow-apple-hover border border-white/50">
          <div className={`w-20 h-20 rounded-[24px] flex items-center justify-center mb-6 ${color} bg-opacity-10`}>
              <Icon className={`h-10 w-10 ${color.replace('bg-', 'text-')}`} strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-[#1D1D1F] mb-3 tracking-tight">{title}</h2>
          <p className="text-[#86868B] max-w-md mb-8 text-base leading-relaxed">{desc}</p>
          <button 
              onClick={() => handleRunModuleAnalysis(moduleName)}
              disabled={!!runningAnalysis}
              className={`px-8 py-4 rounded-full font-semibold text-white shadow-lg flex items-center gap-2.5 transition-all active:scale-95
                  bg-[#1D1D1F] hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
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
        <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col items-center justify-center p-6 font-sans">
            
            <div className="flex flex-col items-center justify-center w-full max-w-4xl bg-white rounded-[40px] shadow-2xl p-16 relative overflow-hidden">
                 {/* Decorative blurred blobs */}
                 <div className="absolute top-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -ml-20 -mt-20"></div>
                 <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl -mr-20 -mb-20"></div>

                 {/* Error Msg */}
                 {validationError && (
                    <div className="w-full mb-8 p-4 bg-red-50/50 border border-red-100 rounded-2xl flex items-center justify-between gap-3 animate-slide-up backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                            </div>
                            <p className="text-sm font-medium text-red-700">{validationError}</p>
                        </div>
                        <button onClick={() => setValidationError(null)} className="text-slate-400 hover:text-slate-600"><XCircle className="h-5 w-5" /></button>
                    </div>
                )}
                
                <div className="text-center mb-12 relative z-10">
                     <div className="flex items-center justify-center gap-3 mb-5">
                        <div className="bg-[#1D1D1F] rounded-[20px] p-4 shadow-xl">
                            <ShieldCheck className="h-10 w-10 text-white" strokeWidth={1.5} />
                        </div>
                    </div>
                    <h1 className="font-bold text-4xl text-[#1D1D1F] mb-3 tracking-tighter">
                        Kaçak Kontrol Pro
                    </h1>
                    <p className="text-[#86868B] text-lg font-medium">
                        Yeni nesil fraud analiz ve tespit platformu.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-10 relative z-10">
                    <div 
                        onClick={() => fileInputRefA.current?.click()}
                        className={`group relative h-64 bg-[#F5F5F7] rounded-[30px] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden hover:scale-[1.02] duration-300
                        ${files.a ? 'border-apple-green bg-green-50/30' : 'border-gray-200 hover:border-apple-blue hover:bg-white hover:shadow-xl'}`}
                    >
                        <input type="file" ref={fileInputRefA} onChange={(e) => handleFileSelect('a', e)} className="hidden" accept=".csv, .xlsx, .xls" />
                        
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 transition-all shadow-sm ${files.a ? 'bg-apple-green text-white' : 'bg-white text-[#86868B] group-hover:text-apple-blue group-hover:scale-110'}`}>
                            {files.a ? <CheckCircle className="h-8 w-8" /> : <UploadCloud className="h-8 w-8" strokeWidth={1.5} />}
                        </div>
                        <h3 className="font-semibold text-[#1D1D1F] mb-1">Referans Listesi</h3>
                        <p className="text-xs text-[#86868B] max-w-[200px] text-center font-medium">
                            {files.a ? <span className="text-apple-green font-bold">{files.a}</span> : 'Sabıkalı abone ve tesisat numaralarını içeren dosya.'}
                        </p>
                    </div>

                    <div 
                        onClick={() => fileInputRefB.current?.click()}
                         className={`group relative h-64 bg-[#F5F5F7] rounded-[30px] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden hover:scale-[1.02] duration-300
                        ${files.b ? 'border-apple-green bg-green-50/30' : 'border-gray-200 hover:border-apple-blue hover:bg-white hover:shadow-xl'}`}
                    >
                        <input type="file" ref={fileInputRefB} onChange={(e) => handleFileSelect('b', e)} className="hidden" accept=".csv, .xlsx, .xls" />
                        
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 transition-all shadow-sm ${files.b ? 'bg-apple-green text-white' : 'bg-white text-[#86868B] group-hover:text-apple-blue group-hover:scale-110'}`}>
                            {files.b ? <CheckCircle className="h-8 w-8" /> : <FileSpreadsheet className="h-8 w-8" strokeWidth={1.5} />}
                        </div>
                        <h3 className="font-semibold text-[#1D1D1F] mb-1">Tüketim Verisi</h3>
                        <p className="text-xs text-[#86868B] max-w-[200px] text-center font-medium">
                             {files.b ? <span className="text-apple-green font-bold">{files.b}</span> : 'Aylık tüketim, adres ve abone bilgilerini içeren dosya.'}
                        </p>
                    </div>
                </div>

                {loadingProgress > 0 && (
                     <div className="w-full max-w-lg mb-8 bg-[#F5F5F7] rounded-2xl p-5 border border-white/50 relative z-10">
                        <div className="flex justify-between text-xs font-bold text-[#86868B] mb-3 uppercase tracking-wide">
                             <span>{loadingStatusText}</span>
                             <span>%{loadingProgress}</span>
                        </div>
                        <div className="w-full bg-white h-2.5 rounded-full overflow-hidden shadow-inner">
                             <div className="h-full bg-apple-blue transition-all duration-300 rounded-full" style={{ width: `${loadingProgress}%` }}></div>
                        </div>
                     </div>
                )}

                <button 
                    onClick={handleLoadData}
                    disabled={loadingProgress > 0 && loadingProgress < 100}
                    className="w-full max-w-sm bg-[#1D1D1F] hover:bg-black text-white font-semibold text-lg py-4 rounded-full shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative z-10 hover:scale-[1.02] active:scale-95"
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
    <div className="flex h-screen bg-[#F5F5F7] font-sans overflow-hidden text-[#1D1D1F]">
        
        <ExplainerModal isOpen={showExplainer} onClose={() => setShowExplainer(false)} />
        <Sidebar 
            currentView={dashboardView} 
            setView={setDashboardView} 
            onExport={handleExportResults}
            onReset={handleReset}
            level1Count={stats.level1Count}
        />
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
            
            {/* Header (Frosted Glass) */}
            <header className="h-20 flex items-center justify-between px-8 bg-[#F5F5F7]/80 backdrop-blur-xl sticky top-0 z-30 shrink-0 border-b border-white/50">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
                        {dashboardView === 'general' && 'Genel Bakış'}
                        {dashboardView === 'ai-report' && 'Yapay Zeka Raporu'}
                        {dashboardView === 'georisk' && 'Coğrafi Risk Haritası'}
                        {dashboardView === 'building' && 'Bina Tüketimi (Komşu Analizi)'}
                        {dashboardView === 'weather' && 'Hava Koşulları Analizi'}
                        {dashboardView === 'tampering' && 'Müdahale Analizi'}
                        {dashboardView === 'inconsistent' && 'Tutarsız Kış Tüketimi'}
                        {dashboardView === 'rule120' && '120 sm³ Kuralı'}
                    </h2>
                    {duplicateInfo && (
                        <div className="flex items-center gap-2 animate-slide-up">
                            <div className="px-3 py-1 bg-white border border-white/60 rounded-full text-[11px] font-semibold text-[#86868B] shadow-sm flex items-center gap-1.5" title="İşlenen veri satırı">
                                <FileText className="h-3 w-3" />
                                {duplicateInfo.totalRows.toLocaleString()} Satır
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShowExplainer(true)}
                      className="p-2.5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-white rounded-full transition-all"
                      title="Nasıl Çalışır?"
                    >
                      <BookOpen className="h-5 w-5" />
                    </button>

                    <button 
                        onClick={handleAiInsights}
                        disabled={isGeneratingReport || riskData.length === 0}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full transition-all border ${
                            aiReport 
                            ? 'bg-apple-purple/10 text-apple-purple border-apple-purple/20'
                            : 'bg-white text-[#1D1D1F] border-transparent shadow-sm hover:shadow hover:scale-105 disabled:opacity-50'
                        }`}
                    >
                         <BrainCircuit className="h-4 w-4" />
                         {isGeneratingReport ? 'Analiz Ediliyor...' : aiReport ? 'Raporu Aç' : 'AI Analiz'}
                    </button>
                    
                    <div className="w-px h-6 bg-gray-300/50 mx-1"></div>
                    
                    <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-white/50">
                        <div className="text-xs font-bold text-[#1D1D1F]">
                            {rawSubscribers.length.toLocaleString()} <span className="text-[#86868B] font-medium">Abone</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto px-8 py-6 bg-[#F5F5F7] custom-scrollbar">
                <div className="mb-8">
                    <StatsCards stats={stats} />
                </div>
                
                {/* GENERAL VIEW (Always shows current state) */}
                {dashboardView === 'general' && (
                    <div className="animate-slide-up">
                        {/* Standard Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 h-[440px]">
                            
                            {/* CHART */}
                            <div className="lg:col-span-2 h-full bg-white rounded-[32px] shadow-apple border border-white/50 overflow-hidden">
                                <DashboardChart topRisk={filteredRiskData[0] || null} />
                            </div>

                            {/* MAP */}
                            <div className="h-full lg:col-span-1 bg-white rounded-[32px] shadow-apple border border-white/50 p-2">
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
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-[#F5F5F7] rounded-[24px] border border-dashed border-gray-300">
                                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                                            <Building2 className="h-6 w-6 text-gray-300" />
                                        </div>
                                        <p className="text-[#86868B] text-sm font-medium mb-4">Harita analizi henüz başlatılmadı.</p>
                                        <button 
                                            onClick={() => setDashboardView('georisk')}
                                            className="text-apple-blue hover:text-blue-600 text-sm font-bold bg-blue-50 px-4 py-2 rounded-full transition-colors"
                                        >
                                            Harita Modülüne Git &rarr;
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                         <div className="min-h-[500px] bg-white rounded-[32px] shadow-apple border border-white/50 overflow-hidden">
                            <RiskTable data={filteredRiskData} />
                         </div>
                    </div>
                )}

                {/* AI REPORT VIEW */}
                {dashboardView === 'ai-report' && (
                    <div className="h-full animate-slide-up">
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
                    <div className="h-full animate-slide-up">
                        {!analysisStatus.georisk ? (
                             <AnalysisStarter 
                                title="Coğrafi Risk Analizi"
                                desc="Yüksek riskli abonelere yakın (10m) mesafedeki, tutarsız tüketim gösteren diğer aboneleri tarar."
                                icon={Zap}
                                color="bg-apple-red"
                                moduleName="georisk"
                             />
                        ) : (
                            <>
                                <div className="mb-8 h-[440px] bg-white rounded-[32px] shadow-apple border border-white/50 p-2">
                                    <HotspotPanel 
                                        riskData={riskData} 
                                        referenceLocations={refLocations}
                                        selectedDistrict={selectedDistrict}
                                        onDistrictSelect={setSelectedDistrict}
                                        detectedCity={detectedCity}
                                        availableDistricts={availableDistricts}
                                    />
                                </div>
                                <div className="h-[500px] bg-white rounded-[32px] shadow-apple border border-white/50 overflow-hidden">
                                        <GeoRiskTable data={filteredRiskData.filter(r => r.breakdown.geoRisk > 0)} />
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* BUILDING ANALYSIS VIEW (NEW) */}
                {dashboardView === 'building' && (
                    <div className="h-full animate-slide-up">
                        {!analysisStatus.buildingAnomaly ? (
                             <AnalysisStarter 
                                title="Bina Tüketim Analizi"
                                desc="Aynı binada oturan (aynı koordinat) en az 4 komşunun kış tüketim medyanını hesaplar ve bu ortalamadan %60 sapan daireleri listeler."
                                icon={Building2}
                                color="bg-apple-purple"
                                moduleName="buildingAnomaly"
                             />
                        ) : (
                            <div className="h-full pb-6 bg-white rounded-[32px] shadow-apple border border-white/50 overflow-hidden">
                                <BuildingAnalysisTable data={buildingRiskData} />
                            </div>
                        )}
                    </div>
                )}

                {/* WEATHER ANALYSIS VIEW (NEW) */}
                {dashboardView === 'weather' && (
                    <div className="h-full animate-slide-up">
                        <WeatherAnalysisView subscribers={rawSubscribers} />
                    </div>
                )}

                {/* TAMPERING VIEW */}
                {dashboardView === 'tampering' && (
                     <div className="h-full animate-slide-up">
                        {!analysisStatus.tampering ? (
                            <AnalysisStarter 
                                title="Müdahale Analizi (Bypass)"
                                desc="Kış ve Yaz tüketim ortalamalarını karşılaştırarak ısıtma katsayısını hesaplar. Mevsimsel farkı olmayan (Bypass şüphesi) aboneleri tespit eder."
                                icon={Zap}
                                color="bg-apple-orange"
                                moduleName="tampering"
                             />
                        ) : (
                            <>
                                <div className="mb-8 h-[380px] bg-white rounded-[32px] shadow-apple border border-white/50 overflow-hidden">
                                    <DashboardChart topRisk={getTopRiskForView(dashboardView)} />
                                </div>
                                <div className="h-[600px] bg-white rounded-[32px] shadow-apple border border-white/50 overflow-hidden">
                                    <TamperingTable data={filteredRiskData.filter(r => r.isTamperingSuspect)} />
                                </div>
                            </>
                        )}
                     </div>
                )}
                
                {/* RULE 120 VIEW */}
                {dashboardView === 'rule120' && (
                    <div className="h-full animate-slide-up">
                         {!analysisStatus.rule120 ? (
                            <AnalysisStarter 
                                title="120 sm³ Kuralı Analizi"
                                desc="Ocak ve Şubat aylarının her ikisinde de 120 sm³ altında tüketim yapan, ancak boş ev statüsünde olmayan (Toplam > 25) aboneleri tarar."
                                icon={Zap}
                                color="bg-apple-blue"
                                moduleName="rule120"
                             />
                        ) : (
                            <div className="h-full pb-6 bg-white rounded-[32px] shadow-apple border border-white/50 overflow-hidden">
                                <Rule120Table data={filteredRiskData.filter(r => r.is120RuleSuspect)} />
                            </div>
                        )}
                    </div>
                )}

                {/* INCONSISTENT VIEW */}
                {dashboardView === 'inconsistent' && (
                    <div className="h-full animate-slide-up">
                        {!analysisStatus.inconsistent ? (
                            <AnalysisStarter 
                                title="Tutarsız Tüketim Analizi"
                                desc="Ani düşüşler, düz çizgi (sabit tüketim) ve sömestr tatili şüphelerini matematiksel trend eğimi ile analiz eder."
                                icon={Zap}
                                color="bg-apple-red"
                                moduleName="inconsistent"
                             />
                        ) : (
                            <div className="h-full pb-6 bg-white rounded-[32px] shadow-apple border border-white/50 overflow-hidden">
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