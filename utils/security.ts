
export const sanitizeInput = (input: string) => {
    // Simple sanitization for HTML rendering
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
};

export interface PrivacySettings { ghostMode: boolean; }

export const getPrivacySettings = (): PrivacySettings => 
    JSON.parse(localStorage.getItem('where2_privacy') || '{"ghostMode":false}');

export const savePrivacySettings = (settings: PrivacySettings) => 
    localStorage.setItem('where2_privacy', JSON.stringify(settings));
