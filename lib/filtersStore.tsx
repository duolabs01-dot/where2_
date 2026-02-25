import React, { ReactNode } from 'react';
import {
  CrowdFilter,
  FilterMode,
  MusicFilter,
  PriceVibeFilter,
  useDiscoveryContext,
} from '../src/state/DiscoveryContext';

export type { CrowdFilter, FilterMode, MusicFilter, PriceVibeFilter };

export const FiltersProvider: React.FC<{ children: ReactNode }> = ({ children }) => <>{children}</>;

export const useFilters = () => {
  const {
    state,
    setOrigin,
    setGroupMode,
    setRadiusMeters,
    setOpenNowOnly,
    setCategories,
    setTonightOnly,
    setCrowd,
    setPriceVibe,
    setMusicFilter,
    cycleCrowd,
    cyclePriceVibe,
    toggleCategory,
    resetFilters,
  } = useDiscoveryContext();

  return {
    state: {
      mode: state.groupMode,
      discoveryMode: state.mode,
      radiusMeters: state.radiusMeters,
      openNowOnly: state.mode === 'RIGHT_NOW',
      categories: state.categories,
      tonightOnly: state.mode === 'TONIGHT' || state.secondaryFilters.tonightOnly,
      crowd: state.secondaryFilters.crowd as CrowdFilter,
      priceVibe: state.secondaryFilters.priceVibe as PriceVibeFilter,
      musicFilter: state.secondaryFilters.music as MusicFilter,
      musicVibe: state.secondaryFilters.music === 'All' ? null : state.secondaryFilters.music,
      lastExpansionReason: state.lastExpansionReason,
    },
    setMode: setGroupMode,
    setRadiusMeters: (radiusMeters: number) => setRadiusMeters(radiusMeters, 'explore'),
    setOpenNowOnly,
    setOrigin: (mode: 'gps' | 'fallback' | 'preferences' = 'preferences') =>
      setOrigin(state.origin.lat, state.origin.lng, mode),
    setCategories,
    setTonightOnly,
    setCrowd,
    setPriceVibe,
    setMusicFilter,
    setMusicVibe: (value: string | null) => {
      if (!value || value === 'Any') {
        setMusicFilter('All');
        return;
      }
      if (value === 'Amapiano' || value === 'Amatshe' || value === 'Jazz' || value === 'RnB') {
        setMusicFilter(value);
        return;
      }
      // Unsupported labels should not crash filter state.
      setMusicFilter('All');
    },
    cycleCrowd,
    cyclePriceVibe,
    toggleCategory,
    resetFilters,
    applyCustomise: () => undefined,
  };
};
