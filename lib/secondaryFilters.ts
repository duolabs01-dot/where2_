import { getCATNow, isPlaceOpenNow, PlaceOpenNowStatus } from './timeFilter'; // Import PlaceOpenNowStatus
import type { CrowdFilter, PriceVibeFilter } from './filtersStore';
import { Place } from '../types'; // Import Place

interface SecondaryFilterState {
  tonightOnly: boolean;
  crowd: CrowdFilter;
  priceVibe: PriceVibeFilter;
}

// SecondaryFilterPlace now extends Place
interface SecondaryFilterPlace extends Place {
  // We can add any specific properties needed for secondary filters here
  // For now, it just inherits from Place
}

const mapNumericCrowd = (value: number): CrowdFilter => {
  if (value <= 1.5) return 'quiet';
  if (value <= 2.5) return 'vibes';
  return 'packed';
};

export const getCrowdSignal = (place: SecondaryFilterPlace): CrowdFilter | null => {
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

  return null;
};

export const getPriceVibeFromLevel = (priceLevel?: number | null): PriceVibeFilter => {
  const normalized = Number(priceLevel ?? 2);
  if (normalized <= 2) return 'easy';
  if (normalized === 3) return 'mid';
  return 'treat';
};

// Refactor opensLaterToday to include already open places or those opening later today
export const opensLaterToday = (place: SecondaryFilterPlace, nowMinutes: number): boolean => {
  const openStatus: PlaceOpenNowStatus = isPlaceOpenNow(place);
  if (openStatus.is_open) return true; // Include if already open
  if (openStatus.opens_today) {
    // If it opens later today, then true. opens_at is already formatted HH:mm
    const [openH, openM] = openStatus.opens_at!.split(':').map(Number);
    const openingMinutes = openH * 60 + openM;
    return openingMinutes > nowMinutes;
  }
  return false; // Does not open later today
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

    if (filterState.crowd !== 'any') {
      const crowdSignal = getCrowdSignal(place);
      if (crowdSignal && crowdSignal !== filterState.crowd) {
        return false;
      }
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
