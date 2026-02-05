import React, { useState } from 'react';
import { RiskScore } from '../types';
import { TrendingDown, GraduationCap, Filter, AlertOctagon, Activity } from 'lucide-react';

interface InconsistentTableProps {
  data: RiskScore[];
}

const InconsistentTable: React.FC<InconsistentTableProps> = ({ data }) => {
  const [hideSemester, setHideSemester] = useState(true);

  // Filter logic: 
  // If hiding semester, we exclude items that are ONLY semester suspects (and not other winter drops).
  // If showing semester, we show everything.
  const filteredData = data.filter(row => {
      const isOnlySemester = row.inconsistentData.isSemesterSuspect && !row.inconsistentData.hasWinterDrop;
      
      if (hideSemester && isOnlySemester) return false;
      return true;
  });

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-pink-500/30 shadow-xl overflow-hidden flex flex-col h-full relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-pink-500"></div>
      
      <div className="p-5 border-b border-slate-700/50 bg-slate-900/50 sticky top-0 z-10 flex justify-between items-center backdrop-blur-xl">
        <h3 className="font-bold text-pink-100 flex items-center gap-2.5">
          <div className="bg-pink-500/20 p-1.5 rounded-md border border-pink-500/30">
             <TrendingDown className="h-5 w-5 text-pink-500" />
          </div>
          Tutarsız Kış Tüketimleri
        </h3>
        
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-lg border border-slate-700">
                <button 
                    onClick={() => setHideSemester(!hideSemester)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all duration-300 ${hideSemester ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                >
                    <GraduationCap className="h-3.5 w-3.5" />
                    {hideSemester ? 'Sömestr Tatilini Gizle' : 'Tümünü Göster'}
                </button>
            </div>
        </div>
      </div>
      
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-0 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-4">Tesisat No</th>
              <th className="px-6 py-4">Abone Tipi</th>
              <th className="px-6 py-4">Tespit Edilen Tutarsızlık</th>
              <th className="px-6 py-4">Sinyal Türü</th>
              <th className="px-6 py-4">Adres</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filteredData.map((row, index) => {
               const isSemester = row.inconsistentData.isSemesterSuspect;
               const hasDrop = row.inconsistentData.hasWinterDrop;

               return (
                <tr key={row.tesisatNo} 
                    className="hover:bg-pink-950/10 transition-colors duration-200 group table-row-animate"
                    style={{ animationDelay: `${index * 30}ms` }}
                >
                    <td className="px-6 py-4">
                        <div className="flex flex-col">
                            <span className="font-bold text-pink-200 group-hover:text-pink-400 font-mono transition-colors">{row.tesisatNo}</span>
                            <span className="text-xs text-slate-500 font-mono mt-0.5">{row.muhatapNo}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-xs font-medium text-slate-300">{row.aboneTipi === 'Commercial' ? 'Ticari' : 'Mesken'}</span>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                            {row.inconsistentData.dropDetails.map((detail, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
                                    {detail}
                                </div>
                            ))}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        {isSemester && !hasDrop ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border bg-indigo-950/40 text-indigo-300 border-indigo-500/30">
                                <GraduationCap className="h-3 w-3" />
                                Olası Sömestr
                            </span>
                        ) : row.inconsistentData.volatilityScore > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border bg-yellow-950/40 text-yellow-300 border-yellow-500/30">
                                <Activity className="h-3 w-3" />
                                Dalgalı (ZigZag)
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border bg-red-950/40 text-red-400 border-red-500/30">
                                <AlertOctagon className="h-3 w-3" />
                                Kritik Düşüş
                            </span>
                        )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 truncate max-w-[150px]">
                        {row.address}
                    </td>
                </tr>
               );
            })}
            {filteredData.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                             <Filter className="h-8 w-8 text-slate-700" />
                             <p>Kriterlere uyan tutarsız tüketim bulunamadı.</p>
                             {hideSemester && <p className="text-xs text-indigo-400">Sömestr filtresi aktif. Devre dışı bırakmayı deneyin.</p>}
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

export default InconsistentTable;