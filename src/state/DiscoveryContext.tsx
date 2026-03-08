'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../supabase';
import { Place } from '../../types';
import { VenueScore } from '../../lib/recommendationEngine';
import { applySecondaryFilters } from '../../lib/secondaryFilters';
import { matchesMusicFilter } from '../../lib/mockSignals';
import type { MusicFilter } from '../../lib/mockSignals';
import { enrichPlacesWithImages } from '../../utils/imageEnricher';
import { getCATNow } from '../../lib/timeFilter';
import {
  MAX_EXPLORE_RADIUS_M,
  MAX_MAP_RADIUS_M,
  PRIMARY_WALK_RADIUS_M,
  RIDE_EXPANSION_RADIUS_M,
  runDiscovery,
} from '../lib/discoveryEngine';

export type DiscoveryMode = 'RIGHT_NOW' | 'TONIGHT' | 'LATER';
export type FilterMode = 'solo' | 'date' | 'group';
export type CrowdFilter = 'any' | 'quiet' | 'vibes' | 'packed';
export type PriceVibeFilter = 'any' | 'easy' | 'mid' | 'treat';
export type { MusicFilter };
type OriginMode = 'gps' | 'fallback' | 'preferences';

interface SecondaryFilters {
  tonightOnly: boolean;
  crowd: CrowdFilter;
  priceVibe: PriceVibeFilter;
  music: MusicFilter;
}

interface DiscoveryState {
  groupMode: FilterMode;
  mode: DiscoveryMode;
  radiusMeters: number;
  categories: string[];
  secondaryFilters: SecondaryFilters;
  lastExpansionReason?: string;
  origin: { lat: number; lng: number; mode: OriginMode };
  focusedPlaceId?: string;
  searchQuery: string;
  venues: Place[];
  scores: VenueScore[];
  loading: boolean;
  refreshTick: number;
  lastUpdated: Date;
  expandedCount: number;
  bannerMessage?: string;
  laterMessage?: string;
  autoSwitchedToLater: boolean;
  hasLoadedFirstResults: boolean;
}

interface DiscoveryContextValue {
  state: DiscoveryState;
  filteredVenues: Place[];
  filteredScores: VenueScore[];
  setOrigin: (lat: number, lng: number, mode: OriginMode) => void;
  setFocusedPlace: (id?: string) => void;
  setGroupMode: (mode: FilterMode) => void;
  setDiscoveryMode: (mode: DiscoveryMode) => void;
  setRadiusMeters: (radiusMeters: number, source?: 'explore' | 'map') => void;
  setCategories: (categories: string[]) => void;
  toggleCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  setOpenNowOnly: (value: boolean) => void;
  setTonightOnly: (value: boolean) => void;
  setCrowd: (value: CrowdFilter) => void;
  setPriceVibe: (value: PriceVibeFilter) => void;
  setMusicFilter: (value: MusicFilter) => void;
  cycleCrowd: () => void;
  cyclePriceVibe: () => void;
  refresh: () => void;
  resetFilters: () => void;
  expandMapRadiusByTenKm: () => void;
  canExpandMapRadius: boolean;
}

const DiscoveryContext = createContext<DiscoveryContextValue | null>(null);

const DEFAULT_SECONDARY: SecondaryFilters = {
  tonightOnly: false,
  crowd: 'any',
  priceVibe: 'any',
  music: 'All',
};

const DEFAULT_STATE: DiscoveryState = {
  groupMode: 'solo',
  mode: 'RIGHT_NOW',
  radiusMeters: 3000,
  categories: [],
  secondaryFilters: DEFAULT_SECONDARY,
  lastExpansionReason: undefined,
  origin: { lat: 0, lng: 0, mode: 'gps' },
  focusedPlaceId: undefined,
  searchQuery: '',
  venues: [],
  scores: [],
  loading: true,
  refreshTick: 0,
  lastUpdated: getCATNow(),
  expandedCount: 0,
  bannerMessage: undefined,
  laterMessage: undefined,
  autoSwitchedToLater: false,
  hasLoadedFirstResults: false,
};

