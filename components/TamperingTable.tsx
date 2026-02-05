import React from 'react';
import { RiskScore } from '../types';
import { Wrench, ArrowDownRight, ThermometerSnowflake, ThermometerSun } from 'lucide-react';

interface TamperingTableProps {
  data: RiskScore[];
}

const TamperingTable: React.FC<TamperingTableProps> = ({ data }) => {
  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-orange-500/30 shadow-xl overflow-hidden flex flex-col h-full relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
      
      <div className="p-5 border-b border-slate-700/50 bg-slate-900/50 sticky top-0 z-10 flex justify-between items-center backdrop-blur-xl">
        <h3 className="font-bold text-orange-100 flex items-center gap-2.5">
          <div className="bg-orange-500/20 p-1.5 rounded-md border border-orange-500/30 animate-pulse">
             <Wrench className="h-5 w-5 text-orange-500" />
          </div>
          Tesisatta Müdahale Şüphesi
        </h3>
        <div className="flex flex-col text-right">
             <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Kriter: Kış ≈ Yaz
             </span>
             <span className="text-[9px] text-slate-500">Mevsimsel fark düşük (Bypass Şüphesi)</span>
        </div>
      </div>
      
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-0 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-4">Tesisat No</th>
              <th className="px-6 py-4">Yaz Ort. (sm³)</th>
              <th className="px-6 py-4">Kış Ort. (sm³)</th>
              <th className="px-6 py-4">Artış Katı</th>
              <th className="px-6 py-4">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {data.map((row, index) => (
              <tr key={row.tesisatNo} 
                  className="hover:bg-orange-950/10 transition-colors duration-200 group table-row-animate"
                  style={{ animationDelay: `${index * 30}ms` }}
              >
                <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-orange-200 group-hover:text-orange-400 font-mono transition-colors">{row.tesisatNo}</span>
                        <span className="text-xs text-slate-500 font-mono mt-0.5">{row.muhatapNo}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-300">
                        <ThermometerSun className="h-3 w-3 text-yellow-500" />
                        <span className="font-mono">{row.seasonalStats.summerAvg}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                     <div className="flex items-center gap-2 text-slate-300">
                        <ThermometerSnowflake className="h-3 w-3 text-blue-400" />
                        <span className="font-mono">{row.seasonalStats.winterAvg}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-red-400 text-lg">{row.heatingSensitivity.toFixed(1)}x</span>
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  </div>
                  <span className="text-[9px] text-slate-500">Beklenen: &gt;5.0x</span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border bg-orange-950/40 text-orange-400 border-orange-500/30">
                    BYPASS ŞÜPHESİ
                  </span>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        <p>Tesisat müdahale kriterine uyan kayıt bulunamadı.</p>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TamperingTable;