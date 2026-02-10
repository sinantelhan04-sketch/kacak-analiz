import React from 'react';
import { EngineStats } from '../types';
import { ShieldAlert, Activity, Search, Eye, ArrowUpRight } from 'lucide-react';

interface StatsCardsProps {
  stats: EngineStats;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      
      {/* Widget 1 */}
      <div className="bg-white rounded-[24px] p-6 shadow-apple hover:shadow-apple-hover transition-shadow duration-300 flex flex-col justify-between h-[160px]">
        <div className="flex justify-between items-start">
             <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Search className="h-5 w-5 text-purple-600" />
             </div>
             <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">TOPLAM</span>
        </div>
        <div>
            <div className="text-3xl font-semibold text-slate-900 tracking-tight">
                {stats.totalScanned.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-slate-500">Taranan Abone</span>
                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium ml-2">Tamamlandı</span>
            </div>
        </div>
      </div>

      {/* Widget 2 */}
      <div className="bg-white rounded-[24px] p-6 shadow-apple hover:shadow-apple-hover transition-shadow duration-300 flex flex-col justify-between h-[160px]">
         <div className="flex justify-between items-start">
             <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center relative">
                <ShieldAlert className="h-5 w-5 text-red-600" />
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
             </div>
             <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wide">KRİTİK</span>
        </div>
        <div>
            <div className="text-3xl font-semibold text-slate-900 tracking-tight">
                {stats.level1Count}
            </div>
            <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-slate-500">Seviye 1 Risk</span>
                <ArrowUpRight className="h-3 w-3 text-red-500 ml-1" />
            </div>
        </div>
      </div>

      {/* Widget 3 */}
      <div className="bg-white rounded-[24px] p-6 shadow-apple hover:shadow-apple-hover transition-shadow duration-300 flex flex-col justify-between h-[160px]">
         <div className="flex justify-between items-start">
             <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-orange-600" />
             </div>
             <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">YÜKSEK</span>
        </div>
        <div>
             <div className="text-3xl font-semibold text-slate-900 tracking-tight">{stats.level2Count}</div>
             <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '60%' }}></div>
             </div>
             <div className="text-xs text-slate-500 mt-1">Seviye 2 Tespit</div>
        </div>
      </div>

      {/* Widget 4 */}
      <div className="bg-white rounded-[24px] p-6 shadow-apple hover:shadow-apple-hover transition-shadow duration-300 flex flex-col justify-between h-[160px]">
         <div className="flex justify-between items-start">
             <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Eye className="h-5 w-5 text-apple-blue" />
             </div>
             <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">ORTA</span>
        </div>
        <div>
             <div className="text-3xl font-semibold text-slate-900 tracking-tight">{stats.level3Count}</div>
             <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                <div className="bg-apple-blue h-1.5 rounded-full" style={{ width: '30%' }}></div>
             </div>
             <div className="text-xs text-slate-500 mt-1">Seviye 3 Tespit</div>
        </div>
      </div>

    </div>
  );
};

export default StatsCards;