
import React, { useState, useEffect, useRef } from 'react';
import { RiskScore } from '../types';
import { AlertTriangle, MapPin, User, Building2, ThermometerSnowflake, Wrench, Activity, Ban, ChevronDown, Search } from 'lucide-react';
import { resolveLocationOSM, ResolvedLocation } from '../services/locationService';

interface RiskTableProps {
  data: RiskScore[];
}

const RiskTable: React.FC<RiskTableProps> = ({ data }) => {
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

  // Filter based on search query
  const filteredData = data.filter(row => 
    row.tesisatNo.includes(searchQuery)
  );

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
          const result = await resolveLocationOSM(sub.location.lat, sub.location.lng);
          if (result) {
            setResolvedMap(prev => ({ ...prev, [key]: result }));
          } else {
            setResolvedMap(prev => ({ ...prev, [key]: { lat: sub.location.lat, lng: sub.location.lng, district: 'Bilinmiyor', city: '', country: '' } }));
          }
        } catch (err) {
          console.error("OSM resolution error:", err);
        }
        await new Promise(resolve => setTimeout(resolve, 1100));
      }
      isResolvingRef.current = false;
    };

    resolveAll();
  }, [visibleData, resolvedMap]);

  // Helper to determine badge style (Apple Chips style)
  const renderReasonBadge = (reason: string) => {
    let style = "bg-[#F5F5F7] text-apple-subtext";
    let icon = null;

    if (reason.includes('MUHATAP') || reason.includes('Kara Liste')) {
      style = "bg-apple-red/10 text-apple-red";
      icon = <Ban className="h-3 w-3 mr-1" />;
    } 
    else if (reason.includes('Geçmiş Müdahale')) {
      style = "bg-apple-red/10 text-apple-red";
      icon = <Wrench className="h-3 w-3 mr-1" />;
    }
    else if (reason.includes('120 Kuralı')) {
      style = "bg-apple-blue/10 text-apple-blue";
      icon = <ThermometerSnowflake className="h-3 w-3 mr-1" />;
    }
    else if (reason.includes('Mevsimsel') || reason.includes('Bypass')) {
      style = "bg-apple-orange/10 text-apple-orange";
      icon = <Activity className="h-3 w-3 mr-1" />;
    }
    else if (reason.includes('Konum') || reason.includes('Bölgesel')) {
      style = "bg-apple-purple/10 text-apple-purple";
      icon = <MapPin className="h-3 w-3 mr-1" />;
    }

    return (
        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold mr-1.5 mb-1.5 ${style}`}>
            {icon}
            <span>{reason}</span>
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Frosted Header */}
      <div className="px-8 py-5 flex justify-between items-center bg-white/80 backdrop-blur-xl sticky top-0 z-20 border-b border-[#F5F5F7]">
        <div>
            <h3 className="font-semibold text-[#1D1D1F] text-xl tracking-tight">Riskli Abone Listesi</h3>
            <p className="text-xs text-[#86868B] font-medium mt-0.5">Analiz edilen {data.length} kayıt</p>
        </div>
        
        {/* Search Input */}
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
                type="text" 
                placeholder="Tesisat No Ara..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[#F5F5F7] rounded-full text-sm font-medium text-[#1D1D1F] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/20 transition-all w-64"
            />
        </div>
      </div>
      
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F5F5F7]/50 text-[#86868B] uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th className="px-8 py-3">#</th>
              <th className="px-6 py-3">Abone Bilgisi</th>
              <th className="px-6 py-3">Konum</th>
              <th className="px-6 py-3">Risk Puanı</th>
              <th className="px-6 py-3">Tespit Detayları</th>
              <th className="px-6 py-3">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F5F7]">
            {visibleData.map((row, index) => (
              <tr key={row.tesisatNo} className="hover:bg-[#F5F5F7]/50 transition-colors">
                <td className="px-8 py-4 font-mono text-[#86868B] text-xs w-16">
                    {index + 1}
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${row.aboneTipi === 'Commercial' ? 'bg-apple-orange/10 text-apple-orange' : 'bg-apple-blue/10 text-apple-blue'}`}>
                            {row.aboneTipi === 'Commercial' ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-[#1D1D1F] text-sm tracking-tight">{row.tesisatNo}</span>
                            <span className="text-xs text-[#86868B] font-medium">{row.muhatapNo}</span>
                            {row.baglantiNesnesi && <span className="text-[10px] text-slate-400 mt-0.5">BN: {row.baglantiNesnesi}</span>}
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4">
                  {row.location.lat !== 0 ? (
                      <div className="flex flex-col">
                          <span className="text-xs font-bold text-[#1D1D1F] flex items-center gap-1" title={(() => {
                              const resolved = resolvedMap[`${row.location.lat},${row.location.lng}`];
                              return resolved?.fullName || 'Konum Belirleniyor...';
                          })()}>
                              <MapPin className="h-3 w-3 text-rose-500" />
                              {(() => {
                                  const resolved = resolvedMap[`${row.location.lat},${row.location.lng}`];
                                  return resolved?.district || row.district || 'Belirleniyor...';
                              })()}
                          </span>
                          <span className="text-[10px] text-[#86868B] font-mono mt-0.5">
                              {row.location.lat.toFixed(4)}, {row.location.lng.toFixed(4)}
                          </span>
                      </div>
                  ) : (
                      <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${row.totalScore >= 80 ? 'bg-apple-red shadow-[0_0_8px_rgba(255,59,48,0.4)]' : row.totalScore >= 50 ? 'bg-apple-orange' : 'bg-yellow-400'}`}></div>
                        <span className="text-lg font-semibold text-[#1D1D1F]">{row.totalScore}</span>
                    </div>
                </td>
                <td className="px-6 py-4 max-w-sm">
                  <div className="flex flex-wrap pt-1">
                    {row.reason.split(', ').map((r, i) => (
                        <React.Fragment key={i}>
                            {renderReasonBadge(r)}
                        </React.Fragment>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                    ${row.riskLevel.includes('Seviye 1') ? 'bg-apple-red text-white shadow-sm' : 
                      row.riskLevel.includes('Seviye 2') ? 'bg-apple-orange/10 text-apple-orange' : 
                      'bg-yellow-400/10 text-yellow-600'}`}>
                    {row.riskLevel.split('(')[0].trim()}
                  </span>
                </td>
              </tr>
            ))}
            
            {visibleCount < filteredData.length && (
                <tr>
                    <td colSpan={6} className="px-6 py-6 text-center">
                        <button 
                            onClick={handleShowMore}
                            className="text-xs font-semibold text-[#1D1D1F] bg-[#F5F5F7] hover:bg-gray-200 px-6 py-2.5 rounded-full transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            Daha Fazla Göster
                            <ChevronDown className="h-3 w-3" />
                        </button>
                    </td>
                </tr>
            )}
            
            {filteredData.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-[#86868B]">
                        <div className="flex flex-col items-center justify-center gap-4">
                             <div className="w-16 h-16 rounded-full bg-[#F5F5F7] flex items-center justify-center">
                                <AlertTriangle className="h-8 w-8 text-gray-400" />
                             </div>
                             <p className="font-medium text-sm">{searchQuery ? 'Aramanızla eşleşen kayıt bulunamadı.' : 'Kayıt bulunamadı.'}</p>
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

export default RiskTable;
