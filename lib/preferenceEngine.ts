
const PREF_STORAGE_KEY = 'where2_user_prefs_v1';

export interface UserPrefs {
    categories: string[];
    vibes: string[];
}

const readPrefs = (): UserPrefs => {
    if (typeof window === 'undefined') {
        return { categories: [], vibes: [] };
    }
    try {
        const raw = localStorage.getItem(PREF_STORAGE_KEY);
        if (!raw) return { categories: [], vibes: [] };
        const parsed = JSON.parse(raw);
        return {
            categories: Array.isArray(parsed.categories) ? parsed.categories : [],
            vibes: Array.isArray(parsed.vibes) ? parsed.vibes : []
        };
    } catch {
        return { categories: [], vibes: [] };
    }
};

const writePrefs = (prefs: UserPrefs) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
        // Ignore write failures (private mode, etc.)
    }
};

export const getUserPrefs = (): UserPrefs => readPrefs();

export const preferenceEngine = {
    /**
     * Apply an explicit set of vibes / categories picked by the user.
     * Used by onboarding and preference nudges.
     */
    applyExplicitSelection: (selected: string[]) => {
        const current = readPrefs();
        const normalized = Array.from(
            new Set(
                selected
                    .map(s => s.trim())
                    .filter(Boolean)
            )
        );
        const next: UserPrefs = {
            categories: current.categories,
            vibes: normalized
        };
        writePrefs(next);
    },

    /**
     * Lightweight behavioral updates from in-app actions
     * (e.g. saving a place, navigating to it, strong like).
     */
    updateFromBehavior: (behavior: 'save' | 'unsave' | 'navigate' | 'view', venue: any) => {
        if (!venue) return;
        const current = readPrefs();

        // Derive candidate tags from venue category + vibe_tags
        const rawTags: string[] = [
            venue.category,
            ...(Array.isArray(venue.vibe_tags) ? venue.vibe_tags : [])
        ].filter(Boolean);

        if (rawTags.length === 0) return;

        const boostTags = (tags: string[], weight: number) => {
            // For now we just ensure they’re present; a future version could track weights.
            let merged = [...current.vibes];
            if (weight > 0) {
                for (const t of tags) {
                    const clean = String(t).trim();
                    if (!clean) continue;
                    const lower = clean.toLowerCase();
                    const exists = merged.some(x => x.toLowerCase() === lower);
                    if (!exists) merged.push(clean);
                }
            } else {
                // For negative feedback we very gently down‑weight by removing one occurrence if present.
                merged = merged.filter(x => {
                    const lower = x.toLowerCase();
                    return !rawTags.some((t: string) => t.toLowerCase() === lower);
                });
            }
            return Array.from(new Set(merged));
        };

        let delta = 0;
        if (behavior === 'save' || behavior === 'navigate') delta = 1;
        if (behavior === 'unsave') delta = -1;

        if (delta === 0) return;

        const nextVibes = boostTags(rawTags, delta);
        writePrefs({ ...current, vibes: nextVibes });
    }
};

