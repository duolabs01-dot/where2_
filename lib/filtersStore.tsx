
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type FilterMode = 'solo' | 'date' | 'group';
export type CrowdFilter = 'any' | 'quiet' | 'vibes' | 'packed';
export type PriceVibeFilter = 'any' | 'easy' | 'mid' | 'treat';

interface FilterState {
    mode: FilterMode;
    radiusMeters: number;
    openNowOnly: boolean;
    categories: string[];
    tonightOnly: boolean;
    crowd: CrowdFilter;
    priceVibe: PriceVibeFilter;
}

const FiltersContext = createContext<any>(null);

export const FiltersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<FilterState>({
        mode: 'solo',
        radiusMeters: 600,
        openNowOnly: true,
        categories: [],
        tonightOnly: false,
        crowd: 'any',
        priceVibe: 'any',
    });

    const setMode = (mode: FilterMode) => setState(s => ({ ...s, mode }));
    const setRadiusMeters = (r: number) => setState(s => ({ ...s, radiusMeters: r }));
    const setOpenNowOnly = (o: boolean) => setState(s => ({ ...s, openNowOnly: o }));
    const setCategories = (c: string[]) => setState(s => ({ ...s, categories: c }));
    const setTonightOnly = (value: boolean) => setState(s => ({ ...s, tonightOnly: value }));
    const setCrowd = (crowd: CrowdFilter) => setState(s => ({ ...s, crowd }));
    const setPriceVibe = (priceVibe: PriceVibeFilter) => setState(s => ({ ...s, priceVibe }));
    const toggleCategory = (cat: string) => setState(s => ({
        ...s,
        categories: s.categories.includes(cat) ? s.categories.filter(x => x !== cat) : [...s.categories, cat]
    }));
    const cycleCrowd = () => setState(s => {
        const next: CrowdFilter = s.crowd === 'any' ? 'quiet' : s.crowd === 'quiet' ? 'vibes' : s.crowd === 'vibes' ? 'packed' : 'any';
        return { ...s, crowd: next };
    });
    const cyclePriceVibe = () => setState(s => {
        const next: PriceVibeFilter = s.priceVibe === 'any' ? 'easy' : s.priceVibe === 'easy' ? 'mid' : s.priceVibe === 'mid' ? 'treat' : 'any';
        return { ...s, priceVibe: next };
    });
    const resetFilters = () => setState({
        mode: 'solo',
        radiusMeters: 600,
        openNowOnly: true,
        categories: [],
        tonightOnly: false,
        crowd: 'any',
        priceVibe: 'any',
    });

    return (
        <FiltersContext.Provider value={{
            state,
            setMode,
            setRadiusMeters,
            setOpenNowOnly,
            setCategories,
            setTonightOnly,
            setCrowd,
            setPriceVibe,
            cycleCrowd,
            cyclePriceVibe,
            toggleCategory,
            resetFilters,
        }}>
            {children}
        </FiltersContext.Provider>
    );
};

export const useFilters = () => useContext(FiltersContext);
