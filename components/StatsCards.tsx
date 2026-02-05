import React from 'react';
import { EngineStats } from '../types';
import { ShieldAlert, Users, Search, Activity } from 'lucide-react';

interface StatsCardsProps {
  stats: EngineStats;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/50 shadow-lg relative group overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-blue-500/10 transition-colors"></div>
        <div className="flex items-center justify-between pb-4 relative z-10">
          <h3 className="text-sm font-medium text-slate-400">Toplam Taranan</h3>
          <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
            <Search className="h-4 w-4 text-blue-400" />
          </div>
        </div>
        <div className="text-3xl font-bold text-white tracking-tight">{stats.totalScanned.toLocaleString()}</div>
        <p className="text-xs text-slate-500 mt-2 font-medium">Aktif Aboneler</p>
      </div>

      <div className="bg-gradient-to-br from-red-900/40 to-slate-900 p-6 rounded-2xl border border-red-500/20 shadow-lg relative group overflow-hidden">
         <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500/50"></div>
         <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
        <div className="flex items-center justify-between pb-4 relative z-10">
          <h3 className="text-sm font-bold text-red-400">Seviye 1: Kritik</h3>
          <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20 animate-pulse">
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </div>
        </div>
        <div className="text-3xl font-bold text-white tracking-tight">{stats.level1Count}</div>
        <p className="text-xs text-red-400/70 mt-2 font-medium">Acil İşlem Gerekli</p>
      </div>

      <div className="bg-gradient-to-br from-orange-900/30 to-slate-900 p-6 rounded-2xl border border-orange-500/20 shadow-lg relative group overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500/50"></div>
        <div className="flex items-center justify-between pb-4 relative z-10">
          <h3 className="text-sm font-bold text-orange-400">Seviye 2: Yüksek</h3>
          <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <Activity className="h-4 w-4 text-orange-500" />
          </div>
        </div>
        <div className="text-3xl font-bold text-white tracking-tight">{stats.level2Count}</div>
        <p className="text-xs text-orange-400/70 mt-2 font-medium">7 Gün İçinde Denetim</p>
      </div>

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/50 shadow-lg relative group overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
        <div className="flex items-center justify-between pb-4 relative z-10">
          <h3 className="text-sm font-medium text-indigo-400">Seviye 3: Orta</h3>
           <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
             <Users className="h-4 w-4 text-indigo-400" />
           </div>
        </div>
        <div className="text-3xl font-bold text-white tracking-tight">{stats.level3Count}</div>
        <p className="text-xs text-indigo-400/60 mt-2 font-medium">İzleme Listesi</p>
      </div>
    </div>
  );
};

export default StatsCards;