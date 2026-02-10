import React, { useState, useEffect } from 'react';
import { RiskScore } from '../types';
import { Wrench, ArrowDownRight, ThermometerSnowflake, ThermometerSun, ChevronDown } from 'lucide-react';

interface TamperingTableProps {
  data: RiskScore[];
}

const TamperingTable: React.FC<TamperingTableProps> = ({ data }) => {
  const [visibleCount, setVisibleCount] = useState(50);

  useEffect(() => {
    setVisibleCount(50);
  }, [data]);

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 50);
  };

  // SORTING LOGIC: Sort by heatingSensitivity ASCENDING (Lowest ratio is higher risk)
  const sortedData = [...data].sort((a, b) => a.heatingSensitivity - b.heatingSensitivity);
  const visibleData = sortedData.slice(0, visibleCount);

  return (
    <div className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden flex flex-col h-full relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
      
      <div className="p-5 border-b border-orange-100 bg-white sticky top-0 z-10 flex justify-between items-center backdrop-blur-xl">
        <h3 className="font-bold text-slate-800 flex items-center gap-2.5">
          <div className="bg-orange-50 p-1.5 rounded-md border border-orange-200 animate-pulse">
             <Wrench className="h-5 w-5 text-orange-500" />
          </div>
          Tesisatta Müdahale Şüphesi
        </h3>
        <div className="flex flex-col text-right">
             <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Sıralama: Artış Katsayısı (En Azdan &rarr; En Çoğa)
             </span>
             <span className="text-[9px] text-slate-500">Katsayı ne kadar düşükse bypass şüphesi o kadar yüksektir.</span>
        </div>
      </div>
      
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-sm text-slate-500">
          <thead className="bg-orange-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-0">
            <tr>
              <th className="px-6 py-4">Tesisat No</th>
              <th className="px-6 py-4">Yaz Ort. (sm³)</th>
              <th className="px-6 py-4">Kış Ort. (sm³)</th>
              <th className="px-6 py-4">Artış Katı</th>
              <th className="px-6 py-4">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-100/50">
            {visibleData.map((row, index) => (
              <tr key={row.tesisatNo} 
                  className="hover:bg-orange-50/50 transition-colors duration-200 group table-row-animate"
                  style={{ animationDelay: `${index % 20 * 30}ms` }}
              >
                <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 group-hover:text-black font-mono transition-colors">{row.tesisatNo}</span>
                        <span className="text-xs text-slate-400 font-mono mt-0.5">{row.muhatapNo}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                        <ThermometerSun className="h-3 w-3 text-orange-400" />
                        <span className="font-mono">{row.seasonalStats.summerAvg}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                     <div className="flex items-center gap-2 text-slate-600">
                        <ThermometerSnowflake className="h-3 w-3 text-blue-400" />
                        <span className="font-mono">{row.seasonalStats.winterAvg}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-red-500 text-lg">{row.heatingSensitivity.toFixed(1)}x</span>
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  </div>
                  <span className="text-[9px] text-slate-400">Beklenen: &gt;5.0x</span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border bg-orange-50 text-orange-600 border-orange-200">
                    BYPASS ŞÜPHESİ
                  </span>
                </td>
              </tr>
            ))}
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