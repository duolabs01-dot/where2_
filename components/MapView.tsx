
import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import Supercluster from 'supercluster';
import { GlassCard, PageWrapper, OptimizedImage, GlassSheet } from './Layouts';
import { usePreciseLocation, PreciseLocation } from '../lib/location';
import { supabase } from '../supabase';
import { Place } from '../types';
import { enrichPlacesWithImages } from '../utils/imageEnricher';
import { PlaceDetailSheet } from './PlaceDetailSheet';
import { showToast } from '../utils/toast';
import { checkTimeFilter, isPlaceOpenNow } from '../lib/timeFilter';
import { useExploreState } from '../lib/exploreState';
import { useFilters } from '../lib/filtersStore';
import { SmartFilterBar } from './SmartFilterBar';
import { AnimatePresence, motion } from 'framer-motion';
import { useHaptic } from '../utils/animations';
import { TransportModeSheet } from './TransportModeSheet';
import { getPlaceImageUrl } from '../utils/placeholders';
import { themeTokens } from './ThemeProvider';

const MarkerCompat = Marker as any;
const MapContainerCompat = MapContainer as any;
const TileLayerCompat = TileLayer as any;
const CircleCompat = Circle as any;

// --- Constants ---
const CACHE_KEY = 'where2_places_cache';
const MAP_RADIUS_STEPS = [2000, 5000, 10000, 30000, 50000, 100000]; // Up to 100km

// --- Distance Helper ---
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; 
};

// --- Custom Components ---

const FitBounds: React.FC<{ venues: Place[]; userLocation: PreciseLocation | null; trigger: number }> = ({ venues, userLocation, trigger }) => {
  const map = useMap();

  useEffect(() => {
    if (venues.length > 0 && userLocation) {
      const points = venues
        .filter((v) => typeof v.latitude === 'number' && typeof v.longitude === 'number')
        .map(v => [v.latitude!, v.longitude!] as [number, number]);
      
      points.push([userLocation.latitude, userLocation.longitude]);

      if (points.length > 0) {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true, duration: 1.5 });
      }
    }
  }, [map, trigger, userLocation, venues]); 

  return null;
};

// --- Map Events Handler ---
const MapClickHandler: React.FC<{ onClear: () => void }> = ({ onClear }) => {
    useMapEvents({
        click: (e) => {
            // Only clear if clicking the map directly (Leaflet handles this, but we ensure specificity)
            onClear();
        },
    });
    return null;
};

// --- Smart Venue Marker (No Popup) ---
interface VenueMarkerProps {
  place: Place;
  userLocation: PreciseLocation | null;
  onSelect: (p: Place) => void;
}

const VenueMarker: React.FC<VenueMarkerProps> = ({ place, onSelect }) => {
    const isOpen = isPlaceOpenNow(place);
    const isTrending = (place.price_level || 0) > 2;
    const rating = 4.0 + (place.name.length % 10) / 10;
    
    const markerColor = isOpen ? '#10B981' : '#EF4444';
    const markerSize = isTrending ? 44 : 36;
    
    return (
        <MarkerCompat
            position={[place.latitude!, place.longitude!]}
            icon={L.divIcon({
                className: 'venue-marker-icon',
                html: `
                  <div style="
                    width: ${markerSize}px;
                    height: ${markerSize}px;
                    border-radius: 50%;
                    background: ${markerColor};
                    border: 3px solid #000;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                    transition: transform 0.2s;
                  ">
                    ${isTrending ? `<div style="position: absolute; top: -2px; right: -2px; width: 12px; height: 12px; background: #FF5050; border: 2px solid #000; border-radius: 50%;"></div>` : ''}
                    <div style="font-size: ${isTrending ? '14px' : '12px'}; color: white; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">
                      ${rating >= 4.5 ? '★' : rating.toFixed(1)}
                    </div>
                  </div>
                `,
                iconSize: [markerSize, markerSize],
                iconAnchor: [markerSize / 2, markerSize / 2],
            })}
            eventHandlers={{
                click: (e) => {
                    L.DomEvent.stopPropagation(e); // Stop map click event
                    onSelect(place);
                }
            }}
        />
    );
};

