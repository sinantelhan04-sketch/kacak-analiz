import React, { useMemo, useEffect } from 'react';
import { RiskScore, Hotspot, ReferenceLocation } from '../types';
import { Map as MapIcon, Navigation, AlertTriangle, XCircle, Filter, MapPin, Search, AlertOctagon, Layers } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
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

// --- Custom Icons ---
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
  
  // 1. Points to Render: Show ONLY Reference Locations (Known Fraud)
  const renderPoints = useMemo(() => {
    const combined = [];
    referenceLocations.forEach(r => {
        if(r.lat !== 0 && r.lng !== 0) {
            combined.push({ ...r, type: 'Reference', score: 100 });
        }
    });
    return combined;
  }, [referenceLocations]);

  // 2. Calculate Map Bounds based on Selection
  const mapBounds = useMemo<L.LatLngBoundsExpression | null>(() => {
    let pointsToFit: {lat: number, lng: number}[] = [];

    // If a district is selected
    if (selectedDistrict) {
        // A. Try to find points in riskData belonging to this district 
        // (We use riskData for geography even if we don't render them all, to get accurate district bounds)
        const districtPoints = riskData.filter(r => r.district === selectedDistrict && r.location.lat !== 0);
        
        if (districtPoints.length > 0) {
            pointsToFit = districtPoints.map(d => d.location);
        } 
        // B. Fallback: If it's a known Istanbul district polygon
        else if (ISTANBUL_DISTRICTS[selectedDistrict]) {
             const poly = ISTANBUL_DISTRICTS[selectedDistrict];
             return L.latLngBounds(poly); // Return polygon bounds directly
        }
    } else {
        // If NO district selected (City View), fit to all data points (References + Risks)
        // to show the full extent of the city
        const allRisks = riskData.filter(r => r.location.lat !== 0).map(r => r.location);
        const allRefs = referenceLocations.filter(r => r.lat !== 0).map(r => ({lat: r.lat, lng: r.lng}));
        pointsToFit = [...allRisks, ...allRefs];
    }

    // Default fallback if no data
    if (pointsToFit.length === 0) {
        // Default Istanbul view
        return [[40.8, 28.6], [41.2, 29.4]];
    }

    // Calculate Min/Max for bounds
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    pointsToFit.forEach(p => {
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
        if (p.lng < minLng) minLng = p.lng;
        if (p.lng > maxLng) maxLng = p.lng;
    });

    return [[minLat, minLng], [maxLat, maxLng]];
  }, [selectedDistrict, riskData, referenceLocations]);


  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (onDistrictSelect) {
          onDistrictSelect(val === "" ? null : val);
      }
  };

  const isIstanbul = detectedCity.toUpperCase().includes('ISTANBUL') || detectedCity.toUpperCase().includes('İSTANBUL');

  // Use passed availableDistricts if present, otherwise fallback to Istanbul constant keys
  const districtList = availableDistricts.length > 0 ? availableDistricts : Object.keys(ISTANBUL_DISTRICTS);

  return (
    <div className="bg-white rounded-[30px] border border-slate-200 shadow-sm flex flex-col h-full relative overflow-hidden group">
      
      {/* Header / Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[500] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pointer-events-none">
          
          {/* Title Card */}
          <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-slate-200 pointer-events-auto transition-transform hover:scale-105 duration-300">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-red-500 to-orange-500 p-2 rounded-xl shadow-lg shadow-orange-500/20">
                        <MapIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">Coğrafi Risk Haritası</h3>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 font-medium uppercase">
                            {selectedDistrict ? selectedDistrict : `TÜM ${detectedCity}`}
                        </p>
                    </div>
                </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 pointer-events-auto">
             <div className="relative group/select shadow-lg rounded-xl">
                 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="h-4 w-4" />
                 </div>
                 <select 
                    value={selectedDistrict || ""} 
                    onChange={handleDistrictChange}
                    className="pl-9 pr-8 py-2.5 bg-white/90 backdrop-blur-md border-none rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 appearance-none cursor-pointer min-w-[160px]"
                 >
                     <option value="">Tüm {detectedCity}</option>
                     {districtList.sort().map(d => (
                         <option key={d} value={d}>{d}</option>
                     ))}
                 </select>
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Layers className="h-3 w-3" />
                 </div>
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

      {/* Map Content Area */}
      <div className="flex-1 w-full relative bg-slate-50 z-0">
         <MapContainer 
            // Default center, will be overridden by MapController
            center={[41.0082, 28.9784]} 
            zoom={10} 
            scrollWheelZoom={true} 
            style={{ height: '100%', width: '100%' }}
            attributionControl={false}
            zoomControl={false} 
         >
            {/* Elegant Map Tiles (CartoDB Voyager - cleaner than Positron) */}
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            
            <MapController bounds={mapBounds} />

            {/* Render Districts - ONLY IF ISTANBUL (Because we only have polygons for Istanbul) */}
            {isIstanbul && Object.entries(ISTANBUL_DISTRICTS).map(([name, poly]) => {
                const isSelected = selectedDistrict === name;
                
                return (
                    <Polygon 
                        key={name}
                        positions={poly}
                        pathOptions={{
                            color: isSelected ? '#F43F5E' : '#94A3B8', // Rose-500 or Slate-400
                            weight: isSelected ? 2 : 1,
                            dashArray: isSelected ? undefined : '4, 8',
                            fillColor: isSelected ? '#F43F5E' : 'transparent',
                            fillOpacity: isSelected ? 0.1 : 0.0,
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
            
            {/* Render Points - ONLY REFERENCE POINTS */}
            {renderPoints.map((p, i) => {
                return (
                    <Marker 
                        key={`${p.type}-${i}`} 
                        position={[p.lat, p.lng]} 
                        icon={redPulseIcon}
                    >
                        <Popup className="custom-popup" closeButton={false}>
                            <div className="p-0.5 min-w-[180px]">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-red-100">
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-red-100">
                                        <AlertOctagon className="h-3.5 w-3.5 text-red-600" />
                                    </div>
                                    <div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                                            Referans Kayıt
                                        </div>
                                        <div className="font-bold text-slate-800 text-xs leading-none mt-0.5">{p.id}</div>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 p-1.5 rounded-md border border-slate-100">
                                        <MapPin className="h-3 w-3 text-slate-400" />
                                        <span className="font-mono">{p.lat.toFixed(5)}, {p.lng.toFixed(5)}</span>
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