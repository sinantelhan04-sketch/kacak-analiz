

import React from 'react';
import { X, ShieldCheck, ThermometerSnowflake, TrendingDown, MapPin, Scale, Building2, Zap, BrainCircuit, Lightbulb, FileSpreadsheet, ArrowRight, ScanSearch, Radar, CheckCircle2 } from 'lucide-react';

interface ExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExplainerModal: React.FC<ExplainerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-slide-up ring-1 ring-slate-200">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-apple-blue/10 rounded-full flex items-center justify-center">
                <Radar className="h-6 w-6 text-apple-blue" />
              </div>
              Sistem Nasıl Çalışır?
            </h2>
            <p className="text-sm text-slate-500 mt-1 pl-14">Veri işleme hattı, tespit algoritmaları ve yapay zeka entegrasyonu.</p>
          </div>
          <button 
              onClick={onClose}
              className="p-2.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200"
          >
              <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-0 custom-scrollbar bg-[#F5F5F7]">
          
          <div className="max-w-5xl mx-auto py-10 px-6 space-y-10">

            {/* 1. DATA FLOW VISUALIZATION */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold">1</span>
                    <h3 className="text-lg font-bold text-slate-800">Veri İşleme Hattı</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Step 1 */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-blue-300 transition-colors">
                        <div className="absolute top-1/2 -right-3 w-6 h-6 bg-white border-r border-t border-slate-200 transform rotate-45 z-10 hidden md:block group-hover:border-blue-300"></div>
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                            <FileSpreadsheet className="h-6 w-6 text-green-600" />
                        </div>
                        <h4 className="font-bold text-slate-800 mb-1">Veri Girişi</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Excel formatındaki Referans (Kara Liste) ve Tüketim verileri sisteme yüklenir. Karakter hataları ve format bozuklukları otomatik temizlenir.
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-blue-300 transition-colors">
                         <div className="absolute top-1/2 -right-3 w-6 h-6 bg-white border-r border-t border-slate-200 transform rotate-45 z-10 hidden md:block group-hover:border-blue-300"></div>
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                            <ScanSearch className="h-6 w-6 text-blue-600" />
                        </div>
                        <h4 className="font-bold text-slate-800 mb-1">Analiz Motoru</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Milyonlarca veri satırı, tanımlı 6 farklı risk algoritması ile taranır. Her abone için 0-100 arası dinamik bir <strong>Risk Skoru</strong> hesaplanır.
                        </p>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 transition-colors">
                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                            <BrainCircuit className="h-6 w-6 text-purple-600" />
                        </div>
                        <h4 className="font-bold text-slate-800 mb-1">Yapay Zeka Raporu</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            İstatistiksel sonuçlar Google Gemini AI modeline gönderilir. Yönetici için stratejik, doğal dilde yazılmış özet rapor oluşturulur.
                        </p>
                    </div>
                </div>
            </section>

            {/* 2. ALGORITHMS GRID */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold">2</span>
                    <h3 className="text-lg font-bold text-slate-800">Tespit Algoritmaları</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    
                    {/* Card: Reference */}
                    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-apple hover:shadow-lg transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ShieldCheck className="h-5 w-5 text-red-600" />
                            </div>
                            <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-1 rounded-full">+50 Puan</span>
                        </div>
                        <h4 className="font-bold text-slate-800">Referans Kontrolü</h4>
                        <p className="text-xs text-slate-500 mt-2 mb-3">
                            Abone adı, TC kimlik no veya sayaç numarası daha önce "Kaçak" olarak işaretlenmiş listede var mı?
                        </p>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 w-[80%]"></div>
                        </div>
                    </div>

                    {/* Card: Bypass */}
                    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-apple hover:shadow-lg transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Zap className="h-5 w-5 text-orange-600" />
                            </div>
                            <span className="bg-orange-50 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full">+30 Puan</span>
                        </div>
                        <h4 className="font-bold text-slate-800">Müdahale (Bypass)</h4>
                        <p className="text-xs text-slate-500 mt-2 mb-3">
                            Kış tüketimi olmasına rağmen Yaz tüketimine oranı çok düşük. (Isınma Katsayısı &lt; 3.5 ise şüpheli).
                        </p>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 w-[60%]"></div>
                        </div>
                    </div>

                    {/* Card: Building Analysis */}
                    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-apple hover:shadow-lg transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Building2 className="h-5 w-5 text-indigo-600" />
                            </div>
                            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-full">Dinamik</span>
                        </div>
                        <h4 className="font-bold text-slate-800">Bina/Komşu Analizi</h4>
                        <p className="text-xs text-slate-500 mt-2 mb-3">
                            Aynı binadaki komşuların ortalamasından %60 daha az tüketen daireleri tespit eder.
                        </p>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-[50%]"></div>
                        </div>
                    </div>

                    {/* Card: Rule 120 */}
                    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-apple hover:shadow-lg transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ThermometerSnowflake className="h-5 w-5 text-blue-600" />
                            </div>
                            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full">+45 Puan</span>
                        </div>
                        <h4 className="font-bold text-slate-800">120 sm³ Kuralı</h4>
                        <p className="text-xs text-slate-500 mt-2 mb-3">
                            Aralık, Ocak ve Şubat aylarının her birinde 25 ile 110 sm³ arasında (ısınmıyor ama kullanıyor) kalanlar.
                        </p>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-[70%]"></div>
                        </div>
                    </div>

                     {/* Card: Inconsistency */}
                     <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-apple hover:shadow-lg transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <TrendingDown className="h-5 w-5 text-pink-600" />
                            </div>
                            <span className="bg-pink-50 text-pink-700 text-[10px] font-bold px-2 py-1 rounded-full">+20 Puan</span>
                        </div>
                        <h4 className="font-bold text-slate-800">Tutarsız Trend</h4>
                        <p className="text-xs text-slate-500 mt-2 mb-3">
                            Ani tüketim düşüşleri, düz çizgi (sabit endeks) veya aşırı dalgalı (ZigZag) profiller.
                        </p>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-pink-500 w-[40%]"></div>
                        </div>
                    </div>

                    {/* Card: Geo Risk */}
                    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-apple hover:shadow-lg transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <MapPin className="h-5 w-5 text-red-600" />
                            </div>
                            <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-1 rounded-full">+15 Puan</span>
                        </div>
                        <h4 className="font-bold text-slate-800">Sıcak Bölgeler</h4>
                        <p className="text-xs text-slate-500 mt-2 mb-3">
                            Bilinen kaçak noktalarına 10 metreden daha yakın olan ve tüketimi şüpheli sınırda gezen aboneler.
                        </p>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 w-[30%]"></div>
                        </div>
                    </div>
                </div>
            </section>

             {/* 3. AI INTEGRATION */}
             <section>
                <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl">
                    {/* Abstract Background Shapes */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                         <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/10 shrink-0">
                            <BrainCircuit className="h-12 w-12 text-blue-300" />
                         </div>
                         <div className="flex-1 text-center md:text-left">
                             <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                                 <Lightbulb className="h-5 w-5 text-yellow-400" />
                                 <h3 className="text-xl font-bold">Yapay Zeka Destekli Karar Mekanizması</h3>
                             </div>
                             <p className="text-slate-300 text-sm leading-relaxed mb-6">
                                 Sistem sadece matematiksel hesaplama yapmaz; <strong>Google Gemini</strong> modeli, üretilen tüm istatistikleri okuyarak bir "Fraud Analyst" gibi davranır. 
                                 Sayısal verileri (Örn: "25 adet bypass şüphesi") yorumlar ve operasyon ekiplerine "Şu bölgedeki ticari abonelere odaklanın" gibi stratejik tavsiyeler verir.
                             </p>
                             <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                 <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-xs font-medium flex items-center gap-2">
                                     <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                                     Doğal Dil İşleme
                                 </div>
                                 <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-xs font-medium flex items-center gap-2">
                                     <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                                     Örüntü Tanıma
                                 </div>
                                 <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-xs font-medium flex items-center gap-2">
                                     <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                                     Otomatik Raporlama
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>
             </section>

          </div>
        </div>
        
        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-white flex justify-end shrink-0 z-20">
            <button 
                onClick={onClose}
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95 flex items-center gap-2"
            >
                Anlaşıldı, Kapat
                <ArrowRight className="h-4 w-4" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ExplainerModal;