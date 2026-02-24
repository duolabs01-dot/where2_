
export const isLocallySaved = (id: string) => {
    const saved = JSON.parse(localStorage.getItem('saved_places') || '[]');
    return saved.includes(id);
};

export const toggleLocalSave = (id: string) => {
    let saved = JSON.parse(localStorage.getItem('saved_places') || '[]');
    const exists = saved.includes(id);
    if (exists) {
        saved = saved.filter((x: string) => x !== id);
    } else {
        saved.push(id);
    }
    localStorage.setItem('saved_places', JSON.stringify(saved));
    window.dispatchEvent(new CustomEvent('where2-local-save-change', { detail: { id, isSaved: !exists } }));
    return !exists;
};
