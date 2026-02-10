import React, { useState, useEffect } from 'react';
import { RiskScore } from '../types';
import { MapPin, AlertTriangle, Building2, User, ChevronDown } from 'lucide-react';

interface GeoRiskTableProps {
  data: RiskScore[];
}

const GeoRiskTable: React.FC<GeoRiskTableProps> = ({ data }) => {
  const [visibleCount, setVisibleCount] = useState(50);

  useEffect(() => {
    setVisibleCount(50);
  }, [data]);

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 50);
  };

  const visibleData = data.slice(0, visibleCount);

  return (
    <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden flex flex-col h-full relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
      
      <div className="p-5 border-b border-red-100 bg-white sticky top-0 z-10 flex justify-between items-center backdrop-blur-xl">
        <h3 className="font-bold text-slate-800 flex items-center gap-2.5">
          <div className="bg-red-50 p-1.5 rounded-md border border-red-200 animate-pulse">
             <MapPin className="h-5 w-5 text-red-500" />
          </div>
          Bölgesel Risk & Düşük Tüketim
        </h3>
        <div className="flex flex-col text-right">
             <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Filtre: Riskli Noktaya Yakın (&lt;10m) & 120 Kuralı
             </span>
             <span className="text-[9px] text-slate-500">
                Çevresinde kaçak tespit edilen 120 sm³ altı aboneler
             </span>
        </div>
      </div>
      
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-sm text-slate-500">
          <thead className="bg-red-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-0">
            <tr>
              <th className="px-6 py-4">Tesisat No</th>
              <th className="px-6 py-4">Abone Tipi</th>
              <th className="px-6 py-4">Koordinat (Enlem, Boylam)</th>
              <th className="px-6 py-4">Kış Tüketimi (Oca/Şub)</th>
              <th className="px-6 py-4">Risk Durumu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-red-50">
            {visibleData.map((row, index) => {
              const janVal = row.rule120Data ? row.rule120Data.jan : 0;
              const febVal = row.rule120Data ? row.rule120Data.feb : 0;
              const janClass = janVal < 10 ? 'text-slate-400' : 'text-blue-600';
              const febClass = febVal < 10 ? 'text-slate-400' : 'text-blue-600';

              return (
              <tr key={row.tesisatNo} 
                  className="hover:bg-red-50/50 transition-colors duration-200 group table-row-animate"
                  style={{ animationDelay: `${index % 20 * 30}ms` }}
              >
                <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 group-hover:text-black font-mono transition-colors">{row.tesisatNo}</span>
                        <span className="text-xs text-slate-400 font-mono mt-0.5">{row.muhatapNo}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                         {row.aboneTipi === 'Commercial' ? (
                            <div className="p-1 bg-orange-50 rounded text-orange-600"><Building2 className="h-3 w-3" /></div>
                        ) : (
                            <div className="p-1 bg-blue-50 rounded text-blue-600"><User className="h-3 w-3" /></div>
                        )}
                        <span className="text-xs font-medium text-slate-600">
                            {row.rawAboneTipi || (row.aboneTipi === 'Commercial' ? 'Ticari' : 'Mesken')}
                        </span>
                    </div>
                </td>
                <td className="px-6 py-4">
                     <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-red-500" />
                        <span className="text-xs text-slate-600 font-mono font-bold">
                            {row.location.lat.toFixed(5)}, {row.location.lng.toFixed(5)}
                        </span>
                     </div>
                </td>
                <td className="px-6 py-4">
                     <div className="flex gap-2">
                         <div className="flex flex-col items-center bg-slate-50 px-2 py-1 rounded border border-slate-200">
                             <span className="text-[9px] text-slate-400">OCAK</span>
                             <span className={`font-mono font-bold ${janClass}`}>
                                 {janVal}
                             </span>
                         </div>
                         <div className="flex flex-col items-center bg-slate-50 px-2 py-1 rounded border border-slate-200">
                             <span className="text-[9px] text-slate-400">ŞUBAT</span>
                             <span className={`font-mono font-bold ${febClass}`}>
                                 {febVal}
                             </span>
                         </div>
                     </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase">
                         <AlertTriangle className="h-3 w-3" />
                         SICAK BÖLGE
                      </span>
                      <div className="w-20 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500" style={{ width: `${row.totalScore}%` }}></div>
                      </div>
                  </div>
                </td>
              </tr>
            );
            })}
             {visibleCount < data.length && (
                <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                        <button 
                            onClick={handleShowMore}
                            className="text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            Daha Fazla Göster ({data.length - visibleCount} kaldı)
                            <ChevronDown className="h-3 w-3" />
                        </button>
                    </td>
                </tr>
            )}
            {data.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        <p>Riskli bölgelerde (Yakın Çevre) şüpheli tüketim tespit edilemedi.</p>
                        <p className="text-xs text-slate-500 mt-1">Bu liste sadece kanıtlanmış bir kaçağa 10m'den yakın olup kendisi de 120 Kuralına takılanları gösterir.</p>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GeoRiskTable;