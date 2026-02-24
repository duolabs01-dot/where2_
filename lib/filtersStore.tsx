
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type FilterMode = 'solo' | 'date' | 'group';

interface FilterState {
    mode: FilterMode;
    radiusMeters: number;
    openNowOnly: boolean;
    categories: string[];
}

const FiltersContext = createContext<any>(null);

export const FiltersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<FilterState>({
        mode: 'solo',
        radiusMeters: 2000,
        openNowOnly: true,
        categories: []
    });

    const setMode = (mode: FilterMode) => setState(s => ({ ...s, mode }));
    const setRadiusMeters = (r: number) => setState(s => ({ ...s, radiusMeters: r }));
    const setOpenNowOnly = (o: boolean) => setState(s => ({ ...s, openNowOnly: o }));
    const setCategories = (c: string[]) => setState(s => ({ ...s, categories: c }));
    const toggleCategory = (cat: string) => setState(s => ({
        ...s,
        categories: s.categories.includes(cat) ? s.categories.filter(x => x !== cat) : [...s.categories, cat]
    }));
    const resetFilters = () => setState({ mode: 'solo', radiusMeters: 2000, openNowOnly: true, categories: [] });

    return (
        <FiltersContext.Provider value={{ state, setMode, setRadiusMeters, setOpenNowOnly, setCategories, toggleCategory, resetFilters }}>
            {children}
        </FiltersContext.Provider>
    );
};

export const useFilters = () => useContext(FiltersContext);
