import React, { useState, useEffect } from 'react';
import { RiskScore } from '../types';
import { ThermometerSnowflake, User, Building2, AlertCircle, ChevronDown, CheckCircle } from 'lucide-react';

interface Rule120TableProps {
  data: RiskScore[];
}

const Rule120Table: React.FC<Rule120TableProps> = ({ data }) => {
  const [visibleCount, setVisibleCount] = useState(50);

  useEffect(() => {
    setVisibleCount(50);
  }, [data]);

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 50);
  };

  const visibleData = data.slice(0, visibleCount);

  return (
    <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden flex flex-col h-full relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
      
      <div className="p-5 border-b border-blue-100 bg-white sticky top-0 z-10 flex justify-between items-center backdrop-blur-xl">
        <h3 className="font-bold text-slate-800 flex items-center gap-2.5">
          <div className="bg-blue-50 p-1.5 rounded-md border border-blue-200 animate-pulse">
             <ThermometerSnowflake className="h-5 w-5 text-blue-500" />
          </div>
          120 Kuralı Analizi
        </h3>
        <div className="flex flex-col text-right">
             <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Kriter: 25 &lt; Ocak, Şubat, Mart &lt; 110
             </span>
             <span className="text-[9px] text-slate-500">
                Üç ay da (Ocak, Şubat, Mart) belirtilen aralıkta olmalı.
             </span>
        </div>
      </div>
      
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-sm text-slate-500">
          <thead className="bg-blue-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-0">
            <tr>
              <th className="px-6 py-4">Tesisat No</th>
              <th className="px-6 py-4">Abone Tipi</th>
              <th className="px-6 py-4">Ocak (sm³)</th>
              <th className="px-6 py-4">Şubat (sm³)</th>
              <th className="px-6 py-4">Mart (sm³)</th>
              <th className="px-6 py-4">Durum</th>
              <th className="px-6 py-4">Risk Skoru</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50">
            {visibleData.map((row, index) => {
               const jan = row.rule120Data?.jan || 0;
               const feb = row.rule120Data?.feb || 0;
               const mar = row.rule120Data?.mar || 0;
               const total = jan + feb + mar;
               
               return (
                <tr key={row.tesisatNo} 
                    className="hover:bg-blue-50/50 transition-colors duration-200 group table-row-animate"
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
                                <div className="p-1.5 bg-orange-50 rounded text-orange-600 border border-orange-200">
                                    <Building2 className="h-3 w-3" />
                                </div>
                            ) : (
                                <div className="p-1.5 bg-blue-50 rounded text-blue-600 border border-blue-200">
                                    <User className="h-3 w-3" />
                                </div>
                            )}
                            <span className="text-xs font-medium text-slate-600">
                                {row.rawAboneTipi || (row.aboneTipi === 'Commercial' ? 'Ticari' : 'Mesken')}
                            </span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`font-mono px-2 py-1 rounded text-xs font-bold ${
                            jan < 50 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                            {jan}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`font-mono px-2 py-1 rounded text-xs font-bold ${
                            feb < 50 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                            {feb}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`font-mono px-2 py-1 rounded text-xs font-bold ${
                            mar < 50 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                            {mar}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        {total < 150 ? (
                            <div className="flex flex-col">
                                <span className="text-red-600 text-xs font-bold flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Çok Kritik
                                </span>
                                <span className="text-[9px] text-slate-400">3 ay toplamı çok düşük.</span>
                            </div>
                        ) : (
                             <div className="flex flex-col">
                                <span className="text-orange-500 text-xs font-bold flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    İncelenmeli
                                </span>
                                <span className="text-[9px] text-slate-400">Ortalamanın çok altında.</span>
                            </div>
                        )}
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                             <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                 <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, row.totalScore)}%` }}></div>
                             </div>
                             <span className="font-mono text-xs text-blue-600">{row.totalScore}</span>
                        </div>
                    </td>
                </tr>
               );
            })}
            {visibleCount < data.length && (
                <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
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
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        <p>120 Kuralı kriterine uyan kayıt bulunamadı.</p>
                        <p className="text-xs text-slate-500 mt-1">Ocak, Şubat ve Mart aylarının üçü de 25 ile 110 sm³ arasında olanlar listelenir.</p>
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