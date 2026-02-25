import { getCATNow, isPlaceOpenNow } from './timeFilter';
import type { CrowdFilter, PriceVibeFilter } from './filtersStore';

interface SecondaryFilterState {
  tonightOnly: boolean;
  crowd: CrowdFilter;
  priceVibe: PriceVibeFilter;
}

interface SecondaryFilterPlace {
  id?: string;
  name?: string;
  opening_time?: string;
  price_level?: number;
  [key: string]: any;
}

const parseMinutes = (timeText?: string | null): number | null => {
  if (!timeText) return null;
  const match = String(timeText).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
};

const hashSeed = (value: string): number => {
  let seed = 0;
  for (let i = 0; i < value.length; i += 1) {
    seed = (seed * 31 + value.charCodeAt(i)) % 100000;
  }
  return seed;
};

const mapNumericCrowd = (value: number): CrowdFilter => {
  if (value <= 1.5) return 'quiet';
  if (value <= 2.5) return 'vibes';
  return 'packed';
};

export const getCrowdSignal = (place: SecondaryFilterPlace): CrowdFilter => {
  const crowdReports = (place as any).crowd_reports;

  if (typeof crowdReports === 'number') {
    return mapNumericCrowd(crowdReports);
  }

  if (typeof crowdReports === 'string') {
    const value = crowdReports.toLowerCase();
    if (value.includes('quiet')) return 'quiet';
    if (value.includes('vibe')) return 'vibes';
    if (value.includes('pack')) return 'packed';
  }

  if (Array.isArray(crowdReports) && crowdReports.length > 0) {
    const numeric = crowdReports
      .map((item) =>
        typeof item === 'number'
          ? item
          : typeof item?.level === 'number'
            ? item.level
            : typeof item?.score === 'number'
              ? item.score
              : null
      )
      .filter((item): item is number => typeof item === 'number');
    if (numeric.length > 0) {
      const avg = numeric.reduce((sum, item) => sum + item, 0) / numeric.length;
      return mapNumericCrowd(avg);
    }
  }

  const seedBase = `${place.id ?? ''}:${place.name ?? ''}`;
  const mockIndex = hashSeed(seedBase) % 3;
  if (mockIndex === 0) return 'quiet';
  if (mockIndex === 1) return 'vibes';
  return 'packed';
};

export const getPriceVibeFromLevel = (priceLevel?: number | null): PriceVibeFilter => {
  const normalized = Number(priceLevel ?? 2);
  if (normalized <= 2) return 'easy';
  if (normalized === 3) return 'mid';
  return 'treat';
};

export const opensLaterToday = (place: SecondaryFilterPlace, nowMinutes: number): boolean => {
  if (isPlaceOpenNow(place)) return false;
  const openingMinutes = parseMinutes(place.opening_time);
  if (openingMinutes === null) return false;
  return openingMinutes > nowMinutes;
};

export const applySecondaryFilters = <T extends SecondaryFilterPlace>(
  places: T[],
  filterState: SecondaryFilterState
): T[] => {
  const now = getCATNow();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return places.filter((place) => {
    if (filterState.tonightOnly && !opensLaterToday(place, nowMinutes)) {
      return false;
    }

    if (filterState.crowd !== 'any' && getCrowdSignal(place) !== filterState.crowd) {
      return false;
    }

    if (
      filterState.priceVibe !== 'any' &&
      getPriceVibeFromLevel(place.price_level) !== filterState.priceVibe
    ) {
      return false;
    }

    return true;
  });
};
