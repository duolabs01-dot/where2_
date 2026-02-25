import { Place } from '../types';

export type MusicFilter = 'All' | 'Amapiano' | 'Amatshe' | 'Jazz' | 'RnB';
export type MusicTag = Exclude<MusicFilter, 'All'>;

export const MUSIC_TAGS: MusicTag[] = ['Amapiano', 'Amatshe', 'Jazz', 'RnB'];

const hashSeed = (value: string): number => {
  let seed = 0;
  for (let i = 0; i < value.length; i += 1) {
    seed = (seed * 33 + value.charCodeAt(i)) % 1000003;
  }
  return seed;
};

const normalizeText = (value?: string | null) => String(value || '').toLowerCase();

const hasAny = (text: string, needles: string[]) => needles.some((needle) => text.includes(needle));

export const getMockMusicTags = (place: Place): MusicTag[] => {
  const bag = normalizeText(
    [
      place.name,
      place.category,
      place.description,
      ...(Array.isArray(place.vibe_tags) ? place.vibe_tags : []),
    ]
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
  const tags = getMockMusicTags(place);
  return tags.includes(filter);
};

export interface VenuePsychSignals {
  reasons: string[];
  rotatingSignals: string[];
  musicTags: MusicTag[];
}

export const getVenuePsychSignals = (place: Place, areaLabel = 'your side'): VenuePsychSignals => {
  const seed = hashSeed(`${place.id}:${place.name}`);
  const musicTags = getMockMusicTags(place);
  const reasons: string[] = [];
  const rotatingSignals: string[] = [];

  const trending = seed % 3 === 0;
  const packed = seed % 5 === 0;
  const friendsHere = (seed % 4 === 0 ? (seed % 3) + 1 : 0);

  if (trending) {
    reasons.push(`Trending in ${areaLabel}`);
    rotatingSignals.push('Trending here!');
  }

  if (musicTags.length > 0) {
    reasons.push(`${musicTags[0]} spot`);
  }

  if (friendsHere > 0) {
    reasons.push(`${friendsHere} friends here now`);
  }

  if (packed) {
    rotatingSignals.push("✨ It's happening!");
  }

  if (reasons.length === 0) {
    reasons.push('Easy decision');
    reasons.push('Solid vibes');
  }

  return {
    reasons: reasons.slice(0, 2),
    rotatingSignals: rotatingSignals.slice(0, 2),
    musicTags,
  };
};
