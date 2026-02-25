type CategoryLike = {
  category?: string | null;
  name?: string | null;
  description?: string | null;
  vibe_tags?: string[] | null;
  is_verified?: boolean | null;
  created_at?: string | Date | null;
};

const CATEGORY_ALIASES: Record<string, string[]> = {
  nightlife: ['nightlife', 'bar', 'club', 'lounge', 'pub', 'amapiano'],
  dining: ['dining', 'restaurant', 'food', 'eat', 'kitchen', 'grill', 'steak'],
  cafe: ['cafe', 'cafes', 'coffee', 'espresso', 'latte', 'brunch'],
  outdoors: ['outdoor', 'park', 'hike', 'garden', 'trail'],
  art: ['art', 'gallery', 'museum', 'creative'],
  music: ['music', 'live music', 'dj', 'concert'],
  'hidden gems': ['hidden gem', 'local favorite', 'underrated'],
};

const normalize = (value: string) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeSelection = (value: string) => {
  const n = normalize(value);
  if (n === 'all') return 'all';
  if (n === 'coffee' || n === 'cafes') return 'cafe';
  if (n === 'hidden gems' || n === 'hidden gem') return 'hidden gems';
  return n;
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const isRecentVenue = (createdAt?: string | Date | null) => {
  if (!createdAt) return false;
  const createdDate = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) return false;

  const ageMs = Date.now() - createdDate.getTime();
  return ageMs >= 0 && ageMs <= THIRTY_DAYS_MS;
};

const isHiddenGem = (item: CategoryLike) =>
  item.is_verified === false || isRecentVenue(item.created_at);

export const matchesCategoryFilters = (
  item: CategoryLike,
  selectedCategories: string[] = []
) => {
  if (!selectedCategories.length) return true;

  const normalizedSelections = selectedCategories.map(normalizeSelection);
  if (normalizedSelections.includes('all')) return true;

  const includeHiddenGems = normalizedSelections.includes('hidden gems');
  const filterableSelections = normalizedSelections.filter((s) => s !== 'hidden gems');
  if (!filterableSelections.length) return includeHiddenGems ? isHiddenGem(item) : true;

  const haystack = normalize([
    item.category,
    item.name,
    item.description,
    ...(Array.isArray(item.vibe_tags) ? item.vibe_tags : []),
  ]
    .filter(Boolean)
    .join(' '));

  return filterableSelections.some((selection) => {
    const keywords = CATEGORY_ALIASES[selection] || [selection];
    return keywords.some((keyword) => haystack.includes(normalize(keyword)));
  }) || (includeHiddenGems && isHiddenGem(item));
};
