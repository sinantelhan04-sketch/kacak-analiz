import React from 'react';
import { LayoutDashboard, MapPin, Wrench, TrendingDown, Gauge, Download, ShieldCheck, RefreshCw, Activity, BrainCircuit, Building2 } from 'lucide-react';

interface SidebarProps {
  currentView: 'general' | 'tampering' | 'inconsistent' | 'rule120' | 'georisk' | 'ai-report' | 'building';
  setView: (view: 'general' | 'tampering' | 'inconsistent' | 'rule120' | 'georisk' | 'ai-report' | 'building') => void;
  onExport: () => void;
  onReset: () => void;
  level1Count: number;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onExport, onReset, level1Count }) => {
  
  const menuItems = [
    { id: 'general', label: 'Genel Bakış', icon: LayoutDashboard },
    { id: 'ai-report', label: 'Yapay Zeka Raporu', icon: BrainCircuit },
    { id: 'georisk', label: 'Coğrafi Harita', icon: MapPin },
    { id: 'building', label: 'Bina Tüketimi', icon: Building2 },
    { id: 'tampering', label: 'Müdahale Analizi', icon: Wrench },
    { id: 'inconsistent', label: 'Tutarsız Tüketim', icon: TrendingDown },
    { id: 'rule120', label: '120 sm³ Kuralı', icon: Gauge },
  ] as const;

  return (
    <div className="w-72 h-screen flex flex-col sticky top-0 z-50">
      {/* Enhanced Glassmorphism Background */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-2xl border-r border-white/40 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"></div>
      
      <div className="relative z-10 flex flex-col h-full">
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 shrink-0">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center transition-transform group-hover:scale-105">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-800 tracking-tight">Kaçak<span className="text-apple-blue">Kontrol</span></span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-4 flex-1 overflow-y-auto custom-scrollbar py-6 space-y-6">
          
          <button 
              onClick={onReset}
              className="w-full flex items-center gap-3 bg-white/80 hover:bg-white text-slate-600 px-3 py-3 rounded-2xl border border-slate-200/60 hover:border-slate-300 shadow-sm hover:shadow-md transition-all group"
          >
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                <RefreshCw className="h-4 w-4 text-slate-500 group-hover:rotate-180 transition-transform duration-700" />
              </div>
              <span className="font-semibold text-sm">Yeniden Yükle</span>
          </button>

          <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">Ana Menü</div>
              
              <div className="space-y-1.5">
                  {menuItems.map((item) => {
                      const isActive = currentView === item.id;
                      const Icon = item.icon;
                      // @ts-ignore
                      const itemId = item.id; 

                      return (
                          <button
                              key={itemId}
                              onClick={() => setView(itemId)}
                              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden ${
                                  isActive 
                                  ? 'bg-white/80 text-apple-blue shadow-sm ring-1 ring-black/5' 
                                  : 'text-slate-500 hover:bg-white/50 hover:text-slate-900'
                              }`}
                          >
                              {/* Active Indicator Line */}
                              {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-apple-blue rounded-r-full"></div>}

                              <Icon className={`h-5 w-5 transition-colors ${isActive ? 'text-apple-blue' : 'text-slate-400 group-hover:text-slate-600'} ${itemId === 'ai-report' ? 'text-purple-500' : ''}`} />
                              <span className={isActive ? 'font-bold' : ''}>{item.label}</span>
                              
                              {level1Count > 0 && itemId === 'general' && !isActive && (
                                  <span className="ml-auto bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                                      {level1Count}
                                  </span>
                              )}
                              {isActive && level1Count > 0 && itemId === 'general' && (
                                  <span className="ml-auto bg-apple-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                      {level1Count}
                                  </span>
                              )}
                          </button>
                      );
                  })}
              </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 shrink-0">
          <div 
              onClick={onExport}
              className="glass-card rounded-[24px] p-5 border border-white/60 hover:bg-white transition-all cursor-pointer group shadow-sm hover:shadow-apple-hover"
          >
              <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center border border-green-100 group-hover:scale-110 transition-transform">
                      <Activity className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h5 className="text-slate-900 font-bold text-sm">Veri Dışa Aktar</h5>
                    <p className="text-[10px] text-slate-500 font-medium">Excel Formatı (.xlsx)</p>
                  </div>
              </div>
              <button 
                  className="w-full bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl transition-all hover:bg-slate-800 shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 active:scale-95"
              >
                  <Download className="h-3.5 w-3.5" />
                  Raporu İndir
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;