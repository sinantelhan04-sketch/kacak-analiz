
import React, { useRef, useState } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Play, 
  ShieldCheck, 
  ArrowRight, 
  LayoutDashboard, 
  Map, 
  BrainCircuit, 
  CheckCircle2,
  Building2,
  ThermometerSnowflake,
  Activity,
  Zap,
  Download,
  Loader2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface LandingGuideProps {
  onStart: () => void;
}

const LandingGuide: React.FC<LandingGuideProps> = ({ onStart }) => {
  const guideRef = useRef<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadManual = async () => {
    if (!guideRef.current) return;
    
    try {
      setIsDownloading(true);
      // Wait a moment for UI to update
      await new Promise(resolve => setTimeout(resolve, 100));

      const element = guideRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // If the content is very long, we might need multiple pages, 
      // but for a poster (afiş), a single scaled page or a long custom page might be better.
      // Let's create a custom size PDF that fits the entire content perfectly like a poster.
      const customPdf = new jsPDF({
        orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [imgWidth, imgHeight]
      });

      customPdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      customPdf.save('Kacak_Kontrol_Pro_Kullanim_Kilavuzu_Afis.pdf');
      
    } catch (error) {
      console.error('PDF oluşturulurken hata oluştu:', error);
      window.alert('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans selection:bg-apple-blue/20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] -z-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-[#F5F5F7] -z-10"></div>
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[600px] bg-gradient-to-b from-white to-transparent -z-10"></div>
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-[120px] -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-[120px] -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-apple border border-white/50 mb-8 animate-slide-up">
            <ShieldCheck className="h-4 w-4 text-apple-blue" />
            <span className="text-xs font-bold tracking-tight text-[#1D1D1F]">Yeni Nesil Enerji Güvenliği</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tighter text-[#1D1D1F] mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
            Kaçak Kontrol <span className="text-apple-blue">Pro</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-[#86868B] max-w-2xl mx-auto mb-12 font-medium leading-relaxed animate-slide-up" style={{ animationDelay: '200ms' }}>
            Tüketim verilerini analiz ederek şüpheli aboneleri tespit eden akıllı denetim asistanı.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <button 
              onClick={onStart}
              className="px-10 py-5 bg-[#1D1D1F] text-white rounded-full font-bold text-lg hover:bg-black transition-all shadow-2xl shadow-black/20 active:scale-95 flex items-center gap-3 group"
            >
              Hemen Başlayın
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={onStart}
              className="px-10 py-5 bg-white text-[#1D1D1F] rounded-full font-bold text-lg hover:bg-gray-50 transition-all border border-gray-200 shadow-sm flex items-center gap-3"
            >
              Demo Verisi ile Dene
              <Zap className="h-5 w-5 text-apple-orange" />
            </button>
          </div>
        </div>
      </section>

      {/* Step by Step Guide */}
      <section id="guide" ref={guideRef} className="py-32 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Kullanım Kılavuzu</h2>
            <p className="text-[#86868B] text-lg font-medium mb-8">3 Adımda Profesyonel Analiz</p>
            <button 
              onClick={handleDownloadManual}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:border-apple-blue hover:text-apple-blue text-[#1D1D1F] rounded-full font-bold text-sm transition-all shadow-sm group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  PDF Hazırlanıyor...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
                  Kılavuzu Afiş Olarak İndir (PDF)
                </>
              )}
            </button>
          </div>

          <div className="space-y-40">
            
            {/* Step 1: Upload */}
            <div className="flex flex-col lg:flex-row items-center gap-20">
              <div className="flex-1 space-y-6">
                <div className="w-14 h-14 bg-apple-blue text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-200">1</div>
                <h3 className="text-3xl font-bold tracking-tight">Verilerinizi Güvenle Yükleyin</h3>
                <p className="text-[#86868B] text-lg leading-relaxed">
                  Uygulamayı kullanmak için ilk olarak iki temel dosyaya ihtiyacınız vardır:
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="mt-1 bg-emerald-100 p-1 rounded-full"><CheckCircle2 className="h-4 w-4 text-emerald-600" /></div>
                    <div>
                      <span className="font-bold text-[#1D1D1F]">Referans Listesi:</span>
                      <p className="text-sm text-[#86868B]">Geçmişte usulsüzlük yapmış abone ve tesisat numaralarını içeren Excel dosyası.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 bg-emerald-100 p-1 rounded-full"><CheckCircle2 className="h-4 w-4 text-emerald-600" /></div>
                    <div>
                      <span className="font-bold text-[#1D1D1F]">Tüketim Verisi:</span>
                      <p className="text-sm text-[#86868B]">Analiz edilecek tüm abonelerin aylık tüketim ve adres bilgilerini içeren ana dosya.</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="flex-1 relative">
                {/* Enhanced Mock UI for Upload */}
                <div className="bg-white rounded-[40px] p-8 shadow-2xl border border-gray-100 relative overflow-hidden group hover:shadow-blue-500/10 transition-shadow">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10"></div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {/* File 1: Uploaded State */}
                    <div className="bg-[#F5F5F7] rounded-3xl p-5 border border-gray-200 flex items-center gap-4 relative overflow-hidden">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                        <FileSpreadsheet className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm text-[#1D1D1F]">referans_listesi.xlsx</div>
                        <div className="text-xs text-[#86868B] mt-0.5">1.2 MB • %100 Yüklendi</div>
                      </div>
                      <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
                      {/* Progress bar */}
                      <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 w-full"></div>
                    </div>

                    {/* File 2: Waiting/Drag Drop State */}
                    <div className="h-32 bg-white rounded-3xl border-2 border-dashed border-apple-blue/40 flex flex-col items-center justify-center gap-2 relative bg-blue-50/30 group-hover:bg-blue-50/60 transition-colors">
                      <UploadCloud className="h-8 w-8 text-apple-blue animate-bounce" />
                      <span className="text-xs font-bold text-apple-blue">Tüketim Verisini Sürükleyin</span>
                      <span className="text-[10px] text-[#86868B]">veya seçmek için tıklayın</span>
                      
                      {/* Arrow 1 */}
                      <div className="absolute -top-6 -right-6 animate-bounce-horizontal">
                        <div className="relative">
                          <div className="bg-apple-blue text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-lg">Buraya Tıklayın</div>
                          <svg className="absolute top-full left-1/2 -translate-x-1/2 w-6 h-6 text-apple-blue" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 24l-8-12h16z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Analysis */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-20">
              <div className="flex-1 space-y-6">
                <div className="w-14 h-14 bg-apple-purple text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-purple-200">2</div>
                <h3 className="text-3xl font-bold tracking-tight">Analizi Başlatın</h3>
                <p className="text-[#86868B] text-lg leading-relaxed">
                  Dosyalar yüklendikten sonra sistem verileri normalize eder. Ardından <span className="font-bold text-[#1D1D1F]">"Analizi Başlat"</span> butonuna tıklayarak 6 farklı algoritmanın çalışmasını sağlayın.
                </p>
                <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100">
                  <p className="text-sm text-purple-800 font-medium">
                    Sistem; Bypass, 120 Kuralı, Bina Sapması ve Konum Risklerini saniyeler içinde hesaplar.
                  </p>
                </div>
              </div>
              
              <div className="flex-1 relative">
                {/* Enhanced Mock UI for Analysis Button */}
                <div className="bg-[#1D1D1F] rounded-[40px] p-10 shadow-2xl border border-gray-800 flex flex-col items-center justify-center relative h-64 overflow-hidden">
                  
                  {/* Radar/Scanner Animation */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <div className="w-64 h-64 rounded-full border border-purple-500/30 relative flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-t-2 border-purple-500 animate-spin-slow"></div>
                      <div className="w-48 h-48 rounded-full border border-purple-500/20 relative flex items-center justify-center">
                         <div className="absolute inset-0 rounded-full border-b-2 border-purple-400 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '4s' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="px-10 py-5 bg-white text-[#1D1D1F] rounded-full font-bold shadow-[0_0_40px_rgba(168,85,247,0.4)] flex items-center gap-3 scale-110 hover:scale-115 transition-transform cursor-pointer">
                      <Play className="h-5 w-5 fill-current text-apple-purple" />
                      Analizi Başlat
                    </div>
                    
                    {/* Progress Bar Mock */}
                    <div className="mt-8 w-full max-w-[200px]">
                      <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-2">
                        <span>Veriler İşleniyor...</span>
                        <span className="text-purple-400">%68</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 w-[68%] relative">
                          <div className="absolute top-0 right-0 bottom-0 w-10 bg-white/30 blur-[2px] animate-shimmer"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow 2 */}
                  <div className="absolute -bottom-6 right-8 animate-bounce-horizontal">
                    <div className="flex items-center gap-3">
                      <svg className="w-10 h-10 text-white -rotate-90 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 24l-8-12h16z" />
                      </svg>
                      <div className="bg-white text-[#1D1D1F] text-xs px-4 py-2 rounded-full font-bold shadow-xl whitespace-nowrap">Tek Tıkla Başlat</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Navigation */}
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 space-y-6">
                <div className="w-14 h-14 bg-apple-orange text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-orange-200">3</div>
                <h3 className="text-3xl font-bold tracking-tight">Sonuçları Detaylı İnceleyin</h3>
                <p className="text-[#86868B] text-lg leading-relaxed">
                  Analiz tamamlandığında, sol menüdeki modüller üzerinden her bir risk katmanını ayrı ayrı inceleyebilir, verileri filtreleyebilir ve Excel olarak dışa aktarabilirsiniz.
                </p>
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                  {[
                    { icon: LayoutDashboard, title: "Genel Bakış (Birleşik Skor)", desc: "Tüm analiz modüllerinden gelen verileri harmanlayarak her abone için 0-100 arası bir risk skoru üretir. En riskli vakalar listenin en üstünde yer alır." },
                    { icon: ThermometerSnowflake, title: "120 Kuralı Analizi", desc: "Kış aylarında (Aralık-Şubat) sadece pişirme/sıcak su seviyesinde (25-110 sm³) kalan ancak ısınma tüketimi görünmeyen şüpheli profilleri tespit eder." },
                    { icon: Zap, title: "Müdahale (Bypass) Analizi", desc: "Mevsimsel tüketim anomalilerini inceler. Kış aylarında ısınma ihtiyacına rağmen tüketimin Yaz seviyesinde kalması durumunu yakalar." },
                    { icon: Building2, title: "Bina Tüketim Analizi", desc: "Aynı binadaki en az 5 'temiz' komşunun medyan tüketimi ile kıyaslama yapar. Ortalamadan %60 sapan aboneleri listeler." },
                    { icon: Activity, title: "Tutarsız Trend Analizi", desc: "Tüketimdeki ani düşüşleri, sabit endeksleri (düz çizgi) veya doğal olmayan aşırı dalgalı (ZigZag) profilleri otomatik olarak saptar." },
                    { icon: Map, title: "Coğrafi Risk Haritası", desc: "Bilinen kaçak noktalarına coğrafi yakınlık analizi yapar. Riskli bölgelerdeki şüpheli tüketimleri harita üzerinde görselleştirir." },
                    { icon: BrainCircuit, title: "Yapay Zeka Raporu", desc: "Google Gemini AI, üretilen tüm istatistikleri okuyarak bir 'Dijital Denetçi' gibi davranır ve stratejik özet raporlar sunar." }
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4 hover:border-apple-orange/40 hover:shadow-md transition-all group">
                      <div className="bg-orange-50 p-3 rounded-xl group-hover:bg-apple-orange group-hover:text-white transition-colors shrink-0">
                        <item.icon className="h-6 w-6 text-apple-orange group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-[#1D1D1F] mb-1">{item.title}</h4>
                        <p className="text-xs text-[#86868B] leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 relative w-full">
                {/* Detailed Mock UI for Dashboard */}
                <div className="bg-[#F5F5F7] rounded-[40px] p-6 shadow-2xl border border-gray-200 flex gap-4 overflow-hidden relative h-[550px]">
                  {/* Sidebar Mock */}
                  <div className="w-16 bg-[#1D1D1F] rounded-3xl p-4 flex flex-col gap-4 items-center shrink-0">
                    <div className="w-10 h-10 bg-white/10 rounded-xl mb-4"></div>
                    {[LayoutDashboard, Map, BrainCircuit, Building2, ThermometerSnowflake, Activity].map((Icon, i) => (
                      <div key={i} className={`w-10 h-10 rounded-xl flex items-center justify-center ${i===0 ? 'bg-apple-blue text-white shadow-lg shadow-blue-500/30' : 'bg-white/5 text-white/40'}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    ))}
                  </div>
                  
                  {/* Main Content Mock */}
                  <div className="flex-1 flex flex-col gap-4">
                    {/* Header/Stats */}
                    <div className="flex gap-3">
                      <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="text-[10px] text-[#86868B] font-bold uppercase tracking-wider mb-1">Toplam Taranan</div>
                        <div className="text-2xl font-extrabold text-[#1D1D1F]">12,450</div>
                      </div>
                      <div className="flex-1 bg-red-50 rounded-2xl p-4 shadow-sm border border-red-100">
                        <div className="text-[10px] text-red-500 font-bold uppercase tracking-wider mb-1">Yüksek Riskli</div>
                        <div className="text-2xl font-extrabold text-red-600">342</div>
                      </div>
                    </div>
                    
                    {/* Table Mock */}
                    <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-[#1D1D1F]">Riskli Aboneler (Genel Bakış)</h4>
                        <div className="h-6 w-20 bg-gray-100 rounded-full"></div>
                      </div>
                      
                      {/* Table Header */}
                      <div className="flex text-[10px] font-bold text-[#86868B] uppercase tracking-wider border-b border-gray-100 pb-2 mb-2">
                        <div className="flex-[1.5]">Tesisat No</div>
                        <div className="flex-1 text-center">Skor</div>
                        <div className="flex-[2.5]">Tespit Edilen Riskler</div>
                      </div>
                      
                      {/* Rows */}
                      <div className="flex flex-col gap-2">
                        {[
                          { id: "T-849201", score: 95, tags: [{t: "120 Kuralı", c: "bg-blue-50 text-blue-600"}, {t: "Bypass", c: "bg-orange-50 text-orange-600"}] },
                          { id: "T-110294", score: 88, tags: [{t: "Bina Sapması", c: "bg-indigo-50 text-indigo-600"}, {t: "Sıcak Bölge", c: "bg-red-50 text-red-600"}] },
                          { id: "T-553102", score: 74, tags: [{t: "Trend Düşüşü", c: "bg-pink-50 text-pink-600"}] },
                          { id: "T-992011", score: 65, tags: [{t: "120 Kuralı", c: "bg-blue-50 text-blue-600"}] },
                          { id: "T-440291", score: 58, tags: [{t: "Sabit Tüketim", c: "bg-pink-50 text-pink-600"}] },
                        ].map((row, i) => (
                          <div key={i} className="flex items-center text-xs border-b border-gray-50 pb-2 last:border-0">
                            <div className="flex-[1.5] font-mono font-bold text-[#1D1D1F]">{row.id}</div>
                            <div className="flex-1 flex justify-center">
                              <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${row.score >= 80 ? 'bg-red-100 text-red-700' : row.score >= 60 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {row.score}
                              </span>
                            </div>
                            <div className="flex-[2.5] flex flex-wrap gap-1">
                              {row.tags.map((tag, j) => (
                                <span key={j} className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${tag.c}`}>
                                  {tag.t}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Tooltip/Highlight */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-gray-200 text-center animate-pulse-slow w-3/4">
                    <div className="w-12 h-12 bg-apple-blue/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <LayoutDashboard className="h-6 w-6 text-apple-blue" />
                    </div>
                    <div className="text-base font-bold text-[#1D1D1F] mb-2">Birleşik Risk Tablosu</div>
                    <div className="text-xs text-[#86868B] leading-relaxed">
                      Tüm modüllerin sonuçları tek bir ekranda toplanır. En yüksek risk skoruna sahip aboneler otomatik olarak en üste sıralanır.
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 bg-[#F5F5F7]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-24 h-24 bg-white rounded-[32px] shadow-apple flex items-center justify-center mx-auto mb-10 rotate-3">
            <ShieldCheck className="h-12 w-12 text-apple-blue" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-6">Analize Hazır Mısınız?</h2>
          <p className="text-[#86868B] text-xl mb-12 font-medium">Verilerinizi yükleyin ve usulsüz kullanım tespitini bir üst seviyeye taşıyın.</p>
          <button 
            onClick={onStart}
            className="px-12 py-6 bg-[#1D1D1F] text-white rounded-full font-bold text-xl hover:bg-black transition-all shadow-2xl shadow-black/20 active:scale-95"
          >
            Hemen Başlayın
          </button>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-horizontal {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(10px); }
        }
        .animate-bounce-horizontal {
          animation: bounce-horizontal 2s infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.95; transform: translate(-50%, -50%) scale(1.02); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}} />
    </div>
  );
};

export default LandingGuide;
