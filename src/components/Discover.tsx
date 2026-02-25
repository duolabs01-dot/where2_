
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../supabase';
import { Place } from '../types';
import { Venue, RecommendationEngine, VenueScore } from '../lib/recommendationEngine';
import { PageWrapper, PullToRefresh, GlassSheet, CardSkeleton } from './Layouts';
import { PlaceDetailSheet } from './PlaceDetailSheet';
import { usePreciseLocation, calculateDistance } from '../lib/location';
import { VenueCard } from './VenueCard';
import { Session } from '@supabase/supabase-js';
import { getSmartTimeLabel, getVibeSentence, getCATNow, isPlaceOpenNow } from '../lib/timeFilter';
import { SmartFilterBar } from './SmartFilterBar';
import { motion, AnimatePresence } from 'framer-motion';
import { enrichPlacesWithImages } from '../utils/imageEnricher';
import { useExploreState } from '../lib/exploreState';
import { useFilters } from '../lib/filtersStore'; 
import { RadiusExpansionBanner } from './RadiusExpansionBanner';
import { showToast } from '../utils/toast';
import { getUserPrefs } from '../lib/preferenceEngine';
import { useHaptic } from '../utils/animations';
import { useTravelSheet } from '../hooks/useTravelSheet';

interface DiscoverProps {
  userCity: string;
  onCityChange: (city: string) => void;
  userPreferences: string[]; 
  onRequireAuth: (action?: () => void) => void;
  session: Session | null;
  initialIntent: any; 
  onSwitchToMap?: () => void;
}

// Adaptive Ladder: [600, 1500, 3000, 6000, 12000, 20000, 30000]
const ADAPTIVE_STEPS = [
  { radius: 600, label: '8-min walk' },
  { radius: 1500, label: '20-min walk' },
  { radius: 3000, label: '5-min ride' },
  { radius: 6000, label: '10-min ride' },
  { radius: 12000, label: 'short drive' },
  { radius: 20000, label: 'drive' },
  { radius: 30000, label: 'city wide' }
];

const EXPLORE_CATEGORIES = ['All', 'Nightlife', 'Dining', 'Cafe', 'Outdoors', 'Art', 'Music', 'Hidden Gems'];

const MUSIC_VIBES = [
    { id: 'Any', label: 'Any Vibe', color: 'bg-white/10 text-gray-400 border-white/5' },
    { id: 'Amapiano', label: 'Amapiano 🎹', color: 'bg-purple-500/10 text-purple-300 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]' },
    { id: 'Deep House', label: 'Deep House 🌊', color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]' },
    { id: 'Blues / Ballads', label: 'Blues / Ballads 🎷', color: 'bg-amber-500/10 text-amber-300 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]' },
];

