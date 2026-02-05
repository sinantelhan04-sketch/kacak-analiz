import React from 'react';
import { RiskScore } from '../types';
import { MapPin, AlertTriangle, Building2, User } from 'lucide-react';

interface GeoRiskTableProps {
  data: RiskScore[];
}

const GeoRiskTable: React.FC<GeoRiskTableProps> = ({ data }) => {
  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-red-500/30 shadow-xl overflow-hidden flex flex-col h-full relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
      
      <div className="p-5 border-b border-slate-700/50 bg-slate-900/50 sticky top-0 z-10 flex justify-between items-center backdrop-blur-xl">
        <h3 className="font-bold text-red-100 flex items-center gap-2.5">
          <div className="bg-red-500/20 p-1.5 rounded-md border border-red-500/30 animate-pulse">
             <MapPin className="h-5 w-5 text-red-500" />
          </div>
          Bölgesel Risk & Düşük Tüketim
        </h3>
        <div className="flex flex-col text-right">
             <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Filtre: Riskli Sokak + 120 Kuralı
             </span>
             <span className="text-[9px] text-slate-500">
                Kaçak yoğunluğunun yüksek olduğu sokaklardaki düşük tüketimliler
             </span>
        </div>
      </div>
      
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-0 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-4">Tesisat No</th>
              <th className="px-6 py-4">Abone Tipi</th>
              <th className="px-6 py-4">Adres (Riskli Bölge)</th>
              <th className="px-6 py-4">Kış Tüketimi (Oca/Şub)</th>
              <th className="px-6 py-4">Risk Durumu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {data.map((row, index) => (
              <tr key={row.tesisatNo} 
                  className="hover:bg-red-950/10 transition-colors duration-200 group table-row-animate"
                  style={{ animationDelay: `${index * 30}ms` }}
              >
                <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-red-200 group-hover:text-red-400 font-mono transition-colors">{row.tesisatNo}</span>
                        <span className="text-xs text-slate-500 font-mono mt-0.5">{row.muhatapNo}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                         {row.aboneTipi === 'Commercial' ? (
                            <div className="p-1 bg-orange-900/20 rounded text-orange-400"><Building2 className="h-3 w-3" /></div>
                        ) : (
                            <div className="p-1 bg-blue-900/20 rounded text-blue-400"><User className="h-3 w-3" /></div>
                        )}
                        <span className="text-xs font-medium">{row.aboneTipi === 'Commercial' ? 'Ticari' : 'Mesken'}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                     <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-red-500" />
                        <span className="text-xs text-slate-300 font-bold truncate max-w-[200px]">{row.address}</span>
                     </div>
                </td>
                <td className="px-6 py-4">
                     <div className="flex gap-2">
                         <div className="flex flex-col items-center bg-slate-800/50 px-2 py-1 rounded border border-slate-700">
                             <span className="text-[9px] text-slate-500">OCAK</span>
                             <span className={`font-mono font-bold ${row.rule120Data?.jan! < 10 ? 'text-slate-500' : 'text-blue-300'}`}>
                                 {row.rule120Data?.jan}
                             </span>
                         </div>
                         <div className="flex flex-col items-center bg-slate-800/50 px-2 py-1 rounded border border-slate-700">
                             <span className="text-[9px] text-slate-500">ŞUBAT</span>
                             <span className={`font-mono font-bold ${row.rule120Data?.feb! < 10 ? 'text-slate-500' : 'text-blue-300'}`}>
                                 {row.rule120Data?.feb}
                             </span>
                         </div>
                     </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 uppercase">
                         <AlertTriangle className="h-3 w-3" />
                         SICAK BÖLGE
                      </span>
                      <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500" style={{ width: `${row.totalScore}%` }}></div>
                      </div>
                  </div>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        <p>Riskli bölgelerde 120 sm³ altı tüketim tespit edilemedi.</p>
                        <p className="text-xs text-slate-600 mt-1">Bu liste sadece referans kaçakların yoğun olduğu sokakları içerir.</p>
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