
import React, { useMemo, useEffect } from 'react';
import { RiskScore, Hotspot, ReferenceLocation } from '../types';
import { AlertTriangle, Search, ChevronDown, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ISTANBUL_DISTRICTS } from '../utils/fraudEngine';
import { DISTRICT_BOUNDS } from '../utils/weatherEngine';

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

const HotspotPanel: React.FC<HotspotPanelProps> = ({ 
    referenceLocations = [], 
    selectedDistrict, 
    onDistrictSelect,
    detectedCity = 'İSTANBUL',
    availableDistricts = []
}) => {
  // Helper for text normalization
  const normalizeTr = (text: string) => text.toLocaleUpperCase('tr').trim();

  // Memoize Icon to prevent re-creation issues, though divIcon is usually lightweight
  const radarIcon = useMemo(() => L.divIcon({
    className: 'radar-icon-container',
    html: `<div class="radar-marker">
              <div class="radar-wave"></div>
              <div class="radar-dot"></div>
           </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12], // Center the icon
    popupAnchor: [0, -10]
  }), []);
  
  // 1. Points to Render
  const renderPoints = useMemo(() => {
    const combined: any[] = [];
    referenceLocations.forEach(r => {
        // Strict check for valid coordinates
        if(typeof r.lat === 'number' && typeof r.lng === 'number' && r.lat !== 0 && r.lng !== 0) {
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

  // 2. Prepare District Shapes (Polygons or Rectangles)
  const districtPolygons = useMemo(() => {
      const shapes: Record<string, [number, number][]> = {};
      const cityKey = normalizeTr(detectedCity);

      // A. Prefer Detailed Polygons (Currently Istanbul only)
      if (cityKey === 'ISTANBUL') {
           Object.entries(ISTANBUL_DISTRICTS).forEach(([name, poly]) => {
               shapes[name] = poly;
           });
      }

      // B. Fallback to Bounding Boxes (Rectangles) from DISTRICT_BOUNDS
      const dbCityKey = Object.keys(DISTRICT_BOUNDS).find(k => normalizeTr(k) === cityKey);
      if (dbCityKey) {
          const districts = DISTRICT_BOUNDS[dbCityKey];
          Object.entries(districts).forEach(([dName, bounds]) => {
              const exists = Object.keys(shapes).some(k => normalizeTr(k) === normalizeTr(dName));
              if (!exists) {
                  const [minLat, maxLat, minLng, maxLng] = bounds;
                  shapes[dName] = [
                      [minLat, minLng],
                      [maxLat, minLng],
                      [maxLat, maxLng],
                      [minLat, maxLng]
                  ];
              }
          });
      }
      return shapes;
  }, [detectedCity]);

  // 3. Map Bounds Calculation
  const mapBounds = useMemo<L.LatLngBoundsExpression | null>(() => {
    if (selectedDistrict) {
        const normSelected = normalizeTr(selectedDistrict);
        const shapeKey = Object.keys(districtPolygons).find(k => normalizeTr(k) === normSelected);
        if (shapeKey) {
            return L.latLngBounds(districtPolygons[shapeKey]);
        }
    }

    if (renderPoints.length === 0) {
         return [[40.8, 28.6], [41.2, 29.4]];
    }

    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    renderPoints.forEach(p => {
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
        if (p.lng < minLng) minLng = p.lng;
        if (p.lng > maxLng) maxLng = p.lng;
    });

    return [[minLat, minLng], [maxLat, maxLng]];
  }, [selectedDistrict, renderPoints, districtPolygons]);

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (onDistrictSelect) {
          onDistrictSelect(val === "" ? null : val);
      }
  };

  const districtList = availableDistricts.length > 0 ? availableDistricts : Object.keys(districtPolygons);
  
  return (
    <div className="bg-white rounded-[28px] overflow-hidden flex flex-col h-full relative group font-sans border border-white/50 shadow-inner">
      
      {/* Simplified Search/Filter Bar */}
      <div className="absolute top-4 left-4 z-[500] w-[260px]">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 flex items-center h-10 px-3 transition-all hover:shadow-md">
             <Search className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
             <div className="flex-1 relative">
                <select 
                    value={selectedDistrict || ""} 
                    onChange={handleDistrictChange}
                    className="w-full bg-transparent text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer appearance-none py-1 pr-4"
                >
                    <option value="">{detectedCity} Geneli</option>
                    {districtList.sort().map(d => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="h-3 w-3 text-gray-400" />
                </div>
             </div>
             {selectedDistrict && (
                 <button 
                    onClick={() => onDistrictSelect && onDistrictSelect(null)}
                    className="ml-2 text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-red-50"
                 >
                    <X className="h-3 w-3" />
                 </button>
             )}
          </div>
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
             {/* Standard Google Roadmap Layer */}
             <TileLayer
                url="https://mt0.google.com/vt/lyrs=m&hl=tr&x={x}&y={y}&z={z}"
                maxZoom={20}
             />
            
            <MapController bounds={mapBounds} />

            {/* Districts */}
            {Object.entries(districtPolygons).map(([name, poly]) => {
                const isSelected = selectedDistrict && normalizeTr(selectedDistrict) === normalizeTr(name);
                return (
                    <Polygon 
                        key={name}
                        positions={poly}
                        pathOptions={{
                            color: isSelected ? '#EA4335' : '#9AA0A6',
                            weight: isSelected ? 2 : 1,
                            dashArray: isSelected ? undefined : '4, 4',
                            fillColor: isSelected ? '#EA4335' : 'transparent',
                            fillOpacity: isSelected ? 0.1 : 0
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
                                <span className="text-xs font-bold text-[#EA4335] drop-shadow-sm px-2 py-1 bg-white/95 rounded-md border border-[#EA4335]/20 shadow-sm">
                                    {name}
                                </span>
                            </Tooltip>
                        )}
                    </Polygon>
                )
            })}
            
            {/* Markers */}
            {renderPoints.map((p, i) => {
                return (
                    <Marker 
                        key={`${p.type}-${p.id}-${i}`} 
                        position={[p.lat, p.lng]} 
                        icon={radarIcon}
                    >
                        <Popup className="google-popup" closeButton={false} offset={[0, -20]} autoPan={false}>
                            <div className="w-[200px]">
                                <div className="p-0">
                                    <div className="border-b border-gray-100 pb-2 mb-2">
                                        <h4 className="font-bold text-gray-800 text-sm leading-tight">{p.id}</h4>
                                        <p className="text-[10px] text-gray-500 mt-0.5 font-mono">{p.lat.toFixed(5)}, {p.lng.toFixed(5)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-3 w-3 text-red-500" />
                                        <span className="text-[10px] font-bold text-gray-700 uppercase">Referans Kaydı</span>
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
         </MapContainer>

         {/* Minimal Google Attribution */}
         <div className="absolute bottom-2 right-2 z-[400] pointer-events-none select-none">
            <div className="bg-white/80 backdrop-blur-[2px] px-1.5 py-0.5 rounded text-[9px] text-gray-500 shadow-sm">
                Harita verileri ©2025 Google
            </div>
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
        .leaflet-popup-content-wrapper {
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            padding: 0;
            overflow: hidden;
            background: #fff;
        }
        .leaflet-popup-content {
            margin: 12px;
            width: auto !important;
        }
        .radar-marker {
            position: relative;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .radar-dot {
            width: 10px;
            height: 10px;
            background-color: #EA4335;
            border: 2px solid white;
            border-radius: 50%;
            z-index: 2;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .radar-wave {
            position: absolute;
            width: 100%;
            height: 100%;
            background-color: rgba(234, 67, 53, 0.3);
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
