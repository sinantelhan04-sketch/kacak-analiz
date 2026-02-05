import React from 'react';
import { RiskScore } from '../types';
import { AlertTriangle, MapPin, User, Building2 } from 'lucide-react';

interface RiskTableProps {
  data: RiskScore[];
}

const RiskTable: React.FC<RiskTableProps> = ({ data }) => {
  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-slate-700/50 bg-slate-900/50 sticky top-0 z-10 flex justify-between items-center backdrop-blur-xl">
        <h3 className="font-bold text-white flex items-center gap-2.5">
          <div className="bg-red-500/10 p-1.5 rounded-md">
             <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          İlk 50 İnceleme Hedefi
        </h3>
        <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-400 px-3 py-1.5 rounded-full border border-slate-700">
            Risk Puanı Sıralı
        </span>
      </div>
      
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-0 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-4">Sıra</th>
              <th className="px-6 py-4">Tesisat / Muhatap</th>
              <th className="px-6 py-4">Abone Tipi</th>
              <th className="px-6 py-4">Risk Puanı</th>
              <th className="px-6 py-4">Tespit Nedenleri</th>
              <th className="px-6 py-4">Seviye</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {data.map((row, index) => (
              <tr key={row.tesisatNo} 
                  className="hover:bg-slate-800/80 transition-colors duration-200 group table-row-animate"
                  style={{ animationDelay: `${index * 30}ms` }}
              >
                <td className="px-6 py-4 font-mono text-slate-500 group-hover:text-slate-300 transition-colors">
                    #{String(index + 1).padStart(2, '0')}
                </td>
                <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-200 group-hover:text-blue-300 transition-colors">{row.tesisatNo}</span>
                        <span className="text-xs text-slate-500 font-mono mt-0.5">{row.muhatapNo}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        {row.aboneTipi === 'Commercial' ? (
                            <div className="p-1.5 bg-orange-900/20 rounded text-orange-400 border border-orange-900/30">
                                <Building2 className="h-3 w-3" />
                            </div>
                        ) : (
                            <div className="p-1.5 bg-blue-900/20 rounded text-blue-400 border border-blue-900/30">
                                <User className="h-3 w-3" />
                            </div>
                        )}
                        <span className="text-xs font-medium">{row.aboneTipi === 'Commercial' ? 'Ticari' : 'Mesken'}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                      <div 
                        className={`h-full rounded-full shadow-sm transition-all duration-1000 ease-out ${
                            row.totalScore >= 80 ? 'bg-gradient-to-r from-red-600 to-red-400' : 
                            row.totalScore >= 50 ? 'bg-gradient-to-r from-orange-600 to-orange-400' : 
                            'bg-gradient-to-r from-yellow-600 to-yellow-400'}`} 
                        style={{ width: `${row.totalScore}%` }}
                      ></div>
                    </div>
                    <span className={`font-bold ${
                        row.totalScore >= 80 ? 'text-red-400' : 
                        row.totalScore >= 50 ? 'text-orange-400' : 
                        'text-yellow-400'
                    }`}>{row.totalScore}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs">
                  <div className="flex flex-wrap gap-1">
                  {row.reason.split(', ').map((r, i) => (
                     <span key={i} className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-medium transition-transform hover:scale-105
                        ${r.includes('MUHATAP') ? 'bg-red-500/10 text-red-300 border-red-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}
                     `}>
                       {r}
                     </span>
                  ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border
                    ${row.riskLevel.includes('Seviye 1') ? 'bg-red-950/30 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 
                      row.riskLevel.includes('Seviye 2') ? 'bg-orange-950/30 text-orange-400 border-orange-500/30' : 
                      'bg-yellow-950/30 text-yellow-400 border-yellow-500/30'}`}>
                    {row.riskLevel.split('(')[0].trim()}
                  </span>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                             <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-slate-600" />
                             </div>
                             <p>Analiz sonucu bulunamadı.</p>
                             <p className="text-xs text-slate-600">Lütfen önce verileri yükleyip analizi başlatın.</p>
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