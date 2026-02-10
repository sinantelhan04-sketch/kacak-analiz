import React from 'react';
import { X, ShieldCheck, Activity, ThermometerSnowflake, TrendingDown, MapPin, Scale } from 'lucide-react';

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
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="bg-white rounded-[30px] shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col relative z-10 animate-slide-up">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Scale className="h-6 w-6 text-accent-purple" />
              Analiz Mantığı ve Algoritma Kriterleri
            </h2>
            <p className="text-xs text-slate-500 mt-1">Sistemin risk puanlarını nasıl hesapladığına dair teknik detaylar.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-8 custom-scrollbar space-y-8 bg-slate-50/50">
          
          {/* Section 1: Scoring Logic */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
              <span className="bg-slate-100 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
              Genel Puanlama Mantığı
            </h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Sistem, her aboneyi 0 ile 100 arasında bir Risk Puanı ile derecelendirir. Puanlar kümülatiftir; yani bir abone birden fazla şüpheli durum sergiliyorsa puanı artar.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                    <div className="text-red-600 font-bold text-sm mb-1">Seviye 1 (Kritik)</div>
                    <div className="text-xs text-slate-500">80+ Puan. Acil saha müdahalesi gerektiren, birden fazla kaçak belirtisi gösteren aboneler.</div>
                </div>
                <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl">
                    <div className="text-orange-600 font-bold text-sm mb-1">Seviye 2 (Yüksek)</div>
                    <div className="text-xs text-slate-500">50-79 Puan. Belirgin bir anomali (örn. referans eşleşmesi veya bypass şüphesi) tespit edilenler.</div>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
                    <div className="text-yellow-600 font-bold text-sm mb-1">Seviye 3 (Orta)</div>
                    <div className="text-xs text-slate-500">25-49 Puan. Mevsimsel tutarsızlıklar veya trend bozuklukları gösterenler.</div>
                </div>
            </div>
          </section>

          {/* Section 2: Detailed Criteria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Algorithm A */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-green-300 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                          <ShieldCheck className="h-5 w-5" />
                      </div>
                      <h4 className="font-bold text-slate-700">Referans Kontrolü</h4>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside marker:text-green-500">
                      <li><strong>Mantık:</strong> Dosya A (Referans/Sabıkalı) ile Dosya B (Tüketim) arasındaki veriler taranır.</li>
                      <li><strong>Muhatap Eşleşmesi (+50 Puan):</strong> Abonenin TC/Muhatap numarası daha önce kaçak kaydıyla işaretlenmişse en yüksek risk atanır.</li>
                      <li><strong>Tesisat Eşleşmesi (+20 Puan):</strong> Abone temiz olsa bile, tesisat (adres/sayaç) geçmişte işlem görmüşse uyarı verilir.</li>
                  </ul>
              </div>

              {/* Algorithm B */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-orange-300 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                          <Activity className="h-5 w-5" />
                      </div>
                      <h4 className="font-bold text-slate-700">Müdahale (Bypass) Analizi</h4>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside marker:text-orange-500">
                      <li><strong>Mantık:</strong> Kış (Ara-Oca-Şub) ve Yaz (Haz-Tem-Ağu) ortalamaları karşılaştırılır.</li>
                      <li><strong>Isınma Katsayısı:</strong> Normalde kış tüketimi yazın en az 5-10 katı olmalıdır.</li>
                      <li><strong>Kural:</strong> Eğer Kış Ortalaması &gt; 30 iken, (Kış / Yaz) oranı 3.5&apos;in altındaysa sayaç bypass edilmiş veya müdahale görmüş olabilir. <strong>(+30 Puan)</strong></li>
                  </ul>
              </div>

              {/* Algorithm C */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <ThermometerSnowflake className="h-5 w-5" />
                      </div>
                      <h4 className="font-bold text-slate-700">120 sm³ Kuralı</h4>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside marker:text-blue-500">
                      <li><strong>Mantık:</strong> Yasal/Yönetmelik gereği belirli bir ısınma alt limiti kontrolü.</li>
                      <li><strong>Kriter:</strong> Ocak, Şubat ve Mart aylarının <span className="underline decoration-blue-300">üçü de</span> 25 sm³ ile 110 sm³ aralığındaysa.</li>
                      <li><strong>Amaç:</strong> Boş evler (25 altı) ve normal kullanımlar (110 üstü) hariç tutularak, sadece şüpheli düşük tüketim aralığına odaklanılır.</li>
                      <li><strong>Puanlama:</strong> Tüketim ne kadar düşükse puan o kadar artar (30-45 Puan arası).</li>
                  </ul>
              </div>

              {/* Algorithm D */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-pink-300 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                          <TrendingDown className="h-5 w-5" />
                      </div>
                      <h4 className="font-bold text-slate-700">Tutarsızlık ve Trend</h4>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside marker:text-pink-500">
                      <li><strong>Ani Düşüş (+20 Puan):</strong> Bir önceki aya göre %60&apos;tan fazla düşüş (Kasım-Aralık veya Aralık-Ocak).</li>
                      <li><strong>Düz Çizgi (+25 Puan):</strong> Kış aylarında tüketimin standart sapması çok düşükse (Sabit endeksli faturalandırma şüphesi).</li>
                      <li><strong>ZigZag:</strong> Tüketimin bir ay artıp diğer ay sert düşmesi (Sayaca dönemsel müdahale).</li>
                  </ul>
              </div>
          </div>

          {/* Section 3: Geo Risk */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
               <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
               <div className="relative z-10">
                   <h4 className="font-bold flex items-center gap-2 mb-2">
                       <MapPin className="h-5 w-5 text-red-400" />
                       Coğrafi Risk (Hotspot) Algoritması
                   </h4>
                   <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                       Sistem, yüksek riskli abonelerin adreslerini ayrıştırır (İlçe, Mahalle, Sokak). 
                       Eğer bir sokakta yoğun kaçak/anomali tespiti yapılmışsa, o sokaktaki diğer &quot;sınırda kalan&quot; düşük tüketimli abonelere otomatik olarak <strong>+10 Bölgesel Risk Puanı</strong> eklenir. 
                       Bu sayede kaçak kullanımın yaygın olduğu bölgelerdeki gizli vakalar öne çıkarılır.
                   </p>
               </div>
          </div>

        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-colors shadow-lg shadow-slate-900/10"
            >
                Anlaşıldı, Kapat
            </button>
        </div>
      </div>
    </div>
  );
};

export default ExplainerModal;