export const Discover: React.FC<DiscoverProps> = ({ userCity, userPreferences, onSwitchToMap, onCityChange, initialIntent, onRequireAuth }) => {
  const { state: exploreState, setOrigin, setFocusedPlace } = useExploreState();
  const { state: filterState, setRadiusMeters, setOpenNowOnly, toggleCategory, setCategories, setMode, resetFilters, setMusicVibe } = useFilters();

  const [venues, setVenues] = useState<Venue[]>([]);
  const [scores, setScores] = useState<VenueScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Adaptive State
  const [expansionLabel, setExpansionLabel] = useState<string | null>(null);
  const [isLaterMode, setIsLaterMode] = useState(false);

  const [refreshTick, setRefreshTick] = useState(0); 
  const [lastUpdated, setLastUpdated] = useState<Date>(getCATNow());
  const [currentTime, setCurrentTime] = useState<Date>(getCATNow());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const scrollTopRef = useRef(0); 
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);

  // Guards
  const lastRequestKeyRef = useRef<string>('');
  const isFetchingRef = useRef<boolean>(false);

  // Memoize stable preferences string
  const stablePrefsKey = useMemo(() => JSON.stringify(userPreferences), [userPreferences]);

  const { location, loading: locationLoading, strategy } = usePreciseLocation();
  const { trigger } = useHaptic();
  
  const timeLabel = getSmartTimeLabel();
  const vibeSentence = getVibeSentence(); 
  const engine = useMemo(() => new RecommendationEngine(supabase), []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getCATNow()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!locationLoading) {
      if (location) {
        setOrigin(location.latitude, location.longitude, 'gps');
      } else {
        setOrigin(-26.2041, 28.0473, 'fallback');
      }
    }
  }, [location, locationLoading]);

  // Initial Intent Handling
  useEffect(() => {
    if (initialIntent) {
        if (initialIntent.groupContext) setMode(initialIntent.groupContext);
        setOpenNowOnly(initialIntent.timeMode === 'open_now');
        if (initialIntent.categories) setCategories(initialIntent.categories);
        if (initialIntent.initialRadius) setRadiusMeters(initialIntent.initialRadius);
        // Force refresh on intent arrival
        setTimeout(() => fetchRecommendations(undefined, true), 100);
    }
  }, [initialIntent]);

  const fetchRecommendations = useCallback(async (overrideQuery?: string, forceRefresh: boolean = false) => {
    if (isFetchingRef.current && !forceRefresh) return;

    const currentQuery = overrideQuery !== undefined ? overrideQuery : searchQuery;
    const { lat, lng } = exploreState.origin;
    
    if (lat === 0 && lng === 0) return;

    // Check key to avoid duplicate fetch (except forceRefresh)
    const requestKey = JSON.stringify({
        lat: lat.toFixed(4), lng: lng.toFixed(4),
        radius: filterState.radiusMeters,
        openNow: filterState.openNowOnly,
        categories: [...filterState.categories].sort(),
        mode: filterState.mode,
        musicVibe: filterState.musicVibe,
        query: currentQuery.trim().toLowerCase(),
        prefs: stablePrefsKey 
    });

    if (!forceRefresh && requestKey === lastRequestKeyRef.current) return;

    setLoading(true);
    isFetchingRef.current = true;
    lastRequestKeyRef.current = requestKey;
    
    // Reset Expansion State
    setExpansionLabel(null);
    setIsLaterMode(false);

    const { categories: savedCats, vibes: learnedVibes } = getUserPrefs();
    const relevantPrefs = [...new Set([...savedCats, ...learnedVibes])];

    try {
        // 1. Fetch Candidates (Fetch Wide Pool if OpenNow is on, to allow adaptive shrink/expand)
        // If OpenNow is true, we ignore the manual radius filter during fetch to get enough candidates for adaptive logic.
        // Otherwise use the manual filter.
        const effectiveRadius = filterState.openNowOnly ? 30000 : filterState.radiusMeters;
        
        // Pass OpenNow=false to engine to get raw candidates, we will filter strictly client-side
        const rawResult = await engine.getTopPicks({
            location: { lat, lng },
            radius: effectiveRadius, 
            openNow: false, // We handle strict filtering here for adaptive logic
            categories: filterState.categories, 
            mode: filterState.mode, 
            musicVibe: filterState.musicVibe, 
            showAllVenues: false, 
            userPreferences: relevantPrefs,
            searchQuery: currentQuery
        });

        let finalVenues = rawResult.venues;
        let finalScores = rawResult.scores;

        // 2. Client-Side Processing & Adaptive Logic
        // Calculate Distance
        finalVenues = finalVenues.map(v => {
            let dist = v.dist_meters || 0;
            if (exploreState.origin.mode === 'gps' && v.latitude && v.longitude) {
                dist = calculateDistance(exploreState.origin.lat, exploreState.origin.lng, v.latitude, v.longitude) * 1000;
            }
            return { ...v, distanceNumeric: dist };
        });

        // 3. Apply Filtering Logic
        if (filterState.openNowOnly && !rawResult.isNameSearch) {
            // A. Strict Open Filter
            const openVenues = finalVenues.filter(v => isPlaceOpenNow(v));
            
            // B. Adaptive Radius Expansion
            let sufficientFound = false;
            let chosenStep = ADAPTIVE_STEPS[0];

            for (const step of ADAPTIVE_STEPS) {
                const countInRadius = openVenues.filter(v => (v.distanceNumeric || 0) <= step.radius).length;
                if (countInRadius >= 3) {
                    sufficientFound = true;
                    chosenStep = step;
                    break;
                }
                chosenStep = step; // Keep expanding
            }

            if (sufficientFound) {
                // Found enough open venues within a certain step
                finalVenues = openVenues.filter(v => (v.distanceNumeric || 0) <= chosenStep.radius);
                
                // Show banner if we expanded beyond the smallest step
                if (chosenStep.radius > ADAPTIVE_STEPS[0].radius) {
                    setExpansionLabel(chosenStep.label);
                    // Silently update filter state to match reality without triggering refetch loop (ref check guards it)
                    if (filterState.radiusMeters !== chosenStep.radius) {
                        setRadiusMeters(chosenStep.radius);
                    }
                }
            } else {
                // C. Fallback to "Later" Mode (0 results even at max radius)
                setIsLaterMode(true);
                setExpansionLabel('Nothing open nearby');
                // Show closed venues, but sorted by distance, limited to max radius
                finalVenues = finalVenues.filter(v => (v.distanceNumeric || 0) <= 30000);
            }
        } else {
            // Standard Radius Filter (No adaptive logic if OpenNow is off or searching by name)
            finalVenues = finalVenues.filter(v => (v.distanceNumeric || 0) <= filterState.radiusMeters);
        }

        // 4. Sort & Limit
        finalVenues.sort((a, b) => (a.distanceNumeric || 0) - (b.distanceNumeric || 0));
        
        // Enrich images
        const enriched = await enrichPlacesWithImages(finalVenues as Place[]);
        const merged = enriched.map(e => {
            const original = finalVenues.find(v => v.id === e.id);
            return { ...original, ...e } as Venue;
        });

        setVenues(merged);
        setScores(finalScores);
        setLastUpdated(getCATNow());

    } catch (e: any) {
        showToast(e.message || "Failed to load venues", 'error');
    } finally {
        setLoading(false);
        setRefreshTick(prev => prev + 1);
        if (scrollTopRef.current < 20) setIsCollapsed(false);
        isFetchingRef.current = false;
    }
  }, [filterState, exploreState.origin, engine, stablePrefsKey, searchQuery]); 

  // Debounced auto-fetch on filter change
  useEffect(() => {
     if (exploreState.origin.lat === 0) return;
     const timeoutId = setTimeout(() => {
        fetchRecommendations();
     }, 400);
     return () => clearTimeout(timeoutId);
  }, [filterState.radiusMeters, filterState.categories, filterState.openNowOnly, filterState.mode, filterState.musicVibe, exploreState.origin, stablePrefsKey]); 

  const handleSearch = (query: string) => {
      setSearchQuery(query);
      // Immediate fetch for search
      setTimeout(() => fetchRecommendations(query, true), 0);
  };

  const handleScroll = (scrollTop: number) => {
     scrollTopRef.current = scrollTop;
     if (scrollTop > 28 && !isCollapsed) setIsCollapsed(true);
     else if (scrollTop < 12 && isCollapsed) setIsCollapsed(false);
  };

  const handleRefresh = async () => {
      setIsCollapsed(false); 
      await fetchRecommendations(undefined, true);
  };

  const handleMapAction = () => {
      if (onSwitchToMap) onSwitchToMap();
  };

  const { openTravelSheet, TravelSheet } = useTravelSheet((place) => {
      setFocusedPlace(place.id);
      if (onSwitchToMap) onSwitchToMap();
  });

  const shouldShowUpdated = (currentTime.getTime() - lastUpdated.getTime()) < 15 * 60 * 1000;
  
  return (
    <PageWrapper className="h-full flex flex-col relative bg-background overflow-hidden">
       <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
           <motion.div 
               animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], rotate: [0, 90, 0] }}
               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
               className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]" 
           />
           <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
       </div>

       {/* Floating Filter Bar */}
       <SmartFilterBar 
         userCity={userCity}
         location={strategy === 'precise' ? location : null} 
         radius={filterState.radiusMeters}
         activeTime={filterState.openNowOnly ? 'now' : 'Any'}
         onOpenLocationSheet={() => setShowSettingsSheet(true)}
         onSearch={handleSearch}
         resultCount={venues.length}
         refreshTick={refreshTick}
         isCollapsed={isCollapsed}
         activeCategories={filterState.categories}
         isDefaultRadius={filterState.radiusMeters === 2000}
       />

      <PullToRefresh onRefresh={handleRefresh} onScroll={handleScroll} className="flex-1 relative z-10">
        
        {/* Dynamic Spacer for Transparent Header */}
        <motion.div 
            initial={false}
            animate={{ height: isCollapsed ? 54 : 72 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full shrink-0 pt-safe"
        />

        <div className="px-4 mt-2 mb-2">
            <div className="flex justify-between items-end mb-1 h-9">
                <motion.h2 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    key={timeLabel.title}
                    className="text-3xl font-display font-bold text-white tracking-tight leading-none drop-shadow-md"
                >
                    {timeLabel.title}
                </motion.h2>
                <AnimatePresence>
                    {shouldShowUpdated && (
                        <motion.span 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-[10px] font-medium text-gray-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5"
                        >
                            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase()} CAT
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>
            <motion.p 
                initial={{ opacity: 0, x: -5 }} 
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                key={vibeSentence}
                className="text-sm font-medium text-gray-400 mt-1 max-w-[85%] leading-snug"
            >
                {vibeSentence}
            </motion.p>
        </div>

        <div className="px-4 mb-2">
            <RadiusExpansionBanner 
              expandedLabel={expansionLabel}
              baseRadius={filterState.radiusMeters}
            />
        </div>

        {/* Categories Row */}
        <div className="relative w-full mb-2 group">
            <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />
            <div 
                className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2 pt-1 px-4 w-full" 
                style={{ touchAction: 'pan-x' }}
            >
                {EXPLORE_CATEGORIES.map(cat => {
                    const isAll = cat === 'All';
                    const isActive = isAll 
                        ? filterState.categories.length === 0 || (filterState.categories.length === 1 && filterState.categories[0] === 'All')
                        : filterState.categories.includes(cat);

                    return (
                        <motion.button
                            key={cat}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                trigger();
                                if (isAll) {
                                    setCategories([]); 
                                } else {
                                    toggleCategory(cat);
                                }
                            }}
                            className={`relative shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold border transition-all duration-300 whitespace-nowrap z-10 ${isActive ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(159,80,255,0.6)]' : 'bg-white/5 backdrop-blur-xl text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'}`}
                        >
                            <span className="relative z-10">{cat}</span>
                        </motion.button>
                    );
                })}
                <div className="w-4 shrink-0" />
            </div>
        </div>

        {/* Music Vibe Row */}
        <div className="relative w-full mb-4">
            <div 
                className="flex gap-2 overflow-x-auto no-scrollbar px-4 w-full" 
                style={{ touchAction: 'pan-x' }}
            >
                {MUSIC_VIBES.map(vibe => {
                    const isSelected = filterState.musicVibe === vibe.id || (!filterState.musicVibe && vibe.id === 'Any');
                    return (
                        <motion.button
                            key={vibe.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                trigger();
                                setMusicVibe(vibe.id === 'Any' ? null : vibe.id);
                            }}
                            className={`
                                px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all whitespace-nowrap
                                ${isSelected 
                                    ? vibe.color.replace('/10', '/20').replace('text-', 'text-white ') + ' scale-105' 
                                    : 'bg-white/5 text-gray-500 border-transparent hover:bg-white/10'
                                }
                            `}
                        >
                            {vibe.label}
                        </motion.button>
                    )
                })}
                <div className="w-4 shrink-0" />
            </div>
        </div>

        <div className="px-4 space-y-6 pb-32">
            {loading ? (
                <div className="flex flex-col gap-4 pt-2">
                  <CardSkeleton /> <CardSkeleton /> <CardSkeleton />
                </div>
            ) : venues.length > 0 ? (
                <>
                    {isLaterMode && (
                        <div className="text-center py-4 px-6 bg-white/5 rounded-2xl border border-white/5 mb-6">
                            <span className="text-2xl block mb-2">😅</span>
                            <h3 className="text-white font-bold text-lg">Nothing’s happening nearby right now</h3>
                            <p className="text-gray-400 text-sm mt-1">Want to plan ahead or see the wider city vibe?</p>
                            <div className="flex gap-2 mt-4 justify-center">
                                <button onClick={handleMapAction} className="bg-primary text-black font-bold px-4 py-2 rounded-xl text-xs hover:bg-white transition-colors">
                                    Check the Map
                                </button>
                                <button className="bg-white/10 text-white font-bold px-4 py-2 rounded-xl text-xs border border-white/5">
                                    Viewing Later Options
                                </button>
                            </div>
                        </div>
                    )}
                    {venues.map((item) => {
                        const s = scores.find(sc => sc.venueId === item.id);
                        return (
                            <VenueCard 
                                key={item.id}
                                venue={item}
                                recommendationScore={s}
                                onClick={() => setSelectedPlace(item as any as Place)}
                                onNavigate={() => openTravelSheet(item)}
                            />
                        );
                    })}
                </>
            ) : (
                <div className="flex flex-col items-center justify-center pt-10 px-2 text-center">
                    <div className="mb-4 p-4 bg-white/5 rounded-full border border-white/5 shadow-lg">
                        <span className="material-symbols-outlined text-3xl text-gray-400">explore_off</span>
                    </div>
                    <h3 className="text-xl font-display font-bold text-white mb-2">Yoh 😅 looks quiet around here</h3>
                    <p className="text-sm text-gray-400 mb-8 max-w-xs mx-auto leading-relaxed">
                        We couldn't find matches for "{searchQuery || 'your vibe'}" nearby.
                    </p>
                    <div className="w-full max-w-sm space-y-3">
                        <button onClick={handleMapAction} className="w-full py-4 bg-primary text-black font-bold rounded-2xl shadow-[0_0_20px_rgba(var(--color-primary),0.3)] hover:bg-primary-dark transition-all flex items-center justify-center gap-2 active:scale-98">
                            <span className="material-symbols-outlined">map</span>
                            Check the Map
                        </button>
                        <button 
                            onClick={() => {
                                setOpenNowOnly(false); 
                                setIsLaterMode(true);
                                // Force re-fetch logic without strict filter by triggering state change if needed, 
                                // but setting isLaterMode usually handles the UI. 
                                // Here we toggle the filter to actually fetch closed places.
                                setOpenNowOnly(false);
                            }}
                            className="w-full py-4 bg-white/10 text-white font-bold rounded-2xl border border-white/5 hover:bg-white/20 transition-all flex items-center justify-center gap-2 active:scale-98"
                        >
                            <span className="material-symbols-outlined">event_upcoming</span>
                            Plan for Later
                        </button>
                    </div>
                </div>
            )}
        </div>
      </PullToRefresh>

      <PlaceDetailSheet 
        place={selectedPlace} 
        onClose={() => setSelectedPlace(null)} 
        onShowMap={() => {
             if (selectedPlace) setFocusedPlace(selectedPlace.id);
             if (onSwitchToMap) onSwitchToMap();
        }}
        onRequireAuth={onRequireAuth}
      />

      <AnimatePresence>
        {showSettingsSheet && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
                    onClick={() => setShowSettingsSheet(false)}
                />
                <GlassSheet className="fixed bottom-0 z-[101] w-full h-[85vh] flex flex-col !p-0 overflow-hidden rounded-t-[32px]">
                    <div className="flex flex-col w-full h-full">
                        <div className="px-6 pb-4 pt-6 flex justify-between items-center shrink-0 border-b border-white/5 bg-surface/50 backdrop-blur-md">
                            <h3 className="font-display font-bold text-xl text-white">Search Settings</h3>
                            <button onClick={() => setShowSettingsSheet(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20">
                                <span className="material-symbols-outlined text-white text-lg">close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-safe overscroll-contain">
                            <div className="pb-32 space-y-8"> 
                                <div>
                                    <div className="flex justify-between mb-4">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Search Radius</label>
                                        <span className="text-primary font-bold text-sm">{filterState.radiusMeters >= 1000 ? `${filterState.radiusMeters/1000}km` : `${filterState.radiusMeters}m`}</span>
                                    </div>
                                    <div className="relative h-2 bg-white/10 rounded-full mb-6 mx-2">
                                        {/* Simplified Slider for Settings */}
                                        <input 
                                            type="range" 
                                            min="2000" 
                                            max="30000" 
                                            step="1000"
                                            value={filterState.radiusMeters}
                                            onChange={(e) => setRadiusMeters(parseInt(e.target.value))}
                                            className="w-full h-2 bg-transparent appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-2">
                                        <span>2km</span>
                                        <span>30km</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <button 
                                        onClick={() => { setOpenNowOnly(true); }} 
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
                                        onClick={() => { setOpenNowOnly(false); }} 
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
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassSheet>
            </>
        )}
      </AnimatePresence>
      <TravelSheet />
    </PageWrapper>
  );
};
