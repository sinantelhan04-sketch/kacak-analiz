import React, { useMemo, useEffect } from 'react';
import { RiskScore, Hotspot, ReferenceLocation } from '../types';
import { Map as MapIcon, Navigation, AlertTriangle, XCircle, Filter, MapPin, Search } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ISTANBUL_DISTRICTS } from '../utils/fraudEngine';

interface HotspotPanelProps {
  hotspots?: Hotspot[]; 
  riskData?: RiskScore[]; 
  referenceLocations?: ReferenceLocation[];
  selectedDistrict?: string | null;
  onDistrictSelect?: (district: string | null) => void;
}

// --- Helper Component for Smooth Zooming ---
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, {
      duration: 1.5, // Animation duration in seconds
      easeLinearity: 0.25
    });
  }, [center, zoom, map]);
  return null;
};

// --- Custom Icons ---
const pulsingIcon = L.divIcon({
  className: 'custom-div-icon',
  html: "<div class='pulsing-dot'></div>",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10]
});

const HotspotPanel: React.FC<HotspotPanelProps> = ({ referenceLocations = [], selectedDistrict, onDistrictSelect }) => {
  
  // Filter points based on selection (visual filtering is handled by map bounds mostly, but good to have logic)
  const points = useMemo(() => {
    return referenceLocations.filter(r => r.lat !== 0 && r.lng !== 0);
  }, [referenceLocations]);

  // Calculate Center Logic
  const { center, zoomLevel } = useMemo(() => {
    // 1. If District Selected -> Center on District Polygon
    if (selectedDistrict && ISTANBUL_DISTRICTS[selectedDistrict]) {
        const poly = ISTANBUL_DISTRICTS[selectedDistrict];
        const latSum = poly.reduce((acc, p) => acc + p[0], 0);
        const lngSum = poly.reduce((acc, p) => acc + p[1], 0);
        return { 
            center: [latSum / poly.length, lngSum / poly.length] as [number, number], 
            zoomLevel: 14 
        };
    }

    // 2. If No District -> Center on all points or Default Istanbul
    if (points.length === 0) return { center: [41.015, 28.978] as [number, number], zoomLevel: 11 };
    
    const latSum = points.reduce((acc, p) => acc + p.lat, 0);
    const lngSum = points.reduce((acc, p) => acc + p.lng, 0);
    return { 
        center: [latSum / points.length, lngSum / points.length] as [number, number], 
        zoomLevel: 11 
    };
  }, [points, selectedDistrict]);

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (onDistrictSelect) {
          onDistrictSelect(val === "" ? null : val);
      }
  };

  return (
    <div className="bg-white rounded-[30px] border border-slate-200 shadow-sm flex flex-col h-full relative overflow-hidden group">
      
      {/* Header / Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[500] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pointer-events-none">
          
          {/* Title Card */}
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-slate-200 pointer-events-auto">
                <div className="flex items-center gap-3">
                    <div className="bg-red-50 p-2 rounded-lg">
                        <MapIcon className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">Coğrafi Risk Haritası</h3>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                            {selectedDistrict 
                                ? `${selectedDistrict} Bölgesinde Kayıtlar` 
                                : `${points.length} Referans Noktası Görüntüleniyor`
                            }
                        </p>
                    </div>
                </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 pointer-events-auto">
             <div className="relative group/select">
                 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="h-4 w-4" />
                 </div>
                 <select 
                    value={selectedDistrict || ""} 
                    onChange={handleDistrictChange}
                    className="pl-9 pr-4 py-2.5 bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 appearance-none cursor-pointer min-w-[160px]"
                 >
                     <option value="">Tüm İstanbul</option>
                     {Object.keys(ISTANBUL_DISTRICTS).map(d => (
                         <option key={d} value={d}>{d}</option>
                     ))}
                 </select>
             </div>

             {selectedDistrict && (
                <button 
                    onClick={() => onDistrictSelect && onDistrictSelect(null)}
                    className="p-2.5 bg-white/90 backdrop-blur-md text-red-500 rounded-xl border border-red-100 shadow-lg hover:bg-red-50 transition-colors"
                    title="Filtreyi Temizle"
                >
                    <XCircle className="h-5 w-5" />
                </button>
             )}
          </div>
      </div>

      {/* Map Content Area */}
      <div className="flex-1 w-full relative bg-slate-100 z-0">
         <MapContainer 
            center={center} 
            zoom={zoomLevel} 
            scrollWheelZoom={true} 
            style={{ height: '100%', width: '100%' }}
            attributionControl={false}
            zoomControl={false} // We can add custom zoom control if needed, or stick to mouse/touch
         >
            {/* Minimal Map Style (CartoDB Positron) */}
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            
            <MapController center={center} zoom={zoomLevel} />

            {/* Render Districts */}
            {Object.entries(ISTANBUL_DISTRICTS).map(([name, poly]) => {
                const isSelected = selectedDistrict === name;
                const isDimmed = selectedDistrict && !isSelected;
                
                return (
                    <Polygon 
                        key={name}
                        positions={poly}
                        pathOptions={{
                            color: isSelected ? '#ef4444' : '#64748b',
                            dashArray: isSelected ? undefined : '5, 10',
                            fillColor: isSelected ? '#ef4444' : '#3b82f6',
                            fillOpacity: isSelected ? 0.15 : 0.0,
                            weight: isSelected ? 3 : 1.5,
                            opacity: isDimmed ? 0.2 : 0.6
                        }}
                        eventHandlers={{
                            click: () => {
                                if (onDistrictSelect) {
                                    if (selectedDistrict === name) onDistrictSelect(null);
                                    else onDistrictSelect(name);
                                }
                            }
                        }}
                    >
                        {!isDimmed && (
                             <Tooltip permanent={isSelected} direction="center" opacity={1} className="district-label-tooltip">
                                <span className={`text-[10px] font-bold tracking-widest ${isSelected ? 'text-red-600 bg-white/80 px-2 py-1 rounded shadow-sm' : 'text-slate-500'}`}>
                                    {name.toUpperCase()}
                                </span>
                            </Tooltip>
                        )}
                    </Polygon>
                )
            })}
            
            {/* Render Points */}
            {points.map((p, i) => {
                // If a district is selected, visual check if point roughly belongs or hide outliers?
                // For now we show all, relying on zoom to filter visually.
                return (
                    <Marker 
                        key={i} 
                        position={[p.lat, p.lng]} 
                        icon={pulsingIcon}
                    >
                        <Popup className="custom-popup">
                            <div className="p-1">
                                <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-2">
                                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                                        <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">Referans Kayıt</div>
                                        <div className="font-bold text-slate-800 text-sm leading-none">{p.id}</div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 p-1.5 rounded">
                                        <MapPin className="h-3 w-3 text-slate-400" />
                                        <span className="font-mono">{p.lat.toFixed(5)}, {p.lng.toFixed(5)}</span>
                                    </div>
                                    <div className="text-[10px] text-red-500 font-medium px-1">
                                        Bu konum risk listesinde.
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
         </MapContainer>

         {/* Legend / Info Footer */}
         <div className="absolute bottom-6 left-6 z-[500]">
             <div className="bg-white/90 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-xl flex flex-col gap-2">
                 <div className="flex items-center gap-2">
                     <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white"></span>
                     </span>
                     <span className="text-[10px] font-bold text-slate-600">Referans Noktası</span>
                 </div>
                 <div className="flex items-center gap-2">
                     <div className="w-3 h-3 border border-dashed border-slate-400 rounded-sm"></div>
                     <span className="text-[10px] font-bold text-slate-600">İlçe Sınırı</span>
                 </div>
             </div>
         </div>
      </div>

      <style>{`
        .district-label-tooltip {
            background: transparent;
            border: none;
            box-shadow: none;
        }
        .leaflet-popup-content-wrapper {
            border-radius: 16px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .leaflet-popup-content {
            margin: 8px;
        }
      `}</style>
    </div>
  );
};

export default HotspotPanel;