import React from 'react';
import { X, ShieldCheck, Activity, ThermometerSnowflake, TrendingDown, MapPin, Scale, Building2, Zap, BrainCircuit } from 'lucide-react';

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
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-slide-up ring-1 ring-slate-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
              <Scale className="h-6 w-6 text-apple-blue" />
              Algoritma ve Analiz Mantığı
            </h2>
            <p className="text-sm text-slate-500 mt-1">Sistemin kaçak tespitinde kullandığı istatistiksel modeller ve risk kriterleri.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-0 custom-scrollbar bg-[#F5F5F7]">
          
          <div className="max-w-4xl mx-auto py-8 px-6 space-y-8">
            
            {/* 1. Risk Scoring Overview */}
            <section className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-200/60">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="bg-slate-900 text-white w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono">1</span>
                Risk Puanlama Sistemi
              </h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Kaçak Analiz Programı, hibrit bir puanlama motoru kullanır. Her abone 0 puandan başlar ve tespit edilen her şüpheli durum için kümülatif ceza puanı alır. Puan 100'e sabitlenir.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full -mr-4 -mt-4 transition-transform group-hover:scale-150"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-red-600 font-bold text-sm">Seviye 1 (Kritik)</span>
                            <span className="text-xs font-mono font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded">80+ Puan</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-snug">
                            Birden fazla kaçak belirtisi (örn. hem referans listesinde hem de tüketim anomalisi) gösteren, acil müdahale gerektiren aboneler.
                        </p>
                      </div>
                  </div>

                  <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full -mr-4 -mt-4 transition-transform group-hover:scale-150"></div>
                       <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-orange-600 font-bold text-sm">Seviye 2 (Yüksek)</span>
                            <span className="text-xs font-mono font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded">50-79 Puan</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-snug">
                            Belirgin bir anomali (örn. 120 kuralı ihlali veya bypass şüphesi) tespit edilen, öncelikli incelenmesi gereken grup.
                        </p>
                      </div>
                  </div>

                  <div className="p-4 bg-yellow-50/50 border border-yellow-100 rounded-xl relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/5 rounded-full -mr-4 -mt-4 transition-transform group-hover:scale-150"></div>
                       <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-yellow-600 font-bold text-sm">Seviye 3 (Orta)</span>
                            <span className="text-xs font-mono font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">25-49 Puan</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-snug">
                            Mevsimsel tutarsızlıklar, trend bozuklukları veya şüpheli düşüşler gösteren potansiyel risk grubu.
                        </p>
                      </div>
                  </div>
              </div>
            </section>

            {/* 2. Detailed Algorithms */}
            <div className="grid grid-cols-1 gap-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-slate-900 text-white w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono">2</span>
                    Tespit Algoritmaları
                </h3>

                {/* Algo: Reference */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-slate-800 text-base mb-2">Referans Kontrolü (Kara Liste)</h4>
                        <p className="text-sm text-slate-600 mb-4">
                            Sistem, yüklenen "Referans Listesi" (Dosya A) ile güncel tüketim verilerini (Dosya B) çapraz sorgular.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div className="text-xs font-bold text-slate-500 uppercase mb-1">Muhatap Eşleşmesi</div>
                                <div className="text-sm font-semibold text-slate-800">
                                    Kişi (TC/Muhatap No) daha önce kaçak yapmışsa. <span className="text-green-600 ml-1">+50 Puan</span>
                                </div>
                             </div>
                             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div className="text-xs font-bold text-slate-500 uppercase mb-1">Tesisat Eşleşmesi</div>
                                <div className="text-sm font-semibold text-slate-800">
                                    Adres/Sayaç geçmişte işlem görmüşse (Abone değişse bile). <span className="text-green-600 ml-1">+20 Puan</span>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Algo: Tampering (Bypass) */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                        <Zap className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                             <h4 className="font-bold text-slate-800 text-base mb-2">Müdahale ve Bypass Analizi</h4>
                             <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded">+30 Puan</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">
                            Abone kışın aktif kullanım yapıyor görünmesine rağmen (Min. Tüketim &gt; 30), Yaz ve Kış tüketimi arasında beklenen katlanma gerçekleşmiyorsa <strong>sayaç bypass edilmiş</strong> olabilir.
                        </p>
                        <div className="bg-slate-900 rounded-xl p-4 text-slate-300 text-xs font-mono overflow-x-auto">
                            <div className="mb-1 text-slate-500">// Formül</div>
                            <div>Isınma_Katsayısı = (Ocak + Şubat + Mart) / (Haziran + Temmuz + Ağustos)</div>
                            <div className="mt-2 text-orange-400">IF (Kış_Ort &gt; 30) AND (Isınma_Katsayısı &lt; 3.5) THEN "Şüpheli"</div>
                        </div>
                    </div>
                </div>

                 {/* Algo: Rule 120 */}
                 <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <ThermometerSnowflake className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                             <h4 className="font-bold text-slate-800 text-base mb-2">120 sm³ Kuralı (Düşük Tüketim)</h4>
                             <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">+30-45 Puan</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">
                            Yönetmelik gereği ve istatistiksel olarak bir konutun kışın aktif olup ısınmama (sadece ocak/şofben kullanımı) sınırı analiz edilir.
                        </p>
                        <ul className="space-y-2">
                            <li className="flex items-start gap-2 text-sm text-slate-700">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                                <span><strong>Kriter:</strong> Ocak, Şubat ve Mart aylarının <span className="underline decoration-blue-300">her üçünde de</span> tüketim <strong>25 sm³ ile 110 sm³</strong> arasındaysa.</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-700">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                                <span><strong>Neden 25 altı değil?</strong> 0-25 sm³ arası genellikle boş ev veya tatile gitmiş abonedir. Kaçak riski düşüktür.</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-700">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                                <span><strong>Neden 110 üstü değil?</strong> 110 sm³ üzeri tüketim, minimum ısınma şartlarını sağlayan normal aboneleri temsil eder.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Algo: Building Analysis */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 ring-2 ring-indigo-50">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Building2 className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                             <h4 className="font-bold text-slate-800 text-base mb-2">Bina/Komşu Kıyaslaması (Yeni)</h4>
                             <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Özel Modül</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">
                            Coğrafi koordinatları (Enlem/Boylam) birebir aynı olan aboneler "Aynı Bina" kabul edilir. Bina içerisindeki tüketim davranışı modellenir.
                        </p>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700 marker:text-indigo-600 marker:font-bold">
                            <li><strong>Temiz Referans Grubu:</strong> Binada kış aylarında düzenli tüketim yapan (her ay &gt; 25 sm³) komşular belirlenir. En az 8 temiz komşu şartı aranır.</li>
                            <li><strong>Medyan Hesaplama:</strong> Temiz komşuların kış ortalamasının medyanı (orta noktası) alınır.</li>
                            <li><strong>Sapma Tespiti:</strong> Eğer bir abonenin tüketimi, bina medyanının <strong>%60'ından daha düşükse</strong> şüpheli olarak işaretlenir.</li>
                        </ol>
                        <div className="mt-4 p-3 bg-indigo-50 rounded-lg text-xs text-indigo-800 flex items-center gap-2">
                             <Scale className="h-4 w-4" />
                             <span>Örnek: Bina Ortalaması 100 m³ iken 35 m³ tüketen daire (-%65 sapma) tespit edilir.</span>
                        </div>
                    </div>
                </div>

                {/* Algo: Inconsistency */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                        <TrendingDown className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                             <h4 className="font-bold text-slate-800 text-base mb-2">Tutarsızlık ve Trend Analizi</h4>
                             <span className="text-xs font-bold bg-pink-100 text-pink-700 px-2 py-1 rounded">+20-25 Puan</span>
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                             <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-xs font-bold text-slate-600 mb-1">Düz Çizgi</div>
                                <p className="text-[10px] text-slate-500">Tüketimin kışın standart sapması sıfıra yakınsa (sabit endeks/müdahale).</p>
                             </div>
                             <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-xs font-bold text-slate-600 mb-1">Ani Düşüş</div>
                                <p className="text-[10px] text-slate-500">Trend eğimi (Slope) negatif yönde sert kırılıyorsa.</p>
                             </div>
                             <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-xs font-bold text-slate-600 mb-1">ZigZag</div>
                                <p className="text-[10px] text-slate-500">Bir ay yüksek, bir ay düşük (Volatilite skoru yüksek).</p>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Algo: Geo Risk */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                        <MapPin className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                             <h4 className="font-bold text-slate-800 text-base mb-2">Coğrafi Risk (Hotspot)</h4>
                             <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded">+10-15 Puan</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                             Sistem, kesinleşmiş kaçak vakalarının (Referans Listesi) veya çok yüksek riskli abonelerin (80+ Puan) coğrafi konumlarını haritalandırır.
                        </p>
                        <p className="text-sm text-slate-600">
                             Eğer "sınırda kalan" (örn. düşük tüketimli) bir abone, bilinen bir kaçak noktasına <strong>10 metreden daha yakınsa</strong>, bölgesel risk puanı eklenerek önceliklendirilir. Bu yöntem, kaçak kullanımın yaygın olduğu sokakları veya bina kümelerini ortaya çıkarır.
                        </p>
                    </div>
                </div>
            </div>

            {/* 3. AI Section */}
             <section className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-[24px] text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
                         <BrainCircuit className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-2">Yapay Zeka Entegrasyonu (Gemini 3 Flash)</h3>
                        <p className="text-sm text-indigo-100 leading-relaxed opacity-90">
                            İstatistiksel motorun ürettiği tüm sayısal veriler ve risk profilleri, Google Gemini AI modeline gönderilir. 
                            Yapay zeka, bu verileri yorumlayarak yöneticiler için "Hangi bölgeye gidilmeli?", "Hangi kaçak türü artışta?" gibi stratejik sorulara yanıt veren, doğal dilde yazılmış özet raporlar oluşturur.
                        </p>
                    </div>
                </div>
            </section>

          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end shrink-0 z-20">
            <button 
                onClick={onClose}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 active:scale-95"
            >
                Anlaşıldı, Kapat
            </button>
        </div>
      </div>
    </div>
  );
};

export default ExplainerModal;