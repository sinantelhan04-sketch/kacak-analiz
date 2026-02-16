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
    <div className="bg-white rounded-[32px] shadow-apple border border-white/50 flex flex-col h-full overflow-hidden relative">
       {/* Header */}
       <div className="px-8 py-6 border-b border-[#F5F5F7] flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-[#AF52DE] to-[#5856D6] flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <BrainCircuit className="h-7 w-7 text-white" />
              </div>
              <div>
                  <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">Yapay Zeka Analiz Raporu</h2>
                  <p className="text-sm text-[#86868B] flex items-center gap-2 mt-1 font-medium">
                      <span>Gemini 3 Flash</span>
                      <span className="text-gray-300">•</span>
                      <span>{stats.totalScanned.toLocaleString()} Abone</span>
                  </p>
              </div>
          </div>
          
          <button 
            onClick={onGenerate}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all shadow-md active:scale-95
                ${isGenerating 
                    ? 'bg-gray-100 text-gray-400 cursor-wait' 
                    : 'bg-[#1D1D1F] text-white hover:bg-black'}`}
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
       <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-[#FBFBFD]">
            
            {!report && !isGenerating ? (
                // Empty State
                <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto opacity-70">
                    <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center mb-8 border border-gray-100 shadow-apple">
                        <BrainCircuit className="h-12 w-12 text-[#D2D2D7]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#1D1D1F] mb-3 tracking-tight">Akıllı Özet Bekleniyor</h3>
                    <p className="text-[#86868B] mb-10 text-lg leading-relaxed">
                        Yapay zeka; Müdahale, 120 Kuralı, Tutarsız Tüketim ve Coğrafi Risk verilerini harmanlayarak kapsamlı bir yönetici özeti hazırlar.
                    </p>
                    <button onClick={onGenerate} className="px-8 py-4 bg-apple-blue hover:bg-blue-600 text-white rounded-full font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 text-base">
                        Analizi Başlat
                    </button>
                </div>
            ) : (
                // Report Content
                <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
                    
                    {/* Summary Chips */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        <div className="bg-white p-5 rounded-[24px] shadow-apple border border-white/50 flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                            <div className="text-[10px] text-[#86868B] font-bold uppercase tracking-widest mb-2">Kritik Risk</div>
                            <div className="text-3xl font-bold text-apple-red">{stats.level1Count}</div>
                        </div>
                        <div className="bg-white p-5 rounded-[24px] shadow-apple border border-white/50 flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                            <div className="text-[10px] text-[#86868B] font-bold uppercase tracking-widest mb-2">Müdahale</div>
                            <div className="text-3xl font-bold text-apple-orange">{tamperingCount}</div>
                        </div>
                        <div className="bg-white p-5 rounded-[24px] shadow-apple border border-white/50 flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                            <div className="text-[10px] text-[#86868B] font-bold uppercase tracking-widest mb-2">120 Kuralı</div>
                            <div className="text-3xl font-bold text-apple-blue">{rule120Count}</div>
                        </div>
                        <div className="bg-white p-5 rounded-[24px] shadow-apple border border-white/50 flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                            <div className="text-[10px] text-[#86868B] font-bold uppercase tracking-widest mb-2">Taranan</div>
                            <div className="text-3xl font-bold text-[#1D1D1F]">{stats.totalScanned}</div>
                        </div>
                    </div>

                    {/* Markdown Output Area */}
                    <div className="bg-white rounded-[32px] p-10 shadow-apple border border-white/50 prose prose-slate max-w-none">
                        {isGenerating ? (
                             <div className="space-y-6 animate-pulse">
                                 <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                 <div className="h-4 bg-gray-100 rounded w-full"></div>
                                 <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                                 <div className="h-40 bg-gray-50 rounded-[20px] mt-8"></div>
                             </div>
                        ) : (
                            <div className="whitespace-pre-wrap leading-relaxed text-[#1D1D1F] font-normal text-[17px]">
                                {report.split('**').map((part, i) => 
                                    i % 2 === 1 ? <span key={i} className="block mt-6 mb-2 text-xl font-bold text-black tracking-tight">{part}</span> : <span key={i} className="text-[#424245]">{part}</span>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Disclaimer */}
                    <div className="flex items-start gap-4 p-5 bg-blue-50 rounded-[24px] text-sm text-apple-blue font-medium leading-relaxed">
                        <Lightbulb className="h-5 w-5 shrink-0 mt-0.5" />
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