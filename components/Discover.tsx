import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Place } from '../types';
import { PageWrapper, PullToRefresh, GlassSheet, CardSkeleton } from './Layouts';
import { PlaceDetailSheet } from './PlaceDetailSheet';
import { usePreciseLocation } from '../lib/location';
import { VenueCard } from './VenueCard';
import { Session } from '@supabase/supabase-js';
import { getSmartTimeLabel, getVibeSentence, getCATNow } from '../lib/timeFilter';
import { SmartFilterBar } from './SmartFilterBar';
import { motion, AnimatePresence } from 'framer-motion';
import { RadiusExpansionBanner } from './RadiusExpansionBanner';
import { useHaptic } from '../utils/animations';
import { useTravelSheet } from '../hooks/useTravelSheet';
import { FilterBar } from './FilterBar';
import { useDiscoveryContext } from '../src/state/DiscoveryContext';
import { PRIMARY_WALK_RADIUS_M } from '../src/lib/discoveryEngine';

interface DiscoverProps {
  userCity: string;
  onCityChange: (city: string) => void;
  userPreferences: string[];
  onRequireAuth: (action?: () => void) => void;
  session: Session | null;
  initialIntent: any;
  onSwitchToMap?: () => void;
}

const RADIUS_STEPS = [600, 1500, 3000, 6000, 12000, 20000, 30000];
const EXPLORE_CATEGORIES = ['All', 'Nightlife', 'Dining', 'Cafe', 'Outdoors', 'Art', 'Music', 'Hidden Gems'];

