
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

/**
 * Core utility to check if a time range is currently open.
 * Handles overnight ranges (e.g. 18:00 - 02:00).
 * Uses Johannesburg time (CAT).
 */
export const isOpenNow = (openingTime: string | undefined | null, closingTime: string | undefined | null, now: Date = getCATNow()): boolean => {
    if (!openingTime || !closingTime) return false;

    // Parse "HH:MM" or "HH:MM:SS"
    const [openH, openM] = openingTime.split(':').map(Number);
    const [closeH, closeM] = closingTime.split(':').map(Number);

    if (isNaN(openH) || isNaN(closeH)) return false;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = openH * 60 + (openM || 0);
    const endMinutes = closeH * 60 + (closeM || 0);

    if (endMinutes < startMinutes) {
        // Overnight logic (e.g. Open 18:00, Close 02:00)
        // It is open if we are AFTER start (18:00-23:59) OR BEFORE end (00:00-01:59)
        return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    } else {
        // Standard logic (e.g. Open 09:00, Close 17:00)
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
};

export const isPlaceOpenNow = (place: any) => {
    if (!place) return false;
    // We ignore place.status (DB) in favor of computed time to ensure accuracy
    // Exception: If explicitly marked CLOSED in DB (temporary closure), respect it.
    if (place.status === 'CLOSED') return false;
    
    return isOpenNow(place.opening_time, place.closing_time);
};

export const checkTimeFilter = (place: any, filter: string) => {
    if (filter === 'now') return isPlaceOpenNow(place);
    return true;
};

export const getSmartTimeLabel = () => {
    const nowCAT = getCATNow();
    const hour = nowCAT.getHours();
    
    if (hour < 5) return { title: 'Late Night' };
    if (hour < 12) return { title: 'Good Morning' };
    if (hour < 17) return { title: 'Good Afternoon' };
    if (hour < 21) return { title: 'Good Evening' };
    return { title: 'Night Out' };
};

export const getVibeSentence = () => {
    const hour = getCATNow().getHours();
    
    if (hour >= 21 || hour < 4) return 'The night is young in the city.';
    if (hour >= 17) return 'Sunset vibes are hitting JHB.';
    if (hour >= 11) return 'Find the perfect lunch spot nearby.';
    return 'Start your day with the best city vibes.';
};

export const getSearchPlaceholder = () => {
    const hour = getCATNow().getHours();
    if (hour >= 21 || hour < 4) return 'Search for nightlife or late eats...';
    return 'Search for a spot, vibe, or area...';
};

export const getJoburgHour = () => getCATNow().getHours();
