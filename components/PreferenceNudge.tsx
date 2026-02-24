
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { getUserPrefs, preferenceEngine } from '../lib/preferenceEngine';
import { useFilters } from '../lib/filtersStore';
import { NavTab } from '../types';

const VIBES = ['Heavy groove', 'Chilled drinks', 'Food + drinks', 'Just food', 'Coffee', 'Live music'];
const DISMISS_SESSION_KEY = 'where2_nudge_dismissed';
const DISMISS_UNTIL_KEY = 'where2_nudge_dismiss_until';
const NUDGE_DELAY_MS = 20000;
const NUDGE_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;

interface PreferenceNudgeProps {
  onApply: (prefs: string[]) => void;
  isAuthenticated: boolean;
  activeTab: NavTab;
  isBlocked?: boolean;
}

export const PreferenceNudge: React.FC<PreferenceNudgeProps> = ({
  onApply,
  isAuthenticated,
  activeTab,
  isBlocked = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const { tokens } = useTheme();
  const { state: filterState } = useFilters();

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'Discover' || isBlocked) {
      setIsVisible(false);
      return;
    }

    const prefs = getUserPrefs();
    const hasSavedPrefs = prefs.vibes.length > 0 || prefs.categories.length > 0;
    if (hasSavedPrefs || filterState.categories.length > 0) {
      setIsVisible(false);
      return;
    }

    const dismissedThisSession = sessionStorage.getItem(DISMISS_SESSION_KEY) === 'true';
    if (dismissedThisSession) return;

    const dismissedUntilRaw = localStorage.getItem(DISMISS_UNTIL_KEY);
    const dismissedUntil = dismissedUntilRaw ? Number(dismissedUntilRaw) : 0;
    if (dismissedUntil > Date.now()) return;

    const timer = setTimeout(() => setIsVisible(true), NUDGE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isAuthenticated, activeTab, isBlocked, filterState.categories]);

  const markDismissed = () => {
    sessionStorage.setItem(DISMISS_SESSION_KEY, 'true');
    localStorage.setItem(DISMISS_UNTIL_KEY, String(Date.now() + NUDGE_COOLDOWN_MS));
  };

  const handleDismiss = () => {
    setIsVisible(false);
    markDismissed();
  };

  const handleApply = () => {
    if (selected.length > 0) {
        // Persist explicit vibe picks for personalization
        preferenceEngine.applyExplicitSelection(selected);
        onApply(selected);
    }
    setIsVisible(false);
    markDismissed();
  };

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed left-4 right-4 z-40 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[400px]"
          style={{ bottom: 'calc(var(--bottom-nav-safe) - 8px)' }}
        >
            <div className={`backdrop-blur-xl border border-primary/20 rounded-2xl p-5 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden relative ${tokens.surface}`}>
              {/* Background Glow */}
              <div className="absolute -top-10 -right-10 size-32 bg-primary/20 rounded-full blur-[50px] pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                   <div>
                      <h3 className="text-white font-display font-bold text-base flex items-center gap-2">
                        <span className={`material-symbols-outlined text-lg ${tokens.accentPurple}`}>auto_awesome</span>
                        Make it yours
                      </h3>
                      <p className="text-gray-300 text-xs mt-1">Tap vibes you love to improve your feed.</p>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-5">
                   {VIBES.map(vibe => (
                      <button
                        key={vibe}
                        onClick={() => toggle(vibe)}
                        className={`py-2 px-1 rounded-lg text-xs font-bold transition-all duration-200 border ${
                          selected.includes(vibe) 
                            ? `${tokens.accentBg} text-white border-primary shadow-[0_0_10px_rgba(159,80,255,0.3)] scale-[1.02]` 
                            : `${tokens.surface2} text-gray-400 ${tokens.border} hover:bg-white/10`
                        }`}
                      >
                        {vibe}
                      </button>
                   ))}
                </div>

                <div className="flex gap-3">
                   <button 
                     onClick={handleApply}
                     disabled={selected.length === 0}
                     className="flex-1 bg-white text-black font-bold py-3 rounded-xl text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
                   >
                     Apply Personalization
                   </button>
                   <button 
                     onClick={handleDismiss}
                     className="px-4 text-gray-500 font-bold text-xs hover:text-white transition-colors"
                   >
                     Not Now
                   </button>
                </div>
              </div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