export const Discover: React.FC<DiscoverProps> = ({
  userCity,
  onSwitchToMap,
  initialIntent,
  onRequireAuth,
}) => {
  const {
    state: discoveryState,
    filteredVenues,
    filteredScores,
    setOrigin,
    setFocusedPlace,
    setGroupMode,
    setRadiusMeters,
    setOpenNowOnly,
    setTonightOnly,
    setCategories,
    toggleCategory,
    cycleCrowd,
    cyclePriceVibe,
    setSearchQuery,
    refresh,
    resetFilters,
  } = useDiscoveryContext();

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const scrollTopRef = useRef(0);
  const [currentTime, setCurrentTime] = useState<Date>(getCATNow());

  const { location, loading: locationLoading, strategy } = usePreciseLocation();
  const { trigger } = useHaptic();

  const timeLabel = getSmartTimeLabel();
  const vibeSentence = getVibeSentence();

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
  }, [location, locationLoading, setOrigin]);

  useEffect(() => {
    if (!initialIntent) return;
    if (initialIntent.groupContext) setGroupMode(initialIntent.groupContext);
    setOpenNowOnly(initialIntent.timeMode === 'open_now');
    if (initialIntent.categories) setCategories(initialIntent.categories);
    if (initialIntent.initialRadius) setRadiusMeters(initialIntent.initialRadius, 'explore');
  }, [initialIntent, setCategories, setGroupMode, setOpenNowOnly, setRadiusMeters]);

  const filterState = useMemo(
    () => ({
      radiusMeters: discoveryState.radiusMeters,
      openNowOnly: discoveryState.mode === 'RIGHT_NOW',
      categories: discoveryState.categories,
      tonightOnly: discoveryState.mode === 'TONIGHT' || discoveryState.secondaryFilters.tonightOnly,
      crowd: discoveryState.secondaryFilters.crowd,
      priceVibe: discoveryState.secondaryFilters.priceVibe,
    }),
    [discoveryState]
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleScroll = (scrollTop: number) => {
    scrollTopRef.current = scrollTop;
    if (scrollTop > 28 && !isCollapsed) setIsCollapsed(true);
    else if (scrollTop < 12 && isCollapsed) setIsCollapsed(false);
  };

  const handleRefresh = async () => {
    setIsCollapsed(false);
    refresh();
  };

  const handleMapAction = () => {
    if (onSwitchToMap) onSwitchToMap();
  };

  const activeRadiusIndex = RADIUS_STEPS.indexOf(filterState.radiusMeters);
  const safeRadiusIndex = activeRadiusIndex >= 0 ? activeRadiusIndex : 0;
  const { openTravelSheet, TravelSheet } = useTravelSheet((place) => {
    setFocusedPlace(place.id);
    if (onSwitchToMap) onSwitchToMap();
  });

  const shouldShowUpdated = currentTime.getTime() - discoveryState.lastUpdated.getTime() < 15 * 60 * 1000;
  const showSecondaryFilters =
    discoveryState.hasLoadedFirstResults && !discoveryState.loading && discoveryState.venues.length > 0;

  return (
    <PageWrapper className="h-full flex flex-col relative bg-background overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]"
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          }}
        />
      </div>

      <SmartFilterBar
        userCity={userCity}
        location={strategy === 'precise' ? location : null}
        radius={filterState.radiusMeters}
        activeTime={filterState.openNowOnly ? 'now' : 'any'}
        onOpenLocationSheet={() => setShowSettingsSheet(true)}
        onSearch={handleSearch}
        resultCount={filteredVenues.length}
        refreshTick={discoveryState.refreshTick}
        isCollapsed={isCollapsed}
        activeCategories={filterState.categories}
        isDefaultRadius={filterState.radiusMeters === PRIMARY_WALK_RADIUS_M}
      />

      <PullToRefresh onRefresh={handleRefresh} onScroll={handleScroll} className="flex-1 relative z-10">
        <div className="px-4 mt-4 mb-3">
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
                  Updated{' '}
                  {discoveryState.lastUpdated
                    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    .toLowerCase()}{' '}
                  CAT
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
            expansionCount={discoveryState.expandedCount}
            finalRadius={filterState.radiusMeters}
            usedFallback={discoveryState.origin.mode === 'fallback'}
            isLaterMode={discoveryState.autoSwitchedToLater}
            customMessage={discoveryState.bannerMessage}
            onResetFilters={() => resetFilters()}
            userCity={userCity}
          />
        </div>

        <div className="relative w-full mb-4 group">
          <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2 pt-1 px-4 w-full" style={{ touchAction: 'pan-x' }}>
            {EXPLORE_CATEGORIES.map((cat) => {
              const isAll = cat === 'All';
              const isActive = isAll
                ? filterState.categories.length === 0 ||
                  (filterState.categories.length === 1 && filterState.categories[0] === 'All')
                : filterState.categories.includes(cat);

              return (
                <motion.button
                  key={cat}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    trigger();
                    if (isAll) {
                      setCategories([]);
                    } else {
                      toggleCategory(cat);
                    }
                  }}
                  className={`relative shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold border transition-all duration-300 whitespace-nowrap z-10 ${
                    isActive
                      ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(159,80,255,0.6)]'
                      : 'bg-white/5 backdrop-blur-xl text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="relative z-10">{cat}</span>
                </motion.button>
              );
            })}
            <div className="w-4 shrink-0" />
          </div>
        </div>

        <FilterBar
          visible={showSecondaryFilters}
          tonightOnly={filterState.tonightOnly}
          crowd={filterState.crowd}
          priceVibe={filterState.priceVibe}
          onToggleTonight={() => {
            trigger();
            setTonightOnly(!filterState.tonightOnly);
          }}
          onCycleCrowd={() => {
            trigger();
            cycleCrowd();
          }}
          onCyclePriceVibe={() => {
            trigger();
            cyclePriceVibe();
          }}
        />

        <div className="px-4 space-y-6 pb-nav-safe">
          {discoveryState.loading ? (
            <div className="flex flex-col gap-4 pt-2">
              <CardSkeleton /> <CardSkeleton /> <CardSkeleton />
            </div>
          ) : filteredVenues.length > 0 ? (
            <>
              {discoveryState.autoSwitchedToLater && (
                <div className="text-center py-4 px-6 bg-white/5 rounded-2xl border border-white/5 mb-6">
                  <span className="text-2xl block mb-2">😅</span>
                  <h3 className="text-white font-bold text-lg">Aweh, it&apos;s not really happening close by right now</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {discoveryState.laterMessage || 'Showing the nearest spots for later.'}
                  </p>
                  <div className="flex gap-2 mt-4 justify-center">
                    <button
                      onClick={handleMapAction}
                      className="bg-primary text-black font-bold px-4 py-2 rounded-xl text-xs hover:bg-white transition-colors"
                    >
                      Check the Map
                    </button>
                    <button className="bg-white/10 text-white font-bold px-4 py-2 rounded-xl text-xs border border-white/5">
                      Viewing Later Options
                    </button>
                  </div>
                </div>
              )}
              {filteredVenues.map((item) => {
                const s = filteredScores.find((score) => score.venueId === item.id);
                const seed = parseInt(item.id.replace(/\D/g, '') || '0', 10);
                const mockSaved = 12 + (seed % 80);
                const mockFriends = (seed % 5) > 3 ? (seed % 3) + 1 : 0;
                return (
                  <VenueCard
                    key={item.id}
                    venue={item as any}
                    recommendationScore={s}
                    socialProof={{ savedCount: mockSaved, friendsCount: mockFriends }}
                    onClick={() => setSelectedPlace(item)}
                    onNavigate={() => openTravelSheet(item as any)}
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
                We couldn&apos;t find matches for &quot;{discoveryState.searchQuery || 'your vibe'}&quot; nearby.
              </p>
              <div className="w-full max-w-sm space-y-3">
                <button
                  onClick={handleMapAction}
                  className="w-full py-4 bg-primary text-black font-bold rounded-2xl shadow-[0_0_20px_rgba(var(--color-primary),0.3)] hover:bg-primary-dark transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <span className="material-symbols-outlined">map</span>
                  Check the Map
                </button>
                <button
                  onClick={() => setOpenNowOnly(false)}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                  <div className="pb-safe space-y-8">
                    <div>
                      <div className="flex justify-between mb-4">
                        <label className="text-xs font-bold text-gray-400 uppercase">Search Radius</label>
                        <span className="text-primary font-bold text-sm">
                          {filterState.radiusMeters >= 1000
                            ? `${filterState.radiusMeters / 1000}km`
                            : `${filterState.radiusMeters}m`}
                        </span>
                      </div>
                      <div className="relative h-2 bg-white/10 rounded-full mb-6 mx-2">
                        <div
                          className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${(safeRadiusIndex / (RADIUS_STEPS.length - 1)) * 100}%` }}
                        />
                        {RADIUS_STEPS.map((r, i) => (
                          <button
                            key={r}
                            onClick={() => setRadiusMeters(r, 'explore')}
                            className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 transition-all duration-300 z-10 ${
                              r === filterState.radiusMeters
                                ? 'bg-primary border-white scale-110 shadow-[0_0_10px_rgba(var(--color-primary),0.5)]'
                                : 'bg-[#121212] border-white/20'
                            }`}
                            style={{
                              left: `${(i / (RADIUS_STEPS.length - 1)) * 100}%`,
                              transform: 'translate(-50%, -50%)',
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-2">
                        <span>600m</span>
                        <span>30km</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <button
                        onClick={() => setOpenNowOnly(true)}
                        className={`w-full flex justify-between items-center p-4 rounded-xl border transition-all ${
                          filterState.openNowOnly
                            ? 'bg-primary/20 border-primary text-white'
                            : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined">schedule</span>
                          <div className="text-left">
                            <p className="font-bold text-sm">Open Now</p>
                            <p className="text-xs opacity-70">Only show places open right now</p>
                          </div>
                        </div>
                        {filterState.openNowOnly && (
                          <span className="material-symbols-outlined text-primary">check_circle</span>
                        )}
                      </button>
                      <button
                        onClick={() => setOpenNowOnly(false)}
                        className={`w-full flex justify-between items-center p-4 rounded-xl border transition-all ${
                          !filterState.openNowOnly
                            ? 'bg-primary/20 border-primary text-white'
                            : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined">timelapse</span>
                          <div className="text-left">
                            <p className="font-bold text-sm">Open Soon / Any Time</p>
                            <p className="text-xs opacity-70">Include places closed right now</p>
                          </div>
                        </div>
                        {!filterState.openNowOnly && (
                          <span className="material-symbols-outlined text-primary">check_circle</span>
                        )}
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
