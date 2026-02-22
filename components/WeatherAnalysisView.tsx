
import React, { useState } from 'react';
import { CloudSun, ArrowRight, Building2, MapPin, Calendar, ThermometerSun, AlertCircle, Download, ChevronDown, Loader2, Info, ArrowDown } from 'lucide-react';
import { Subscriber, WeatherRiskResult } from '../types';
import { analyzeWeatherNormalized, TURKEY_CITIES, getMGMHeatingDegreeDays } from '../utils/weatherEngine';
import * as XLSX from 'xlsx';

interface WeatherAnalysisViewProps {
  subscribers: Subscriber[];
}

const WeatherAnalysisView: React.FC<WeatherAnalysisViewProps> = ({ subscribers }) => {
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [results, setResults] = useState<WeatherRiskResult[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);
  const [showInfo, setShowInfo] = useState(true);

  // Use TURKEY_CITIES constant for full list
  const cities = Object.keys(TURKEY_CITIES).sort();
  const districts = selectedCity ? (TURKEY_CITIES[selectedCity] || []).sort() : [];

  const handleRunAnalysis = async () => {
    if(!selectedCity || !selectedDistrict) return;
    
    setIsLoading(true);
    setHasRun(false);

    try {
        // 1. Fetch HDD Data from MGM Service (Simulated)
        const hddData = await getMGMHeatingDegreeDays(selectedCity);
        
        // 2. Run Analysis with fetched data
        const res = analyzeWeatherNormalized(subscribers, selectedCity, selectedDistrict, hddData);
        
        setResults(res);
        setHasRun(true);
        setVisibleCount(50);
        setShowInfo(true); // Show explanation when results arrive
    } catch (error) {
        console.error("Analiz hatası:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 50);
  };

  const handleExport = () => {
     if(results.length === 0) return;
     const exportData = results.map(row => ({
        "Tesisat No": row.tesisatNo,
        "Bağlantı Nesnesi": row.baglantiNesnesi,
        "Lokasyon": `${selectedCity} / ${selectedDistrict}`,
        "Yıl": selectedYear,
        "Ham Kış Ort. (m3)": row.rawWinterAvg,
        "Norm. Kış Ort. (HDD)": row.normWinterAvg,
        "Bina Medyan (Norm)": row.buildingNormMedian,
        "Sapma (%)": row.deviationPercentage.toFixed(2),
        "HDD Faktörü (Oca/Şub/Mar)": `${row.hddUsed.jan}/${row.hddUsed.feb}/${row.hddUsed.mar}`
     }));
     const ws = XLSX.utils.json_to_sheet(exportData);
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, "Hava_Kosullari_Analizi");
     XLSX.writeFile(wb, "Hava_Kosullari_Risk_Raporu.xlsx");
  };

  // Generate last 10 years dynamically
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 10}, (_, i) => (currentYear - i).toString());

  return (
    <div className="bg-white rounded-[32px] shadow-apple border border-white/50 flex flex-col h-full overflow-hidden relative">
        
        {/* Header & Filter Section */}
        <div className="px-8 py-6 border-b border-[#F5F5F7] bg-white/80 backdrop-blur-xl sticky top-0 z-10">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center shadow-sm">
                    <CloudSun className="h-6 w-6 text-sky-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">Hava Koşulları Analizi</h2>
                    <p className="text-sm text-[#86868B] font-medium">MGM verileri (Isıtma Derece Gün - HDD) kullanılarak iklim normalize edilmiş tüketim analizi.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                {/* Year Select */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#86868B] uppercase ml-1">Analiz Yılı</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select 
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-[#F5F5F7] rounded-xl text-sm font-semibold text-[#1D1D1F] appearance-none focus:outline-none focus:ring-2 focus:ring-sky-200 cursor-pointer"
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                {/* City Select */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#86868B] uppercase ml-1">İl</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select 
                            value={selectedCity}
                            onChange={(e) => { setSelectedCity(e.target.value); setSelectedDistrict(''); }}
                            className="w-full pl-10 pr-4 py-2.5 bg-[#F5F5F7] rounded-xl text-sm font-semibold text-[#1D1D1F] appearance-none focus:outline-none focus:ring-2 focus:ring-sky-200 cursor-pointer"
                        >
                            <option value="">Seçiniz...</option>
                            {cities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                {/* District Select */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#86868B] uppercase ml-1">İlçe</label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select 
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                            disabled={!selectedCity}
                            className="w-full pl-10 pr-4 py-2.5 bg-[#F5F5F7] rounded-xl text-sm font-semibold text-[#1D1D1F] appearance-none focus:outline-none focus:ring-2 focus:ring-sky-200 cursor-pointer disabled:opacity-50"
                        >
                            <option value="">{selectedCity ? 'Seçiniz...' : 'Önce İl Seçin'}</option>
                            {districts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>

                {/* Action Button */}
                <button 
                    onClick={handleRunAnalysis}
                    disabled={!selectedCity || !selectedDistrict || isLoading}
                    className="h-[42px] bg-[#1D1D1F] hover:bg-black text-white font-bold text-sm rounded-xl px-6 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Veriler Çekiliyor...
                        </>
                    ) : (
                        <>
                            Analizi Başlat <ArrowRight className="h-4 w-4" />
                        </>
                    )}
                </button>
            </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#FBFBFD] p-6">
            {!hasRun && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <CloudSun className="h-24 w-24 text-gray-300 mb-4" />
                    <p className="text-lg font-medium text-gray-500">MGM veritabanından hava koşullarını çekmek için bölge seçiniz.</p>
                </div>
            )}
            
            {isLoading && (
                 <div className="h-full flex flex-col items-center justify-center text-center animate-pulse">
                    <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mb-4">
                        <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
                    </div>
                    <h3 className="text-lg font-bold text-[#1D1D1F]">MGM Servisine Bağlanılıyor...</h3>
                    <p className="text-gray-400 text-sm mt-1">{selectedCity} / {selectedDistrict} için geçmiş sıcaklık verileri alınıyor.</p>
                </div>
            )}

            {hasRun && results.length === 0 && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-[#1D1D1F]">Risk Bulunamadı</h3>
                    <p className="text-gray-500 max-w-md mt-2">
                        Seçilen bölgede ({selectedDistrict}) hava koşullarına göre normalize edilmiş bina ortalamasından sapma gösteren abone tespit edilemedi.
                    </p>
                </div>
            )}

            {hasRun && results.length > 0 && !isLoading && (
                <div className="animate-slide-up space-y-4">
                    
                    {/* INFO BOX (EXPLAINER) */}
                    {showInfo && (
                        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 flex gap-4 relative">
                             <button onClick={() => setShowInfo(false)} className="absolute top-2 right-2 text-sky-400 hover:text-sky-600"><ChevronDown className="h-4 w-4" /></button>
                             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm text-sky-500">
                                 <Info className="h-5 w-5" />
                             </div>
                             <div className="text-sm text-sky-900 space-y-2">
                                 <h4 className="font-bold text-sky-700">Terimler Sözlüğü</h4>
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                     <div>
                                         <span className="font-bold block text-xs uppercase tracking-wide text-sky-600 mb-1">Ham Kış Ortalaması</span>
                                         <p className="text-xs opacity-80 leading-relaxed">Abonenin Ocak, Şubat ve Mart aylarında sayaçtan okunan gerçek tüketimlerinin (m³) aritmetik ortalamasıdır.</p>
                                     </div>
                                     <div>
                                         <span className="font-bold block text-xs uppercase tracking-wide text-sky-600 mb-1">HDD (Isıtma Derece Gün)</span>
                                         <p className="text-xs opacity-80 leading-relaxed">Dış hava sıcaklığının ne kadar soğuk olduğunu gösteren bilimsel katsayıdır. Hava soğudukça HDD artar.</p>
                                     </div>
                                     <div>
                                         <span className="font-bold block text-xs uppercase tracking-wide text-sky-600 mb-1">Düzeltilmiş (br/HDD)</span>
                                         <p className="text-xs opacity-80 leading-relaxed">Ham tüketimin HDD'ye bölünmüş halidir. Bu sayede hava durumundan bağımsız olarak abonenin binaya göre verimliliği/sapması ölçülür.</p>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center px-2">
                         <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center bg-red-100 text-red-600 font-bold text-xs h-6 px-2 rounded-full border border-red-200">
                                {results.length} Riskli Abone
                            </span>
                            <span className="text-xs text-gray-400 font-mono hidden md:inline-block">
                                HDD Ref (O/Ş/M): {results[0].hddUsed.jan}/{results[0].hddUsed.feb}/{results[0].hddUsed.mar}
                            </span>
                         </div>
                         <button 
                            onClick={handleExport}
                            className="text-xs font-bold text-[#1D1D1F] bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
                         >
                            <Download className="h-3.5 w-3.5" /> Excel
                         </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-sky-50/50 text-[#86868B] uppercase text-[10px] font-bold tracking-wider border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Abone Bilgisi</th>
                                    <th className="px-6 py-4">Gerçek Tüketim (m³)</th>
                                    <th className="px-6 py-4">İklim Düzeltmeli Kıyaslama</th>
                                    <th className="px-6 py-4 text-center">Sapma Durumu</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {results.slice(0, visibleCount).map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4 align-top">
                                            <div className="flex flex-col gap-1">
                                                <div className="font-bold text-[#1D1D1F] font-mono text-sm">{row.tesisatNo}</div>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <Building2 className="h-3 w-3 text-sky-500" />
                                                    <span className="font-mono font-medium">{row.baglantiNesnesi}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 opacity-60 mt-1">
                                                    <MapPin className="h-3 w-3 text-gray-400" />
                                                    <span className="text-[10px] text-gray-500 font-mono">{row.location.lat.toFixed(4)}, {row.location.lng.toFixed(4)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-4 align-top">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <ThermometerSun className="h-4 w-4 text-gray-400" />
                                                    <span className="font-mono font-bold text-gray-700 text-lg">{row.rawWinterAvg}</span>
                                                    <span className="text-xs text-gray-400 font-medium">Ort.</span>
                                                </div>
                                                {/* Monthly Breakdown */}
                                                <div className="flex gap-1">
                                                     <div className="px-1.5 py-0.5 bg-gray-100 rounded text-[9px] text-gray-500 font-mono">
                                                         Oca: {row.monthlyData.jan}
                                                     </div>
                                                     <div className="px-1.5 py-0.5 bg-gray-100 rounded text-[9px] text-gray-500 font-mono">
                                                         Şub: {row.monthlyData.feb}
                                                     </div>
                                                     <div className="px-1.5 py-0.5 bg-gray-100 rounded text-[9px] text-gray-500 font-mono">
                                                         Mar: {row.monthlyData.mar}
                                                     </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 align-top">
                                            <div className="flex flex-col gap-2">
                                                 <div className="flex justify-between items-center text-xs bg-red-50/50 p-1.5 rounded border border-red-100/50">
                                                     <span className="text-red-800 font-medium">Abone:</span>
                                                     <span className="font-mono font-bold text-red-600">{row.normWinterAvg.toFixed(4)} <span className="text-[8px] opacity-60">br/HDD</span></span>
                                                 </div>
                                                 <div className="flex justify-between items-center text-xs bg-sky-50/50 p-1.5 rounded border border-sky-100/50">
                                                     <span className="text-sky-800 font-medium">Bina Geneli:</span>
                                                     <span className="font-mono font-bold text-sky-600">{row.buildingNormMedian.toFixed(4)} <span className="text-[8px] opacity-60">br/HDD</span></span>
                                                 </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 align-top text-center">
                                            <div className="flex flex-col items-center justify-center h-full pt-1">
                                                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold bg-red-50 text-red-600 border border-red-200 shadow-sm">
                                                    <ArrowDown className="h-3.5 w-3.5" />
                                                    %{Math.abs(row.deviationPercentage).toFixed(1)}
                                                </span>
                                                <span className="text-[10px] text-gray-400 mt-1.5 font-medium">Binadan daha az</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {visibleCount < results.length && (
                            <div className="p-4 border-t border-gray-100 flex justify-center">
                                <button 
                                    onClick={handleShowMore}
                                    className="text-xs font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1"
                                >
                                    Daha Fazla Göster <ChevronDown className="h-3 w-3" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default WeatherAnalysisView;
