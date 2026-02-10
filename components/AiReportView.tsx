import React from 'react';
import { BrainCircuit, Loader2, RefreshCw, FileText, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';
import { EngineStats, RiskScore } from '../types';

interface AiReportViewProps {
  report: string;
  isGenerating: boolean;
  onGenerate: () => void;
  stats: EngineStats;
  riskData: RiskScore[];
}

const AiReportView: React.FC<AiReportViewProps> = ({ report, isGenerating, onGenerate, stats, riskData }) => {
  
  // Calculate quick stats for the header
  const tamperingCount = riskData.filter(r => r.isTamperingSuspect).length;
  const rule120Count = riskData.filter(r => r.is120RuleSuspect).length;

  return (
    <div className="bg-white rounded-[30px] border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden relative">
       {/* Header */}
       <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <BrainCircuit className="h-6 w-6 text-white" />
              </div>
              <div>
                  <h2 className="text-xl font-bold text-slate-800">Yapay Zeka Analiz Raporu</h2>
                  <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {stats.totalScanned} Abone</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span>Gemini 3 Flash Model</span>
                  </p>
              </div>
          </div>
          
          <button 
            onClick={onGenerate}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95
                ${isGenerating 
                    ? 'bg-slate-100 text-slate-400 cursor-wait' 
                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10'}`}
          >
            {isGenerating ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Rapor Oluşturuluyor...
                </>
            ) : (
                <>
                    <RefreshCw className="h-4 w-4" />
                    {report ? 'Raporu Güncelle' : 'Raporu Oluştur'}
                </>
            )}
          </button>
       </div>

       {/* Content Area */}
       <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#F8FAFC]">
            
            {!report && !isGenerating ? (
                // Empty State
                <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto opacity-60">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 border-4 border-slate-100 shadow-sm">
                        <BrainCircuit className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Henüz Rapor Oluşturulmadı</h3>
                    <p className="text-slate-500 mb-8">
                        Yapay zeka; Müdahale, 120 Kuralı, Tutarsız Tüketim ve Coğrafi Risk verilerini harmanlayarak kapsamlı bir yönetici özeti hazırlar.
                    </p>
                    <button onClick={onGenerate} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold shadow-lg shadow-purple-500/30 transition-all active:scale-95">
                        Analizi Başlat
                    </button>
                </div>
            ) : (
                // Report Content
                <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
                    
                    {/* Summary Chips */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Kritik Risk</div>
                            <div className="text-2xl font-bold text-red-500">{stats.level1Count}</div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Müdahale Şüphesi</div>
                            <div className="text-2xl font-bold text-orange-500">{tamperingCount}</div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">120 Kuralı</div>
                            <div className="text-2xl font-bold text-blue-500">{rule120Count}</div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Taranan</div>
                            <div className="text-2xl font-bold text-slate-700">{stats.totalScanned}</div>
                        </div>
                    </div>

                    {/* Markdown Output Area */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm prose prose-slate max-w-none">
                        {isGenerating ? (
                             <div className="space-y-4 animate-pulse">
                                 <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                                 <div className="h-4 bg-slate-100 rounded w-full"></div>
                                 <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                                 <div className="h-32 bg-slate-50 rounded-xl mt-6"></div>
                             </div>
                        ) : (
                            <div className="whitespace-pre-wrap leading-relaxed text-slate-700 font-medium text-base">
                                {report.split('**').map((part, i) => 
                                    i % 2 === 1 ? <strong key={i} className="text-slate-900 font-bold">{part}</strong> : part
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Disclaimer */}
                    <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 text-xs text-blue-700/70">
                        <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />
                        <p>
                            Bu rapor, yapay zeka tarafından tespit edilen desenlere dayanarak oluşturulmuştur. 
                            Saha ekiplerinin operasyonel kararlarını desteklemek için bir tavsiye niteliğindedir. 
                            Nihai karar teknik inceleme sonucunda verilmelidir.
                        </p>
                    </div>
                </div>
            )}
       </div>
    </div>
  );
};

export default AiReportView;