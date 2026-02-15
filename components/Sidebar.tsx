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
    <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col sticky top-0 z-50">
      
      <div className="flex flex-col h-full">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-800 tracking-tight">Kaçak<span className="text-primary-600">Kontrol</span></span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-3 flex-1 overflow-y-auto custom-scrollbar py-6 space-y-4">
          
          <button 
              onClick={onReset}
              className="w-full flex items-center gap-3 bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-2.5 rounded-lg border border-slate-200 transition-colors"
          >
              <RefreshCw className="h-4 w-4 text-slate-500" />
              <span className="font-semibold text-sm">Yeniden Yükle</span>
          </button>

          <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">Ana Menü</div>
              
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
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  isActive 
                                  ? 'bg-primary-50 text-primary-700' 
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                          >
                              <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                              <span>{item.label}</span>
                              
                              {level1Count > 0 && itemId === 'general' && !isActive && (
                                  <span className="ml-auto bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                                      {level1Count}
                                  </span>
                              )}
                              {isActive && level1Count > 0 && itemId === 'general' && (
                                  <span className="ml-auto bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
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
        <div className="p-4 border-t border-slate-100">
          <div 
              onClick={onExport}
              className="bg-slate-50 rounded-xl p-4 border border-slate-200 cursor-pointer hover:border-primary-300 transition-all group"
          >
              <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border border-green-200">
                      <Activity className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h5 className="text-slate-800 font-bold text-sm">Rapor Al</h5>
                    <p className="text-[10px] text-slate-500">Excel (.xlsx)</p>
                  </div>
              </div>
              <button 
                  className="w-full bg-slate-900 text-white text-xs font-bold py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                  <Download className="h-3 w-3" />
                  İndir
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;