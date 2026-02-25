import { Place } from '../types';

export type MusicFilter = 'All' | 'Amapiano' | 'Amatshe' | 'Jazz' | 'RnB';
export type MusicTag = Exclude<MusicFilter, 'All'>;

export const MUSIC_TAGS: MusicTag[] = ['Amapiano', 'Amatshe', 'Jazz', 'RnB'];

const normalizeText = (value?: string | null) => String(value || '').toLowerCase();

const hasAny = (text: string, needles: string[]) => needles.some((needle) => text.includes(needle));

const getMusicTagsFromVenue = (place: Place): MusicTag[] => {
  const bag = normalizeText(
    [...(Array.isArray(place.vibe_tags) ? place.vibe_tags : [])]
      .filter(Boolean)
      .join(' ')
  );

  const tags: MusicTag[] = [];
  if (hasAny(bag, ['amapiano', 'piano', 'yano'])) tags.push('Amapiano');
  if (hasAny(bag, ['amatshe', 'gqom', 'afrotech'])) tags.push('Amatshe');
  if (hasAny(bag, ['jazz', 'sax', 'blues'])) tags.push('Jazz');
  if (hasAny(bag, ['rnb', 'r&b', 'soul', 'hip hop', 'hiphop'])) tags.push('RnB');

  return Array.from(new Set(tags)).slice(0, 2);
};

export const matchesMusicFilter = (place: Place, filter: MusicFilter): boolean => {
  if (filter === 'All') return true;
  const tags = getMusicTagsFromVenue(place);
  return tags.includes(filter);
};

export interface VenuePsychSignals {
  reasons: string[];
  rotatingSignals: string[];
  musicTags: MusicTag[];
}

export const getVenuePsychSignals = (place: Place, areaLabel = 'your side'): VenuePsychSignals => {
  const musicTags = getMusicTagsFromVenue(place);
  const reasons: string[] = [];
  const rotatingSignals: string[] = [];
  const crowdReports = (place as any).crowd_reports;

  if (musicTags.length > 0) reasons.push(`${musicTags[0]} spot`);
  if (place.category?.trim()) reasons.push(`${place.category.trim()} in ${areaLabel}`);

  if (typeof place.price_level === 'number') {
    if (place.price_level <= 2) reasons.push('Easy on the pocket');
    if (place.price_level >= 4) reasons.push('Treat-yourself vibe');
  }

  if (typeof crowdReports === 'string') {
    const crowd = crowdReports.toLowerCase();
    if (crowd.includes('pack')) rotatingSignals.push("It's happening!");
    if (crowd.includes('trend')) rotatingSignals.push('Trending here!');
  } else if (typeof crowdReports === 'number') {
    if (crowdReports >= 2.6) rotatingSignals.push("It's happening!");
    if (crowdReports >= 2.1 && crowdReports < 2.6) rotatingSignals.push('Trending here!');
  }

  if (reasons.length === 0) reasons.push('Easy decision - solid vibes.');

  return {
    reasons: reasons.slice(0, 2),
    rotatingSignals: rotatingSignals.slice(0, 2),
    musicTags,
  };
};
