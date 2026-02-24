
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { preferenceEngine } from '../lib/preferenceEngine';

const VIBES = ['Heavy groove', 'Chilled drinks', 'Food + drinks', 'Just food', 'Coffee', 'Live music'];

export const PreferenceNudge: React.FC<{ onApply: (prefs: string[]) => void }> = ({ onApply }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const { tokens } = useTheme();

  useEffect(() => {
    // Check if previously dismissed in this session
    const dismissed = sessionStorage.getItem('where2_nudge_dismissed');
    if (dismissed) return;

    // Show after 30 seconds of engagement
    const timer = setTimeout(() => setIsVisible(true), 30000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('where2_nudge_dismissed', 'true');
  };

  const handleApply = () => {
    if (selected.length > 0) {
        // Persist explicit vibe picks for personalization
        preferenceEngine.applyExplicitSelection(selected);
        onApply(selected);
    }
    setIsVisible(false);
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
          className="fixed bottom-24 left-4 right-4 z-40 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[400px]"
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
