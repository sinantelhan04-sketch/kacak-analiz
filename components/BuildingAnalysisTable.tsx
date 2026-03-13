
import React, { useState, useEffect, useRef } from 'react';
import { BuildingRisk } from '../types';
import { Building2, ArrowDown, MapPin, ChevronDown, Download, Users, Search, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import { resolveLocation, ResolvedLocation } from '../services/locationService';

interface BuildingAnalysisTableProps {
  data: BuildingRisk[];
}

const BuildingAnalysisTable: React.FC<BuildingAnalysisTableProps> = ({ data }) => {
  const [visibleCount, setVisibleCount] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [minDeviation, setMinDeviation] = useState<number>(0);
  const [resolvedMap, setResolvedMap] = useState<Record<string, ResolvedLocation>>({});
  const isResolvingRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleCount(50);
    }, 0);
    return () => clearTimeout(timer);
  }, [data, searchQuery, minDeviation]);

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 50);
  };

  const filteredData = data.filter(row => {
      const matchesSearch = row.tesisatNo.includes(searchQuery);
      // deviationPercentage is negative (e.g. -65), so we take Math.abs
      const absDev = Math.abs(row.deviationPercentage);
      const matchesDeviation = absDev >= minDeviation;
      return matchesSearch && matchesDeviation;
  });
  
  const visibleData = filteredData.slice(0, visibleCount);

  // Automatically resolve locations that need it using OSM Nominatim
  useEffect(() => {
    if (isResolvingRef.current) return;

    const resolveNeeded = visibleData.filter(sub => {
      const notResolvedYet = !resolvedMap[`${sub.location.lat},${sub.location.lng}`];
      const hasLocation = sub.location && sub.location.lat !== 0;
      return notResolvedYet && hasLocation;
    }).slice(0, 5);

    if (resolveNeeded.length === 0) return;

    const resolveAll = async () => {
      isResolvingRef.current = true;
      for (const sub of resolveNeeded) {
        const key = `${sub.location.lat},${sub.location.lng}`;
        if (resolvedMap[key]) continue;

        try {
          const result = await resolveLocation(sub.location.lat, sub.location.lng);
          if (result) {
            setResolvedMap(prev => ({ ...prev, [key]: result }));
          } else {
            setResolvedMap(prev => ({ ...prev, [key]: { lat: sub.location.lat, lng: sub.location.lng, district: 'Bilinmiyor', city: '', country: '' } }));
          }
        } catch (err) {
          console.error("Location resolution error:", err);
        }
        await new Promise(resolve => setTimeout(resolve, 1100));
      }
      isResolvingRef.current = false;
    };

    resolveAll();
  }, [visibleData, resolvedMap]);

  const handleExport = () => {
    const exportData = filteredData.map(row => {
        const resolved = resolvedMap[`${row.location.lat},${row.location.lng}`];
        return {
            "Tesisat No": row.tesisatNo,
            "Bağlantı Nesnesi": row.baglantiNesnesi,
            "Abone Tipi": row.aboneTipi,
            "Abone Kış Ort. (m3)": row.personalWinterAvg,
            "Bina Kış Medyan (m3)": row.buildingWinterMedian,
            "Sapma (%)": row.deviationPercentage.toFixed(2),
            "Komşu Sayısı": row.neighborCount,
            "Ocak": row.monthlyData.jan,
            "Şubat": row.monthlyData.feb,
            "Mart": row.monthlyData.mar,
            "Adres": resolved?.fullName || row.address,
            "İlçe (OSM)": resolved?.district || ""
        };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bina_Analizi");
    XLSX.writeFile(wb, "Bina_Tuketim_Raporu.xlsx");
  };

  return (
    <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm overflow-hidden flex flex-col h-full relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
      
      <div className="p-5 border-b border-indigo-100 bg-white sticky top-0 z-10 flex flex-col md:flex-row justify-between items-center gap-4 backdrop-blur-xl">
        <div className="flex items-center gap-4 w-full md:w-auto">
            <h3 className="font-bold text-slate-800 flex items-center gap-2.5">
            <div className="bg-indigo-50 p-1.5 rounded-md border border-indigo-200 animate-pulse">
                <Building2 className="h-5 w-5 text-indigo-500" />
            </div>
            Bina Tüketim Analizi (Komşu Kıyaslaması)
            </h3>
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-500 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95 ml-auto md:ml-0"
                title="Listeyi Excel olarak indir"
            >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Excel İndir</span>
            </button>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
             {/* Filter Dropdown */}
             <div className="relative">
                 <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-300" />
                 <select 
                    value={minDeviation} 
                    onChange={(e) => setMinDeviation(Number(e.target.value))}
                    className="pl-9 pr-8 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-sm font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all cursor-pointer appearance-none min-w-[140px]"
                 >
                     <option value={0}>Tüm Sapmalar</option>
                     <option value={50}>%50 ve üzeri</option>
                     <option value={60}>%60 ve üzeri</option>
                     <option value={70}>%70 ve üzeri</option>
                     <option value={80}>%80 ve üzeri</option>
                     <option value={90}>%90 ve üzeri</option>
                 </select>
                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-indigo-400 pointer-events-none" />
             </div>

             {/* Search Input */}
             <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-300" />
                <input 
                    type="text" 
                    placeholder="Tesisat Ara..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-sm font-medium text-slate-700 placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all w-full md:w-48"
                />
            </div>
        </div>
      </div>
      
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-sm text-slate-500">
          <thead className="bg-indigo-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-0">
            <tr>
              <th className="px-6 py-4">Tesisat No</th>
              <th className="px-6 py-4">Kış Ort. (Abone vs Bina)</th>
              <th className="px-6 py-4">Sapma (%)</th>
              <th className="px-6 py-4">Aylık Detay (Oca/Şub/Mar)</th>
              <th className="px-6 py-4">Bina & Bağlantı</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-50">
            {visibleData.map((row, index) => {
              return (
              <tr key={row.tesisatNo} 
                  className="hover:bg-indigo-50/50 transition-colors duration-200 group table-row-animate"
                  style={{ animationDelay: `${index % 20 * 30}ms` }}
              >
                <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 group-hover:text-black font-mono transition-colors">{row.tesisatNo}</span>
                        <span className="text-xs text-slate-400 font-mono mt-0.5">{row.aboneTipi}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between min-w-[120px]">
                            <span className="text-xs text-slate-400">Abone:</span>
                            <span className="font-mono font-bold text-red-500">{row.personalWinterAvg} m³</span>
                        </div>
                        <div className="flex items-center justify-between min-w-[120px] pb-1 border-b border-dashed border-indigo-200">
                             <span className="text-xs text-slate-400">Bina Medyan:</span>
                             <span className="font-mono font-bold text-indigo-600">{row.buildingWinterMedian} m³</span>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                         <div className="p-1 bg-red-100 rounded text-red-600">
                             <ArrowDown className="h-4 w-4" />
                         </div>
                         <span className="font-bold text-lg text-slate-700">
                             {Math.abs(row.deviationPercentage).toFixed(1)}%
                         </span>
                    </div>
                    <span className="text-[9px] text-slate-400 block mt-1">Binadan daha az tüketiyor</span>
                </td>
                <td className="px-6 py-4">
                     <div className="flex gap-1.5">
                         {[row.monthlyData.jan, row.monthlyData.feb, row.monthlyData.mar].map((val, i) => (
                             <div key={i} className="flex flex-col items-center bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                                 <span className="text-[8px] text-slate-400 uppercase tracking-tight">
                                     {i===0?'OCA':i===1?'ŞUB':'MAR'}
                                 </span>
                                 <span className={`font-mono font-bold text-xs ${val<25?'text-red-500':'text-slate-600'}`}>
                                     {val}
                                 </span>
                             </div>
                         ))}
                     </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 text-indigo-400" />
                          <span className="font-mono text-xs text-slate-700 font-bold">{row.baglantiNesnesi}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 opacity-60" title={(() => {
                          const resolved = resolvedMap[`${row.location.lat},${row.location.lng}`];
                          return resolved?.fullName || 'Konum Belirleniyor...';
                      })()}>
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span className="font-mono text-[10px] text-slate-500">
                              {(() => {
                                  const resolved = resolvedMap[`${row.location.lat},${row.location.lng}`];
                                  if (resolved) return `${resolved.district} / ${resolved.city}`;
                                  return `${row.location.lat.toFixed(4)}, ${row.location.lng.toFixed(4)}`;
                              })()}
                          </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                          <Users className="h-3 w-3 text-indigo-400" />
                          <span className="text-xs text-slate-500">{row.neighborCount} temiz komşu</span>
                      </div>
                  </div>
                </td>
              </tr>
            );
            })}
             {visibleCount < filteredData.length && (
                <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                        <button 
                            onClick={handleShowMore}
                            className="text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            Daha Fazla Göster ({filteredData.length - visibleCount} kaldı)
                            <ChevronDown className="h-3 w-3" />
                        </button>
                    </td>
                </tr>
            )}
            {filteredData.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                            <Building2 className="h-8 w-8 text-indigo-200" />
                            <p>{searchQuery ? 'Arama sonucu bulunamadı.' : 'Seçilen kriterlerde (sapma oranı) abone bulunamadı.'}</p>
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BuildingAnalysisTable;
