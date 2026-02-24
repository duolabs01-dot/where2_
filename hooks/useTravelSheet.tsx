
import React from 'react';

export const useTravelSheet = (onAction: (place: any) => void) => {
    // This is a stub for the complex transport logic
    const TravelSheet = () => null;
    return { openTravelSheet: onAction, TravelSheet };
};
