
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ExploreState {
    origin: { lat: number; lng: number; mode: 'gps' | 'fallback' | 'preferences' };
    focusedPlaceId?: string;
}

const ExploreContext = createContext<any>(null);

export const ExploreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<ExploreState>({
        origin: { lat: 0, lng: 0, mode: 'gps' },
        focusedPlaceId: undefined
    });

    const setOrigin = (lat: number, lng: number, mode: 'gps' | 'fallback' | 'preferences') => 
        setState(prev => ({ ...prev, origin: { lat, lng, mode } }));
    
    const setFocusedPlace = (id?: string) => 
        setState(prev => ({ ...prev, focusedPlaceId: id }));

    return (
        <ExploreContext.Provider value={{ state, setOrigin, setFocusedPlace }}>
            {children}
        </ExploreContext.Provider>
    );
};

export const useExploreState = () => useContext(ExploreContext);
