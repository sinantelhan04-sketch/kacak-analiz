
import React, { useState, useEffect, useRef } from 'react';
import { RiskScore } from '../types';
import { Wrench, ArrowDownRight, ThermometerSnowflake, ThermometerSun, ChevronDown, Download, Search, MapPin } from 'lucide-react';
import * as XLSX from 'xlsx';
import { resolveLocation, ResolvedLocation } from '../services/locationService';

interface TamperingTableProps {
  data: RiskScore[];
}

const TamperingTable: React.FC<TamperingTableProps> = ({ data }) => {
  const [visibleCount, setVisibleCount] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [resolvedMap, setResolvedMap] = useState<Record<string, ResolvedLocation>>({});
  const isResolvingRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleCount(50);
    }, 0);
    return () => clearTimeout(timer);
  }, [data, searchQuery]);

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 50);
  };

  // FILTER & SORT
  const filteredData = data.filter(row => row.tesisatNo.includes(searchQuery));
  
  // SORTING LOGIC: Sort by summerAvg DESCENDING (Highest summer average is at the top)
  const sortedData = [...filteredData].sort((a, b) => b.seasonalStats.summerAvg - a.seasonalStats.summerAvg);
  const visibleData = sortedData.slice(0, visibleCount);

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
    const exportData = sortedData.map(row => {
        const resolved = resolvedMap[`${row.location.lat},${row.location.lng}`];
        return {
            "Tesisat No": row.tesisatNo,
            "Muhatap No": row.muhatapNo,
            "Bağlantı Nesnesi": row.baglantiNesnesi,
            "Abone Tipi": row.rawAboneTipi || row.aboneTipi,
            "Yaz Ortalaması (m3)": row.seasonalStats.summerAvg,
            "Kış Ortalaması (m3)": row.seasonalStats.winterAvg,
            "Isınma Katsayısı (Kat)": row.heatingSensitivity.toFixed(2),
            "Adres": resolved?.fullName || row.address,
            "İlçe (OSM)": resolved?.district || ""
        };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mudahale_Suphesi");
    XLSX.writeFile(wb, "Mudahale_Analiz_Raporu.xlsx");
  };

  return (
    <div className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden flex flex-col h-full relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
      
      <div className="p-5 border-b border-orange-100 bg-white sticky top-0 z-10 flex justify-between items-center backdrop-blur-xl">
        <div className="flex items-center gap-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2.5">
            <div className="bg-orange-50 p-1.5 rounded-md border border-orange-200 animate-pulse">
                <Wrench className="h-5 w-5 text-orange-500" />
            </div>
            Tesisatta Müdahale Şüphesi
            </h3>
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-orange-300 hover:text-orange-600 text-slate-500 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95"
                title="Listeyi Excel olarak indir"
            >
                <Download className="h-3.5 w-3.5" />
                Excel İndir
            </button>
        </div>
        
        <div className="flex items-center gap-4">
             {/* Search Input */}
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-300" />
                <input 
                    type="text" 
                    placeholder="Tesisat Ara..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-1.5 bg-orange-50 border border-orange-100 rounded-full text-sm font-medium text-slate-700 placeholder-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all w-48"
                />
            </div>

             <div className="flex flex-col text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Sıralama: Yaz Ortalaması
                </span>
                <span className="text-[9px] text-slate-500">En Yüksek &rarr; En Düşük</span>
            </div>
        </div>
      </div>
      
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-sm text-slate-500">
          <thead className="bg-orange-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-0">
            <tr>
              <th className="px-6 py-4">Tesisat No</th>
              <th className="px-6 py-4">Yaz Ort. (sm³)</th>
              <th className="px-6 py-4">Kış Ort. (sm³)</th>
              <th className="px-6 py-4">Artış Katı</th>
              <th className="px-6 py-4">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-100/50">
            {visibleData.map((row, index) => (
              <tr key={row.tesisatNo} 
                  className="hover:bg-orange-50/50 transition-colors duration-200 group table-row-animate"
                  style={{ animationDelay: `${index % 20 * 30}ms` }}
              >
                <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 group-hover:text-black font-mono transition-colors">{row.tesisatNo}</span>
                        <span className="text-xs text-slate-400 font-mono mt-0.5">{row.muhatapNo}</span>
                        <div className="flex items-center gap-1 mt-1" title={(() => {
                            const resolved = resolvedMap[`${row.location.lat},${row.location.lng}`];
                            return resolved?.fullName || 'Konum Belirleniyor...';
                        })()}>
                            <MapPin className="h-3 w-3 text-orange-400" />
                            <span className="text-[10px] text-slate-500 font-medium">
                                {(() => {
                                    const resolved = resolvedMap[`${row.location.lat},${row.location.lng}`];
                                    if (resolved) return `${resolved.district} / ${resolved.city}`;
                                    return row.district || 'Belirleniyor...';
                                })()}
                            </span>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                        <ThermometerSun className="h-3 w-3 text-orange-400" />
                        <span className="font-mono">{row.seasonalStats.summerAvg}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                     <div className="flex items-center gap-2 text-slate-600">
                        <ThermometerSnowflake className="h-3 w-3 text-blue-400" />
                        <span className="font-mono">{row.seasonalStats.winterAvg}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-red-500 text-lg">{row.heatingSensitivity.toFixed(1)}x</span>
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  </div>
                  <span className="text-[9px] text-slate-400">Beklenen: &gt;5.0x</span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border bg-orange-50 text-orange-600 border-orange-200">
                    BYPASS ŞÜPHESİ
                  </span>
                </td>
              </tr>
            ))}
             {visibleCount < sortedData.length && (
                <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                        <button 
                            onClick={handleShowMore}
                            className="text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            Daha Fazla Göster ({sortedData.length - visibleCount} kaldı)
                            <ChevronDown className="h-3 w-3" />
                        </button>
                    </td>
                </tr>
            )}
            {sortedData.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        <p>{searchQuery ? 'Arama sonucu bulunamadı.' : 'Tesisat müdahale kriterine uyan kayıt bulunamadı.'}</p>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TamperingTable;
