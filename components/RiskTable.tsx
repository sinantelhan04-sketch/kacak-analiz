import React, { useState, useEffect } from 'react';
import { RiskScore } from '../types';
import { AlertTriangle, MapPin, User, Building2, ThermometerSnowflake, Wrench, Activity, Ban, ChevronDown } from 'lucide-react';

interface RiskTableProps {
  data: RiskScore[];
}

const RiskTable: React.FC<RiskTableProps> = ({ data }) => {
  const [visibleCount, setVisibleCount] = useState(50);

  useEffect(() => {
    setVisibleCount(50);
  }, [data]);

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 50);
  };

  const visibleData = data.slice(0, visibleCount);

  // Helper to determine badge style (Apple Colors)
  const renderReasonBadge = (reason: string, row: RiskScore) => {
    let style = "bg-slate-100 text-slate-600 border-slate-200";
    let icon = null;

    if (reason.includes('MUHATAP') || reason.includes('Kara Liste')) {
      style = "bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20";
      icon = <Ban className="h-3 w-3 mr-1" />;
    } 
    else if (reason.includes('Geçmiş Müdahale')) {
      style = "bg-[#FF3B30]/5 text-[#FF3B30] border-[#FF3B30]/10";
      icon = <Wrench className="h-3 w-3 mr-1" />;
    }
    else if (reason.includes('120 Kuralı')) {
      style = "bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20";
      icon = <ThermometerSnowflake className="h-3 w-3 mr-1" />;
    }
    else if (reason.includes('Mevsimsel') || reason.includes('Bypass')) {
      style = "bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/20";
      icon = <Activity className="h-3 w-3 mr-1" />;
    }
    else if (reason.includes('Konum') || reason.includes('Bölgesel')) {
      style = "bg-[#AF52DE]/10 text-[#AF52DE] border-[#AF52DE]/20";
      icon = <MapPin className="h-3 w-3 mr-1" />;
    }

    return (
        <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold mr-1 mb-1 border ${style}`}>
            {icon}
            <span>{reason}</span>
        </div>
    );
  };

  return (
    <div className="bg-white/80 rounded-[24px] shadow-sm border border-white flex flex-col h-full overflow-hidden backdrop-blur-xl">
      {/* Header */}
      <div className="px-6 py-5 border-b border-black/5 flex justify-between items-center bg-white/60 backdrop-blur-md sticky top-0 z-20">
        <div>
            <h3 className="font-semibold text-[#1D1D1F] text-lg">Riskli Abone Listesi</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Analiz edilen {data.length} kayıt</p>
        </div>
        
        <div className="flex gap-2">
            <div className="h-3 w-3 rounded-full bg-[#FF3B30] border border-black/5"></div>
            <div className="h-3 w-3 rounded-full bg-[#FF9500] border border-black/5"></div>
            <div className="h-3 w-3 rounded-full bg-[#34C759] border border-black/5"></div>
        </div>
      </div>
      
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F5F5F7] text-slate-500 uppercase text-[10px] font-bold tracking-wide sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 font-semibold text-[#86868b]">Rank</th>
              <th className="px-6 py-3 font-semibold text-[#86868b]">Abone Bilgisi</th>
              <th className="px-6 py-3 font-semibold text-[#86868b]">Konum</th>
              <th className="px-6 py-3 font-semibold text-[#86868b]">Risk Puanı</th>
              <th className="px-6 py-3 font-semibold text-[#86868b]">Tespit Detayları</th>
              <th className="px-6 py-3 font-semibold text-[#86868b]">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {visibleData.map((row, index) => (
              <tr key={row.tesisatNo} 
                  className="hover:bg-black/[0.02] transition-colors group table-row-animate"
                  style={{ animationDelay: `${index % 20 * 20}ms` }}
              >
                <td className="px-6 py-4 font-mono text-slate-400 text-xs">
                    #{String(index + 1).padStart(2, '0')}
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${row.aboneTipi === 'Commercial' ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-blue-50 border-blue-100 text-[#007AFF]'}`}>
                            {row.aboneTipi === 'Commercial' ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-[#1D1D1F] text-[13px]">{row.tesisatNo}</span>
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 font-mono">{row.muhatapNo}</span>
                                <span className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5">
                                    {row.rawAboneTipi || (row.aboneTipi === 'Commercial' ? 'Ticari' : 'Mesken')}
                                </span>
                            </div>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4">
                  {row.location.lat !== 0 ? (
                      <span className="text-xs font-mono text-slate-500 bg-[#F2F2F7] px-2 py-1 rounded-md border border-black/5">
                          {row.location.lat.toFixed(4)}, {row.location.lng.toFixed(4)}
                      </span>
                  ) : (
                      <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                    <div className="relative w-10 h-10 flex items-center justify-center">
                        <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                            <path 
                                className={`${row.totalScore >= 80 ? 'text-[#FF3B30]' : row.totalScore >= 50 ? 'text-[#FF9500]' : 'text-[#FFCC00]'}`} 
                                strokeDasharray={`${row.totalScore}, 100`} 
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="3" 
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className="text-xs font-bold text-slate-700">{row.totalScore}</span>
                    </div>
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <div className="flex flex-wrap gap-1">
                    {row.reason.split(', ').map((r, i) => (
                        <React.Fragment key={i}>
                            {renderReasonBadge(r, row)}
                        </React.Fragment>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wide
                    ${row.riskLevel.includes('Seviye 1') ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : 
                      row.riskLevel.includes('Seviye 2') ? 'bg-[#FF9500]/10 text-[#FF9500]' : 
                      'bg-[#FFCC00]/20 text-[#9A7D0A]'}`}>
                    {row.riskLevel.split('(')[0].trim()}
                  </span>
                </td>
              </tr>
            ))}
            
            {visibleCount < data.length && (
                <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                        <button 
                            onClick={handleShowMore}
                            className="text-xs font-medium text-slate-500 hover:text-[#1D1D1F] hover:bg-slate-100 px-4 py-2 rounded-full transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            Daha Fazla Göster
                            <ChevronDown className="h-3 w-3" />
                        </button>
                    </td>
                </tr>
            )}
            
            {data.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-3">
                             <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-slate-300" />
                             </div>
                             <p className="font-medium">Kayıt bulunamadı.</p>
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