
import React, { useState, useEffect } from 'react';
import { BuildingRisk } from '../types';
import { Building2, ArrowDown, MapPin, ChevronDown, Download, Users } from 'lucide-react';
import * as XLSX from 'xlsx';

interface BuildingAnalysisTableProps {
  data: BuildingRisk[];
}

const BuildingAnalysisTable: React.FC<BuildingAnalysisTableProps> = ({ data }) => {
  const [visibleCount, setVisibleCount] = useState(50);

  useEffect(() => {
    setVisibleCount(50);
  }, [data]);

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 50);
  };

  const visibleData = data.slice(0, visibleCount);

  const handleExport = () => {
    const exportData = data.map(row => ({
        "Tesisat No": row.tesisatNo,
        "Bağlantı Nesnesi": row.baglantiNesnesi,
        "Abone Tipi": row.aboneTipi,
        "Abone Kış Ort. (m3)": row.personalWinterAvg,
        "Bina Kış Medyan (m3)": row.buildingWinterMedian,
        "Sapma (%)": row.deviationPercentage.toFixed(2),
        "Komşu Sayısı": row.neighborCount,
        "Ocak": row.monthlyData.jan,
        "Şubat": row.monthlyData.feb,
        "Mart": row.monthlyData.mar,
        "Enlem": row.location.lat,
        "Boylam": row.location.lng,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bina_Analizi");
    XLSX.writeFile(wb, "Bina_Tuketim_Raporu.xlsx");
  };

  return (
    <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm overflow-hidden flex flex-col h-full relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
      
      <div className="p-5 border-b border-indigo-100 bg-white sticky top-0 z-10 flex justify-between items-center backdrop-blur-xl">
        <div className="flex items-center gap-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2.5">
            <div className="bg-indigo-50 p-1.5 rounded-md border border-indigo-200 animate-pulse">
                <Building2 className="h-5 w-5 text-indigo-500" />
            </div>
            Bina Tüketim Analizi (Komşu Kıyaslaması)
            </h3>
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-500 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95"
                title="Listeyi Excel olarak indir"
            >
                <Download className="h-3.5 w-3.5" />
                Excel İndir
            </button>
        </div>
        
        <div className="flex flex-col text-right">
             <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Filtre: Bina Ortalamasının %60 Altında Kalanlar
             </span>
             <span className="text-[9px] text-slate-500">
                Aynı Bağlantı Nesnesi, en az 8 temiz (Oca-Mar {'>'} 25) komşu şartı.
             </span>
        </div>
      </div>
      
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-sm text-slate-500">
          <thead className="bg-indigo-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-0">
            <tr>
              <th className="px-6 py-4">Tesisat No</th>
              <th className="px-6 py-4">Kış Ort. (Abone vs Bina)</th>
              <th className="px-6 py-4">Sapma (%)</th>
              <th className="px-6 py-4">Aylık Detay (Oca/Şub/Mar)</th>
              <th className="px-6 py-4">Bina & Bağlantı</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-50">
            {visibleData.map((row, index) => {
              return (
              <tr key={row.tesisatNo} 
                  className="hover:bg-indigo-50/50 transition-colors duration-200 group table-row-animate"
                  style={{ animationDelay: `${index % 20 * 30}ms` }}
              >
                <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 group-hover:text-black font-mono transition-colors">{row.tesisatNo}</span>
                        <span className="text-xs text-slate-400 font-mono mt-0.5">{row.aboneTipi}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between min-w-[120px]">
                            <span className="text-xs text-slate-400">Abone:</span>
                            <span className="font-mono font-bold text-red-500">{row.personalWinterAvg} m³</span>
                        </div>
                        <div className="flex items-center justify-between min-w-[120px] pb-1 border-b border-dashed border-indigo-200">
                             <span className="text-xs text-slate-400">Bina Medyan:</span>
                             <span className="font-mono font-bold text-indigo-600">{row.buildingWinterMedian} m³</span>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                         <div className="p-1 bg-red-100 rounded text-red-600">
                             <ArrowDown className="h-4 w-4" />
                         </div>
                         <span className="font-bold text-lg text-slate-700">
                             {Math.abs(row.deviationPercentage).toFixed(1)}%
                         </span>
                    </div>
                    <span className="text-[9px] text-slate-400 block mt-1">Binadan daha az tüketiyor</span>
                </td>
                <td className="px-6 py-4">
                     <div className="flex gap-1.5">
                         {[row.monthlyData.jan, row.monthlyData.feb, row.monthlyData.mar].map((val, i) => (
                             <div key={i} className="flex flex-col items-center bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                                 <span className="text-[8px] text-slate-400 uppercase tracking-tight">
                                     {i===0?'OCA':i===1?'ŞUB':'MAR'}
                                 </span>
                                 <span className={`font-mono font-bold text-xs ${val<25?'text-red-500':'text-slate-600'}`}>
                                     {val}
                                 </span>
                             </div>
                         ))}
                     </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 text-indigo-400" />
                          <span className="font-mono text-xs text-slate-700 font-bold">{row.baglantiNesnesi}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 opacity-60">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span className="font-mono text-[10px] text-slate-500">{row.location.lat.toFixed(4)}, {row.location.lng.toFixed(4)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                          <Users className="h-3 w-3 text-indigo-400" />
                          <span className="text-xs text-slate-500">{row.neighborCount} temiz komşu</span>
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
                        <div className="flex flex-col items-center justify-center gap-2">
                            <Building2 className="h-8 w-8 text-indigo-200" />
                            <p>Bina geneline göre anormal düşük tüketen abone bulunamadı.</p>
                            <p className="text-xs text-slate-400 max-w-md">Not: Analiz sadece aynı "Bağlantı Nesnesi" altında en az 8 adet düzenli tüketen (Oca-Şub-Mar {'>'} 25) komşusu olan binalar için yapılır.</p>
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

export default BuildingAnalysisTable;