const ClusterLayer: React.FC<{ 
  places: Place[]; 
  onSelectPlace: (p: Place) => void;
  mapRef: L.Map | null;
  userLocation: PreciseLocation | null;
}> = ({ places, onSelectPlace, mapRef, userLocation }) => {
  const [clusters, setClusters] = useState<any[]>([]);
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);
  const [zoom, setZoom] = useState(13);
  
  const supercluster = useMemo(() => {
    const index = new Supercluster({
      radius: 50,
      maxZoom: 16,
    });

    const points = places
      .map(p => ({
        type: 'Feature' as const,
        properties: { cluster: false, placeId: p.id, category: p.category },
        geometry: {
          type: 'Point' as const,
          coordinates: [p.longitude!, p.latitude!]
        }
      }));

    index.load(points);
    return index;
  }, [places]);

  const MapEvents = () => {
    const map = useMapEvents({
      moveend: () => {
        const b = map.getBounds();
        setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
        setZoom(map.getZoom());
      },
      zoomend: () => setZoom(map.getZoom())
    });
    
    useEffect(() => {
        if (!bounds && map) {
             const b = map.getBounds();
             setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
             setZoom(map.getZoom());
        }
    }, [map]);
    return null;
  };

  useEffect(() => {
    if (bounds && supercluster) {
      const expansionZoom = Math.min(zoom, 17);
      const clusters = supercluster.getClusters(bounds, expansionZoom);
      setClusters(clusters);
    }
  }, [bounds, zoom, supercluster]);

  return (
    <>
      <MapEvents />
      {clusters.map((cluster) => {
        const [longitude, latitude] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count: pointCount } = cluster.properties;

        if (isCluster) {
          return (
            <MarkerCompat
              key={`cluster-${cluster.id}`}
              position={[latitude, longitude]}
              icon={L.divIcon({
                html: `<div class="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 backdrop-blur-md border-2 border-primary text-primary font-bold text-xs shadow-glass shadow-primary/20 transition-transform hover:scale-110">
                         +${pointCount}
                       </div>`,
                className: 'custom-cluster-marker marker-bounce-enter',
                iconSize: [40, 40]
              })}
              eventHandlers={{
                click: () => {
                  const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(cluster.id), 17);
                  mapRef?.flyTo([latitude, longitude], expansionZoom, { animate: true, duration: 0.8 });
                }
              }}
            />
          );
        }

        const placeId = cluster.properties.placeId;
        const place = places.find(p => p.id === placeId);
        if (!place) return null;

        return (
            <VenueMarker 
                key={`place-${placeId}`}
                place={place}
                userLocation={userLocation}
                onSelect={onSelectPlace}
            />
        );
      })}
    </>
  );
};

// --- Map Preview Card ---
const MapPreviewCard: React.FC<{ 
    place: Place; 
    onClose: () => void; 
    onNavigate: () => void;
    onExpand: () => void;
    userLocation: PreciseLocation | null;
}> = ({ place, onClose, onNavigate, onExpand, userLocation }) => {
    const isOpen = isPlaceOpenNow(place);
    let distanceStr = 'Nearby';
    if (userLocation && typeof place.latitude === 'number' && typeof place.longitude === 'number') {
        const d = calculateDistance(userLocation.latitude, userLocation.longitude, place.latitude, place.longitude);
        distanceStr = d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
    }
    const price = place.price_level ? 'R'.repeat(place.price_level) : 'RR';
    const rating = 4.0 + (place.name.length % 10) / 10; // Mock
    const displayImage = getPlaceImageUrl(place);

    return (
        <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute left-4 right-4 z-[500]"
            style={{ bottom: 'calc(var(--bottom-nav-safe) + 8px)' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 100 }}
            onDragEnd={(e, { offset, velocity }) => {
                if (offset.y > 50 || velocity.y > 0.5) onClose();
            }}
        >
            <GlassCard 
                className={`p-0 ${themeTokens.surface}/95 backdrop-blur-2xl border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden`}
                onClick={onExpand}
            >
                {/* Drag Handle */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full z-20" />

                <div className="flex">
                    {/* Left Image Thumbnail */}
                    <div className="w-24 h-auto relative shrink-0 bg-gray-800">
                        <OptimizedImage src={displayImage} alt={place.name} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0F1012]/95" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 pl-0 flex flex-col justify-between min-w-0">
                        <div>
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-lg text-white truncate pr-2">{place.name}</h3>
                                <div className="flex items-center gap-1 text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-yellow-400 font-bold shrink-0">
                                    <span>★</span>{rating.toFixed(1)}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                <span className="font-medium text-white">{place.category}</span>
                                <span>•</span>
                                <span>{distanceStr}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-3">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${isOpen ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                {isOpen ? 'Open Now' : 'Closed'}
                            </span>
                            <span className="text-xs font-mono text-gray-500 font-bold">{price}</span>
                        </div>
                    </div>
                </div>

                {/* Primary CTA */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onNavigate();
                    }}
                    className="w-full bg-primary hover:bg-primary-dark text-black font-bold text-sm py-3.5 flex items-center justify-center gap-2 transition-colors active:bg-primary-dark/80"
                >
                    <span className="material-symbols-outlined text-lg">near_me</span>
                    Go there
                </button>
            </GlassCard>
        </motion.div>
    );
};

