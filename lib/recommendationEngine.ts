
import { SupabaseClient } from '@supabase/supabase-js';
import { isPlaceOpenNow, getTimeOfDayBiasCategories } from './timeFilter';
import { matchesCategoryFilters, CATEGORY_ALIASES } from './categoryFilter';
import { Place } from '../types'; // Import Place interface
import { DiscoveryVenue } from '../src/lib/discoveryEngine'; // Import DiscoveryVenue

export interface VenueScore { venueId: string; score: number; }

const matchMusicVibe = (venue: Place, vibe: string | null): boolean => { // Changed Venue to Place
    if (!vibe || vibe === 'Any') return true;
    
    const normalizedVibe = vibe.toLowerCase();
    // Safely handle potential missing tags
    const tags = (venue.vibe_tags || []).map(t => t.toLowerCase());
    // Create a rich text corpus for heuristic matching
    const text = (venue.name + ' ' + (venue.description || '') + ' ' + venue.category).toLowerCase();

    // 1. Amapiano / Piano
    if (normalizedVibe === 'amapiano') {
        if (tags.some(t => t.includes('amapiano') || t.includes('piano') || t.includes('yanos') || t.includes('afro'))) return true;
        if (text.includes('amapiano') || text.includes('log drum') || text.includes('soulful') || text.includes('groove')) return true;
    }
    
    // 2. Deep House
    if (normalizedVibe === 'deep house') {
        if (tags.some(t => t.includes('deep house') || t.includes('house') || t.includes('electronic') || t.includes('techno'))) return true;
        if (text.includes('deep house') || text.includes('house music') || text.includes('sunset') || text.includes('lounge') || text.includes('dj')) return true;
    }

    // 3. Blues / Ballads / Jazz
    if (normalizedVibe === 'blues / ballads') {
        if (tags.some(t => t.includes('blues') || t.includes('jazz') || t.includes('ballad') || t.includes('live music') || t.includes('acoustic'))) return true;
        if (text.includes('blues') || text.includes('jazz') || text.includes('piano') || text.includes('live band') || text.includes('sax') || text.includes('classy')) return true;
    }

    return false;
};

export class RecommendationEngine {
    constructor(private supabase: SupabaseClient) {}

    async getTopPicks(options: any): Promise<{ venues: DiscoveryVenue[]; scores: VenueScore[]; isNameSearch: boolean; }> { // Added return type
        const {
            location,
            radius,
            openNow,
            categories = [],
            userPreferences = [],
            searchQuery
        } = options || {};

        // Update Supabase query to select is_24_7 and join operating_hours
        let query = this.supabase.from('places').select('*, is_24_7, operating_hours(*)');

        // Name search – keep this so Discover can treat it specially
        if (searchQuery) {
            query = query.ilike('name', `%${searchQuery}%`);
        }

        const { data, error } = await query.limit(200);

        if (error) {
            console.error('RecommendationEngine Error:', error);
            return { venues: [], scores: [], isNameSearch: !!searchQuery }; // Return empty on error
        }

        const raw = (data || []) as Place[]; // Use Place[] instead of Venue[]

        // If we have no location information, still apply non-distance filters.
        if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
            const filtered = raw.filter((p) => { // Changed v to p
                if (!matchesCategoryFilters(p, categories)) return false; // Changed v to p
                if (openNow && !isPlaceOpenNow(p).is_open) return false; // Changed v to p
                return true;
            }) as DiscoveryVenue[]; // Cast to DiscoveryVenue[]
            return {
                venues: filtered,
                scores: filtered.map(p => ({ venueId: p.id, score: 0.9 })), // Changed v to p
                isNameSearch: !!searchQuery
            };
        }

        const toRad = (v: number) => (v * Math.PI) / 180;
        const earthRadiusM = 6371e3;
        const prefTags: string[] = Array.isArray(userPreferences) ? userPreferences : [];

