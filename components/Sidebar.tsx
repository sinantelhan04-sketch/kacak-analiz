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
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-[#FBFBFD]/80 backdrop-blur-xl border-r border-black/5"></div>
      
      <div className="relative z-10 flex flex-col h-full">
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-apple-blue rounded-lg shadow-lg shadow-blue-500/30 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-lg text-slate-900 tracking-tight">Kaçak<span className="text-apple-blue">Kontrol</span></span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-4 flex-1 overflow-y-auto custom-scrollbar py-4">
          
          <button 
              onClick={onReset}
              className="w-full mb-6 flex items-center gap-3 bg-white text-slate-600 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group"
          >
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                <RefreshCw className="h-3.5 w-3.5 text-slate-500 group-hover:rotate-180 transition-transform duration-500" />
              </div>
              <span className="font-medium text-sm">Yeniden Yükle</span>
          </button>

          <div className="text-[11px] font-semibold text-slate-400 mb-2 px-3">Menü</div>
          
          <div className="space-y-1">
              {menuItems.map((item) => {
                  const isActive = currentView === item.id;
                  const Icon = item.icon;
                  // @ts-ignore
                  const itemId = item.id; 

                  return (
                      <button
                          key={itemId}
                          onClick={() => setView(itemId)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                              isActive 
                              ? 'bg-black/5 text-black' 
                              : 'text-slate-500 hover:bg-black/5 hover:text-slate-900'
                          }`}
                      >
                          <Icon className={`h-4 w-4 ${isActive ? 'text-apple-blue' : 'text-slate-400'} ${itemId === 'ai-report' ? 'text-purple-500' : ''}`} />
                          <span>{item.label}</span>
                          
                          {level1Count > 0 && itemId === 'general' && !isActive && (
                              <span className="ml-auto bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  {level1Count}
                              </span>
                          )}
                          {isActive && level1Count > 0 && itemId === 'general' && (
                              <span className="ml-auto bg-apple-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  {level1Count}
                              </span>
                          )}
                      </button>
                  );
              })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 shrink-0">
          <div 
              onClick={onExport}
              className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-black/5 hover:bg-white transition-colors cursor-pointer group"
          >
              <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-accent-green/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-accent-green" />
                  </div>
                  <div>
                    <h5 className="text-slate-900 font-semibold text-xs">Veri Dışa Aktar</h5>
                    <p className="text-[10px] text-slate-500">Excel Formatı</p>
                  </div>
              </div>
              <button 
                  className="w-full bg-white border border-slate-200 text-slate-700 hover:text-apple-blue hover:border-apple-blue/30 text-xs font-medium py-2 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                  <Download className="h-3.5 w-3.5" />
                  Excel İndir
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;