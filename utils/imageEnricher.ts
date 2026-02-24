
export const enrichPlacesWithImages = async (places: any[]) => {
    return places.map(p => ({
        ...p,
        cover_image: p.cover_image || `https://picsum.photos/seed/${p.id}/800/450`
    }));
};
