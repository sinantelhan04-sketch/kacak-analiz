import React, { useMemo, useEffect, useState } from 'react';
import { RiskScore, Hotspot, ReferenceLocation } from '../types';
import { Map as MapIcon, Navigation, AlertTriangle, XCircle, Filter, MapPin, Search, AlertOctagon, Layers, ThermometerSun, CircleDot, Siren, Satellite, TrafficCone, Landmark, Globe, Menu, X, Plus, Minus } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat'; // Import side-effects for L.heatLayer
import { ISTANBUL_DISTRICTS } from '../utils/fraudEngine';

interface HotspotPanelProps {
  hotspots?: Hotspot[]; 
  riskData?: RiskScore[]; 
  referenceLocations?: ReferenceLocation[];
  selectedDistrict?: string | null;
  onDistrictSelect?: (district: string | null) => void;
  detectedCity?: string;
  availableDistricts?: string[];
}

// --- Helper Component for Smooth Zooming using Bounds ---
const MapController: React.FC<{ bounds: L.LatLngBoundsExpression | null }> = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15,
        animate: true,
        duration: 1.0
      });
    }
  }, [bounds, map]);
  return null;
};

// --- Heatmap Layer Component ---
const HeatmapLayer = ({ points }: { points: { lat: number, lng: number, intensity: number }[] }) => {
    const map = useMap();

    useEffect(() => {
      if (!points || points.length === 0) return;

      const heatData = points.map(p => [p.lat, p.lng, p.intensity]);

      // @ts-ignore
      if (typeof L.heatLayer !== 'function') return;

      // @ts-ignore
      const heat = L.heatLayer(heatData, {
          radius: 25,
          blur: 15,
          maxZoom: 13,
          minOpacity: 0.4,
          gradient: {
            0.2: '#4285F4', // Google Blue
            0.4: '#34A853', // Google Green
            0.6: '#FBBC05', // Google Yellow
            0.8: '#EA4335', // Google Red
            1.0: '#B31412'  // Dark Red
          }
      });

      heat.addTo(map);

      return () => {
          map.removeLayer(heat);
      };
    }, [points, map]);

    return null;
};

