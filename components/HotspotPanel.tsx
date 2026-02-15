import React, { useMemo, useEffect, useState } from 'react';
import { RiskScore, Hotspot, ReferenceLocation } from '../types';
import { Map as MapIcon, Navigation, AlertTriangle, XCircle, Filter, MapPin, Search, AlertOctagon, Layers, ThermometerSun, CircleDot, Siren } from 'lucide-react';
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
        duration: 1.5
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

      // Transform data for leaflet.heat: [lat, lng, intensity]
      const heatData = points.map(p => [p.lat, p.lng, p.intensity]);

      // Check if L.heatLayer exists (it comes from the import)
      // @ts-ignore
      if (typeof L.heatLayer !== 'function') {
          console.warn("Leaflet.heat not loaded");
          return;
      }

      // @ts-ignore
      const heat = L.heatLayer(heatData, {
          radius: 25,
          blur: 15,
          maxZoom: 13,
          minOpacity: 0.4,
          gradient: {
            0.2: 'blue',
            0.4: 'cyan',
            0.6: 'lime',
            0.8: 'yellow',
            1.0: 'red'
          }
      });

      heat.addTo(map);

      return () => {
          map.removeLayer(heat);
      };
    }, [points, map]);

    return null;
};

// --- Custom Icons (Blinking/Pulsing) ---
const redPulseIcon = L.divIcon({
  className: 'custom-div-icon',
  html: "<div class='radar-dot red'></div>",
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  popupAnchor: [0, -10]
});

