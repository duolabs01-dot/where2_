
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getTheme, setTheme as setGlobalTheme, Theme } from '../utils/theme';

interface ThemeTokens {
  bg: string;
  surface: string;
  surface2: string; // Lighter/Secondary surface
  glass: string;    // Standard glassmorphism
  text: string;
  mutedText: string;
  border: string;
  accentPurple: string; // Class for text-primary
  accentBg: string;
  successGreen: string; // Unified Success
  dangerRed: string;    // Unified Danger
  
  // Component specific
  panelFill: string;    // For Modals/Sheets
  
  // Legacy mappings kept for compatibility but unified
  openGreen: string;
  openBg: string;
  closedRed: string;
  closedBg: string;
  warningAmber: string;
  warningBg: string;
  shadow: string;
  radius: string;
}

// Standard Tokens mapping to Tailwind/CSS variables
// DEFAULT: iOS Glass (Neutral/Dark)
const tokens: ThemeTokens = {
  bg: 'bg-background',
  surface: 'bg-surface', 
  surface2: 'bg-white/5',
  glass: 'backdrop-blur-xl bg-black/20 border border-white/5',
  text: 'text-white',
  mutedText: 'text-gray-400',
  border: 'border-white/10',
  accentPurple: 'text-primary',
  accentBg: 'bg-primary',
  successGreen: 'text-emerald-400',
  dangerRed: 'text-red-400',
  
  panelFill: 'bg-surface/90', // Dynamic based on theme var

  openGreen: 'text-emerald-400',
  openBg: 'bg-emerald-500/10 border border-emerald-500/20',
  closedRed: 'text-red-400',
  closedBg: 'bg-red-500/10 border border-red-500/20',
  warningAmber: 'text-amber-400',
  warningBg: 'bg-amber-500/10 border border-amber-500/20',
  shadow: 'shadow-glass',
  radius: 'rounded-[32px]',
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  tokens: ThemeTokens;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentThemeState] = useState<Theme>('default');

  useEffect(() => {
    // Sync with local storage on mount
    const saved = getTheme();
    setCurrentThemeState(saved);
    
    // Listen for external changes (e.g. from utils/theme.ts legacy calls)
    const handleThemeChange = (e: CustomEvent<Theme>) => {
      setCurrentThemeState(e.detail);
    };
    window.addEventListener('where2-theme-change', handleThemeChange as any);
    return () => window.removeEventListener('where2-theme-change', handleThemeChange as any);
  }, []);

  const changeTheme = (newTheme: Theme) => {
    setGlobalTheme(newTheme); // Updates DOM and localStorage
    setCurrentThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, setTheme: changeTheme, tokens }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Re-export specific hook for legacy compat if needed, mostly we use tokens now
export { tokens as themeTokens };
