
import { SupabaseClient } from '@supabase/supabase-js';
import { isPlaceOpenNow } from '../../lib/timeFilter'; // Corrected import path
import { Place } from '../../types'; // Import the Place type

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

    async getTopPicks(options: any) {
        // Update Supabase query to select is_24_7 and join operating_hours
        let query = this.supabase.from('places').select('*, is_24_7, operating_hours(*)');
        
        // Category filtering (Server-side)
        if (options.categories?.length && !options.categories.includes('All')) {
            query = query.in('category', options.categories);
        }

        // Name search (Server-side)
        if (options.searchQuery) {
            query = query.ilike('name', `%${options.searchQuery}%`);
        }

        // Fetch a MUCH larger pool to allow for extensive client-side filtering (Radius, Open Now, Music)
        // Since we don't have geospatial sorting on server, we must fetch widely to find nearby/open spots.
        const limit = 500; 
        const { data, error } = await query.limit(limit);
        
        if (error) console.error("RecommendationEngine Error:", error);

        let places = (data || []) as Place[]; // Changed Venue[] to Place[]

        // 1. Strict Client-Side Open Now Filtering (Only if explicitly requested)
        if (options.openNow) {
            places = places.filter(p => isPlaceOpenNow(p).is_open); // Changed v to p and access is_open property
        }

        // 2. Music Vibe Filtering
        if (options.musicVibe) {
            places = places.filter(p => matchMusicVibe(p, options.musicVibe)); // Changed v to p
        }

        // 3. Clamp back to reasonable size after filtering
        if (places.length > 50) {
            places = places.slice(0, 50);
        }

        return {
            venues: places, // Changed venues to places
            scores: places.map(p => ({ venueId: p.id, score: 0.9 })), // Changed v to p
            isNameSearch: !!options.searchQuery
        };
    }
}
