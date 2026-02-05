import React, { useState, useRef } from 'react';
import { Activity, CheckCircle, Play, BrainCircuit, FileSpreadsheet, FileText, FileUp, RefreshCw, XCircle, ShieldCheck, Zap, LayoutDashboard, Wrench, TrendingDown, ThermometerSnowflake, MapPin } from 'lucide-react';
import StatsCards from './components/StatsCards';
import RiskTable from './components/RiskTable';
import TamperingTable from './components/TamperingTable';
import InconsistentTable from './components/InconsistentTable';
import Rule120Table from './components/Rule120Table';
import GeoRiskTable from './components/GeoRiskTable';
import HotspotPanel from './components/HotspotPanel';
import { generateDemoData, analyzeSubscriber } from './utils/fraudEngine';
import { PYTHON_LOGIC_CODE } from './utils/pythonCode';
import { generateExecutiveSummary } from './services/geminiService';
import { RiskScore, EngineStats, Hotspot, Subscriber, MonthlyData } from './types';
import * as XLSX from 'xlsx';

const App: React.FC = () => {
  const [appStage, setAppStage] = useState<'setup' | 'analyzing' | 'results'>('setup');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'code'>('dashboard');
  
  // Dashboard Sub-View State - Added 'georisk'
  const [dashboardView, setDashboardView] = useState<'general' | 'tampering' | 'inconsistent' | 'rule120' | 'georisk'>('general');

  const [riskData, setRiskData] = useState<RiskScore[]>([]);
  const [stats, setStats] = useState<EngineStats>({ totalScanned: 0, level1Count: 0, level2Count: 0, level3Count: 0 });
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [aiReport, setAiReport] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // File Refs for UI state (names)
  const fileInputRefA = useRef<HTMLInputElement>(null);
  const fileInputRefB = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<{a: string | null, b: string | null}>({ a: null, b: null });
  
  // Ref to store actual File objects for processing
  const fileObjects = useRef<{a: File | null, b: File | null}>({ a: null, b: null });

  // --- HELPER: ID Normalizer ---
  const normalizeId = (val: any): string => {
      if (val === null || val === undefined) return '';
      let str = String(val).trim();
      if (str.endsWith('.0')) {
          str = str.slice(0, -2);
      }
      return str;
  };

  // --- HELPER: Fuzzy Column Matcher ---
  const findVal = (row: any, candidates: string[]): string => {
    const keys = Object.keys(row);
    for (const key of keys) {
        const normalizedKey = key.toString().toLowerCase().replace(/[\s_.]/g, '').replace('ı', 'i').replace('İ', 'i');
        if (candidates.includes(normalizedKey)) {
            const val = row[key];
            return normalizeId(val);
        }
    }
    return '';
  };

  const findNumVal = (row: any, candidates: string[]): number => {
    const keys = Object.keys(row);
    for (const key of keys) {
        const normalizedKey = key.toString().toLowerCase().replace(/[\s_.]/g, '').replace('ı', 'i').replace('İ', 'i');
        if (candidates.includes(normalizedKey)) {
            const val = row[key];
            if (val === undefined || val === null) return 0;
            if (typeof val === 'string') {
               return parseFloat(val.replace(',', '.')); 
            }
            return parseFloat(String(val));
        }
    }
    return NaN;
  };

  // --- REAL DATA PROCESSING LOGIC ---
  const processUploadedFiles = async (): Promise<{ subscribers: Subscriber[], refMuhatapIds: Set<string>, refTesisatIds: Set<string> }> => {
    const fileA = fileObjects.current.a;
    const fileB = fileObjects.current.b;

    if (!fileA || !fileB) {
        throw new Error("Dosyalar eksik.");
    }

    // 1. Process File A
    const refMuhatapIds = new Set<string>();
    const refTesisatIds = new Set<string>();

    const bufferA = await fileA.arrayBuffer();
    const wbA = XLSX.read(bufferA);
    const sheetA = wbA.Sheets[wbA.SheetNames[0]];
    const dataA = XLSX.utils.sheet_to_json<any>(sheetA);
    
    const tesisatKeys = ['tesisatno', 'tesisat', 'aboneno', 'abone', 'sozlesme', 'sozlesmeno'];
    const muhatapKeys = ['muhatapno', 'muhatap', 'tc', 'sahıs', 'sahis', 'musterino', 'musteri', 'referans', 'referansno', 'kimlik', 'tckn', 'borclu'];

    dataA.forEach(row => {
        const tesisat = findVal(row, tesisatKeys);
        const muhatap = findVal(row, muhatapKeys);

        if (tesisat) refTesisatIds.add(tesisat);
        if (muhatap) refMuhatapIds.add(muhatap);
    });

    console.log(`Referans listesi yüklendi: ${refMuhatapIds.size} Muhatap, ${refTesisatIds.size} Tesisat.`);

    // 2. Process File B
    const bufferB = await fileB.arrayBuffer();
    const wbB = XLSX.read(bufferB);
    
    const subscriberMap = new Map<string, Subscriber>();
    
    const monthMapping: { key: keyof MonthlyData }[] = [
        { key: 'jan' }, { key: 'feb' }, { key: 'mar' },
        { key: 'apr' }, { key: 'may' }, { key: 'jun' },
        { key: 'jul' }, { key: 'aug' }, { key: 'sep' },
        { key: 'oct' }, { key: 'nov' }, { key: 'dec' }
    ];

    const emptyConsumption: MonthlyData = {
        jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
        jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0
    };

    const typeKeys = ['abonetipi', 'abonegrubu', 'tip', 'tarife', 'sinif'];
    const sm3Keys = ['sm3', 'tuketim', 'sarfiyat', 'endeksfark', 'm3', 'hacim'];
    const addressKeys = ['adres', 'yer', 'lokasyon', 'mahalle'];

    const sheetsToProcess = wbB.SheetNames.slice(0, 12);

    sheetsToProcess.forEach((sheetName, index) => {
        const sheet = wbB.Sheets[sheetName];
        if (!sheet) return;

        const monthKey = monthMapping[index]?.key;
        if (!monthKey) return;

        const data = XLSX.utils.sheet_to_json<any>(sheet);
        
        data.forEach(row => {
            const id = findVal(row, tesisatKeys); 
            if (!id) return;
            
            const mNo = findVal(row, muhatapKeys);
            
            if (!subscriberMap.has(id)) {
                let type: Subscriber['aboneTipi'] = 'Residential';
                const rawType = findVal(row, typeKeys).toLowerCase();
                if (rawType.includes('ticari') || rawType.includes('commercial') || rawType.includes('sanayi') || rawType.includes('isyeri')) {
                    type = 'Commercial';
                }

                subscriberMap.set(id, {
                    tesisatNo: id,
                    muhatapNo: mNo,
                    relatedMuhatapNos: mNo ? [mNo] : [], 
                    address: findVal(row, addressKeys) || 'Adres Bilinmiyor',
                    aboneTipi: type,
                    consumption: { ...emptyConsumption },
                    isVacant: false 
                });
            }
            
            const sub = subscriberMap.get(id)!;
            
            const sm3 = findNumVal(row, sm3Keys);
            if (!isNaN(sm3)) {
                sub.consumption[monthKey] = sm3;
            }

            if (mNo) {
                if (!sub.relatedMuhatapNos.includes(mNo)) {
                    sub.relatedMuhatapNos.push(mNo);
                }
                if (!sub.muhatapNo) {
                    sub.muhatapNo = mNo;
                }
            }
            
            const currentAddr = findVal(row, addressKeys);
            if (currentAddr && (sub.address === 'Adres Bilinmiyor' || sub.address.length < 5)) {
                sub.address = currentAddr;
            }
        });
    });

    const subscribers = Array.from(subscriberMap.values()).map(sub => {
        const zeroMonths = Object.values(sub.consumption).filter(v => v === 0).length;
        sub.isVacant = zeroMonths >= 10;
        return sub;
    });

    return { subscribers, refMuhatapIds, refTesisatIds };
  };

  // Load and Process Data
  const runAnalysis = async () => {
    setAppStage('analyzing');
    setValidationError(null);

    setTimeout(async () => {
        try {
            let subscribers: Subscriber[];
            let refMuhatapIds: Set<string>;
            let refTesisatIds: Set<string>;

            if (files.a && files.b && fileObjects.current.a && fileObjects.current.b) {
                console.log("Gerçek dosyalar kullanılıyor...");
                const data = await processUploadedFiles();
                subscribers = data.subscribers;
                refMuhatapIds = data.refMuhatapIds;
                refTesisatIds = data.refTesisatIds;
            } else {
                console.log("Demo verisi kullanılıyor...");
                const data = generateDemoData();
                subscribers = data.subscribers;
                refMuhatapIds = data.fraudMuhatapIds;
                refTesisatIds = data.fraudTesisatIds;
            }
          
            // --- DYNAMIC GEO RISK IDENTIFICATION ---
            // 1. Identify which addresses in the uploaded file correspond to "Confirmed Frauds"
            const streetFreq: Record<string, number> = {};
            
            subscribers.forEach(sub => {
                const isFraudMatch = sub.relatedMuhatapNos.some(m => refMuhatapIds.has(m)) || refTesisatIds.has(sub.tesisatNo);
                if (isFraudMatch) {
                    // Extract street part (Simple: first part before comma)
                    const streetPart = sub.address.split(',')[0].trim();
                    if (streetPart && streetPart.length > 3) {
                         streetFreq[streetPart] = (streetFreq[streetPart] || 0) + 1;
                    }
                }
            });

            // 2. Identify top 5 risky streets
            const riskyStreets = Object.entries(streetFreq)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(entry => entry[0]);

            console.log("Identified Risky Streets:", riskyStreets);

            // --- MAIN ANALYSIS ---
            const results: RiskScore[] = [];
            const streetCounts: Record<string, number> = {};
            let l1 = 0, l2 = 0, l3 = 0;

            subscribers.forEach(sub => {
                if (sub.isVacant) return; 
                
                // Pass dynamic risky streets to the engine
                const result = analyzeSubscriber(sub, refMuhatapIds, refTesisatIds, riskyStreets);
                
                // Keep if score > 10 OR if specific flags are active
                if (result.totalScore > 10 || result.isTamperingSuspect || result.inconsistentData.hasWinterDrop || result.inconsistentData.isSemesterSuspect || result.is120RuleSuspect) {
                     results.push(result);
                }

                if (result.riskLevel.includes('Seviye 1')) l1++;
                else if (result.riskLevel.includes('Seviye 2')) l2++;
                else if (result.riskLevel.includes('Seviye 3')) l3++;

                if (result.totalScore > 30) {
                    const street = result.address.split(',')[0].trim();
                    streetCounts[street] = (streetCounts[street] || 0) + 1;
                }
            });

            results.sort((a, b) => b.totalScore - a.totalScore);
            
            const hotspotList = Object.entries(streetCounts)
                .map(([street, count]) => ({ street, count, avgScore: 0 }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            setRiskData(results); // Keep all relevant
            setStats({
                totalScanned: subscribers.length,
                level1Count: l1,
                level2Count: l2,
                level3Count: l3
            });
            setHotspots(hotspotList);
            setAppStage('results');
            setAiReport(''); 
        } catch (error: any) {
            console.error(error);
            setValidationError(error.message || "Analiz sırasında beklenmeyen bir hata oluştu.");
            setAppStage('setup');
        }
    }, 1500); 
  };

  const handleAiInsights = async () => {
    if (riskData.length === 0) return;
    setIsGeneratingReport(true);
    const summary = await generateExecutiveSummary(riskData);
    setAiReport(summary);
    setIsGeneratingReport(false);
  };

  // ... (handleFileSelect, validateColumns, downloads)
  const handleDownloadRefExample = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rows = [["Tesisat No", "Referans No", "Abone Tipi", "Dönem", "Sm3", "Adres"], ["990001", "M-990001", "Mesken", "2023-01", 120, "Riskli Cad. No:1"]];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "sheet");
    XLSX.writeFile(wb, "ornek_referans_dosyasi_A.xlsx");
  };

  const handleDownloadTargetExample = (e: React.MouseEvent) => {
    e.stopPropagation();
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const wb = XLSX.utils.book_new();
    months.forEach((month, index) => {
        const period = `2023-${String(index + 1).padStart(2, '0')}`;
        const rows = [["Tesisat No", "Muhatap", "Abone Tipi", "Dönem", "Sm3", "Adres"], ["100001", "M-100001", "Mesken", period, 300, "Lale Sk. No:5"]];
        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, month);
    });
    XLSX.writeFile(wb, "ornek_hedef_dosyasi_B_aylik_sekmeler.xlsx");
  };
  
  const validateColumns = (headers: any[], expected: string[], fileName: string, sheetName?: string) => {
    const cleanedHeaders = headers.map(h => String(h).trim().toLowerCase());
    const hasId = cleanedHeaders.some(h => h.includes('tesisat'));
    if (!hasId) {
      throw new Error(`Hata: ${fileName} ${sheetName ? `(${sheetName} sekmesi)` : ''} içinde 'Tesisat No' sütunu bulunamadı.`);
    }
  };

  const handleFileSelect = async (type: 'a' | 'b', e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const expectedColumns = ["Tesisat No"]; 
        if (type === 'a') {
            const sheetName = workbook.SheetNames[0]; 
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            if (json.length > 0) {
                const headers = json[0] as any[];
                validateColumns(headers, expectedColumns, file.name);
            }
            fileObjects.current.a = file;
        } else {
             if (workbook.SheetNames.length === 0) throw new Error("Excel dosyasında sayfa bulunamadı.");
             const sheetName = workbook.SheetNames[0];
             const sheet = workbook.Sheets[sheetName];
             const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
             if (json.length > 0) {
                 const headers = json[0] as any[];
                 validateColumns(headers, expectedColumns, file.name, sheetName);
             }
             fileObjects.current.b = file;
        }
        setFiles(prev => ({ ...prev, [type]: file.name }));
      } catch (err: any) {
        console.error(err);
        setValidationError(err.message || "Dosya okuma hatası.");
        e.target.value = ""; 
        setFiles(prev => ({ ...prev, [type]: null }));
        if (type === 'a') fileObjects.current.a = null;
        else fileObjects.current.b = null;
      }
    }
  };
  
  const resetApp = () => {
    setAppStage('setup');
    setFiles({ a: null, b: null });
    fileObjects.current = { a: null, b: null }; 
    setRiskData([]);
    setValidationError(null);
    setDashboardView('general');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[128px]"></div>
         <div className="absolute top-[40%] right-[10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[128px]"></div>
      </div>

      {/* Header */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform duration-300">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">Kaçak Analiz Programı</h1>
              <span className="text-[10px] text-blue-400 font-mono tracking-wider uppercase">V2.0 // YAPAY ZEKA DESTEKLİ</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {appStage === 'results' && (
                <button 
                  onClick={resetApp}
                  className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800"
                >
                  <RefreshCw className="h-3 w-3" /> Yeni Analiz
                </button>
             )}
            <div className="flex bg-slate-900/80 rounded-lg p-1 border border-slate-800">
                <button 
                onClick={() => setActiveTab('dashboard')}
                disabled={appStage !== 'results'}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-300 ${activeTab === 'dashboard' && appStage === 'results' ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' : 'text-slate-400 hover:text-white'} ${appStage !== 'results' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                Panel
                </button>
                <button 
                onClick={() => setActiveTab('code')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-300 ${activeTab === 'code' ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' : 'text-slate-400 hover:text-white'}`}
                >
                Python Kodu
                </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full z-10 relative">

        {/* --- SETUP / UPLOAD SCREEN --- */}
        {appStage === 'setup' && (
            <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
                {validationError && (
                    <div className="w-full max-w-2xl mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between gap-3 text-red-200 animate-pulse backdrop-blur-sm shadow-lg shadow-red-900/20">
                        <div className="flex items-center gap-3">
                            <XCircle className="h-6 w-6 text-red-500 shrink-0" />
                            <div>
                                <h4 className="font-bold text-red-400 text-sm">Doğrulama Hatası</h4>
                                <p className="text-sm opacity-90">{validationError}</p>
                            </div>
                        </div>
                        <button onClick={() => setValidationError(null)} className="text-red-400 hover:text-red-300">
                            <XCircle className="h-5 w-5" />
                        </button>
                    </div>
                )}

                <div className="text-center mb-12 max-w-3xl">
                    <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-indigo-200 mb-6 tracking-tight animate-slide-up" style={{animationDelay: '0.1s'}}>
                        Veri Odaklı Dolandırıcılık Tespiti
                    </h2>
                    <p className="text-lg text-slate-400 leading-relaxed mb-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
                        Kaçak Analiz Programı, 12 aylık tüketim verilerini ve sabıkalı listelerini çapraz sorgulayarak
                        istatistiksel anormallikleri ve coğrafi risk kümelerini tespit eder.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-indigo-300 bg-indigo-950/30 px-4 py-2 rounded-full border border-indigo-500/20 w-fit mx-auto animate-slide-up" style={{animationDelay: '0.3s'}}>
                        <BrainCircuit className="h-3 w-3" />
                        <span>Gemini AI Entegrasyonu ile Akıllı Raporlama</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl animate-slide-up" style={{animationDelay: '0.4s'}}>
                    {/* FILE A: REFERENCE */}
                    <div 
                        onClick={() => fileInputRefA.current?.click()}
                        className={`group relative overflow-hidden flex flex-col items-center justify-center p-8 border border-dashed rounded-2xl transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-blue-900/20 hover:-translate-y-1
                        ${files.a ? 'border-green-500/40 bg-green-900/10' : 'border-slate-700 bg-slate-800/40 hover:border-blue-500/50 hover:bg-slate-800/80'}`}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRefA} 
                            onChange={(e) => handleFileSelect('a', e)} 
                            className="hidden" 
                            accept=".csv, .xlsx, .xls" 
                        />
                        <div className={`p-4 rounded-full mb-4 transition-transform group-hover:scale-110 duration-300 ${files.a ? 'bg-green-500/10' : 'bg-blue-500/10'}`}>
                            {files.a ? <CheckCircle className="h-8 w-8 text-green-400" /> : <FileText className="h-8 w-8 text-blue-400" />}
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">Referans Liste (Dosya A)</h3>
                        <p className="text-sm text-slate-400 mb-6 text-center max-w-[250px]">
                            {files.a ? <span className="text-green-400 font-mono">{files.a}</span> : 'Geçmiş kaçak kayıtları (Tesisat veya Muhatap No)'}
                        </p>
                        
                        <div className="flex items-center gap-3 z-10">
                             <span className={`px-5 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition-colors ${files.a ? 'bg-green-600 text-white shadow-lg shadow-green-900/20' : 'bg-slate-700 text-slate-300 group-hover:bg-blue-600 group-hover:text-white'}`}>
                                {files.a ? 'Yüklendi' : 'Dosya Seç'}
                             </span>
                             <button 
                                onClick={handleDownloadRefExample}
                                className="text-[10px] text-slate-500 hover:text-blue-300 flex items-center gap-1 hover:underline p-2 bg-slate-900/50 rounded border border-slate-800 transition-colors"
                             >
                                <FileUp className="h-3 w-3" /> Örnek
                             </button>
                        </div>
                    </div>

                    {/* FILE B: TARGET */}
                    <div 
                        onClick={() => fileInputRefB.current?.click()}
                        className={`group relative overflow-hidden flex flex-col items-center justify-center p-8 border border-dashed rounded-2xl transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-purple-900/20 hover:-translate-y-1
                        ${files.b ? 'border-green-500/40 bg-green-900/10' : 'border-slate-700 bg-slate-800/40 hover:border-purple-500/50 hover:bg-slate-800/80'}`}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRefB} 
                            onChange={(e) => handleFileSelect('b', e)} 
                            className="hidden" 
                            accept=".csv, .xlsx, .xls" 
                        />
                         <div className={`p-4 rounded-full mb-4 transition-transform group-hover:scale-110 duration-300 ${files.b ? 'bg-green-500/10' : 'bg-purple-500/10'}`}>
                            {files.b ? <CheckCircle className="h-8 w-8 text-green-400" /> : <FileSpreadsheet className="h-8 w-8 text-purple-400" />}
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">Hedef Liste (Dosya B)</h3>
                        <p className="text-sm text-slate-400 mb-6 text-center max-w-[250px]">
                             {files.b ? <span className="text-green-400 font-mono">{files.b}</span> : '12 aylık tüketim verileri (Ocak-Aralık sekmeleri)'}
                        </p>

                        <div className="flex items-center gap-3 z-10">
                             <span className={`px-5 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition-colors ${files.b ? 'bg-green-600 text-white shadow-lg shadow-green-900/20' : 'bg-slate-700 text-slate-300 group-hover:bg-purple-600 group-hover:text-white'}`}>
                                {files.b ? 'Yüklendi' : 'Dosya Seç'}
                             </span>
                             <button 
                                onClick={handleDownloadTargetExample}
                                className="text-[10px] text-slate-500 hover:text-purple-300 flex items-center gap-1 hover:underline p-2 bg-slate-900/50 rounded border border-slate-800 transition-colors"
                             >
                                <FileUp className="h-3 w-3" /> Örnek
                             </button>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center gap-4 animate-slide-up" style={{animationDelay: '0.5s'}}>
                    <button 
                        onClick={runAnalysis}
                        className="group relative inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-white transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl focus:outline-none hover:scale-105 shadow-xl shadow-indigo-500/20 border border-indigo-400/20 active:scale-95"
                    >
                        <Zap className="w-5 h-5 mr-2 fill-current animate-pulse" />
                        Analizi Başlat
                        <div className="absolute inset-0 rounded-xl ring-2 ring-white/10 group-hover:ring-white/30 transition-all"></div>
                    </button>
                    <p className="text-xs text-slate-500/70">
                        * Dosya yüklenmezse sistem demo verisi ile simülasyon yapacaktır.
                    </p>
                </div>
            </div>
        )}

        {/* --- LOADING SCREEN --- */}
        {appStage === 'analyzing' && (
             <div className="flex flex-col items-center justify-center min-h-[600px] animate-fade-in">
                 <div className="relative">
                    {/* Enhanced Spinner */}
                    <div className="w-32 h-32 border-4 border-slate-800 border-t-indigo-500 border-r-indigo-500/30 rounded-full animate-spin"></div>
                    <div className="w-24 h-24 border-4 border-slate-800 border-b-blue-500 border-l-blue-500/30 rounded-full animate-spin-slow absolute top-4 left-4"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Activity className="h-10 w-10 text-indigo-400 animate-pulse-fast" />
                    </div>
                 </div>
                 <h2 className="text-3xl font-bold text-white mt-8 tracking-tight animate-pulse">Veriler İşleniyor...</h2>
                 <p className="text-slate-400 mt-2 text-lg">Coğrafi Risk Kümeleri Taranıyor</p>
                 <div className="flex gap-3 mt-8">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
                 </div>
             </div>
        )}

        {/* --- DASHBOARD CONTENT --- */}
        {activeTab === 'dashboard' && appStage === 'results' && (
          <div className="animate-fade-in space-y-8">
            <StatsCards stats={stats} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:h-[650px] h-auto">
              {/* Main Table Area with Tabs */}
              <div className="lg:col-span-2 h-full flex flex-col gap-4">
                  
                  {/* View Switcher */}
                  <div className="flex gap-2 flex-wrap">
                     <button
                        onClick={() => setDashboardView('general')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-all duration-300 ${
                            dashboardView === 'general' 
                            ? 'bg-slate-900/60 text-white border-t border-x border-slate-700/50' 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                        }`}
                     >
                        <LayoutDashboard className="h-4 w-4" />
                        Genel
                     </button>
                     <button
                        onClick={() => setDashboardView('georisk')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-all duration-300 ${
                            dashboardView === 'georisk' 
                            ? 'bg-slate-900/60 text-red-200 border-t border-x border-red-500/20' 
                            : 'text-slate-500 hover:text-red-400 hover:bg-slate-800/30'
                        }`}
                     >
                        <MapPin className="h-4 w-4" />
                        Bölgesel Risk
                     </button>
                     <button
                        onClick={() => setDashboardView('tampering')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-all duration-300 ${
                            dashboardView === 'tampering' 
                            ? 'bg-slate-900/60 text-orange-200 border-t border-x border-orange-500/20' 
                            : 'text-slate-500 hover:text-orange-400 hover:bg-slate-800/30'
                        }`}
                     >
                        <Wrench className="h-4 w-4" />
                        Müdahale
                     </button>
                     <button
                        onClick={() => setDashboardView('inconsistent')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-all duration-300 ${
                            dashboardView === 'inconsistent' 
                            ? 'bg-slate-900/60 text-pink-200 border-t border-x border-pink-500/20' 
                            : 'text-slate-500 hover:text-pink-400 hover:bg-slate-800/30'
                        }`}
                     >
                        <TrendingDown className="h-4 w-4" />
                        Tutarsız
                     </button>
                      <button
                        onClick={() => setDashboardView('rule120')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-all duration-300 ${
                            dashboardView === 'rule120' 
                            ? 'bg-slate-900/60 text-blue-200 border-t border-x border-blue-500/20' 
                            : 'text-slate-500 hover:text-blue-400 hover:bg-slate-800/30'
                        }`}
                     >
                        <ThermometerSnowflake className="h-4 w-4" />
                        120 Kuralı
                     </button>
                  </div>

                  {/* Wrapper for animation on tab switch */}
                  <div key={dashboardView} className="animate-slide-up flex-1 flex flex-col min-h-0">
                      {dashboardView === 'general' ? (
                          <RiskTable data={riskData.slice(0, 50)} />
                      ) : dashboardView === 'georisk' ? (
                          <GeoRiskTable data={riskData.filter(r => r.breakdown.geoRisk > 0 && r.is120RuleSuspect)} />
                      ) : dashboardView === 'tampering' ? (
                          <TamperingTable data={riskData.filter(r => r.isTamperingSuspect)} />
                      ) : dashboardView === 'rule120' ? (
                          <Rule120Table data={riskData.filter(r => r.is120RuleSuspect)} />
                      ) : (
                          <InconsistentTable data={riskData.filter(r => r.inconsistentData.hasWinterDrop || r.inconsistentData.isSemesterSuspect)} />
                      )}
                  </div>
                  
                  {/* AI Section (Only visible on General View to save space) */}
                   {dashboardView === 'general' && appStage === 'results' && (
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl relative overflow-hidden group hover:border-purple-500/30 transition-colors duration-500">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-purple-500/10 transition-colors duration-500"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
                                    <BrainCircuit className="h-5 w-5 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-purple-100">Gemini YZ Analisti</h3>
                                    <p className="text-[10px] text-purple-400/60">AI POWERED INSIGHTS</p>
                                </div>
                             </div>
                             <button 
                                onClick={handleAiInsights}
                                disabled={isGeneratingReport || !!aiReport}
                                className="text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 hover:-translate-y-0.5 active:translate-y-0"
                             >
                                 {isGeneratingReport ? 'Analiz Ediliyor...' : aiReport ? 'Rapor Görüntüle' : 'Özet Oluştur'}
                             </button>
                        </div>
                        {aiReport ? (
                            <div className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 animate-slide-up h-[120px] overflow-y-auto custom-scrollbar">
                                {aiReport}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 italic relative z-10">
                                İlk 5 kritik vakanın Gemini 3 modelini kullanarak yönetici özetini oluşturmak için butona tıklayın.
                            </p>
                        )}
                    </div>
                   )}
              </div>
              
              {/* Sidebar: Hotspots & Filters */}
              <div className="h-full flex flex-col gap-6">
                 <div className="h-[45%]">
                    <HotspotPanel hotspots={hotspots} />
                 </div>
                 
                 <div className="h-[55%] bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 flex flex-col hover:border-slate-600/50 transition-colors duration-300">
                    <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Aktif Filtreler
                    </h3>
                    <div className="space-y-4 flex-1">
                        <div className="flex justify-between text-sm items-center p-2 bg-slate-800/30 rounded border border-slate-800 hover:bg-slate-800/50 transition-colors">
                            <span className="text-slate-400">Boş Ev Kontrolü</span>
                            <span className="text-green-400 font-mono text-xs bg-green-900/20 px-2 py-0.5 rounded">AKTİF</span>
                        </div>
                        <div className="flex justify-between text-sm items-center p-2 bg-slate-800/30 rounded border border-slate-800 hover:bg-slate-800/50 transition-colors">
                            <span className="text-slate-400">Referans Çakışma</span>
                            <span className="text-green-400 font-mono text-xs bg-green-900/20 px-2 py-0.5 rounded">YÜKLENDİ</span>
                        </div>
                        <div className="flex justify-between text-sm items-center p-2 bg-slate-800/30 rounded border border-slate-800 hover:bg-slate-800/50 transition-colors">
                            <span className="text-slate-400">Dinamik Bölge Analizi</span>
                            <span className="text-blue-400 font-mono text-xs bg-blue-900/20 px-2 py-0.5 rounded"> AKTİF</span>
                        </div>
                    </div>
                        
                    <div className="mt-6 pt-6 border-t border-slate-700/50">
                            <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-4">Risk Puanlama Ağırlıkları</h4>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="bg-slate-800/50 p-3 rounded-lg text-center border border-slate-700/50 hover:bg-slate-800 transition-colors">
                                    <div className="font-bold text-lg text-white">50p</div>
                                    <div className="text-slate-500 text-[10px]">Muhatap</div>
                                </div>
                                <div className="bg-slate-800/50 p-3 rounded-lg text-center border border-slate-700/50 hover:bg-slate-800 transition-colors">
                                    <div className="font-bold text-lg text-white">35p</div>
                                    <div className="text-slate-500 text-[10px]">120 Kuralı</div>
                                </div>
                                <div className="bg-slate-800/50 p-3 rounded-lg text-center border border-slate-700/50 hover:bg-slate-800 transition-colors">
                                    <div className="font-bold text-lg text-white">30p</div>
                                    <div className="text-slate-500 text-[10px]">Mevsimsel</div>
                                </div>
                                <div className="bg-slate-800/50 p-3 rounded-lg text-center border border-slate-700/50 hover:bg-slate-800 transition-colors">
                                    <div className="font-bold text-lg text-white">20p</div>
                                    <div className="text-slate-500 text-[10px]">Ani Düşüş</div>
                                </div>
                            </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* --- CODE TAB --- */}
        {activeTab === 'code' && (
          <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-2xl animate-slide-up">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center gap-2">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="ml-3 text-sm font-mono text-slate-400">fraud_analytics_engine.py</span>
            </div>
            <pre className="p-6 overflow-x-auto text-sm font-mono leading-relaxed text-blue-100 bg-[#0f172a]">
              <code>{PYTHON_LOGIC_CODE}</code>
            </pre>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;