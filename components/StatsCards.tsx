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
      <div className="bg-white rounded-[24px] p-6 shadow-apple border border-white/50 flex flex-col justify-between h-[160px] transition-transform hover:scale-[1.02] duration-300">
        <div className="flex justify-between items-start">
             <div className="w-10 h-10 rounded-full bg-[#F5F5F7] flex items-center justify-center">
                <Search className="h-5 w-5 text-[#86868B]" />
             </div>
             <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wide bg-[#F5F5F7] px-2.5 py-1 rounded-full">TOPLAM</span>
        </div>
        <div>
            <div className="text-4xl font-semibold text-[#1D1D1F] tracking-tight">
                {stats.totalScanned.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-apple-green"></div>
                <span className="text-sm font-medium text-[#86868B]">Taranan Abone</span>
            </div>
        </div>
      </div>

      {/* Widget 2 */}
      <div className="bg-white rounded-[24px] p-6 shadow-apple border border-white/50 flex flex-col justify-between h-[160px] transition-transform hover:scale-[1.02] duration-300 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-32 h-32 bg-apple-red/5 rounded-full -mr-16 -mt-16 group-hover:bg-apple-red/10 transition-colors"></div>
         <div className="flex justify-between items-start relative z-10">
             <div className="w-10 h-10 rounded-full bg-apple-red/10 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5 text-apple-red" />
             </div>
             <span className="text-[10px] font-bold text-apple-red uppercase tracking-wide bg-apple-red/10 px-2.5 py-1 rounded-full">KRİTİK</span>
        </div>
        <div className="relative z-10">
            <div className="text-4xl font-semibold text-[#1D1D1F] tracking-tight">
                {stats.level1Count}
            </div>
            <div className="flex items-center gap-1 mt-2">
                <span className="text-sm font-medium text-[#86868B]">Seviye 1 Risk</span>
                {stats.level1Count > 0 && <ArrowUpRight className="h-4 w-4 text-apple-red" />}
            </div>
        </div>
      </div>

      {/* Widget 3 */}
      <div className="bg-white rounded-[24px] p-6 shadow-apple border border-white/50 flex flex-col justify-between h-[160px] transition-transform hover:scale-[1.02] duration-300">
         <div className="flex justify-between items-start">
             <div className="w-10 h-10 rounded-full bg-apple-orange/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-apple-orange" />
             </div>
             <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wide bg-[#F5F5F7] px-2.5 py-1 rounded-full">YÜKSEK</span>
        </div>
        <div>
             <div className="text-4xl font-semibold text-[#1D1D1F] tracking-tight">{stats.level2Count}</div>
             <div className="w-full bg-[#F5F5F7] rounded-full h-1.5 mt-4 overflow-hidden">
                <div className="bg-apple-orange h-1.5 rounded-full" style={{ width: '60%' }}></div>
             </div>
        </div>
      </div>

      {/* Widget 4 */}
      <div className="bg-white rounded-[24px] p-6 shadow-apple border border-white/50 flex flex-col justify-between h-[160px] transition-transform hover:scale-[1.02] duration-300">
         <div className="flex justify-between items-start">
             <div className="w-10 h-10 rounded-full bg-apple-blue/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-apple-blue" />
             </div>
             <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wide bg-[#F5F5F7] px-2.5 py-1 rounded-full">ORTA</span>
        </div>
        <div>
             <div className="text-4xl font-semibold text-[#1D1D1F] tracking-tight">{stats.level3Count}</div>
             <div className="w-full bg-[#F5F5F7] rounded-full h-1.5 mt-4 overflow-hidden">
                <div className="bg-apple-blue h-1.5 rounded-full" style={{ width: '30%' }}></div>
             </div>
        </div>
      </div>

    </div>
  );
};

export default StatsCards;