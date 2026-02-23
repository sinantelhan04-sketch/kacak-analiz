import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Subscriber } from '../types';
import { OctagonPause, Search, Download, Filter, Building2, User, ChevronDown, AlertCircle, MapPin } from 'lucide-react';
import * as XLSX from 'xlsx';
import { identifyDistrictGeometric } from '../utils/fraudEngine';
import { resolveLocationOSM, ResolvedLocation } from '../services/locationService';

interface StoppedMeterViewProps {
  subscribers: Subscriber[];
}

const StoppedMeterView: React.FC<StoppedMeterViewProps> = ({ subscribers }) => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);
  const [onlyDecActive, setOnlyDecActive] = useState(false);
  const [buildingTypeFilter, setBuildingTypeFilter] = useState<'all' | 'mustakil' | 'bina'>('all');
  
  // NEW: Location resolution state
  const [resolvedMap, setResolvedMap] = useState<Record<string, ResolvedLocation>>({});

  // Extract unique raw subscriber types for the dropdown
  const subscriberTypes = useMemo(() => {
    const types = new Set<string>();
    subscribers.forEach(sub => {
      if (sub.rawAboneTipi) {
        types.add(sub.rawAboneTipi);
      }
    });
    return Array.from(types).sort();
  }, [subscribers]);
  
  // Calculate baglantiNesnesi counts for filtering
  const baglantiNesnesiCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    subscribers.forEach(sub => {
      if (sub.baglantiNesnesi) {
        counts[sub.baglantiNesnesi] = (counts[sub.baglantiNesnesi] || 0) + 1;
      }
    });
    return counts;
  }, [subscribers]);

  // Helper to check for special type
  const isSpecialType = (type: string) => {
      if (!type) return false;
      const norm = type.toLocaleUpperCase('tr').replace(/\s/g, '');
      return norm.includes('RESMİKURUM') && norm.includes('ISINMA');
  };

  // Filter Logic
  const filteredData = useMemo(() => {
    return subscribers.filter(sub => {
      // 0. Only evaluate those with a valid muhatap (excluding auto-generated placeholders if applicable)
      // In our dataLoader, placeholders start with 'M-' followed by tesisatNo.
      // We'll filter for subscribers who have a muhatapNo that isn't just a placeholder.
      if (!sub.muhatapNo || sub.muhatapNo === `M-${sub.tesisatNo}`) {
        return false;
      }

      // 1. Filter by Type (if selected)
      if (selectedType && sub.rawAboneTipi !== selectedType) {
        return false;
      }

      // 2. Filter by Search Query
      if (searchQuery && !sub.tesisatNo.includes(searchQuery)) {
        return false;
      }

      // 3. Core Logic
      const dec = sub.consumption.dec || 0;
      const jan = sub.consumption.jan || 0;
      const feb = sub.consumption.feb || 0;

      // NEW: If Jan or Feb data is missing (not just 0, but not present in file), exclude from list
      // per user request: "aralıkta tüketim olup ocak ve şubat aylarında bu tesisata ait bilgi yoksa listeden çıkar"
      const isJanPresent = sub.monthsPresent.includes('jan');
      const isFebPresent = sub.monthsPresent.includes('feb');
      
      // NEW: Also check if there is a muhatap associated in Jan/Feb
      // per user request: "ocak ve şubatta muhatabı olmayanlar listelenmesin"
      const hasJanMuhatap = sub.monthsWithMuhatap.includes('jan');
      const hasFebMuhatap = sub.monthsWithMuhatap.includes('feb');
      
      if (!isJanPresent || !isFebPresent || !hasJanMuhatap || !hasFebMuhatap) {
          return false;
      }

      // 4. Building Type Filter
      if (buildingTypeFilter !== 'all') {
          if (!sub.baglantiNesnesi) return false;
          const count = baglantiNesnesiCounts[sub.baglantiNesnesi] || 0;
          if (buildingTypeFilter === 'mustakil' && count !== 1) return false;
          if (buildingTypeFilter === 'bina' && count <= 4) return false;
      }

      // If global toggle is active, apply "Dec > 0, Jan/Feb == 0" to everyone
      if (onlyDecActive) {
          return dec > 0 && jan === 0 && feb === 0;
      }

      // Apply logic based on the subscriber's own type
      if (isSpecialType(sub.rawAboneTipi)) {
         // Special Case: Resmi Kurum (Isınma)
         // Logic: Dec > 0 AND Jan == 0 AND Feb == 0
         return dec > 0 && jan === 0 && feb === 0;
      }

      // Default Logic: Dec == 0 AND Jan == 0 AND Feb == 0
      return dec === 0 && jan === 0 && feb === 0;
    }).sort((a, b) => (b.consumption.dec || 0) - (a.consumption.dec || 0));
  }, [subscribers, selectedType, searchQuery, onlyDecActive, buildingTypeFilter, baglantiNesnesiCounts]);

  const isResolvingRef = useRef(false);

  const visibleData = filteredData.slice(0, visibleCount);

  // Automatically resolve locations that need it using OSM Nominatim
  useEffect(() => {
    if (isResolvingRef.current) return;

    const resolveNeeded = visibleData.filter(sub => {
      const notResolvedYet = !resolvedMap[`${sub.location.lat},${sub.location.lng}`];
      const hasLocation = sub.location && sub.location.lat !== 0;
      return notResolvedYet && hasLocation;
    }).slice(0, 3); // Small batch to respect rate limits

    if (resolveNeeded.length === 0) return;

    const resolveAll = async () => {
      isResolvingRef.current = true;
      console.log(`Auto-resolving ${resolveNeeded.length} locations via OSM...`);

      for (const sub of resolveNeeded) {
        const key = `${sub.location.lat},${sub.location.lng}`;
        
        // Check again if already resolved in this loop (to be safe)
        if (resolvedMap[key]) continue;

        try {
          // Resolve by lat/lng only as per user request
          const result = await resolveLocationOSM(sub.location.lat, sub.location.lng);

          if (result) {
            console.log(`OSM Resolved ${key} to ${result.district} / ${result.city}`);
            setResolvedMap(prev => ({ ...prev, [key]: result }));
          } else {
            // Mark as failed to avoid retrying immediately
            setResolvedMap(prev => ({ ...prev, [key]: { lat: sub.location.lat, lng: sub.location.lng, district: 'Bilinmiyor', city: '', country: '' } }));
          }
        } catch (err) {
          console.error("OSM resolution error:", err);
        }

        // Nominatim strict rate limit: 1 request per second
        await new Promise(resolve => setTimeout(resolve, 1100));
      }
      isResolvingRef.current = false;
    };

    resolveAll();
  }, [visibleData, resolvedMap]);

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 50);
  };

  const handleExport = () => {
    if (filteredData.length === 0) return;
    const exportData = filteredData.map(row => ({
      "Tesisat No": row.tesisatNo,
      "Muhatap No": row.muhatapNo,
      "Abone Tipi": row.rawAboneTipi,
      "Adres": row.address,
      "Aralık (m3)": row.consumption.dec,
      "Ocak (m3)": row.consumption.jan,
      "Şubat (m3)": row.consumption.feb,
      "Durum": isSpecialType(row.rawAboneTipi) ? 'Aralık Var, Ocak/Şubat Yok' : '3 Ay Boyunca Tüketim Yok'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Duran_Sayac_Analizi");
    XLSX.writeFile(wb, "Duran_Sayac_Raporu.xlsx");
  };

  return (
    <div className="bg-white rounded-[32px] shadow-apple border border-white/50 flex flex-col h-full overflow-hidden relative">
      
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#F5F5F7] bg-white/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shadow-sm">
            <OctagonPause className="h-6 w-6 text-rose-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">Duran Sayaç Analizi</h2>
            <p className="text-sm text-[#86868B] font-medium">Kış aylarında tüketimi duran veya hiç olmayan aboneleri tespit eder.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
             {/* Type Select */}
             <div className="flex flex-col gap-1.5 w-full md:w-64">
                <label className="text-xs font-bold text-[#86868B] uppercase ml-1">Abone Tipi</label>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select 
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#F5F5F7] rounded-xl text-sm font-semibold text-[#1D1D1F] appearance-none focus:outline-none focus:ring-2 focus:ring-rose-200 cursor-pointer"
                    >
                        <option value="">Tümü (Standart Analiz)</option>
                        {subscriberTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="h-3 w-3 text-gray-400" />
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="flex flex-col gap-1.5 w-full md:w-64">
                <label className="text-xs font-bold text-[#86868B] uppercase ml-1">Tesisat Ara</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Tesisat No..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#F5F5F7] rounded-xl text-sm font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-rose-200"
                    />
                </div>
            </div>

            {/* Global Toggle Checkbox */}
            <div className="flex items-center gap-3 h-[42px] px-4 bg-[#F5F5F7] rounded-xl cursor-pointer hover:bg-rose-50 transition-colors group" onClick={() => setOnlyDecActive(!onlyDecActive)}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${onlyDecActive ? 'bg-rose-600 border-rose-600' : 'border-gray-300 bg-white'}`}>
                    {onlyDecActive && <div className="w-2 h-2 bg-white rounded-sm"></div>}
                </div>
                <span className={`text-xs font-bold transition-colors ${onlyDecActive ? 'text-rose-700' : 'text-[#86868B]'}`}>
                    Ocak/Şubat Kesintisi
                </span>
            </div>

            {/* Building Type Filters */}
            <div className="flex items-center gap-2 bg-[#F5F5F7] p-1 rounded-xl h-[42px]">
                <button 
                    onClick={() => setBuildingTypeFilter(buildingTypeFilter === 'mustakil' ? 'all' : 'mustakil')}
                    className={`px-4 h-full rounded-lg text-xs font-bold transition-all ${buildingTypeFilter === 'mustakil' ? 'bg-white text-rose-600 shadow-sm' : 'text-[#86868B] hover:text-[#1D1D1F]'}`}
                >
                    Müstakil
                </button>
                <button 
                    onClick={() => setBuildingTypeFilter(buildingTypeFilter === 'bina' ? 'all' : 'bina')}
                    className={`px-4 h-full rounded-lg text-xs font-bold transition-all ${buildingTypeFilter === 'bina' ? 'bg-white text-rose-600 shadow-sm' : 'text-[#86868B] hover:text-[#1D1D1F]'}`}
                >
                    Bina (+4)
                </button>
            </div>
          </div>

          <button 
              onClick={handleExport}
              disabled={filteredData.length === 0}
              className="h-[42px] bg-white border border-gray-200 hover:bg-gray-50 text-[#1D1D1F] font-bold text-sm rounded-xl px-6 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
              <Download className="h-4 w-4" /> Excel İndir
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#FBFBFD] p-6">
        {filteredData.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-[#1D1D1F] mb-2">Kayıt Bulunamadı</h3>
                <p className="text-gray-500 max-w-md">
                    Seçilen kriterlere uygun duran sayaç tespiti yapılamadı.
                </p>
            </div>
        ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-slide-up">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        {filteredData.length} Kayıt Bulundu
                    </span>
                    <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-1 rounded-md font-bold border border-rose-200">
                        {onlyDecActive ? 'Kritik: Ocak/Şubat Kesintisi' : 'Kritik: Tüketim Kesintisi'}
                    </span>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-[#86868B] uppercase text-[10px] font-bold tracking-wider border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4">Tesisat Bilgisi</th>
                            <th className="px-6 py-4">Yapı Tipi</th>
                            <th className="px-6 py-4">Aralık</th>
                            <th className="px-6 py-4">Ocak</th>
                            <th className="px-6 py-4">Şubat</th>
                            <th className="px-6 py-4">Durum</th>
                            <th className="px-6 py-4">Adres</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {visibleData.map((row, idx) => {
                            const bCount = row.baglantiNesnesi ? (baglantiNesnesiCounts[row.baglantiNesnesi] || 0) : 0;
                            const isBina = bCount > 4;
                            const isMustakil = bCount === 1;

                            return (
                                <tr key={idx} className="hover:bg-rose-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-[#1D1D1F] font-mono">{row.tesisatNo}</span>
                                            <span className="text-xs text-gray-400">{row.muhatapNo}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-1">
                                                {isMustakil ? (
                                                    <User className="h-3.5 w-3.5 text-blue-500" />
                                                ) : (
                                                    <Building2 className="h-3.5 w-3.5 text-orange-500" />
                                                )}
                                                <span className="text-xs font-bold text-gray-700">
                                                    {isMustakil ? 'Müstakil' : isBina ? 'Bina (+4)' : 'Apartman'}
                                                </span>
                                            </div>
                                            {bCount > 1 && (
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    {bCount} Abone Mevcut
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`font-mono font-bold ${row.consumption.dec === 0 ? 'text-rose-600' : 'text-gray-700'}`}>
                                            {row.consumption.dec}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`font-mono font-bold ${row.consumption.jan === 0 ? 'text-rose-600' : 'text-gray-700'}`}>
                                            {row.consumption.jan}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`font-mono font-bold ${row.consumption.feb === 0 ? 'text-rose-600' : 'text-gray-700'}`}>
                                            {row.consumption.feb}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-100 w-fit">
                                                {isSpecialType(row.rawAboneTipi) ? 'Ocak/Şubat Yok' : '3 Ay Yok'}
                                            </span>
                                            {isBina && (
                                                <span className="text-[9px] text-rose-500 font-bold uppercase tracking-tighter">
                                                    Kritik: Bina İçi Tekil Durma
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                    <div className="flex flex-col max-w-xs">
                                        <div className="flex items-center gap-1 text-[#1D1D1F] font-bold mb-0.5">
                                            <MapPin className="h-3 w-3 text-rose-500" />
                                            <span className="truncate">
                                                {(() => {
                                                    const resolved = resolvedMap[`${row.location.lat},${row.location.lng}`];
                                                    if (resolved) return resolved.district || 'Bilinmiyor';
                                                    
                                                    // Fallback to geometric identification if OSM not yet resolved
                                                    return identifyDistrictGeometric(row.location.lat, row.location.lng) || 'Konum Belirleniyor...';
                                                })()}
                                            </span>
                                        </div>
                                        <a 
                                            href={`https://www.google.com/maps/search/?api=1&query=${row.location.lat},${row.location.lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] text-gray-400 truncate hover:text-rose-600 hover:underline transition-colors flex items-center gap-1" 
                                            title="Google Haritalarda Aç"
                                        >
                                            {(() => {
                                                const resolved = resolvedMap[`${row.location.lat},${row.location.lng}`];
                                                if (resolved) return resolved.district || 'Bilinmiyor';
                                                return 'Haritada Gör';
                                            })()}
                                            <AlertCircle className="h-2 w-2" />
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
                {visibleCount < filteredData.length && (
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
        )}
      </div>
    </div>
  );
};

export default StoppedMeterView;
