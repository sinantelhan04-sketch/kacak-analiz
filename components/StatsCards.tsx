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
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between h-[150px]">
        <div className="flex justify-between items-start">
             <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center">
                <Search className="h-5 w-5 text-purple-600" />
             </div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-slate-50 px-2 py-1 rounded">TOPLAM</span>
        </div>
        <div>
            <div className="text-3xl font-bold text-slate-800 tracking-tight">
                {stats.totalScanned.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span className="text-xs font-medium text-slate-500">Taranan Abone</span>
            </div>
        </div>
      </div>

      {/* Widget 2 */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between h-[150px]">
         <div className="flex justify-between items-start">
             <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center relative">
                <ShieldAlert className="h-5 w-5 text-red-600" />
             </div>
             <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide bg-red-50 px-2 py-1 rounded">KRİTİK</span>
        </div>
        <div>
            <div className="text-3xl font-bold text-slate-800 tracking-tight">
                {stats.level1Count}
            </div>
            <div className="flex items-center gap-1 mt-1">
                <span className="text-xs font-medium text-slate-500">Seviye 1 Risk</span>
                <ArrowUpRight className="h-3 w-3 text-red-500" />
            </div>
        </div>
      </div>

      {/* Widget 3 */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between h-[150px]">
         <div className="flex justify-between items-start">
             <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-orange-600" />
             </div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-slate-50 px-2 py-1 rounded">YÜKSEK</span>
        </div>
        <div>
             <div className="text-3xl font-bold text-slate-800 tracking-tight">{stats.level2Count}</div>
             <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '60%' }}></div>
             </div>
             <div className="text-xs text-slate-500 mt-2 font-medium">Seviye 2 Tespit</div>
        </div>
      </div>

      {/* Widget 4 */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between h-[150px]">
         <div className="flex justify-between items-start">
             <div className="w-10 h-10 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center">
                <Eye className="h-5 w-5 text-primary-600" />
             </div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-slate-50 px-2 py-1 rounded">ORTA</span>
        </div>
        <div>
             <div className="text-3xl font-bold text-slate-800 tracking-tight">{stats.level3Count}</div>
             <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: '30%' }}></div>
             </div>
             <div className="text-xs text-slate-500 mt-2 font-medium">Seviye 3 Tespit</div>
        </div>
      </div>

    </div>
  );
};

export default StatsCards;