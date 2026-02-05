import React from 'react';
import { RiskScore } from '../types';
import { ThermometerSnowflake, User, Building2, AlertCircle } from 'lucide-react';

interface Rule120TableProps {
  data: RiskScore[];
}

const Rule120Table: React.FC<Rule120TableProps> = ({ data }) => {
  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-blue-500/30 shadow-xl overflow-hidden flex flex-col h-full relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
      
      <div className="p-5 border-b border-slate-700/50 bg-slate-900/50 sticky top-0 z-10 flex justify-between items-center backdrop-blur-xl">
        <h3 className="font-bold text-blue-100 flex items-center gap-2.5">
          <div className="bg-blue-500/20 p-1.5 rounded-md border border-blue-500/30 animate-pulse">
             <ThermometerSnowflake className="h-5 w-5 text-blue-400" />
          </div>
          120 Kuralı Analizi
        </h3>
        <div className="flex flex-col text-right">
             <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Kriter: Ocak, Şubat &lt; 120 sm³
             </span>
             <span className="text-[9px] text-slate-500">
                Her iki ay 10 sm³ altındaysa hariç (Boş)
             </span>
        </div>
      </div>
      
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-0 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-4">Tesisat No</th>
              <th className="px-6 py-4">Abone Tipi</th>
              <th className="px-6 py-4">Ocak (sm³)</th>
              <th className="px-6 py-4">Şubat (sm³)</th>
              <th className="px-6 py-4">Risk Seviyesi</th>
              <th className="px-6 py-4">Adres</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {data.map((row, index) => (
              <tr key={row.tesisatNo} 
                  className="hover:bg-blue-950/10 transition-colors duration-200 group table-row-animate"
                  style={{ animationDelay: `${index * 30}ms` }}
              >
                <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-blue-200 group-hover:text-blue-400 font-mono transition-colors">{row.tesisatNo}</span>
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
                     <span className={`font-mono px-2 py-1 rounded text-xs font-bold ${
                         (row.rule120Data?.jan || 0) < 10 ? 'bg-slate-700 text-slate-400' : 'bg-blue-900/40 text-blue-300'
                     }`}>
                         {row.rule120Data?.jan}
                     </span>
                </td>
                <td className="px-6 py-4">
                     <span className={`font-mono px-2 py-1 rounded text-xs font-bold ${
                         (row.rule120Data?.feb || 0) < 10 ? 'bg-slate-700 text-slate-400' : 'bg-blue-900/40 text-blue-300'
                     }`}>
                         {row.rule120Data?.feb}
                     </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border
                    ${row.totalScore >= 50 ? 'bg-red-950/30 text-red-400 border-red-500/30' : 'bg-blue-950/30 text-blue-400 border-blue-500/30'}`}>
                    <AlertCircle className="h-3 w-3" />
                    {row.totalScore >= 50 ? 'Yüksek' : 'Orta'}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500 truncate max-w-[150px]">
                    {row.address}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        <p>120 Kuralı kriterine uyan kayıt bulunamadı.</p>
                        <p className="text-xs text-slate-600 mt-1">Ocak ve Şubat 120 sm³ altında olanlar listelenir (Her ikisi 10 sm³ altındaysa hariç).</p>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Rule120Table;