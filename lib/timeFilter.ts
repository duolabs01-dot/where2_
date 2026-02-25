
/**
 * Utility to get current time in Central Africa Time (CAT) 
 * regardless of device timezone settings.
 */
export const getCATNow = (): Date => {
    // CAT is UTC+2. We use Intl to get the string representation for JHB and convert to Date.
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Johannesburg',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    });
    
    const parts = formatter.formatToParts(new Date());
    const dateMap: Record<string, number> = {};
    parts.forEach(({ type, value }) => {
        if (type !== 'literal') dateMap[type] = parseInt(value, 10);
    });

    // Create a date object that "looks" like CAT local time
    return new Date(
        dateMap.year,
        dateMap.month - 1,
        dateMap.day,
        dateMap.hour,
        dateMap.minute,
        dateMap.second
    );
};

export interface PlaceOpenNowStatus {
    is_open: boolean;
    open_hours_unknown: boolean;
}

export const isPlaceOpenNow = (place: any): PlaceOpenNowStatus => {
    if (!place) return { is_open: false, open_hours_unknown: true };
    if (place.status === 'CLOSED') return { is_open: false, open_hours_unknown: false };
    if (place.status === 'OPEN') return { is_open: true, open_hours_unknown: false };
    
    // Check hours relative to CAT
    const nowCAT = getCATNow();
    const currentTimeMinutes = nowCAT.getHours() * 60 + nowCAT.getMinutes();
    
    if (place.opening_time && place.closing_time) {
        const [oh, om] = place.opening_time.split(':').map(Number);
        const [ch, cm] = place.closing_time.split(':').map(Number);
        const start = oh * 60 + om;
        const end = ch * 60 + cm;
        
        if (end < start) { // Handles venues open past midnight (e.g., 18:00 to 02:00)
            return { is_open: currentTimeMinutes >= start || currentTimeMinutes <= end, open_hours_unknown: false };
        }
        return { is_open: currentTimeMinutes >= start && currentTimeMinutes <= end, open_hours_unknown: false };
    }

    // If no status + no opening/closing data, don't assume "open".
    if (!place.status && !place.opening_time && !place.closing_time) {
        return { is_open: false, open_hours_unknown: true };
    }

    return { is_open: true, open_hours_unknown: false };
};

export const checkTimeFilter = (place: any, filter: string) => {
    if (filter === 'now') return isPlaceOpenNow(place).is_open;
    return true;
};

export const getSmartTimeLabel = () => {
    const nowCAT = getCATNow();
    const hour = nowCAT.getHours();
    
    // Late night & after‑hours focused copy
    if (hour >= 0 && hour < 4) return { title: 'After hours in Joburg' };
    if (hour >= 4 && hour < 11) return { title: 'Good morning, Joburg' };
    if (hour >= 11 && hour < 17) return { title: 'Daytime spots to try' };
    if (hour >= 17 && hour < 21) return { title: 'Tonight in the city' };
    return { title: 'Late night out' };
};

export const getVibeSentence = () => {
    const hour = getCATNow().getHours();
    
    if (hour >= 21 || hour < 4) {
        return 'Still‑open bars, late kitchens, and groove spots that fit your vibe.';
    }
    if (hour >= 17) {
        return 'Easy dinner, drinks, and pre‑groove spots around you right now.';
    }
    if (hour >= 11) {
        return 'Coffee, lunch, and chill daytime spots that feel like you.';
    }
    return 'Start the day with coffee, brunch, or a quiet catch‑up nearby.';
};

export const getSearchPlaceholder = () => {
    const hour = getCATNow().getHours();
    if (hour >= 21 || hour < 4) {
        return 'Search for Amapiano, late bars, or after‑hours eats...';
    }
    if (hour >= 17) {
        return 'Search for dinner, sundowners, or tonight’s vibe...';
    }
    return 'Search for coffee, brunch, or a chill spot...';
};

export const getJoburgHour = () => getCATNow().getHours();
