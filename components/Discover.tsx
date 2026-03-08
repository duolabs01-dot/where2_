
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../supabase';
import { Place } from '../types';
import { DiscoveryVenue } from '../src/lib/discoveryEngine';
import { VenueScore } from '../lib/recommendationEngine'; // Import DiscoveryVenue
import { PageWrapper, PullToRefresh, GlassSheet, CardSkeleton } from './Layouts';
import { PlaceDetailSheet } from './PlaceDetailSheet';
import { usePreciseLocation, calculateDistance } from '../lib/location';
import { VenueCard } from './VenueCard';
import { Session } from '@supabase/supabase-js';
import { getSmartTimeLabel, getVibeSentence, getCATNow, isPlaceOpenNow, getJoburgHour } from '../lib/timeFilter';
import { SmartFilterBar } from './SmartFilterBar';
import { motion, AnimatePresence } from 'framer-motion';
import { enrichPlacesWithImages } from '../utils/imageEnricher';
import { useExploreState } from '../lib/exploreState';
import { useFilters } from '../lib/filtersStore'; 
import { useDiscoveryContext } from '../src/state/DiscoveryContext';
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
  prefetchedVenues?: DiscoveryVenue[];
  prefetchedScores?: VenueScore[];
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

interface StoryPlaceRef {
  name?: string | null;
  cover_image?: string | null;
}

interface StoryRow {
  id: string;
  place_id: string;
  created_at: string;
  places?: StoryPlaceRef | StoryPlaceRef[] | null;
}

interface StoryRingItem {
  id: string;
  placeId: string;
  createdAt: string;
  placeName: string;
  coverImage?: string | null;
}

interface FriendProfileRef {
  first_name?: string | null;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
}

interface FriendPlaceRef {
  id?: string | null;
  name?: string | null;
}

interface FriendActivityRow {
  id: string;
  user_id: string;
  place_id: string;
  created_at: string;
  profiles?: FriendProfileRef | FriendProfileRef[] | null;
  places?: FriendPlaceRef | FriendPlaceRef[] | null;
}

interface FriendActivityItem {
  id: string;
  userId: string;
  placeId: string;
  createdAt: string;
  friendName: string;
  avatarUrl?: string | null;
  placeName: string;
}