        const scored = raw
            .map((p) => { // Changed v to p
                // Distance in meters from user
                let distanceNumeric = 0;
                if (typeof p.latitude === 'number' && typeof p.longitude === 'number') { // Changed v to p
                    const dLat = toRad(p.latitude - location.lat); // Changed v to p
                    const dLng = toRad(p.longitude - location.lng); // Changed v to p
                    const a =
                        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(toRad(location.lat)) *
                            Math.cos(toRad(p.latitude)) * // Changed v to p
                            Math.sin(dLng / 2) *
                            Math.sin(dLng / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    distanceNumeric = earthRadiusM * c;
                }

                const openStatus = isPlaceOpenNow(p); // PlaceOpenNowStatus
                const open_now = openStatus.is_open; // Extract is_open

                const withinRadius = !radius || distanceNumeric <= radius;
                if (!withinRadius) {
                    return null;
                }

                if (!matchesCategoryFilters(p, categories)) { // Changed v to p
                    return null;
                }

                if (openNow && !open_now) { // Use open_now here
                    return null;
                }

                // Compute simple vibe match score
                const placeTags: string[] = [ // Changed venueTags to placeTags
                    p.category, // Changed v to p
                    ...(Array.isArray(p.vibe_tags) ? p.vibe_tags : []) // Changed v to p
                ]
                    .filter(Boolean)
                    .map((t) => String(t).toLowerCase());

                let vibeScore = 0;
                if (prefTags.length && placeTags.length) { // Changed venueTags to placeTags
                    const prefLower = prefTags.map((p) => String(p).toLowerCase());
                    const matches = placeTags.filter((tag) => // Changed venueTags to placeTags
                        prefLower.some((p) => tag.includes(p) || p.includes(tag))
                    );
                    if (matches.length > 0) {
                        vibeScore = 1 + 0.5 * (matches.length - 1);
                    }
                }

                // Distance score: closer is better; beyond ~10km fades out
                let distanceScore = 0;
                if (distanceNumeric > 0) {
                    const km = distanceNumeric / 1000;
                    if (km <= 2) distanceScore = 1;
                    else if (km <= 5) distanceScore = 0.8;
                    else if (km <= 10) distanceScore = 0.5;
                    else if (km <= 20) distanceScore = 0.2;
                }

                const openBonus = open_now ? 0.8 : 0; // Use open_now
                const base = 0.3;

                // Multi-category bonus
                const selectedNormalized = categories.map((c: string) => c.toLowerCase());
                const placeCategoryText = [p.category, ...(p.vibe_tags || [])].join(' ').toLowerCase(); // Changed venueCategoryText to placeCategoryText, v to p
                const matchCount = selectedNormalized.filter((cat: string) =>
                    (CATEGORY_ALIASES[cat] || [cat]).some((kw) => placeCategoryText.includes(kw)) // Changed venueCategoryText to placeCategoryText
                ).length;
                const multiCategoryBonus = matchCount > 1 ? (matchCount - 1) * 0.3 : 0;

                // Time-of-day bias — only applied when user has no category filter active
                let timeBonus = 0;
                if (!categories || categories.length === 0 || categories.includes('All')) {
                    const biasCategories = getTimeOfDayBiasCategories();
                    const placeText = [p.category, ...(Array.isArray(p.vibe_tags) ? p.vibe_tags : [])].join(' ').toLowerCase(); // Changed venueText to placeText, v to p
                    const biasMatch = biasCategories.some((kw) => placeText.includes(kw)); // Changed venueText to placeText
                    if (biasMatch) timeBonus = 0.6;
                }

                const score = base + openBonus + vibeScore + distanceScore + multiCategoryBonus + timeBonus;

                const distanceLabel =
                    distanceNumeric > 0
                        ? distanceNumeric < 1000
                            ? `${Math.round(distanceNumeric)}m`
                            : `${(distanceNumeric / 1000).toFixed(1)}km`
                        : p.distance; // Changed v to p

                const enriched: DiscoveryVenue & { _score: number } = { // Explicitly use DiscoveryVenue
                    ...p, // Changed v to p
                    distanceNumeric,
                    open_now, // Add open_now
                    distance: distanceLabel,
                    _score: score
                };

                return enriched;
            })
            .filter(Boolean) as (DiscoveryVenue & { _score: number })[]; // Cast to DiscoveryVenue

        // Respect active filters: return empty when nothing matches.
        if (scored.length === 0) {
            return {
                venues: [],
                scores: [],
                isNameSearch: !!searchQuery
            };
        }

        scored.sort((a, b) => b._score - a._score);

        return {
            venues: scored,
            scores: scored.map(p => ({ venueId: p.id, score: p._score })), // Changed v to p
            isNameSearch: !!searchQuery
        };
    }
}