const clampRadius = (value: number, source: 'explore' | 'map' = 'explore') => {
  const safeValue = Number.isFinite(value) ? value : PRIMARY_WALK_RADIUS_M;
  const max = source === 'map' ? MAX_MAP_RADIUS_M : MAX_EXPLORE_RADIUS_M;
  return Math.max(PRIMARY_WALK_RADIUS_M, Math.min(max, Math.round(safeValue)));
};

const getTonightActive = (state: DiscoveryState) =>
  state.mode === 'TONIGHT' || state.secondaryFilters.tonightOnly;

export const DiscoveryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DiscoveryState>(DEFAULT_STATE);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const lastRequestKeyRef = useRef('');
  const isFetchingRef = useRef(false);
  const hasFetchedOnceRef = useRef(false);

  const categoriesKey = useMemo(
    () => JSON.stringify([...state.categories].sort()),
    [state.categories]
  );

  const secondaryKey = useMemo(
    () => JSON.stringify(state.secondaryFilters),
    [state.secondaryFilters]
  );

  const filteredVenues = useMemo(
    () => {
      const secondaryFiltered = applySecondaryFilters(state.venues, {
        tonightOnly: getTonightActive(state),
        crowd: state.secondaryFilters.crowd,
        priceVibe: state.secondaryFilters.priceVibe,
      });

      if (state.secondaryFilters.music === 'All') return secondaryFiltered;
      return secondaryFiltered.filter((venue) => matchesMusicFilter(venue, state.secondaryFilters.music));
    },
    [state.venues, state.mode, state.secondaryFilters]
  );

  const filteredScores = useMemo(() => {
    const ids = new Set(filteredVenues.map((venue) => venue.id));
    return state.scores.filter((score) => ids.has(score.venueId));
  }, [state.scores, filteredVenues]);

  const canExpandMapRadius =
    !state.loading &&
    state.mode === 'RIGHT_NOW' &&
    state.autoSwitchedToLater &&
    state.radiusMeters < MAX_MAP_RADIUS_M;

  useEffect(() => {
    const originUnset = state.origin.lat === 0 || state.origin.lng === 0;
    if (!hasFetchedOnceRef.current && originUnset) return;

    const requestKey = JSON.stringify({
      lat: state.origin.lat.toFixed(4),
      lng: state.origin.lng.toFixed(4),
      mode: state.mode,
      radius: state.radiusMeters,
      categories: categoriesKey,
      secondary: secondaryKey,
      query: state.searchQuery.trim().toLowerCase(),
      refreshNonce,
    });

    if (requestKey === lastRequestKeyRef.current || isFetchingRef.current) {
      return;
    }

    const fetchDiscovery = async () => {
      isFetchingRef.current = true;
      lastRequestKeyRef.current = requestKey;
      setState((prev) => ({
        ...prev,
        loading: true,
        expandedCount: 0,
        bannerMessage: undefined,
        laterMessage: undefined,
        autoSwitchedToLater: false,
      }));

      try {
        console.warn('[PERF] discovery fetch');
        const discovery = await runDiscovery({
          supabase,
          userLat: state.origin.lat,
          userLng: state.origin.lng,
          openNowOnly: state.mode === 'RIGHT_NOW',
          categories: state.categories,
          searchQuery: state.searchQuery,
          fallbackRadius: PRIMARY_WALK_RADIUS_M,
          maxRadiusMeters: Math.max(state.radiusMeters, MAX_EXPLORE_RADIUS_M),
        });

        const enriched = await enrichPlacesWithImages(discovery.venues as Place[]);
        const merged = enriched.map((venue) => {
          const original = discovery.venues.find((item) => item.id === venue.id);
          return { ...original, ...venue } as Place & { distanceNumeric?: number };
        });

        const scores = merged.map((venue) => {
          const distance = venue.distanceNumeric || MAX_EXPLORE_RADIUS_M;
          const normalized = 1 - Math.min(distance / MAX_EXPLORE_RADIUS_M, 1);
          return { venueId: venue.id, score: Math.max(0.1, normalized) };
        });

        let reason: string | undefined;
        if (state.radiusMeters > MAX_EXPLORE_RADIUS_M) {
          reason = `Expanded on map to ${(state.radiusMeters / 1000).toFixed(0)}km`;
        } else if (discovery.mode === 'later' && state.mode === 'RIGHT_NOW') {
          reason = 'No open spots nearby';
        } else if (discovery.usedRadius > RIDE_EXPANSION_RADIUS_M) {
          reason = 'Expanded to find more open options';
        }

        setState((prev) => ({
          ...prev,
          venues: merged,
          scores,
          loading: false,
          refreshTick: prev.refreshTick + 1,
          lastUpdated: getCATNow(),
          expandedCount: discovery.expansionCount,
          bannerMessage: discovery.bannerMessage,
          laterMessage: discovery.laterMessage,
          autoSwitchedToLater: discovery.mode === 'later' && prev.mode === 'RIGHT_NOW',
          radiusMeters:
            prev.mode === 'RIGHT_NOW' && discovery.usedRadius !== prev.radiusMeters
              ? discovery.usedRadius
              : prev.radiusMeters,
          lastExpansionReason: reason,
          hasLoadedFirstResults: true,
        }));
      } catch (error) {
        setState((prev) => ({ ...prev, loading: false, refreshTick: prev.refreshTick + 1 }));
      } finally {
        hasFetchedOnceRef.current = true;
        isFetchingRef.current = false;
      }
    };

    fetchDiscovery();
  }, [
    state.origin.lat,
    state.origin.lng,
    state.mode,
    state.radiusMeters,
    categoriesKey,
    secondaryKey,
    state.searchQuery,
    refreshNonce,
  ]);

  const setOrigin = useCallback((lat: number, lng: number, mode: OriginMode) => {
    setState((prev) => {
      if (
        Math.abs(prev.origin.lat - lat) < 0.0001 &&
        Math.abs(prev.origin.lng - lng) < 0.0001 &&
        prev.origin.mode === mode
      ) {
        return prev;
      }
      return { ...prev, origin: { lat, lng, mode } };
    });
  }, []);

  const setFocusedPlace = useCallback((id?: string) => {
    setState((prev) => ({ ...prev, focusedPlaceId: id }));
  }, []);

  const setGroupMode = useCallback((mode: FilterMode) => {
    setState((prev) => ({ ...prev, groupMode: mode }));
  }, []);

  const setDiscoveryMode = useCallback((mode: DiscoveryMode) => {
    setState((prev) => ({
      ...prev,
      mode,
      radiusMeters: mode === 'RIGHT_NOW' ? prev.radiusMeters : Math.min(prev.radiusMeters, MAX_EXPLORE_RADIUS_M),
    }));
  }, []);

  const setRadiusMeters = useCallback((radiusMeters: number, source: 'explore' | 'map' = 'explore') => {
    setState((prev) => ({ ...prev, radiusMeters: clampRadius(radiusMeters, source) }));
  }, []);

  const setCategories = useCallback((categories: string[]) => {
    setState((prev) => ({ ...prev, categories }));
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((item) => item !== category)
        : [...prev.categories, category],
    }));
  }, []);

  const setSearchQuery = useCallback((searchQuery: string) => {
    setState((prev) => ({ ...prev, searchQuery }));
  }, []);

  const setOpenNowOnly = useCallback((value: boolean) => {
    setState((prev) => ({
      ...prev,
      mode: value ? 'RIGHT_NOW' : prev.mode === 'RIGHT_NOW' ? 'LATER' : prev.mode,
      radiusMeters: value ? prev.radiusMeters : Math.min(prev.radiusMeters, MAX_EXPLORE_RADIUS_M),
    }));
  }, []);

  const setTonightOnly = useCallback((value: boolean) => {
    setState((prev) => ({
      ...prev,
      mode: value ? 'TONIGHT' : prev.mode === 'TONIGHT' ? 'LATER' : prev.mode,
      radiusMeters: Math.min(prev.radiusMeters, MAX_EXPLORE_RADIUS_M),
      secondaryFilters: { ...prev.secondaryFilters, tonightOnly: value },
    }));
  }, []);

  const setCrowd = useCallback((value: CrowdFilter) => {
    setState((prev) => ({ ...prev, secondaryFilters: { ...prev.secondaryFilters, crowd: value } }));
  }, []);

  const setPriceVibe = useCallback((value: PriceVibeFilter) => {
    setState((prev) => ({ ...prev, secondaryFilters: { ...prev.secondaryFilters, priceVibe: value } }));
  }, []);

  const setMusicFilter = useCallback((value: MusicFilter) => {
    setState((prev) => ({ ...prev, secondaryFilters: { ...prev.secondaryFilters, music: value } }));
  }, []);

  const cycleCrowd = useCallback(() => {
    setState((prev) => {
      const next: CrowdFilter =
        prev.secondaryFilters.crowd === 'any'
          ? 'quiet'
          : prev.secondaryFilters.crowd === 'quiet'
            ? 'vibes'
            : prev.secondaryFilters.crowd === 'vibes'
              ? 'packed'
              : 'any';
      return { ...prev, secondaryFilters: { ...prev.secondaryFilters, crowd: next } };
    });
  }, []);

  const cyclePriceVibe = useCallback(() => {
    setState((prev) => {
      const next: PriceVibeFilter =
        prev.secondaryFilters.priceVibe === 'any'
          ? 'easy'
          : prev.secondaryFilters.priceVibe === 'easy'
            ? 'mid'
            : prev.secondaryFilters.priceVibe === 'mid'
              ? 'treat'
              : 'any';
      return { ...prev, secondaryFilters: { ...prev.secondaryFilters, priceVibe: next } };
    });
  }, []);

  const refresh = useCallback(() => setRefreshNonce((prev) => prev + 1), []);

  const resetFilters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      groupMode: 'solo',
      mode: 'RIGHT_NOW',
      radiusMeters: PRIMARY_WALK_RADIUS_M,
      categories: [],
      secondaryFilters: DEFAULT_SECONDARY,
      searchQuery: '',
      lastExpansionReason: undefined,
    }));
    setRefreshNonce((prev) => prev + 1);
  }, []);

  const expandMapRadiusByTenKm = useCallback(() => {
    setState((prev) => {
      if (prev.mode !== 'RIGHT_NOW' || prev.radiusMeters >= MAX_MAP_RADIUS_M) {
        return prev;
      }
      const nextRadius = Math.min(MAX_MAP_RADIUS_M, prev.radiusMeters + 10000);
      return {
        ...prev,
        radiusMeters: nextRadius,
        lastExpansionReason: `Expanded on map to ${(nextRadius / 1000).toFixed(0)}km`,
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      state,
      filteredVenues,
      filteredScores,
      setOrigin,
      setFocusedPlace,
      setGroupMode,
      setDiscoveryMode,
      setRadiusMeters,
      setCategories,
      toggleCategory,
      setSearchQuery,
      setOpenNowOnly,
      setTonightOnly,
      setCrowd,
      setPriceVibe,
      setMusicFilter,
      cycleCrowd,
      cyclePriceVibe,
      refresh,
      resetFilters,
      expandMapRadiusByTenKm,
      canExpandMapRadius,
    }),
    [
      state,
      filteredVenues,
      filteredScores,
      setOrigin,
      setFocusedPlace,
      setGroupMode,
      setDiscoveryMode,
      setRadiusMeters,
      setCategories,
      toggleCategory,
      setSearchQuery,
      setOpenNowOnly,
      setTonightOnly,
      setCrowd,
      setPriceVibe,
      setMusicFilter,
      cycleCrowd,
      cyclePriceVibe,
      refresh,
      resetFilters,
      expandMapRadiusByTenKm,
      canExpandMapRadius,
    ]
  );

  return <DiscoveryContext.Provider value={value}>{children}</DiscoveryContext.Provider>;
};

export const useDiscoveryContext = () => {
  const context = useContext(DiscoveryContext);
  if (!context) {
    throw new Error('useDiscoveryContext must be used inside DiscoveryProvider');
  }
  return context;
};
