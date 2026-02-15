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
      <div className="glass-card rounded-[26px] p-6 hover:shadow-apple-hover hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[170px] group border border-white/60">
        <div className="flex justify-between items-start">
             <div className="w-11 h-11 rounded-[14px] bg-[#AF52DE]/10 border border-[#AF52DE]/20 flex items-center justify-center shadow-sm">
                <Search className="h-5 w-5 text-[#AF52DE]" />
             </div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-white/50 px-2 py-1 rounded-full backdrop-blur-sm">TOPLAM</span>
        </div>
        <div>
            <div className="text-4xl font-semibold text-[#1D1D1F] tracking-tight">
                {stats.totalScanned.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse"></div>
                <span className="text-xs font-medium text-slate-500">Taranan Abone</span>
            </div>
        </div>
      </div>

      {/* Widget 2 */}
      <div className="glass-card rounded-[26px] p-6 hover:shadow-apple-hover hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[170px] group border border-white/60">
         <div className="flex justify-between items-start">
             <div className="w-11 h-11 rounded-[14px] bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center justify-center shadow-sm relative">
                <ShieldAlert className="h-5 w-5 text-[#FF3B30]" />
             </div>
             <span className="text-[10px] font-bold text-[#FF3B30] uppercase tracking-wide bg-[#FF3B30]/10 px-2 py-1 rounded-full">KRİTİK</span>
        </div>
        <div>
            <div className="text-4xl font-semibold text-[#1D1D1F] tracking-tight">
                {stats.level1Count}
            </div>
            <div className="flex items-center gap-1 mt-2">
                <span className="text-xs font-medium text-slate-500">Seviye 1 Risk</span>
                <div className="bg-[#FF3B30]/10 rounded-full px-1.5 py-0.5 flex items-center">
                    <ArrowUpRight className="h-3 w-3 text-[#FF3B30]" />
                </div>
            </div>
        </div>
      </div>

      {/* Widget 3 */}
      <div className="glass-card rounded-[26px] p-6 hover:shadow-apple-hover hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[170px] group border border-white/60">
         <div className="flex justify-between items-start">
             <div className="w-11 h-11 rounded-[14px] bg-[#FF9500]/10 border border-[#FF9500]/20 flex items-center justify-center shadow-sm">
                <Activity className="h-5 w-5 text-[#FF9500]" />
             </div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-white/50 px-2 py-1 rounded-full backdrop-blur-sm">YÜKSEK</span>
        </div>
        <div>
             <div className="text-4xl font-semibold text-[#1D1D1F] tracking-tight">{stats.level2Count}</div>
             <div className="w-full bg-slate-100/50 rounded-full h-1.5 mt-4 overflow-hidden">
                <div className="bg-gradient-to-r from-[#FF9500] to-[#FFB340] h-1.5 rounded-full" style={{ width: '60%' }}></div>
             </div>
             <div className="text-xs text-slate-500 mt-2 font-medium">Seviye 2 Tespit</div>
        </div>
      </div>

      {/* Widget 4 */}
      <div className="glass-card rounded-[26px] p-6 hover:shadow-apple-hover hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[170px] group border border-white/60">
         <div className="flex justify-between items-start">
             <div className="w-11 h-11 rounded-[14px] bg-[#007AFF]/10 border border-[#007AFF]/20 flex items-center justify-center shadow-sm">
                <Eye className="h-5 w-5 text-[#007AFF]" />
             </div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-white/50 px-2 py-1 rounded-full backdrop-blur-sm">ORTA</span>
        </div>
        <div>
             <div className="text-4xl font-semibold text-[#1D1D1F] tracking-tight">{stats.level3Count}</div>
             <div className="w-full bg-slate-100/50 rounded-full h-1.5 mt-4 overflow-hidden">
                <div className="bg-gradient-to-r from-[#007AFF] to-[#409CFF] h-1.5 rounded-full" style={{ width: '30%' }}></div>
             </div>
             <div className="text-xs text-slate-500 mt-2 font-medium">Seviye 3 Tespit</div>
        </div>
      </div>

    </div>
  );
};

export default StatsCards;