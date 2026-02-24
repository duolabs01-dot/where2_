
export const getPlaceImageUrl = (place: any) => 
    place.cover_image || place.cover_url || `https://picsum.photos/seed/${place.id}/800/450`;

export const isPlaceholderImage = (url: string) => 
    url.includes('picsum.photos');

export const normalizeCategory = (cat?: string) => 
    cat || 'Spot';
