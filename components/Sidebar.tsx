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
    <div className="w-[280px] h-screen flex flex-col sticky top-0 z-50 bg-[#F5F5F7]/80 backdrop-blur-xl border-r border-white/50">
      
      <div className="flex flex-col h-full px-4 py-6">
        {/* Logo Area */}
        <div className="flex items-center gap-3 px-3 mb-8">
            <div className="w-9 h-9 bg-black rounded-[10px] flex items-center justify-center shadow-md">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
                <h1 className="font-bold text-lg text-apple-text tracking-tight leading-none">Kaçak Kontrol</h1>
                <span className="text-[11px] font-medium text-apple-subtext tracking-wide">PRO ANALYTICS</span>
            </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
          
          <div>
              <div className="text-[11px] font-semibold text-apple-subtext uppercase tracking-wider mb-2 px-3 opacity-80">Ana Menü</div>
              
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
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-out ${
                                  isActive 
                                  ? 'bg-white shadow-sm text-apple-text' 
                                  : 'text-apple-subtext hover:bg-black/5 hover:text-apple-text'
                              }`}
                          >
                              <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-apple-blue' : 'text-slate-400'}`} strokeWidth={2} />
                              <span className="tracking-tight">{item.label}</span>
                              
                              {level1Count > 0 && itemId === 'general' && !isActive && (
                                  <span className="ml-auto bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                      {level1Count}
                                  </span>
                              )}
                              {isActive && level1Count > 0 && itemId === 'general' && (
                                  <span className="ml-auto bg-apple-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                      {level1Count}
                                  </span>
                              )}
                          </button>
                      );
                  })}
              </div>
          </div>
          
           <button 
              onClick={onReset}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-apple-subtext hover:bg-black/5 hover:text-apple-text transition-colors"
          >
              <RefreshCw className="h-[18px] w-[18px]" strokeWidth={2} />
              <span>Verileri Sıfırla</span>
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto pt-4">
          <div 
              onClick={onExport}
              className="bg-white rounded-[20px] p-5 shadow-apple cursor-pointer hover:shadow-apple-hover hover:scale-[1.02] transition-all duration-300 group border border-white/50"
          >
              <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-apple-green/10 flex items-center justify-center">
                      <FileSpreadsheetIcon className="h-5 w-5 text-apple-green" />
                  </div>
                  <div>
                    <h5 className="text-apple-text font-bold text-sm">Raporu İndir</h5>
                    <p className="text-[11px] text-apple-subtext">Excel Formatı (.xlsx)</p>
                  </div>
              </div>
              <button 
                  className="w-full bg-[#1D1D1F] text-white text-xs font-semibold py-2.5 rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2"
              >
                  <Download className="h-3.5 w-3.5" />
                  Dışa Aktar
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper icon
const FileSpreadsheetIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h2"/><path d="M14 13h2"/><path d="M8 17h2"/><path d="M14 17h2"/></svg>
)

export default Sidebar;