// --- Radar Style Pin Icon ---
const radarIcon = L.divIcon({
  className: 'radar-icon-container',
  html: `<div class="radar-marker">
            <div class="radar-wave"></div>
            <div class="radar-dot"></div>
         </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12], // Center the icon
  popupAnchor: [0, -10]
});

const HotspotPanel: React.FC<HotspotPanelProps> = ({ 
    referenceLocations = [], 
    selectedDistrict, 
    onDistrictSelect,
    detectedCity = 'İSTANBUL',
    availableDistricts = []
}) => {
  // Map Style: Roadmap (Google Default) or Satellite (Google Hybrid)
  const [mapStyle, setMapStyle] = useState<'roadmap' | 'satellite'>('roadmap');
  const [showHeatmap, setShowHeatmap] = useState(false);
  
  // 1. Points to Render
  const renderPoints = useMemo(() => {
    const combined: any[] = [];
    referenceLocations.forEach(r => {
        if(r.lat !== 0 && r.lng !== 0) {
            combined.push({ 
                ...r, 
                type: 'Reference', 
                score: 100, 
                intensity: 1.0,
                reason: 'Referans Listesi (Sabıkalı)',
                muhatapNo: 'Referans Kaydı'
            });
        }
    });
    return combined;
  }, [referenceLocations]);

  // 2. Map Bounds
  const mapBounds = useMemo<L.LatLngBoundsExpression | null>(() => {
    if (selectedDistrict && ISTANBUL_DISTRICTS[selectedDistrict]) {
        const poly = ISTANBUL_DISTRICTS[selectedDistrict];
        return L.latLngBounds(poly);
    }

    if (renderPoints.length === 0) return [[40.8, 28.6], [41.2, 29.4]];

    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    renderPoints.forEach(p => {
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
        if (p.lng < minLng) minLng = p.lng;
        if (p.lng > maxLng) maxLng = p.lng;
    });

    return [[minLat, minLng], [maxLat, maxLng]];
  }, [selectedDistrict, renderPoints]);

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (onDistrictSelect) {
          onDistrictSelect(val === "" ? null : val);
      }
  };

  const isIstanbul = detectedCity.toUpperCase().includes('ISTANBUL') || detectedCity.toUpperCase().includes('İSTANBUL');
  const districtList = availableDistricts.length > 0 ? availableDistricts : Object.keys(ISTANBUL_DISTRICTS);
  const activePointCount = renderPoints.length;

  return (
    <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm flex flex-col h-full relative overflow-hidden group font-sans">
      
      {/* Google Maps Style Search Bar (Top Left) */}
      <div className="absolute top-4 left-4 z-[500] w-[360px] max-w-[calc(100%-32px)]">
          <div className="bg-white rounded-lg shadow-md border border-slate-100 flex items-center p-0.5 h-12 transition-shadow hover:shadow-lg">
             <div className="w-12 h-full flex items-center justify-center text-slate-500 cursor-pointer hover:text-slate-700">
                <Menu className="h-5 w-5" />
             </div>
             
             <div className="flex-1 h-full relative">
                <select 
                    value={selectedDistrict || ""} 
                    onChange={handleDistrictChange}
                    className="w-full h-full appearance-none bg-transparent text-sm text-slate-700 font-medium px-2 focus:outline-none cursor-pointer"
                >
                    <option value="">Google Haritalar'da Ara</option>
                    {districtList.sort().map(d => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>
                {!selectedDistrict && (
                    <div className="absolute top-0 right-0 h-full flex items-center pr-3 pointer-events-none">
                         <Search className="h-5 w-5 text-[#4285F4]" />
                    </div>
                )}
             </div>

             <div className="w-px h-6 bg-slate-200 mx-1"></div>

             {selectedDistrict ? (
                 <button 
                    onClick={() => onDistrictSelect && onDistrictSelect(null)}
                    className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-[#EA4335] rounded-full hover:bg-slate-50"
                 >
                    <X className="h-5 w-5" />
                 </button>
             ) : (
                <button 
                    className="w-10 h-10 flex items-center justify-center text-[#1a73e8] hover:bg-blue-50 rounded-full"
                    title="Yol Tarifi"
                >
                    <Navigation className="h-5 w-5 fill-current" />
                </button>
             )}
          </div>
          
          {/* Quick Filter Chips (Below Search) */}
          <div className="mt-2 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button 
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border transition-colors whitespace-nowrap
                ${showHeatmap 
                    ? 'bg-[#1a73e8] text-white border-[#1a73e8]' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                  <TrafficCone className="h-3.5 w-3.5" />
                  Trafik (Yoğunluk)
              </button>
              
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-slate-600 text-xs font-medium shadow-sm border border-slate-200 whitespace-nowrap">
                   <Landmark className="h-3.5 w-3.5 text-slate-400" />
                   {selectedDistrict || detectedCity}
              </div>
          </div>
      </div>

      {/* Layer Toggle (Bottom Left) */}
      <div className="absolute bottom-6 left-4 z-[500] group/layers">
          <div className="relative w-16 h-16 rounded-lg shadow-md border-2 border-white overflow-hidden cursor-pointer hover:border-slate-300 transition-all">
               {/* Show the OTHER layer as preview */}
               {mapStyle === 'roadmap' ? (
                   <div onClick={() => setMapStyle('satellite')} className="w-full h-full relative">
                        <img src="https://mt0.google.com/vt/lyrs=s&x=0&y=0&z=0" className="w-full h-full object-cover" alt="Uydu" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[10px] font-bold text-center py-0.5 backdrop-blur-sm">
                            Uydu
                        </div>
                   </div>
               ) : (
                   <div onClick={() => setMapStyle('roadmap')} className="w-full h-full relative bg-[#F8F9FA]">
                        <div className="absolute inset-0 grid grid-cols-2 gap-0.5 p-1 opacity-50">
                            <div className="bg-blue-200 rounded-sm"></div><div className="bg-gray-200 rounded-sm"></div>
                            <div className="bg-gray-200 rounded-sm"></div><div className="bg-green-200 rounded-sm"></div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-white/80 text-slate-800 text-[10px] font-bold text-center py-0.5 backdrop-blur-sm">
                            Harita
                        </div>
                   </div>
               )}
          </div>
      </div>

      {/* Zoom Controls (Bottom Right) */}
      <div className="absolute bottom-8 right-4 z-[500] flex flex-col gap-2">
          <div className="bg-white rounded shadow-md border border-slate-100 flex flex-col">
               <button className="w-9 h-9 flex items-center justify-center text-slate-600 hover:text-black hover:bg-slate-50 border-b border-slate-100 transition-colors">
                   <Plus className="h-5 w-5" />
               </button>
               <button className="w-9 h-9 flex items-center justify-center text-slate-600 hover:text-black hover:bg-slate-50 transition-colors">
                   <Minus className="h-5 w-5" />
               </button>
          </div>
          <button className="w-9 h-9 bg-white rounded shadow-md border border-slate-100 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors">
               <Navigation className="h-5 w-5 fill-current transform rotate-45" />
          </button>
      </div>

      {/* Map Content Area */}
      <div className="flex-1 w-full relative bg-[#F8F9FA] z-0">
         <MapContainer 
            center={[41.0082, 28.9784]} 
            zoom={10} 
            scrollWheelZoom={true} 
            style={{ height: '100%', width: '100%' }}
            attributionControl={false}
            zoomControl={false} 
         >
            {/* GOOGLE MAPS LAYERS */}
            {mapStyle === 'roadmap' ? (
                 <TileLayer
                    url="https://mt0.google.com/vt/lyrs=m&hl=tr&x={x}&y={y}&z={z}"
                    maxZoom={20}
                 />
            ) : (
                 <TileLayer
                    // Hybrid: s = satellite, h = roads/labels
                    url="https://mt0.google.com/vt/lyrs=y&hl=tr&x={x}&y={y}&z={z}"
                    maxZoom={20}
                 />
            )}
            
            <MapController bounds={mapBounds} />

            {/* Render Heatmap Layer Overlay */}
            {showHeatmap && (
                <HeatmapLayer points={renderPoints} />
            )}

            {/* Render Districts (Polygons) - Google Style */}
            {isIstanbul && Object.entries(ISTANBUL_DISTRICTS).map(([name, poly]) => {
                const isSelected = selectedDistrict === name;
                return (
                    <Polygon 
                        key={name}
                        positions={poly}
                        pathOptions={{
                            color: isSelected ? '#EA4335' : (mapStyle === 'satellite' ? '#fff' : '#5F6368'),
                            weight: isSelected ? 2 : 1,
                            dashArray: isSelected ? undefined : '4, 4',
                            fillColor: isSelected ? '#EA4335' : 'transparent',
                            fillOpacity: isSelected ? 0.08 : 0
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
                         {isSelected && (
                             <Tooltip permanent direction="center" opacity={1} className="google-tooltip">
                                <span className="text-sm font-medium text-[#EA4335] drop-shadow-sm px-1 py-0.5 bg-white/90 rounded border border-[#EA4335]/20 shadow-sm">
                                    {name}
                                </span>
                            </Tooltip>
                        )}
                    </Polygon>
                )
            })}
            
            {/* RENDER MARKERS */}
            {!showHeatmap && renderPoints.map((p, i) => {
                return (
                    <Marker 
                        key={`${p.type}-${p.id}-${i}`} 
                        position={[p.lat, p.lng]} 
                        icon={radarIcon}
                    >
                        <Popup className="google-popup" closeButton={false} offset={[0, -20]}>
                            <div className="w-[240px]">
                                <div className="p-0">
                                    {/* Google Info Window Style */}
                                    <div className="border-b border-slate-100 pb-2 mb-2">
                                        <h4 className="font-medium text-slate-800 text-sm leading-tight">{p.id}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">{p.lat.toFixed(5)}, {p.lng.toFixed(5)}</p>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-slate-700 uppercase">Referans Kaydı</span>
                                            <span className="text-[10px] text-slate-500">Kara listede mevcut</span>
                                        </div>
                                    </div>

                                    <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-[10px] text-blue-600 hover:underline cursor-pointer font-medium">Bu konumu ara</span>
                                        <span className="text-[10px] text-blue-600 hover:underline cursor-pointer font-medium">Yakındakileri kaydet</span>
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
         </MapContainer>

         {/* Google Logo / Attribution */}
         <div className="absolute bottom-1 left-20 z-[400] pointer-events-none select-none opacity-80">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/368px-Google_2015_logo.svg.png" alt="Google" className="h-4" />
         </div>
         <div className="absolute bottom-1 right-20 z-[400] pointer-events-none select-none text-[10px] text-slate-600">
             Harita verileri ©2025 Google
         </div>
      </div>

      <style>{`
        .google-tooltip {
            background: transparent;
            border: none;
            box-shadow: none;
        }
        .google-tooltip::before {
            display: none;
        }
        /* Google Style Popup */
        .leaflet-popup-content-wrapper {
            border-radius: 8px;
            box-shadow: 0 2px 7px 1px rgba(0,0,0,0.3);
            padding: 0;
            overflow: hidden;
            background: #fff;
            font-family: Roboto, Arial, sans-serif;
        }
        .leaflet-popup-content {
            margin: 16px;
            width: auto !important;
        }
        .leaflet-popup-tip {
            background: #fff;
            box-shadow: 0 2px 7px 1px rgba(0,0,0,0.3);
        }
        .leaflet-container {
             font-family: Roboto, Arial, sans-serif;
             background: #F8F9FA;
        }

        /* RADAR PIN STYLES */
        .radar-marker {
            position: relative;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .radar-dot {
            width: 12px;
            height: 12px;
            background-color: #EF4444; /* Red-500 */
            border: 2px solid white;
            border-radius: 50%;
            z-index: 2;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .radar-wave {
            position: absolute;
            width: 100%;
            height: 100%;
            background-color: rgba(239, 68, 68, 0.6);
            border-radius: 50%;
            z-index: 1;
            animation: radar-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes radar-ping {
            0% { transform: scale(0.5); opacity: 1; }
            100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default HotspotPanel;