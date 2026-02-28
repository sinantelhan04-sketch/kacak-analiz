

import React from 'react';
import { X, ShieldCheck, ThermometerSnowflake, TrendingDown, MapPin, Building2, Zap, BrainCircuit, Lightbulb, FileSpreadsheet, ArrowRight, ScanSearch, Radar, CheckCircle2 } from 'lucide-react';

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
            <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-4 tracking-tight">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 rotate-3">
                <Radar className="h-7 w-7 text-white" />
              </div>
              Sistem Nasıl Çalışır?
            </h2>
            <p className="text-base text-slate-500 mt-2 pl-16 font-medium">Uçtan uca veri işleme hattı, tescilli tespit algoritmaları ve üretken yapay zeka entegrasyonu.</p>
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
                <div className="flex items-center gap-3 mb-8">
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-md">1</span>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Veri İşleme Hattı</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                    {/* Connection Line for Desktop */}
                    <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0"></div>

                    {/* Step 1 */}
                    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative z-10 group hover:border-blue-400 transition-all hover:shadow-xl hover:-translate-y-1">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                            <FileSpreadsheet className="h-7 w-7 text-emerald-600" />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2 text-lg">Akıllı Veri Girişi</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Sistem, ham Excel verilerini (Referans ve Tüketim) kabul eder. Gelişmiş veri temizleme motoru, karakter hatalarını ve format uyumsuzluklarını anında normalize eder.
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative z-10 group hover:border-blue-400 transition-all hover:shadow-xl hover:-translate-y-1">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                            <ScanSearch className="h-7 w-7 text-blue-600" />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2 text-lg">Çok Katmanlı Analiz</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Milyonlarca satırlık veri kümesi, 6 katmanlı tescilli risk algoritmalarımızdan geçer. Her abone için gerçek zamanlı, 0-100 ölçeğinde dinamik bir <strong>Risk Skoru</strong> üretilir.
                        </p>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative z-10 group hover:border-purple-400 transition-all hover:shadow-xl hover:-translate-y-1">
                        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                            <BrainCircuit className="h-7 w-7 text-purple-600" />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2 text-lg">AI Stratejik Raporlama</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Elde edilen istatistiksel çıktılar Google Gemini AI tarafından analiz edilir. Karar vericiler için stratejik içgörüler içeren, doğal dilde yapılandırılmış yönetici raporları sunulur.
                        </p>
                    </div>
                </div>
            </section>

            {/* 2. ALGORITHMS GRID */}
            <section>
                <div className="flex items-center gap-3 mb-8">
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-md">2</span>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Tespit Algoritmaları</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* Card: Reference */}
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-apple hover:shadow-2xl transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-500"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm">
                                    <ShieldCheck className="h-6 w-6 text-red-600" />
                                </div>
                                <span className="bg-red-50 text-red-700 text-xs font-bold px-3 py-1 rounded-full border border-red-100">+50 Puan</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-lg">Referans Kontrolü</h4>
                            <p className="text-sm text-slate-500 mt-2 mb-4 leading-relaxed">
                                Abone kimlik bilgileri veya sayaç numarası, geçmişte "Usulsüz Kullanım" olarak işaretlenmiş veri tabanı ile anlık olarak eşleştirilir.
                            </p>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-gradient-to-r from-red-400 to-red-600 w-[80%]"></div>
                            </div>
                        </div>
                    </div>

                    {/* Card: Bypass */}
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-apple hover:shadow-2xl transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-500"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm">
                                    <Zap className="h-6 w-6 text-orange-600" />
                                </div>
                                <span className="bg-orange-50 text-orange-700 text-xs font-bold px-3 py-1 rounded-full border border-orange-100">+30 Puan</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-lg">Müdahale (Bypass)</h4>
                            <p className="text-sm text-slate-500 mt-2 mb-4 leading-relaxed">
                                Mevsimsel tüketim anomalileri analiz edilir. Kış aylarında ısınma ihtiyacına rağmen tüketimin Yaz seviyesinde kalması (Katsayı &lt; 3.5) şüpheli kabul edilir.
                            </p>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 w-[60%]"></div>
                            </div>
                        </div>
                    </div>

                    {/* Card: Building Analysis */}
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-apple hover:shadow-2xl transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-500"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm">
                                    <Building2 className="h-6 w-6 text-indigo-600" />
                                </div>
                                <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full border border-indigo-100">Dinamik</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-lg">Bina/Komşu Analizi</h4>
                            <p className="text-sm text-slate-500 mt-2 mb-4 leading-relaxed">
                                Aynı lokasyon ve bina tipindeki komşuların tüketim ortalamaları ile kıyaslama yapılır. Ortalamadan %60 sapan aboneler radara girer.
                            </p>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 w-[50%]"></div>
                            </div>
                        </div>
                    </div>

                    {/* Card: Rule 120 */}
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-apple hover:shadow-2xl transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-500"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm">
                                    <ThermometerSnowflake className="h-6 w-6 text-blue-600" />
                                </div>
                                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">+45 Puan</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-lg">120 sm³ Kuralı</h4>
                            <p className="text-sm text-slate-500 mt-2 mb-4 leading-relaxed">
                                Kış aylarında (Aralık-Şubat) sadece pişirme/sıcak su seviyesinde (25-110 sm³) kalan ancak ısınma tüketimi görünmeyen profiller taranır.
                            </p>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 w-[70%]"></div>
                            </div>
                        </div>
                    </div>

                     {/* Card: Inconsistency */}
                     <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-apple hover:shadow-2xl transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-500"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm">
                                    <TrendingDown className="h-6 w-6 text-pink-600" />
                                </div>
                                <span className="bg-pink-50 text-pink-700 text-xs font-bold px-3 py-1 rounded-full border border-pink-100">+20 Puan</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-lg">Tutarsız Trend</h4>
                            <p className="text-sm text-slate-500 mt-2 mb-4 leading-relaxed">
                                Ani tüketim düşüşleri, sabit endeks (düz çizgi) veya doğal olmayan aşırı dalgalı (ZigZag) tüketim profilleri otomatik olarak saptanır.
                            </p>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-gradient-to-r from-pink-400 to-pink-600 w-[40%]"></div>
                            </div>
                        </div>
                    </div>

                    {/* Card: Geo Risk */}
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-apple hover:shadow-2xl transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-500"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm">
                                    <MapPin className="h-6 w-6 text-red-600" />
                                </div>
                                <span className="bg-red-50 text-red-700 text-xs font-bold px-3 py-1 rounded-full border border-red-100">+15 Puan</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-lg">Sıcak Bölgeler</h4>
                            <p className="text-sm text-slate-500 mt-2 mb-4 leading-relaxed">
                                Bilinen kaçak noktalarına coğrafi yakınlık analizi yapılır. Riskli bölgelerdeki şüpheli tüketimler ek puan ile önceliklendirilir.
                            </p>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-gradient-to-r from-red-400 to-red-600 w-[30%]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

             {/* 3. AI INTEGRATION */}
             <section>
                <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5">
                    {/* Immersive Background Elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] -mr-32 -mt-32 animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] -ml-32 -mb-32 animate-pulse" style={{ animationDelay: '2s' }}></div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                         <div className="w-32 h-32 bg-white/10 backdrop-blur-xl rounded-[40px] flex items-center justify-center border border-white/20 shrink-0 shadow-2xl rotate-6 group hover:rotate-0 transition-transform duration-500">
                            <BrainCircuit className="h-16 w-16 text-blue-400" />
                         </div>
                         <div className="flex-1 text-center lg:text-left">
                             <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                                 <div className="bg-yellow-400/20 p-1.5 rounded-lg">
                                    <Lightbulb className="h-6 w-6 text-yellow-400" />
                                 </div>
                                 <h3 className="text-2xl font-bold tracking-tight">Yapay Zeka Destekli Karar Mekanizması</h3>
                             </div>
                             <p className="text-slate-300 text-lg leading-relaxed mb-8 font-light">
                                 Sistem sadece matematiksel hesaplama yapmaz; <strong>Google Gemini</strong> modeli, üretilen tüm istatistikleri okuyarak bir <span className="text-blue-400 font-medium">"Dijital Denetçi"</span> gibi davranır. 
                                 Sayısal verileri yorumlar ve operasyon ekiplerine <span className="italic text-white">"Şu bölgedeki ticari abonelere odaklanın"</span> gibi stratejik ve eyleme dönüştürülebilir tavsiyeler verir.
                             </p>
                             <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                                 <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-sm font-medium flex items-center gap-2.5 hover:bg-white/10 transition-colors cursor-default">
                                     <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                     Doğal Dil İşleme (NLP)
                                 </div>
                                 <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-sm font-medium flex items-center gap-2.5 hover:bg-white/10 transition-colors cursor-default">
                                     <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                     İleri Örüntü Tanıma
                                 </div>
                                 <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-sm font-medium flex items-center gap-2.5 hover:bg-white/10 transition-colors cursor-default">
                                     <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                     Otonom Raporlama
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