export const MapView: React.FC<{ userCity?: string; onRequireAuth?: (action?: () => void) => void }> = ({ userCity = 'Johannesburg', onRequireAuth }) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use Global Filter Store
  const { 
      state: filterState, 
      setRadiusMeters, 
      setOpenNowOnly, 
      resetFilters 
  } = useFilters();

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showFullDetails, setShowFullDetails] = useState(false); // Controls full sheet
  const [transportPlace, setTransportPlace] = useState<Place | null>(null); // Controls transport sheet
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(true);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const { location } = usePreciseLocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  });
  
  const { trigger } = useHaptic();

  const { state: exploreState, setFocusedPlace } = useExploreState();

  useEffect(() => {
      setRefreshTick(prev => prev + 1);
  }, [filterState.radiusMeters, filterState.openNowOnly, places.length]);

  useEffect(() => {
    const fetchPlaces = async () => {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        setPlaces(JSON.parse(cached));
        setIsLoadingPlaces(false);
      }

      try {
        const { data, error } = await supabase.from('places').select('*');
        if (error) throw error;
        
        if (data) {
          const enriched = await enrichPlacesWithImages(data as Place[]);
          setPlaces(enriched);
          localStorage.setItem(CACHE_KEY, JSON.stringify(enriched));
        }
      } catch (err) {
        console.error('Error fetching places:', err);
      } finally {
        setIsLoadingPlaces(false);
      }
    };
    fetchPlaces();
  }, []);

  useEffect(() => {
    if (exploreState.focusedPlaceId && !isLoadingPlaces && places.length > 0 && map) {
        const target = places.find(p => p.id === exploreState.focusedPlaceId);
        if (target && typeof target.latitude === 'number' && typeof target.longitude === 'number') {
            map.flyTo([target.latitude, target.longitude], 16, {
                animate: true,
                duration: 1.5
            });
            setSelectedPlace(target);
            setFocusedPlace(undefined);
        }
    }
  }, [exploreState.focusedPlaceId, places, isLoadingPlaces, map]);

  const handleRecenter = () => {
    trigger();
    if (map && location) {
      map.flyTo([location.latitude, location.longitude], 15, {
        animate: true,
        duration: 1.5,
        easeLinearity: 0.25
      });
      setRecenterTrigger(prev => prev + 1);
      showToast('Centered on your location', 'info');
    } else {
        showToast('Waiting for GPS signal...', 'info');
    }
  };

  const handleSelectPlace = (p: Place) => {
      trigger();
      setSelectedPlace(p);
      // Optional: slight pan to marker
      if (map && typeof p.latitude === 'number' && typeof p.longitude === 'number') {
          map.flyTo([p.latitude, p.longitude], map.getZoom(), { animate: true, duration: 0.8 });
      }
  };

  const handleNavigate = (p: Place) => {
      setTransportPlace(p);
  };

  const handleDriveInternal = () => {
      // In MapView, we are already on the map.
      // Just close the sheet and maybe zoom in to the location.
      if (transportPlace && map && typeof transportPlace.latitude === 'number' && typeof transportPlace.longitude === 'number') {
          map.flyTo([transportPlace.latitude, transportPlace.longitude], 17, { animate: true });
          showToast('Destination centered', 'success');
      }
      setTransportPlace(null);
  };

  // --- Filter Logic ---
  const filteredPlaces = useMemo(() => {
    const timeFilter = filterState.openNowOnly ? 'now' : 'any';
    const query = searchQuery.toLowerCase().trim();

    return places.filter(p => {
        if (location && typeof p.latitude === 'number' && typeof p.longitude === 'number') {
            const dist = calculateDistance(location.latitude, location.longitude, p.latitude, p.longitude);
            if ((dist * 1000) > filterState.radiusMeters) return false;
        }

        if (filterState.categories.length > 0 && !filterState.categories.includes('All')) {
             if (!p.category) return false;
             const matches = filterState.categories.some(cat => p.category.toLowerCase().includes(cat.toLowerCase()));
             if (!matches) return false;
        }

        if (query) {
            const matchesName = p.name.toLowerCase().includes(query);
            const matchesCat = p.category?.toLowerCase().includes(query);
            if (!matchesName && !matchesCat) return false;
        }

        return checkTimeFilter(p, timeFilter);
    });
  }, [places, filterState, location, searchQuery]);

  const activeRadiusIndex = MAP_RADIUS_STEPS.indexOf(filterState.radiusMeters);

  // Find closest step if not exact match (handle legacy values)
  const safeRadiusIndex = activeRadiusIndex >= 0 ? activeRadiusIndex : 0;

  return (
    <PageWrapper className="relative w-full h-full bg-background text-white isolate min-h-0 min-w-0">
      
      {/* --- Top Bar Overlay --- */}
      <div className="absolute top-0 left-0 right-0 z-[1000]">
          <SmartFilterBar 
             userCity={userCity}
             location={location}
             radius={filterState.radiusMeters}
             activeTime={filterState.openNowOnly ? 'now' : 'any'}
             onOpenLocationSheet={() => setShowSettingsSheet(true)}
             onSearch={setSearchQuery}
             resultCount={filteredPlaces.length}
             refreshTick={refreshTick}
             isCollapsed={false}
             activeCategories={filterState.categories}
             isDefaultRadius={filterState.radiusMeters === 2000}
          />
      </div>

      {/* Recenter FAB (Vibey Glass) - Moved up to avoid fixed nav overlap */}
      <div
        className="absolute right-4 z-[400] pointer-events-auto"
        style={{ bottom: 'calc(var(--bottom-nav-safe) + 12px)' }}
      >
          <button
            onClick={handleRecenter}
            className="size-14 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-white shadow-[0_0_25px_rgba(0,0,0,0.5)] flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all group"
          >
              <span className="material-symbols-outlined text-2xl group-hover:text-primary transition-colors">navigation</span>
              {/* Inner glow pulse */}
              <span className="absolute inset-0 rounded-full border border-white/5 animate-ping opacity-20 pointer-events-none"></span>
          </button>
      </div>

      {/* --- Map Container --- */}
      <MapContainerCompat 
        center={[-26.2041, 28.0473]} 
        zoom={13} 
        zoomControl={false} 
        className="absolute inset-0 z-0 block bg-background"
        ref={setMap}
      >
        <TileLayerCompat
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />

        <MapClickHandler onClear={() => setSelectedPlace(null)} />

        {location && (
          <>
            <CircleCompat 
                center={[location.latitude, location.longitude]}
                radius={location.accuracy}
                pathOptions={{
                    color: '#10B981', 
                    fillColor: '#10B981',
                    fillOpacity: 0.15,
                    weight: 0,
                    className: 'animate-pulse-slow'
                }}
            />
            
            <MarkerCompat 
              position={[location.latitude, location.longitude]} 
              icon={L.divIcon({
                className: 'user-location-marker',
                html: `
                  <div class="relative flex items-center justify-center size-6">
                    <div class="absolute size-full rounded-full bg-primary/30 animate-pulse-ring"></div>
                    <div class="relative size-4 bg-primary border-2 border-white rounded-full shadow-[0_0_15px_var(--color-primary)] z-10"></div>
                  </div>
                `,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })}
              zIndexOffset={1000}
            />
          </>
        )}

        <FitBounds venues={filteredPlaces} userLocation={location} trigger={recenterTrigger} />

        <ClusterLayer 
            places={filteredPlaces} 
            onSelectPlace={handleSelectPlace}
            mapRef={map}
            userLocation={location}
        />

      </MapContainerCompat>

      {/* --- Selected Place Card (Bottom Sheet Style) --- */}
      <AnimatePresence>
        {selectedPlace && !showFullDetails && (
            <MapPreviewCard 
                key={selectedPlace.id}
                place={selectedPlace}
                userLocation={location}
                onClose={() => setSelectedPlace(null)}
                onNavigate={() => handleNavigate(selectedPlace)}
                onExpand={() => setShowFullDetails(true)}
            />
        )}
      </AnimatePresence>

      {/* --- Full Details Sheet (If Expanded) --- */}
      {showFullDetails && (
          <PlaceDetailSheet 
            place={selectedPlace} 
            onClose={() => setShowFullDetails(false)} 
            onRequireAuth={onRequireAuth || (() => {})}
          />
      )}

      {/* --- Transport Sheet (For Navigation) --- */}
      <AnimatePresence>
        {transportPlace && (
            <TransportModeSheet 
                place={transportPlace} 
                onClose={() => setTransportPlace(null)} 
                onDrive={handleDriveInternal}
            />
        )}
      </AnimatePresence>

      {/* --- Search Settings Sheet (Map Context) --- */}
      <AnimatePresence>
        {showSettingsSheet && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 z-[1100] backdrop-blur-sm"
                    onClick={() => setShowSettingsSheet(false)}
                />
                
                <GlassSheet className="fixed bottom-0 z-[1101] w-full h-[60vh] flex flex-col !p-0 overflow-hidden rounded-t-[32px]">
                    <div className="flex flex-col w-full h-full">
                        <div className="px-6 pb-4 pt-6 flex justify-between items-center shrink-0 border-b border-white/5 bg-surface/50 backdrop-blur-md">
                            <h3 className="font-display font-bold text-xl text-white">Map Settings</h3>
                            <button onClick={() => setShowSettingsSheet(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20">
                                <span className="material-symbols-outlined text-white text-lg">close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-safe overscroll-contain">
                            <div className="pb-safe space-y-8"> 
                                {/* Radius Slider (Extended for Map) */}
                                <div>
                                    <div className="flex justify-between mb-4">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Search Radius</label>
                                        <span className="text-primary font-bold text-sm">
                                            {filterState.radiusMeters >= 1000 ? `${filterState.radiusMeters/1000}km` : `${filterState.radiusMeters}m`}
                                        </span>
                                    </div>
                                    <div className="relative h-2 bg-white/10 rounded-full mb-6 mx-2">
                                        <div 
                                            className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-300" 
                                            style={{ width: `${(safeRadiusIndex / (MAP_RADIUS_STEPS.length - 1)) * 100}%` }} 
                                        />
                                        {MAP_RADIUS_STEPS.map((r, i) => (
                                            <button 
                                                key={r}
                                                onClick={() => setRadiusMeters(r)}
                                                className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 transition-all duration-300 z-10 ${
                                                    r === filterState.radiusMeters 
                                                    ? 'bg-primary border-white scale-110 shadow-[0_0_10px_rgba(var(--color-primary),0.5)]' 
                                                    : 'bg-[#121212] border-white/20'
                                                }`}
                                                style={{ left: `${(i / (MAP_RADIUS_STEPS.length - 1)) * 100}%`, transform: 'translate(-50%, -50%)' }}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-2">
                                        <span>2km</span>
                                        <span>100km</span>
                                    </div>
                                </div>

                                {/* Quick Toggles */}
                                <div className="space-y-3">
                                    <button 
                                        onClick={() => setOpenNowOnly(true)} 
                                        className={`w-full flex justify-between items-center p-4 rounded-xl border transition-all ${filterState.openNowOnly ? 'bg-primary/20 border-primary text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined">schedule</span>
                                            <div className="text-left">
                                                <p className="font-bold text-sm">Open Now</p>
                                                <p className="text-xs opacity-70">Only show places open right now</p>
                                            </div>
                                        </div>
                                        {filterState.openNowOnly && <span className="material-symbols-outlined text-primary">check_circle</span>}
                                    </button>

                                    <button 
                                        onClick={() => setOpenNowOnly(false)} 
                                        className={`w-full flex justify-between items-center p-4 rounded-xl border transition-all ${!filterState.openNowOnly ? 'bg-primary/20 border-primary text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined">timelapse</span>
                                            <div className="text-left">
                                                <p className="font-bold text-sm">Open Soon / Any Time</p>
                                                <p className="text-xs opacity-70">Include places closed right now</p>
                                            </div>
                                        </div>
                                        {!filterState.openNowOnly && <span className="material-symbols-outlined text-primary">check_circle</span>}
                                    </button>

                                    <button 
                                        onClick={() => resetFilters()}
                                        className="w-full flex justify-between items-center p-4 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined">restart_alt</span>
                                            <div className="text-left">
                                                <p className="font-bold text-sm">Reset Filters</p>
                                                <p className="text-xs opacity-70">Return to default settings</p>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassSheet>
            </>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};
