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
      <div className="glass-card rounded-[32px] p-6 hover:shadow-apple-hover hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[160px] group">
        <div className="flex justify-between items-start">
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <Search className="h-6 w-6 text-purple-600" />
             </div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-white/50 px-2 py-1 rounded-full backdrop-blur-sm">TOPLAM</span>
        </div>
        <div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">
                {stats.totalScanned.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-medium text-slate-500">Taranan Abone</span>
            </div>
        </div>
      </div>

      {/* Widget 2 */}
      <div className="glass-card rounded-[32px] p-6 hover:shadow-apple-hover hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[160px] group">
         <div className="flex justify-between items-start">
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow relative">
                <ShieldAlert className="h-6 w-6 text-red-600" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
             </div>
             <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide bg-red-50 px-2 py-1 rounded-full">KRİTİK</span>
        </div>
        <div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">
                {stats.level1Count}
            </div>
            <div className="flex items-center gap-1 mt-2">
                <span className="text-xs font-medium text-slate-500">Seviye 1 Risk</span>
                <div className="bg-red-50 rounded-full px-1.5 py-0.5 flex items-center">
                    <ArrowUpRight className="h-3 w-3 text-red-500" />
                </div>
            </div>
        </div>
      </div>

      {/* Widget 3 */}
      <div className="glass-card rounded-[32px] p-6 hover:shadow-apple-hover hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[160px] group">
         <div className="flex justify-between items-start">
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <Activity className="h-6 w-6 text-orange-600" />
             </div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-white/50 px-2 py-1 rounded-full backdrop-blur-sm">YÜKSEK</span>
        </div>
        <div>
             <div className="text-3xl font-bold text-slate-900 tracking-tight">{stats.level2Count}</div>
             <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-400 to-orange-500 h-1.5 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" style={{ width: '60%' }}></div>
             </div>
             <div className="text-xs text-slate-500 mt-2 font-medium">Seviye 2 Tespit</div>
        </div>
      </div>

      {/* Widget 4 */}
      <div className="glass-card rounded-[32px] p-6 hover:shadow-apple-hover hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[160px] group">
         <div className="flex justify-between items-start">
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <Eye className="h-6 w-6 text-apple-blue" />
             </div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-white/50 px-2 py-1 rounded-full backdrop-blur-sm">ORTA</span>
        </div>
        <div>
             <div className="text-3xl font-bold text-slate-900 tracking-tight">{stats.level3Count}</div>
             <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-400 to-apple-blue h-1.5 rounded-full shadow-[0_0_10px_rgba(0,122,255,0.4)]" style={{ width: '30%' }}></div>
             </div>
             <div className="text-xs text-slate-500 mt-2 font-medium">Seviye 3 Tespit</div>
        </div>
      </div>

    </div>
  );
};

export default StatsCards;