
export type Theme = 'default' | 'matrix' | 'neo';

export const getTheme = (): Theme => (localStorage.getItem('where2_theme') as Theme) || 'default';

export const setTheme = (theme: Theme) => {
    localStorage.setItem('where2_theme', theme);
    const html = document.documentElement;
    html.classList.remove('theme-matrix', 'theme-neo');
    if (theme !== 'default') html.classList.add(`theme-${theme}`);
    window.dispatchEvent(new CustomEvent('where2-theme-change', { detail: theme }));
};

export const initTheme = () => {
    const theme = getTheme();
    const html = document.documentElement;
    html.classList.remove('theme-matrix', 'theme-neo');
    if (theme !== 'default') html.classList.add(`theme-${theme}`);
};
