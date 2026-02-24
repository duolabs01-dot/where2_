
import { SupabaseClient } from '@supabase/supabase-js';
import { isPlaceOpenNow } from './timeFilter';
import { matchesCategoryFilters } from './categoryFilter';

export interface Venue {
    id: string;
    name: string;
    category: string;
    city: string;
    latitude: number;
    longitude: number;
    status: string;
    opening_time: string;
    closing_time: string;
    price_level: number;
    dist_meters?: number;
    distanceNumeric?: number;
    distance?: string; // Added for compatibility
    vibe_tags?: string[];
    description?: string;
    address?: string;
    is_verified?: boolean;
    popular_items?: any[];
    cover_image?: string;
}

export interface VenueScore { venueId: string; score: number; }

export class RecommendationEngine {
    constructor(private supabase: SupabaseClient) {}

    async getTopPicks(options: any) {
        const {
            location,
            radius,
            openNow,
            categories = [],
            userPreferences = [],
            searchQuery
        } = options || {};

        let query = this.supabase.from('places').select('*');

        // Name search – keep this so Discover can treat it specially
        if (searchQuery) {
            query = query.ilike('name', `%${searchQuery}%`);
        }

        const { data, error } = await query.limit(200);

        if (error) {
            console.error('RecommendationEngine Error:', error);
        }

        const raw = (data || []) as Venue[];

        // If we have no location information, still apply non-distance filters.
        if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
            const filtered = raw.filter((v) => {
                if (!matchesCategoryFilters(v, categories)) return false;
                if (openNow && !isPlaceOpenNow(v)) return false;
                return true;
            });
            return {
                venues: filtered,
                scores: filtered.map(v => ({ venueId: v.id, score: 0.9 })),
                isNameSearch: !!searchQuery
            };
        }

        const toRad = (v: number) => (v * Math.PI) / 180;
        const earthRadiusM = 6371e3;
        const prefTags: string[] = Array.isArray(userPreferences) ? userPreferences : [];

        const scored = raw
            .map((v) => {
                // Distance in meters from user
                let distanceNumeric = 0;
                if (typeof v.latitude === 'number' && typeof v.longitude === 'number') {
                    const dLat = toRad(v.latitude - location.lat);
                    const dLng = toRad(v.longitude - location.lng);
                    const a =
                        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(toRad(location.lat)) *
                            Math.cos(toRad(v.latitude)) *
                            Math.sin(dLng / 2) *
                            Math.sin(dLng / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    distanceNumeric = earthRadiusM * c;
                }

                const withinRadius = !radius || distanceNumeric <= radius;
                if (!withinRadius) {
                    return null;
                }

                if (!matchesCategoryFilters(v, categories)) {
                    return null;
                }

                const isOpen = isPlaceOpenNow(v);
                if (openNow && !isOpen) {
                    return null;
                }

                // Compute simple vibe match score
                const venueTags: string[] = [
                    v.category,
                    ...(Array.isArray(v.vibe_tags) ? v.vibe_tags : [])
                ]
                    .filter(Boolean)
                    .map((t) => String(t).toLowerCase());

                let vibeScore = 0;
                if (prefTags.length && venueTags.length) {
                    const prefLower = prefTags.map((p) => String(p).toLowerCase());
                    const matches = venueTags.filter((tag) =>
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

                const openBonus = isOpen ? 0.8 : 0;
                const base = 0.3;

                const score = base + openBonus + vibeScore + distanceScore;

                const distanceLabel =
                    distanceNumeric > 0
                        ? distanceNumeric < 1000
                            ? `${Math.round(distanceNumeric)}m`
                            : `${(distanceNumeric / 1000).toFixed(1)}km`
                        : v.distance;

                const enriched: Venue & { distanceNumeric?: number; distance?: string; _score: number } = {
                    ...v,
                    distanceNumeric,
                    distance: distanceLabel,
                    _score: score
                };

                return enriched;
            })
            .filter(Boolean) as (Venue & { distanceNumeric?: number; distance?: string; _score: number })[];

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
            scores: scored.map(v => ({ venueId: v.id, score: v._score })),
            isNameSearch: !!searchQuery
        };
    }
}

