import React from 'react';
import { LayoutDashboard, MapPin, Wrench, TrendingDown, ThermometerSnowflake, Settings, Sliders, ShieldCheck, Download } from 'lucide-react';

interface ControlPanelProps {
  currentView: 'general' | 'tampering' | 'inconsistent' | 'rule120' | 'georisk';
  setView: (view: 'general' | 'tampering' | 'inconsistent' | 'rule120' | 'georisk') => void;
  onExport: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ currentView, setView, onExport }) => {
  
  const menuItems = [
    { 
      id: 'general', 
      label: 'Genel Bakış', 
      icon: LayoutDashboard, 
      desc: 'Tüm riskli aboneler',
      color: 'text-slate-400',
      activeColor: 'text-white'
    },
    { 
      id: 'georisk', 
      label: 'Bölgesel Risk', 
      icon: MapPin, 
      desc: 'Sıcak bölgeler & Düşük tüketim',
      color: 'text-red-400',
      activeColor: 'text-red-400'
    },
    { 
      id: 'tampering', 
      label: 'Müdahale Şüphesi', 
      icon: Wrench, 
      desc: 'Yaz/Kış oranı anomalileri',
      color: 'text-orange-400',
      activeColor: 'text-orange-400'
    },
    { 
      id: 'inconsistent', 
      label: 'Tutarsız Veri', 
      icon: TrendingDown, 
      desc: 'Ani düşüşler ve ZigZag',
      color: 'text-pink-400',
      activeColor: 'text-pink-400'
    },
    { 
      id: 'rule120', 
      label: '120 Kuralı', 
      icon: ThermometerSnowflake, 
      desc: 'Ocak-Şubat < 120 sm³',
      color: 'text-blue-400',
      activeColor: 'text-blue-400'
    },
  ] as const;

  return (
    <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/50 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-700/50 bg-slate-800/90 flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-blue-500" />
                Kontrol Paneli
            </h3>
            <div className="p-1.5 bg-slate-700 rounded-md border border-slate-600 cursor-help group relative">
                <Settings className="h-3 w-3 text-slate-400" />
                <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-slate-700 rounded border border-slate-600 text-[10px] text-slate-400 hidden group-hover:block z-50 shadow-xl">
                    Parametre ayarları yönetici yetkisi gerektirir.
                </div>
            </div>
        </div>

        {/* Navigation Menu */}
        <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 px-2">Analiz Modları</div>
            
            {menuItems.map((item) => {
                const isActive = currentView === item.id;
                const Icon = item.icon;
                
                return (
                    <button
                        key={item.id}
                        onClick={() => setView(item.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-300 border ${
                            isActive 
                            ? 'bg-slate-700 border-slate-600 shadow-lg shadow-black/20 scale-[1.02]' 
                            : 'bg-transparent border-transparent hover:bg-slate-700/50 hover:border-slate-700/50 text-slate-500'
                        }`}
                    >
                        <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-slate-600 shadow-inner' : 'bg-slate-700/50'}`}>
                            <Icon className={`h-4 w-4 ${isActive ? item.activeColor : item.color}`} />
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                {item.label}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                                {item.desc}
                            </span>
                        </div>
                        {isActive && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                        )}
                    </button>
                );
            })}
        </div>

        {/* Active Parameters / Footer */}
        <div className="p-4 bg-slate-900/30 border-t border-slate-700/50">
             <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3">Aktif Algoritmalar</div>
             <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-green-500/5 border border-green-500/10 rounded-lg">
                    <span className="text-[11px] text-green-200/80 flex items-center gap-1.5">
                        <ShieldCheck className="h-3 w-3" />
                        Referans Kontrolü
                    </span>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                    <span className="text-[11px] text-blue-200/80 flex items-center gap-1.5">
                        <Sliders className="h-3 w-3" />
                        Dinamik Ağırlıklar
                    </span>
                    <span className="text-[9px] font-mono text-blue-400">V2.0</span>
                </div>
             </div>

             <button 
                onClick={onExport}
                className="mt-4 w-full py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
             >
                 <Download className="h-3 w-3" />
                 Excel Dışa Aktar
             </button>
        </div>
    </div>
  );
};

export default ControlPanel;