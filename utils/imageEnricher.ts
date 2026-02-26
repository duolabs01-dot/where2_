
import { Place } from '../types'; // Import Place interface

export const enrichPlacesWithImages = async <T extends Place>(places: T[]): Promise<T[]> => {
    return places.map(p => ({
        ...p,
        cover_image: p.cover_image || `https://picsum.photos/seed/${p.id}/800/450`
    }));
};
