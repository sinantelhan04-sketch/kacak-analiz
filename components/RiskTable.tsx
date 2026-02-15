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
    let style = "bg-slate-100 text-slate-600 border-slate-200";
    let icon = null;

    if (reason.includes('MUHATAP') || reason.includes('Kara Liste')) {
      style = "bg-red-50 text-red-600 border-red-100";
      icon = <Ban className="h-3 w-3 mr-1" />;
    } 
    else if (reason.includes('Geçmiş Müdahale')) {
      style = "bg-red-50 text-red-500 border-red-100";
      icon = <Wrench className="h-3 w-3 mr-1" />;
    }
    else if (reason.includes('120 Kuralı')) {
      style = "bg-blue-50 text-blue-600 border-blue-100";
      icon = <ThermometerSnowflake className="h-3 w-3 mr-1" />;
    }
    else if (reason.includes('Mevsimsel') || reason.includes('Bypass')) {
      style = "bg-orange-50 text-orange-600 border-orange-100";
      icon = <Activity className="h-3 w-3 mr-1" />;
    }
    else if (reason.includes('Konum') || reason.includes('Bölgesel')) {
      style = "bg-purple-50 text-purple-600 border-purple-100";
      icon = <MapPin className="h-3 w-3 mr-1" />;
    }

    return (
        <div className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium mr-1 mb-1 border ${style}`}>
            {icon}
            <span>{reason}</span>
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-20">
        <div>
            <h3 className="font-bold text-slate-800 text-lg">Riskli Abone Listesi</h3>
            <p className="text-xs text-slate-500">Analiz edilen {data.length} kayıt</p>
        </div>
      </div>
      
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-3 border-b border-slate-200">#</th>
              <th className="px-6 py-3 border-b border-slate-200">Abone Bilgisi</th>
              <th className="px-6 py-3 border-b border-slate-200">Konum</th>
              <th className="px-6 py-3 border-b border-slate-200">Risk Puanı</th>
              <th className="px-6 py-3 border-b border-slate-200">Tespit Detayları</th>
              <th className="px-6 py-3 border-b border-slate-200">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleData.map((row, index) => (
              <tr key={row.tesisatNo} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-3 font-mono text-slate-400 text-xs w-16">
                    {index + 1}
                </td>
                <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${row.aboneTipi === 'Commercial' ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                            {row.aboneTipi === 'Commercial' ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-sm font-mono">{row.tesisatNo}</span>
                            <span className="text-xs text-slate-500 font-mono">{row.muhatapNo}</span>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-3">
                  {row.location.lat !== 0 ? (
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {row.location.lat.toFixed(4)}, {row.location.lng.toFixed(4)}
                      </span>
                  ) : (
                      <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
                <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${row.totalScore >= 80 ? 'bg-red-500' : row.totalScore >= 50 ? 'bg-orange-500' : 'bg-yellow-500'}`}></div>
                        <span className="text-sm font-bold text-slate-700">{row.totalScore}</span>
                    </div>
                </td>
                <td className="px-6 py-3 max-w-xs">
                  <div className="flex flex-wrap">
                    {row.reason.split(', ').map((r, i) => (
                        <React.Fragment key={i}>
                            {renderReasonBadge(r, row)}
                        </React.Fragment>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border
                    ${row.riskLevel.includes('Seviye 1') ? 'bg-red-50 text-red-700 border-red-100' : 
                      row.riskLevel.includes('Seviye 2') ? 'bg-orange-50 text-orange-700 border-orange-100' : 
                      'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
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
                            className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            Daha Fazla Göster
                            <ChevronDown className="h-3 w-3" />
                        </button>
                    </td>
                </tr>
            )}
            
            {data.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-slate-300" />
                             </div>
                             <p className="font-medium text-sm">Kayıt bulunamadı.</p>
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