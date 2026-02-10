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

  // Helper to determine badge style
  const renderReasonBadge = (reason: string, row: RiskScore) => {
    let style = "bg-slate-100 text-slate-600";
    let icon = null;

    if (reason.includes('MUHATAP') || reason.includes('Kara Liste')) {
      style = "bg-red-100 text-red-700";
      icon = <Ban className="h-3 w-3 mr-1" />;
    } 
    else if (reason.includes('Geçmiş Müdahale')) {
      style = "bg-red-50 text-red-600";
      icon = <Wrench className="h-3 w-3 mr-1" />;
    }
    else if (reason.includes('120 Kuralı')) {
      style = "bg-blue-50 text-apple-blue";
      icon = <ThermometerSnowflake className="h-3 w-3 mr-1" />;
    }
    else if (reason.includes('Mevsimsel') || reason.includes('Bypass')) {
      style = "bg-orange-50 text-orange-600";
      icon = <Activity className="h-3 w-3 mr-1" />;
    }
    else if (reason.includes('Konum') || reason.includes('Bölgesel')) {
      style = "bg-purple-50 text-purple-600";
      icon = <MapPin className="h-3 w-3 mr-1" />;
    }

    return (
        <div className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium mr-1 mb-1 ${style}`}>
            {icon}
            <span>{reason}</span>
        </div>
    );
  };

  return (
    <div className="bg-white rounded-[24px] shadow-apple flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div>
            <h3 className="font-semibold text-slate-900 text-lg">Riskli Abone Listesi</h3>
            <p className="text-xs text-slate-500 mt-0.5">Analiz edilen {data.length} kayıt listeleniyor</p>
        </div>
        
        <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#FF3B30]"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-[#FF9500]"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-[#FFCC00]"></div>
        </div>
      </div>
      
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-semibold tracking-wide sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-3 font-medium">Rank</th>
              <th className="px-6 py-3 font-medium">Abone Bilgisi</th>
              <th className="px-6 py-3 font-medium">Konum</th>
              <th className="px-6 py-3 font-medium">Risk Puanı</th>
              <th className="px-6 py-3 font-medium">Tespit Detayları</th>
              <th className="px-6 py-3 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleData.map((row, index) => (
              <tr key={row.tesisatNo} 
                  className="hover:bg-slate-50/80 transition-colors group table-row-animate"
                  style={{ animationDelay: `${index % 20 * 20}ms` }}
              >
                <td className="px-6 py-4 font-mono text-slate-400 text-xs">
                    #{String(index + 1).padStart(2, '0')}
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${row.aboneTipi === 'Commercial' ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-apple-blue'}`}>
                            {row.aboneTipi === 'Commercial' ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-slate-900">{row.tesisatNo}</span>
                            <div className="flex flex-col mt-0.5">
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
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
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
                        <span className="text-xs font-semibold text-slate-700">{row.totalScore}</span>
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
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold
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
                            className="text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-4 py-2 rounded-full transition-colors flex items-center justify-center gap-2 mx-auto"
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