const HotspotPanel: React.FC<HotspotPanelProps> = ({ 
    referenceLocations = [], 
    riskData = [], 
    selectedDistrict, 
    onDistrictSelect,
    detectedCity = 'İSTANBUL',
    availableDistricts = []
}) => {
  const [viewMode, setViewMode] = useState<'points' | 'heatmap'>('points'); // Default to points
  
  // 1. Points to Render: 
  // ONLY REFERENCES (Known Bad Actors) are shown as requested
  const renderPoints = useMemo(() => {
    const combined: any[] = [];
    
    // A. Add References (Known Bad Actors) - TYPE: Reference
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

  // 2. Calculate Map Bounds based on Selection
  const mapBounds = useMemo<L.LatLngBoundsExpression | null>(() => {
    let pointsToFit: {lat: number, lng: number}[] = [];

    if (selectedDistrict) {
        // In district mode, fit to district polygon if available
        if (ISTANBUL_DISTRICTS[selectedDistrict]) {
             const poly = ISTANBUL_DISTRICTS[selectedDistrict];
             return L.latLngBounds(poly);
        }
    } else {
        // Fit to all points
        pointsToFit = renderPoints.map(r => ({lat: r.lat, lng: r.lng}));
    }

    if (pointsToFit.length === 0) return [[40.8, 28.6], [41.2, 29.4]];

    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    pointsToFit.forEach(p => {
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

  // Count active points for display
  const activePointCount = renderPoints.length;

  return (
    <div className="bg-white rounded-[30px] border border-slate-200 shadow-sm flex flex-col h-full relative overflow-hidden group">
      
      {/* Header / Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[500] flex flex-col gap-4 pointer-events-none">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            {/* Title Card */}
            <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-slate-200 pointer-events-auto transition-transform hover:scale-105 duration-300">
                    <div className="flex items-center gap-3">
                        <div className={`bg-gradient-to-br p-2 rounded-xl shadow-lg ${viewMode === 'heatmap' ? 'from-orange-500 to-red-600 shadow-orange-500/20' : 'from-blue-500 to-indigo-600 shadow-blue-500/20'}`}>
                            {viewMode === 'heatmap' ? <ThermometerSun className="h-5 w-5 text-white" /> : <Siren className="h-5 w-5 text-white animate-pulse" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">{viewMode === 'heatmap' ? 'Referans Yoğunluğu' : 'Referans Noktaları'}</h3>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1 font-medium uppercase">
                                {selectedDistrict ? selectedDistrict : `TÜM ${detectedCity}`}
                                <span className="w-1 h-1 rounded-full bg-slate-300 mx-1"></span>
                                {activePointCount} Kayıt
                            </p>
                        </div>
                    </div>
            </div>

            {/* Controls Group */}
            <div className="flex items-center gap-2 pointer-events-auto">
                {/* View Mode Toggle */}
                <div className="bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-lg border border-slate-200 flex items-center gap-1">
                    <button 
                        onClick={() => setViewMode('points')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'points' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Nokta Görünümü (Yanıp Sönen)"
                    >
                        <CircleDot className="h-4 w-4" />
                    </button>
                    <button 
                        onClick={() => setViewMode('heatmap')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'heatmap' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Isı Haritası"
                    >
                        <ThermometerSun className="h-4 w-4" />
                    </button>
                </div>

                {/* District Filter */}
                <div className="relative group/select shadow-lg rounded-xl">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Search className="h-4 w-4" />
                    </div>
                    <select 
                        value={selectedDistrict || ""} 
                        onChange={handleDistrictChange}
                        className="pl-9 pr-8 py-2.5 bg-white/90 backdrop-blur-md border-none rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 appearance-none cursor-pointer min-w-[140px]"
                    >
                        <option value="">Tüm {detectedCity}</option>
                        {districtList.sort().map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>

                {selectedDistrict && (
                    <button 
                        onClick={() => onDistrictSelect && onDistrictSelect(null)}
                        className="p-2.5 bg-white/90 backdrop-blur-md text-red-500 rounded-xl border-none shadow-lg hover:bg-red-50 transition-colors"
                        title="Filtreyi Temizle"
                    >
                        <XCircle className="h-5 w-5" />
                    </button>
                )}
            </div>
          </div>
      </div>

      {/* Map Content Area */}
      <div className="flex-1 w-full relative bg-slate-50 z-0">
         <MapContainer 
            center={[41.0082, 28.9784]} 
            zoom={10} 
            scrollWheelZoom={true} 
            style={{ height: '100%', width: '100%' }}
            attributionControl={false}
            zoomControl={false} 
         >
            {/* Elegant Map Tiles */}
            <TileLayer
                url={viewMode === 'heatmap' 
                    ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"}
            />
            
            <MapController bounds={mapBounds} />

            {/* Render Heatmap Layer if Mode is Heatmap */}
            {viewMode === 'heatmap' && (
                <HeatmapLayer points={renderPoints} />
            )}

            {/* Render Districts (Polygons) */}
            {isIstanbul && Object.entries(ISTANBUL_DISTRICTS).map(([name, poly]) => {
                const isSelected = selectedDistrict === name;
                return (
                    <Polygon 
                        key={name}
                        positions={poly}
                        pathOptions={{
                            color: isSelected ? '#F43F5E' : '#94A3B8',
                            weight: isSelected ? 2 : 1,
                            dashArray: isSelected ? undefined : '4, 8',
                            fillColor: 'transparent',
                            opacity: isSelected ? 1 : 0.4
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
                             <Tooltip permanent direction="center" opacity={1} className="district-label-tooltip">
                                <span className="text-[10px] font-black tracking-widest text-rose-600 bg-white/90 px-3 py-1 rounded-full shadow-sm border border-rose-100">
                                    {name.toUpperCase()}
                                </span>
                            </Tooltip>
                        )}
                    </Polygon>
                )
            })}
            
            {/* 
                RENDER BLINKING MARKERS - ONLY REFERENCES
            */}
            {viewMode === 'points' && renderPoints.map((p, i) => {
                return (
                    <Marker 
                        key={`${p.type}-${p.id}-${i}`} 
                        position={[p.lat, p.lng]} 
                        icon={redPulseIcon}
                    >
                        <Popup className="custom-popup" closeButton={false}>
                            <div className="p-0.5 min-w-[200px]">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-red-600 bg-red-100">
                                        <AlertTriangle className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                                            Referans Kaydı (Sabıkalı)
                                        </div>
                                        <div className="font-bold text-slate-800 text-sm leading-tight mt-0.5">{p.id}</div>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                        <MapPin className="h-3 w-3 text-slate-400" />
                                        <span className="font-mono">{p.lat.toFixed(5)}, {p.lng.toFixed(5)}</span>
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-600 mt-1 bg-red-50 p-1.5 rounded text-red-700 leading-snug">
                                        Kara Liste / Referans
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
         </MapContainer>

         {/* Legend / Info Footer */}
         <div className="absolute bottom-6 left-6 z-[500] pointer-events-none">
             <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-xl flex flex-col gap-2.5 pointer-events-auto">
                 {viewMode === 'heatmap' ? (
                     <div className="flex flex-col gap-1.5 min-w-[120px]">
                         <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Referans Yoğunluğu</span>
                         <div className="h-2 w-full rounded-full bg-gradient-to-r from-blue-400 via-yellow-400 to-red-600"></div>
                         <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                             <span>Seyrek</span>
                             <span>Yoğun</span>
                         </div>
                     </div>
                 ) : (
                     <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-3">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white box-content"></span>
                            </span>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-700">Referans Noktası</span>
                                <span className="text-[9px] text-slate-400">Sabıkalı / Kara Liste</span>
                            </div>
                         </div>
                     </div>
                 )}
             </div>
         </div>
      </div>

      <style>{`
        .district-label-tooltip {
            background: transparent;
            border: none;
            box-shadow: none;
        }
        .district-label-tooltip::before {
            display: none;
        }
        .leaflet-popup-content-wrapper {
            border-radius: 16px;
            box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.15);
            padding: 0;
            overflow: hidden;
        }
        .leaflet-popup-content {
            margin: 12px;
            width: auto !important;
        }
        .leaflet-popup-tip {
            background: white;
        }
        .leaflet-container {
             font-family: inherit;
        }
      `}</style>
    </div>
  );
};

export default HotspotPanel;