export const Discover: React.FC<DiscoverProps> = ({
  userCity,
  userPreferences,
  onSwitchToMap,
  onCityChange,
  initialIntent,
  onRequireAuth,
  session,
  prefetchedVenues,
  prefetchedScores,
}) => {
  const { state: exploreState, setOrigin, setFocusedPlace } = useExploreState();
  const { state: filterState, setRadiusMeters, setOpenNowOnly, toggleCategory, setCategories, setMode, resetFilters, setMusicVibe } = useFilters();
  const { state: discoveryState, filteredVenues, filteredScores, refresh, setSearchQuery } = useDiscoveryContext();

  const venues = filteredVenues as DiscoveryVenue[];
  const scores = filteredScores;
  const loading = discoveryState.loading;
  const isLaterMode = discoveryState.autoSwitchedToLater;
  const expansionLabel = discoveryState.bannerMessage || null;

  const hour = getJoburgHour();
  const laterHeader = (hour >= 21 || hour < 5)
    ? 'Late night — next openings nearby:'
    : 'Nothing open right now — opens later:';

  const displayVenues = isLaterMode ? venues.slice(3) : venues;

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [activeStories, setActiveStories] = useState<StoryRingItem[]>([]);
  const [localRadius, setLocalRadius] = useState(filterState.radiusMeters);
  const [friendActivity, setFriendActivity] = useState<FriendActivityItem[]>([]);
  const [storyPlaceholderOnly, setStoryPlaceholderOnly] = useState(false);
  const [searchQuery, setSearchQueryLocal] = useState('');
  
  const [refreshTick, setRefreshTick] = useState(0); 
  const [lastUpdated, setLastUpdated] = useState<Date>(getCATNow());
  const [currentTime, setCurrentTime] = useState<Date>(getCATNow());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const scrollTopRef = useRef(0); 
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prefetchedAppliedRef = useRef(false);

  // Guards
  const lastRequestKeyRef = useRef<string>('');
  const isFetchingRef = useRef<boolean>(false);

  // Memoize stable preferences string
  const stablePrefsKey = useMemo(() => JSON.stringify(userPreferences), [userPreferences]);
  const categoriesKey = useMemo(
    () => JSON.stringify([...filterState.categories].sort()),
    [filterState.categories]
  );
  const activeCategoryCount = filterState.categories.length;

  const { location, loading: locationLoading, strategy } = usePreciseLocation();
  const { trigger } = useHaptic();

  // Helper function to get day name from day of week (1=Mon, 7=Sun)
  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const adjustedDay = dayOfWeek === 7 ? 0 : dayOfWeek; // Convert 1-7 (Mon-Sun) to 0-6 (Sun-Sat)
    return days[adjustedDay];
  };
  
  const timeLabel = getSmartTimeLabel();
  const vibeSentence = getVibeSentence(); 

  useEffect(() => {
    if (prefetchedAppliedRef.current) return;
    if (prefetchedVenues && prefetchedVenues.length) {
      // prefetched data normally feeds into context or initial state
      // but the user wants DiscoveryContext as the exclusive source
      prefetchedAppliedRef.current = true;
    }
  }, [prefetchedVenues, prefetchedScores]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getCATNow()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchStoriesAndFriends = useCallback(
    async (cancelRef?: { current: boolean }) => {
      console.warn('[PERF] stories/friends fetch triggered');

      const { data: storyData, error: storyError } = await supabase
        .from('place_stories')
        .select('id, place_id, created_at, places(name, cover_image)')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (!cancelRef?.current) {
        if (storyError) {
          if (storyError.code === '42P01') {
            setStoryPlaceholderOnly(true);
            setActiveStories([]);
          } else {
            console.error('Failed to load place stories:', storyError.message);
          }
        } else if (storyData) {
          const mappedStories = (storyData as StoryRow[]).map((row) => {
            const placeRef = Array.isArray(row.places) ? row.places[0] : row.places;
            return {
              id: row.id,
              placeId: row.place_id,
              createdAt: row.created_at,
              placeName: (placeRef?.name || 'Venue').trim(),
              coverImage: placeRef?.cover_image || null,
            };
          });
          setActiveStories(mappedStories);
        }
      }

      const userId = session?.user?.id;
      if (!userId) {
        if (!cancelRef?.current) setFriendActivity([]);
        return;
      }

      const { data: follows, error: followsError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)
        .eq('status', 'approved');

      if (cancelRef?.current) return;
      if (followsError) {
        console.error('Failed to load follows for friend activity:', followsError.message);
        setFriendActivity([]);
        return;
      }

      const followingIds = (follows || [])
        .map((row: { following_id?: string | null }) => row.following_id)
        .filter((value): value is string => Boolean(value));

      if (followingIds.length === 0) {
        setFriendActivity([]);
        return;
      }

      const { data: checkIns, error: checkInsError } = await supabase
        .from('check_ins')
        .select('id, user_id, place_id, created_at, profiles(first_name, full_name, username, avatar_url), places(id, name)')
        .in('user_id', followingIds)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (cancelRef?.current) return;
      if (checkInsError) {
        console.error('Failed to load check-ins:', checkInsError.message);
        setFriendActivity([]);
        return;
      }

      const mapped = ((checkIns || []) as FriendActivityRow[]).map((row) => {
        const profileRef = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        const placeRef = Array.isArray(row.places) ? row.places[0] : row.places;
        const friendName = (
          profileRef?.first_name ||
          profileRef?.full_name ||
          profileRef?.username ||
          'Friend'
        ).trim();

        return {
          id: row.id,
          userId: row.user_id,
          placeId: row.place_id,
          createdAt: row.created_at,
          friendName,
          avatarUrl: profileRef?.avatar_url || null,
          placeName: (placeRef?.name || 'a spot').trim(),
        };
      });

      setFriendActivity(mapped);
    },
    [session?.user?.id]
  );

  useEffect(() => {
    const cancelRef = { current: false };
    fetchStoriesAndFriends(cancelRef);
    return () => {
      cancelRef.current = true;
    };
  }, [fetchStoriesAndFriends]);

  useEffect(() => {
    if (!locationLoading) {
      if (location) {
        setOrigin(location.latitude, location.longitude, 'gps');
      } else {
        setOrigin(-26.2041, 28.0473, 'fallback');
      }
    }
  }, [location, locationLoading]);

  useEffect(() => {
    setLocalRadius(filterState.radiusMeters);
  }, [filterState.radiusMeters]);

  // Initial Intent Handling
  useEffect(() => {
    if (initialIntent) {
        if (initialIntent.groupContext) setMode(initialIntent.groupContext);
        setOpenNowOnly(initialIntent.timeMode === 'open_now');
        if (initialIntent.categories) setCategories(initialIntent.categories);
        if (initialIntent.initialRadius) setRadiusMeters(initialIntent.initialRadius);
    }
  }, [initialIntent]);

  const handleSearch = (query: string) => {
      setSearchQueryLocal(query);
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
      await fetchStoriesAndFriends();
  };

  const handleMapAction = () => {
      if (onSwitchToMap) onSwitchToMap();
  };

  const isStoryLive = (createdAt: string) => {
    const createdTs = new Date(createdAt).getTime();
    if (Number.isNaN(createdTs)) return false;
    const ageMs = Date.now() - createdTs;
    return ageMs >= 0 && ageMs <= 2 * 60 * 60 * 1000;
  };

  const truncateStoryName = (name: string) => {
    const trimmed = (name || '').trim();
    if (trimmed.length <= 10) return trimmed;
    return `${trimmed.slice(0, 10)}...`;
  };

  const openPlaceById = async (placeId: string, fallbackError: string) => {
    const fromLoadedVenues = venues.find((v) => v.id === placeId);
    if (fromLoadedVenues) {
      setSelectedPlace(fromLoadedVenues as unknown as Place);
      return;
    }

    const { data, error } = await supabase
      .from('places')
      .select('*, is_24_7, operating_hours(*)')
      .eq('id', placeId)
      .single();

    if (error || !data) {
      showToast(error?.message || fallbackError, 'error');
      return;
    }

    setSelectedPlace(data as Place);
  };

  const handleStoryPress = async (story: StoryRingItem) => {
    trigger();
    await openPlaceById(story.placeId, 'Unable to open this story right now.');
  };

  const handleFriendActivityPress = async (item: FriendActivityItem) => {
    trigger();
    await openPlaceById(item.placeId, 'Unable to open this check-in right now.');
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

        {activeCategoryCount >= 2 && (
          <div className="px-4 -mt-1 mb-1 text-[11px] text-gray-300 flex items-center gap-2">
            <span className="font-bold">Filters</span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/15 text-[10px]">
              {activeCategoryCount} active
            </span>
          </div>
        )}

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
                        ? filterState.categories.length === 0
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
                                    // remove "All" by ensuring empty array isn't kept
                                    const next = filterState.categories.includes(cat)
                                      ? filterState.categories.filter((c) => c !== cat)
                                      : [...filterState.categories.filter((c) => c !== 'All'), cat];
                                    setCategories(next);
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

        <AnimatePresence initial={false}>
          {(activeStories.length > 0 || storyPlaceholderOnly) && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-full mb-4"
            >
              <div className="absolute left-0 top-0 bottom-3 w-8 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-3 w-8 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />
              <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-3 w-full" style={{ touchAction: 'pan-x' }}>
                {activeStories.map((story, index) => (
                  <motion.button
                    key={story.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.2 }}
                    onClick={() => handleStoryPress(story)}
                    className="relative shrink-0 w-14 flex flex-col items-center gap-1.5"
                  >
                    <div className="relative">
                      <div
                        className="rounded-full p-[2px] border-2 bg-white/5"
                        style={{ borderColor: '#00D4FF' }}
                      >
                        {story.coverImage ? (
                          <img
                            src={story.coverImage}
                            alt={story.placeName}
                            className="size-10 rounded-full object-cover bg-white/10"
                            loading="lazy"
                          />
                        ) : (
                          <div className="size-10 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-cyan-300">
                            {story.placeName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {isStoryLive(story.createdAt) && (
                        <span className="absolute -top-1 -right-2 px-1.5 h-4 rounded-full bg-black/90 border border-red-500/40 text-[8px] font-bold text-red-300 flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-red-500" />
                          LIVE
                        </span>
                      )}
                    </div>
                    <span className="max-w-full text-[10px] font-semibold text-gray-300 text-center leading-tight">
                      {truncateStoryName(story.placeName)}
                    </span>
                  </motion.button>
                ))}
                {storyPlaceholderOnly && (
                  <motion.button
                    key="placeholder-story"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative shrink-0 w-14 flex flex-col items-center gap-1.5"
                    onClick={() => showToast('Stories coming soon for your business profile.', 'info')}
                  >
                    <div className="relative">
                      <div
                        className="rounded-full p-[2px] border-2 bg-white/5"
                        style={{ borderColor: '#00D4FF' }}
                      >
                        <div className="size-10 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-cyan-300">
                          +
                        </div>
                      </div>
                      <span className="absolute -top-1 -right-2 px-1.5 h-4 rounded-full bg-black/90 border border-cyan-500/40 text-[8px] font-bold text-cyan-200 flex items-center gap-1">
                        Add
                      </span>
                    </div>
                    <span className="max-w-full text-[10px] font-semibold text-gray-300 text-center leading-tight">
                      Add Story
                    </span>
                  </motion.button>
                )}
                <div className="w-4 shrink-0" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-4 space-y-6" style={{ paddingBottom: 'var(--bottom-nav-safe)' }}>
            {loading ? (
                <div className="flex flex-col gap-4 pt-2">
                  <CardSkeleton /> <CardSkeleton /> <CardSkeleton />
                </div>
            ) : venues.length > 0 ? (
                <>
                    {isLaterMode && venues.length > 0 && (
                        <div className="text-left py-4 px-4 bg-white/5 rounded-2xl border border-white/5 mb-4">
                            <h3 className="text-white font-bold text-base mb-1">{laterHeader}</h3>
                            <div className="flex flex-col gap-2 mt-3">
                              {venues.slice(0, 3).map((v) => {
                                const status = isPlaceOpenNow(v);
                                const timeLabel = status.opens_at
                                  ? (status.opens_today ? `Opens ${status.opens_at}` : `Tomorrow ${status.opens_at}`)
                                  : status.open_hours_unknown ? 'Hours TBC' : '—';

                                return (
                                  <div key={v.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold text-white truncate">{v.name}</p>
                                      <p className="text-[11px] text-gray-400 truncate">{v.category}</p>
                                    </div>
                                    <span className="text-[11px] px-2 py-1 rounded-full bg-amber-500/15 text-amber-200 border border-amber-500/30 whitespace-nowrap">
                                      {timeLabel}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                        </div>
                    )}
                    {displayVenues.length > 0 && (
                      <>
                        {!isLaterMode && (
                          <VenueCard
                            key={displayVenues[0].id}
                            venue={displayVenues[0]}
                            recommendationScore={scores.find(sc => sc.venueId === displayVenues[0].id)}
                            index={0}
                            heightClass="h-[280px]"
                            badge="Top Pick Tonight"
                            onClick={() => setSelectedPlace(displayVenues[0] as any as Place)}
                            onNavigate={() => openTravelSheet(displayVenues[0])}
                          />
                        )}

                        {friendActivity.length > 0 && (
                          <div className="mt-4 mb-2 px-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Friends Out Tonight →</h4>
                            </div>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" style={{ touchAction: 'pan-x' }}>
                              {friendActivity.map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => handleFriendActivityPress(item)}
                                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white shrink-0"
                                >
                                  {item.avatarUrl ? (
                                    <img src={item.avatarUrl} alt={item.friendName} className="size-7 rounded-full object-cover" />
                                  ) : (
                                    <div className="size-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-200">
                                      {item.friendName.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="whitespace-nowrap">{item.friendName} @ {item.placeName}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {displayVenues.slice(!isLaterMode ? 1 : 0).map((item, index) => {
                            const s = scores.find(sc => sc.venueId === item.id);
                            return (
                                <VenueCard 
                                    key={item.id}
                                    venue={item}
                                    recommendationScore={s}
                                    index={index + (isLaterMode ? 3 : 1)}
                                    onClick={() => setSelectedPlace(item as any as Place)}
                                    onNavigate={() => openTravelSheet(item)}
                                />
                            );
                        })}
                      </>
                    )}
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
                                trigger();
                                setOpenNowOnly(false); 
                                // Force re-fetch logic without strict filter by triggering state change if needed, 
                                // but setting isLaterMode usually handles the UI. 
                                // Here we toggle the filter to actually fetch closed places.
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
                                        <span className="text-primary font-bold text-sm">{localRadius >= 1000 ? `${localRadius/1000}km` : `${localRadius}m`}</span>
                                    </div>
                                    <div className="relative h-2 bg-white/10 rounded-full mb-6 mx-2">
                                        {/* Simplified Slider for Settings */}
                                        <input 
                                            type="range" 
                                            min="600" 
                                            max="30000" 
                                            step="100"
                                            value={localRadius}
                                            onChange={(e) => {
                                                const raw = parseInt(e.target.value);
                                                setLocalRadius(raw);
                                                
                                                if (debounceTimerRef.current) {
                                                  clearTimeout(debounceTimerRef.current);
                                                }
                                                debounceTimerRef.current = setTimeout(() => {
                                                  const steps = [600, 1500, 3000, 6000, 12000, 20000, 30000];
                                                  const nearest = steps.reduce((prev, curr) =>
                                                    Math.abs(curr - raw) < Math.abs(prev - raw) ? curr : prev
                                                  );
                                                  setRadiusMeters(nearest);
                                                }, 300);
                                            }}
                                            className="w-full h-2 bg-transparent appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-2">
                                        <span>600m</span>
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
