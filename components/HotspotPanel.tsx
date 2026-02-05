import React from 'react';
import { Hotspot } from '../types';
import { Map, Flame, Crosshair, Navigation } from 'lucide-react';

interface HotspotPanelProps {
  hotspots: Hotspot[];
}

const HotspotPanel: React.FC<HotspotPanelProps> = ({ hotspots }) => {
  
  // Sokak isimlerini harita üzerindeki belirli koordinatlara (hashleyerek) atayan fonksiyon.
  // Bu sayede aynı sokak her zaman haritada aynı noktada görünür.
  const getCoordinates = (street: string) => {
    let hash = 0;
    for (let i = 0; i < street.length; i++) {
      hash = street.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Haritanın (SVG'nin) dolu kısımlarına denk gelecek şekilde koordinatları sınırla.
    // X: %15 ile %85 arası
    // Y: %20 ile %80 arası
    const x = (Math.abs(hash % 70) + 15); 
    const y = (Math.abs((hash >> 3) % 60) + 20);
    return { x, y };
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Map className="h-5 w-5 text-blue-500" />
          Coğrafi Risk Haritası
        </h3>
        <div className="flex items-center gap-1">
             <span className="text-[10px] text-slate-500 font-mono">İL:</span>
             <span className="text-[10px] text-blue-400 font-bold bg-blue-900/20 px-1 rounded">GENEL</span>
             <Flame className="h-4 w-4 text-orange-500 animate-pulse ml-2" />
        </div>
      </div>

      <div className="flex-1 min-h-[250px] w-full min-w-0 relative bg-slate-900 rounded-lg overflow-hidden border border-slate-700/50 group cursor-crosshair">
         
         {/* Harita Arkaplanı (SVG) */}
         <div className="absolute inset-0 w-full h-full flex items-center justify-center p-4">
            <svg viewBox="0 0 400 300" className="w-full h-full drop-shadow-2xl">
                <defs>
                    <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                {/* İlçe 1: Merkez */}
                <path 
                    d="M 150,120 L 220,110 L 240,160 L 180,190 L 140,160 Z" 
                    fill="url(#mapGradient)" 
                    stroke="#475569" 
                    strokeWidth="1"
                    className="hover:fill-slate-700 transition-colors duration-300"
                />
                <text x="180" y="150" className="text-[6px] fill-slate-600 font-mono pointer-events-none select-none">MERKEZ</text>

                {/* İlçe 2: Kuzey */}
                <path 
                    d="M 140,60 L 250,50 L 220,110 L 150,120 L 110,90 Z" 
                    fill="url(#mapGradient)" 
                    stroke="#475569" 
                    strokeWidth="1"
                    className="hover:fill-slate-700 transition-colors duration-300"
                />
                <text x="170" y="90" className="text-[6px] fill-slate-600 font-mono pointer-events-none select-none">KUZEY İLÇE</text>

                {/* İlçe 3: Doğu */}
                <path 
                    d="M 250,50 L 320,70 L 340,150 L 240,160 L 220,110 Z" 
                    fill="url(#mapGradient)" 
                    stroke="#475569" 
                    strokeWidth="1"
                    className="hover:fill-slate-700 transition-colors duration-300"
                />
                <text x="270" y="110" className="text-[6px] fill-slate-600 font-mono pointer-events-none select-none">SANAYİ BÖLGESİ</text>

                {/* İlçe 4: Güney */}
                <path 
                    d="M 180,190 L 240,160 L 340,150 L 300,240 L 160,230 Z" 
                    fill="url(#mapGradient)" 
                    stroke="#475569" 
                    strokeWidth="1"
                    className="hover:fill-slate-700 transition-colors duration-300"
                />
                <text x="240" y="200" className="text-[6px] fill-slate-600 font-mono pointer-events-none select-none">GÜNEY İLÇE</text>

                {/* İlçe 5: Batı */}
                <path 
                    d="M 60,110 L 140,60 L 150,120 L 140,160 L 160,230 L 50,200 Z" 
                    fill="url(#mapGradient)" 
                    stroke="#475569" 
                    strokeWidth="1"
                    className="hover:fill-slate-700 transition-colors duration-300"
                />
                 <text x="90" y="160" className="text-[6px] fill-slate-600 font-mono pointer-events-none select-none">BATI YAKASI</text>

                {/* İl Sınırı Efekti (Dış Çizgi) */}
                <path 
                    d="M 60,110 L 140,60 L 250,50 L 320,70 L 340,150 L 300,240 L 160,230 L 50,200 Z" 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    className="opacity-50 pointer-events-none"
                    filter="url(#glow)"
                />
            </svg>
         </div>

         {/* Radar Sweep Effect */}
         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent w-[200%] h-full animate-[spin_6s_linear_infinite] origin-center opacity-30 pointer-events-none"></div>

         {/* Points */}
         {hotspots.map((h, i) => {
             const { x, y } = getCoordinates(h.street);
             const isTop3 = i < 3;
             
             return (
                 <div 
                    key={h.street}
                    className="absolute flex items-center justify-center group/point hover:z-50"
                    style={{ left: `${x}%`, top: `${y}%` }}
                 >
                     {/* Pulse Animation */}
                     <div className={`absolute rounded-full animate-ping opacity-75 ${isTop3 ? 'bg-red-500' : 'bg-orange-500'}`} 
                          style={{ 
                              width: isTop3 ? '24px' : '16px', 
                              height: isTop3 ? '24px' : '16px',
                              animationDuration: isTop3 ? '1.5s' : '3s'
                          }}
                     ></div>

                     {/* The Dot */}
                     <div className={`relative rounded-full border border-slate-900 shadow-lg z-10 cursor-pointer
                         ${isTop3 ? 'bg-red-500 w-3 h-3 ring-2 ring-red-500/30' : 'bg-orange-400 w-2 h-2'}
                         transition-transform duration-300 hover:scale-150
                     `}></div>

                     {/* Tooltip (Hover) */}
                     <div className="absolute bottom-full mb-3 bg-slate-900/95 backdrop-blur-md text-xs px-3 py-2 rounded-lg border border-slate-600 whitespace-nowrap opacity-0 group-hover/point:opacity-100 transition-all duration-300 z-50 shadow-2xl transform translate-y-2 group-hover/point:translate-y-0 pointer-events-none">
                         <div className="flex items-center gap-2 mb-1 border-b border-slate-700/50 pb-1">
                             <Navigation className="h-3 w-3 text-blue-400" />
                             <span className="font-bold text-white tracking-wide">{h.street}</span>
                         </div>
                         <div className="flex justify-between items-center gap-4">
                             <span className="text-slate-400 text-[10px]">Tespit Sayısı:</span>
                             <span className={`font-mono font-bold ${isTop3 ? 'text-red-400' : 'text-orange-400'}`}>
                                 {h.count}
                             </span>
                         </div>
                         {/* Connector Arrow */}
                         <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-600"></div>
                     </div>
                 </div>
             );
         })}
         
         {/* Map Overlay Info */}
         <div className="absolute bottom-2 left-2 px-2 py-1 flex flex-col pointer-events-none">
             <span className="text-[8px] text-slate-500 font-mono tracking-widest">MAP_V2.1 // VECTOR</span>
             <span className="text-[10px] text-slate-400 font-bold">BÖLGESEL DAĞILIM</span>
         </div>
      </div>
      
      <div className="mt-4 grid grid-cols-1 gap-2 max-h-[120px] overflow-y-auto custom-scrollbar">
          {hotspots.slice(0, 4).map((h, i) => (
              <div key={i} className="flex justify-between items-center text-xs p-2 bg-slate-700/30 rounded border border-slate-700 hover:bg-slate-700/50 transition-colors cursor-default">
                  <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${i < 2 ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                     <span className="text-slate-300 font-medium truncate max-w-[120px]" title={h.street}>{h.street}</span>
                  </div>
                  <span className={`font-bold ${i < 2 ? 'text-red-400' : 'text-orange-400'}`}>{h.count}</span>
              </div>
          ))}
      </div>
    </div>
  );
};

export default HotspotPanel;