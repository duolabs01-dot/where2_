import { SupabaseClient } from '@supabase/supabase-js';
import { Place } from '../../types';
import { matchesCategoryFilters } from '../../lib/categoryFilter';
import { haversineMeters } from './haversine';
import { isPlaceOpenNow } from '../../lib/timeFilter'; // Use the new isPlaceOpenNow

export const PRIMARY_WALK_RADIUS_M = 600; // 8-min walk @ 75m/min
export const RIDE_EXPANSION_RADIUS_M = 1500; // ~5-min ride
export const MAX_EXPLORE_RADIUS_M = 30000; // 30km cap
export const MAX_MAP_RADIUS_M = 100000; // 100km cap (map opt-in only)
const MIN_OPEN_RESULTS = 3;

const BASE_RADIUS_STEPS = [600, 1500, 3000, 6000, 12000, 20000, 30000];
const EXACT_RIDE_BANNER = 'Nothing perfect nearby — expanding to a 5-min ride ';

type DiscoverMode = 'right_now' | 'later';

export interface DiscoveryVenue extends Place {
  distanceNumeric: number;
  open_now: boolean;
}

export interface DiscoveryResult {
  venues: DiscoveryVenue[];
  mode: DiscoverMode;
  usedRadius: number;
  expansionCount: number;
  bannerMessage?: string;
  laterMessage?: string;
  elapsedMs: number;
}

interface DiscoveryParams {
  supabase: SupabaseClient;
  userLat: number;
  userLng: number;
  openNowOnly: boolean;
  categories?: string[];
  searchQuery?: string;
  fallbackRadius?: number;
  maxRadiusMeters?: number;
}

const normalize = (value?: string | null) =>
  String(value || '')
    .toLowerCase()
    .trim();

const matchesQuery = (place: Place, query?: string) => {
  const q = normalize(query);
  if (!q) return true;
  const haystack = normalize(
    [
      place.name,
      place.category,
      place.address,
      place.description,
      ...(Array.isArray(place.vibe_tags) ? place.vibe_tags : []),
    ]
      .filter(Boolean)
      .join(' ')
  );
  return haystack.includes(q);
};

const withDefaults = (place: Place): Place => {
  const safeCategory = place.category?.trim() ? place.category : '✨ Surprise spot';
  return {
    ...place,
    category: safeCategory,
  };
};

const buildRadiusSteps = (maxRadiusMeters: number): number[] => {
  const capped = Math.max(PRIMARY_WALK_RADIUS_M, maxRadiusMeters);
  const steps = [...BASE_RADIUS_STEPS.filter((step) => step <= capped)];

  if (capped > MAX_EXPLORE_RADIUS_M) {
    for (let next = MAX_EXPLORE_RADIUS_M + 10000; next <= capped; next += 10000) {
      steps.push(next);
    }
  }

  if (!steps.includes(capped)) {
    steps.push(capped);
  }

  return steps;
};

export const runDiscovery = async ({
  supabase,
  userLat,
  userLng,
  openNowOnly,
  categories = [],
  searchQuery = '',
  fallbackRadius = PRIMARY_WALK_RADIUS_M,
  maxRadiusMeters = MAX_EXPLORE_RADIUS_M,
}: DiscoveryParams): Promise<DiscoveryResult> => {
  const startedAt = Date.now();
  const maxRadiusCap = Math.max(PRIMARY_WALK_RADIUS_M, Math.min(MAX_MAP_RADIUS_M, maxRadiusMeters));
  const radiusSteps = buildRadiusSteps(maxRadiusCap);

  // Update Supabase query to select is_24_7 and join operating_hours
  console.log('[Discovery] Fetching places for lat:', userLat, 'lng:', userLng);
  const { data, error } = await supabase.from('places').select('*, is_24_7, operating_hours(*)').limit(500);
  console.log('[Discovery] Places response:', { dataCount: data?.length, error: error?.message || error });
  if (error) {
    throw new Error(error.message || 'Failed to fetch places');
  }

  if (!data || data.length === 0) {
    console.warn('[Discovery] No places found in database');
  }

  const prepared: DiscoveryVenue[] = ((data || []) as Place[])
    .map(withDefaults)
    .filter((place) => typeof place.latitude === 'number' && typeof place.longitude === 'number')
    .filter((place) => matchesQuery(place, searchQuery))
    .filter((place) => {
      if (!categories.length || categories.includes('All')) return true;
      if (!place.category || place.category === '✨ Surprise spot') return true;
      return matchesCategoryFilters(place, categories);
    })
    .map((place) => {
      const distanceNumeric = haversineMeters(userLat, userLng, place.latitude!, place.longitude!);
      // Update open_now calculation to use the new isPlaceOpenNow
      const { is_open: open_now } = isPlaceOpenNow(place);
      return { ...place, distanceNumeric, open_now };
    })
    .sort((a, b) => a.distanceNumeric - b.distanceNumeric);

  if (!openNowOnly) {
    let usedRadius = Math.max(PRIMARY_WALK_RADIUS_M, Math.min(maxRadiusCap, fallbackRadius));
    let venues = prepared.filter((place) => place.distanceNumeric <= usedRadius);
    let expansionCount = 0;

    // Auto-expand in 'later' mode if no venues are found within starting radius
    if (venues.length === 0) {
      for (const radius of radiusSteps) {
        if (radius <= usedRadius) continue;
        const count = prepared.filter((place) => place.distanceNumeric <= radius).length;
        usedRadius = radius;
        expansionCount++;
        if (count > 0) break;
      }
      venues = prepared.filter((place) => place.distanceNumeric <= usedRadius);
    }

    // Final fallback: if still empty, return nearest 40 regardless of distance
    if (venues.length === 0 && prepared.length > 0) {
        venues = prepared.slice(0, 40);
        usedRadius = venues[venues.length - 1].distanceNumeric;
    }

    return {
      venues,
      mode: 'later',
      usedRadius,
      expansionCount,
      elapsedMs: Date.now() - startedAt,
    };
  }

  const openOnly = prepared.filter((place) => place.open_now);

  let usedRadius = PRIMARY_WALK_RADIUS_M;
  let expansionCount = 0;
  for (const radius of radiusSteps) {
    const count = openOnly.filter((place) => place.distanceNumeric <= radius).length;
    usedRadius = radius;
    if (radius > PRIMARY_WALK_RADIUS_M) expansionCount++;
    if (count >= MIN_OPEN_RESULTS) break;
  }

  const rightNow = openOnly.filter((place) => place.distanceNumeric <= usedRadius);

  if (rightNow.length > 0) {
    return {
      venues: rightNow,
      mode: 'right_now',
      usedRadius,
      expansionCount,
      bannerMessage: usedRadius >= RIDE_EXPANSION_RADIUS_M ? EXACT_RIDE_BANNER : undefined,
      elapsedMs: Date.now() - startedAt,
    };
  }

  const closestForLater = prepared.slice(0, 40);
  return {
    venues: closestForLater,
    mode: 'later',
    usedRadius: maxRadiusCap,
    expansionCount: radiusSteps.length - 1,
    bannerMessage: EXACT_RIDE_BANNER,
    laterMessage: "Aweh, it's not really happening close by right now — here are the nearest spots for later.",
    elapsedMs: Date.now() - startedAt,
  };
};
