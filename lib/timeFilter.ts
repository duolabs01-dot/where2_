import { Place, OperatingHour } from '../types';

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
 * Formats a time string (HH:mm:ss or HH:mm) into a user-friendly format (e.g., "9:00 AM").
 * Uses Johannesburg time (CAT).
 */
export const formatTimeDisplay = (timeStr?: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const date = getCATNow(); // Use current CAT date to preserve day, but set target time
    date.setHours(h, m, 0, 0); // Set hours, minutes, seconds, milliseconds

    // Use toLocaleTimeString for proper AM/PM and locale formatting
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(' ', '');
};

export interface PlaceOpenNowStatus {
    is_open: boolean;
    open_hours_unknown: boolean;
    opens_at?: string; // Next opening time, if known
    opens_today?: boolean; // If it opens later today
    current_day_hours?: OperatingHour[]; // All operating hours for today
    next_opening_hours?: OperatingHour; // Next period it opens, across days
    active_period?: OperatingHour; // The currently active operating hour
}

export const isPlaceOpenNow = (place: Place): PlaceOpenNowStatus => {
    // 24/7 venues are always open
    if (place.is_24_7) {
        return { is_open: true, open_hours_unknown: false };
    }

    // If no operating hours are provided, we don't know if it's open
    if (!place.operating_hours || place.operating_hours.length === 0) {
        return { is_open: false, open_hours_unknown: true };
    }

    const nowCAT = getCATNow();
    // getDay() returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday.
    // Our DB uses 1 for Monday, ..., 7 for Sunday. Adjusting.
    const currentDayOfWeek = nowCAT.getDay() === 0 ? 7 : nowCAT.getDay();
    const currentMinutes = nowCAT.getHours() * 60 + nowCAT.getMinutes();

    // Find all operating hours for the current day
    const todayOperatingHours = place.operating_hours.filter(oh => oh.day_of_week === currentDayOfWeek);

    // Also consider hours that started yesterday and end today (multi-day spans)
    const previousDayOfWeek = currentDayOfWeek === 1 ? 7 : currentDayOfWeek - 1;
    const yesterdayOperatingHours = place.operating_hours.filter(oh =>
        oh.day_of_week === previousDayOfWeek &&
        oh.open_time > oh.close_time // This indicates a multi-day span
    );

    let currentOpenPeriod: OperatingHour | undefined;

    // Check today's operating hours
    for (const oh of todayOperatingHours) {
        const [openHour, openMinute] = oh.open_time.split(':').map(Number);
        const [closeHour, closeMinute] = oh.close_time.split(':').map(Number);

        const openMinutes = openHour * 60 + openMinute;
        const closeMinutes = closeHour * 60 + closeMinute;

        // Case 0: 24/7 expressed as 00:00 to 00:00
        if (oh.open_time === '00:00:00' && oh.close_time === '00:00:00') {
            currentOpenPeriod = oh;
            break;
        }

        // Case 1: Standard hours (open and close on the same day)
        if (openMinutes < closeMinutes) {
            if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
                currentOpenPeriod = oh;
                break;
            }
        } else if (openMinutes > closeMinutes) { // Case 2: Multi-day span (opens today, closes tomorrow)
            // If currentMinutes is >= openMinutes, it means it opened today and is still open.
            // If currentMinutes is < closeMinutes, it means it opened today and closes after midnight.
            if (currentMinutes >= openMinutes || currentMinutes < closeMinutes) {
                 currentOpenPeriod = oh;
                 break;
            }
        } else {
            // openMinutes === closeMinutes and not 00:00:00
            // This could be a 24h period or a mistake. Assuming 24h if they match but are not 00:00.
            currentOpenPeriod = oh;
            break;
        }
    }

    // If not found in today's hours, check if it opened yesterday and is still open today
    if (!currentOpenPeriod) {
        for (const oh of yesterdayOperatingHours) {
            const [openHour, openMinute] = oh.open_time.split(':').map(Number);
            const [closeHour, closeMinute] = oh.close_time.split(':').map(Number);

            const openMinutes = openHour * 60 + openMinute;
            const closeMinutes = closeHour * 60 + closeMinute;

            // Multi-day span (opened yesterday, closes today)
            // Current time must be before yesterday's closing time (which is today)
            if (currentMinutes < closeMinutes) {
                currentOpenPeriod = oh;
                break;
            }
        }
    }


    if (currentOpenPeriod) {
        return { is_open: true, open_hours_unknown: false, current_day_hours: todayOperatingHours, active_period: currentOpenPeriod };
    }

    // If not open now, find the next opening time
    let nextOpeningTime: { time: string; day: number } | undefined;

    // Check for next opening time today
    for (const oh of todayOperatingHours) {
        const [openHour, openMinute] = oh.open_time.split(':').map(Number);
        const openMinutes = openHour * 60 + openMinute;
        if (openMinutes > currentMinutes) {
            if (!nextOpeningTime || openMinutes < (nextOpeningTime.time.split(':').map(Number)[0] * 60 + nextOpeningTime.time.split(':').map(Number)[1])) {
                nextOpeningTime = { time: oh.open_time.substring(0,5), day: currentDayOfWeek };
            }
        }
    }

    // If no opening time today, look for the next day
    if (!nextOpeningTime) {
        // Iterate through days of the week starting from tomorrow
        for (let i = 1; i <= 7; i++) {
            const nextDay = (currentDayOfWeek % 7) + i; // Loop through days
            const nextDayOperatingHours = place.operating_hours.filter(oh => oh.day_of_week === nextDay);
            if (nextDayOperatingHours.length > 0) {
                // Find the earliest opening time on this next day
                const earliestNextDayOpen = nextDayOperatingHours.reduce((minOh, oh) => {
                    const [minOpenH, minOpenM] = minOh.open_time.split(':').map(Number);
                    const [ohOpenH, ohOpenM] = oh.open_time.split(':').map(Number);
                    if ((ohOpenH * 60 + ohOpenM) < (minOpenH * 60 + minOpenM)) {
                        return oh;
                    }
                    return minOh;
                }, nextDayOperatingHours[0]);

                nextOpeningTime = { time: earliestNextDayOpen.open_time.substring(0,5), day: nextDay };
                break;
            }
        }
    }

    return {
        is_open: false,
        open_hours_unknown: false,
        opens_at: nextOpeningTime?.time,
        opens_today: nextOpeningTime?.day === currentDayOfWeek,
        current_day_hours: todayOperatingHours,
        next_opening_hours: nextOpeningTime ? { // Create a dummy OperatingHour for next_opening_hours
            id: -1, // Dummy ID
            created_at: new Date().toISOString(),
            place_id: place.id,
            day_of_week: nextOpeningTime.day,
            open_time: nextOpeningTime.time + ':00',
            close_time: nextOpeningTime.time + ':00', // Close time not relevant here
        } : undefined,
    };
};

export const checkTimeFilter = (place: Place, filter: string) => {
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

export type TimeOfDay = 'late_night' | 'morning' | 'daytime' | 'evening' | 'night';

export const getTimeOfDay = (): TimeOfDay => {
    const hour = getJoburgHour();
    if (hour >= 0 && hour < 5) return 'late_night';
    if (hour >= 5 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 17) return 'daytime';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
};

// Returns category keywords that should rank higher at this time of day
export const getTimeOfDayBiasCategories = (): string[] => {
    const hour = getJoburgHour();
    if (hour >= 0 && hour < 5)  return ['bar','nightlife','club','lounge','amapiano','after-hours'];
    if (hour >= 5 && hour < 11) return ['cafe','coffee','breakfast','brunch','bakery'];
    if (hour >= 11 && hour < 17) return ['restaurant','dining','lunch','cafe','food'];
    if (hour >= 17 && hour < 21) return ['restaurant','dining','dinner','bar','sundowner'];
    return ['nightlife','bar','club','lounge','music','amapiano'];
};
