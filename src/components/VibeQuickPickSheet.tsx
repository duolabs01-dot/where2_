
import React, { useState, useEffect, useMemo } from 'react';
import { GlassSheet, PrimaryButton } from './Layouts';
import { SearchIntent } from '../types';
import { useFilters } from '../lib/filtersStore'; 
import { useTheme } from './ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';

interface VibeQuickPickSheetProps {
  onApply: (intent: SearchIntent) => void;
  onClose: () => void;
}

const UI_CATEGORIES = ['Nightlife', 'Dining', 'Cafés', 'Outdoors', 'Art', 'Chill', 'Hidden Gems'];

// DB/Store Mapping
const TO_STORE_MAP: Record<string, string> = {
  'Cafés': 'Cafe',
  'Chill': 'Lounge',
  'Hidden Gems': 'Speakeasy'
};
// Reverse mapping for initialization
const TO_UI_MAP: Record<string, string> = {
  'Cafe': 'Cafés',
  'Lounge': 'Chill',
  'Speakeasy': 'Hidden Gems'
};

export const VibeQuickPickSheet: React.FC<VibeQuickPickSheetProps> = ({ onApply, onClose }) => {
  const { 
      state, 
      setCategories, 
      setOpenNowOnly, 
      setRadiusMeters,
      setOrigin,
      resetFilters,
      applyCustomise 
  } = useFilters();

  const { tokens } = useTheme();

  // Local state initialized from store
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  
  // Sync on mount
  useEffect(() => {
      const uiCats = state.categories
        .filter(c => c !== 'All')
        .map(c => TO_UI_MAP[c] || c);
      setSelectedCats(uiCats);
  }, []);

  const toggleCat = (cat: string) => {
    setSelectedCats(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleApply = () => {
    // 1. Map UI Categories -> Store Categories
    const storeCats = selectedCats.map(c => TO_STORE_MAP[c] || c);

    // 2. Update Global Store
    setCategories(storeCats);
    setOpenNowOnly(true); // "Vibe" implies NOW
    setRadiusMeters(2000); // Standard "Vibe" radius
    setOrigin('preferences');
    applyCustomise();

    // 3. Pass Intent to parent
    const intent: SearchIntent = {
      mode: 'custom',
      timeMode: 'open_now',
      categories: storeCats.length > 0 ? storeCats : ['All'],
      groupContext: 'solo', // Defaulting as unused
      initialRadius: 2000,
      autoExpand: true
    };
    onApply(intent);
  };

  const handleReset = () => {
      resetFilters(); 
      onClose();
  };

  // Dynamic Summary
  const summaryText = useMemo(() => {
      if (selectedCats.length === 0) return 'Everything nearby';
      if (selectedCats.length > 2) return `${selectedCats[0]}, ${selectedCats[1]} +${selectedCats.length - 2} more`;
      return selectedCats.join(' & ');
  }, [selectedCats]);

  return (
    <div className="fixed inset-0 z-[1100] flex flex-col justify-end isolate pointer-events-none">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto" 
        onClick={onClose} 
      />
      
      <GlassSheet className={`relative z-10 pointer-events-auto pb-safe flex flex-col max-h-[85vh] ${tokens.surface} border-t ${tokens.border} shadow-2xl !p-0`}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/5">
           <div>
             <h3 className="font-display font-bold text-xl text-white tracking-tight">Set the Vibe</h3>
             <p className={`text-xs ${tokens.mutedText} mt-0.5`}>What are you looking for right now?</p>
           </div>
           <button 
             onClick={onClose} 
             className="size-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
           >
             <span className="material-symbols-outlined text-lg">close</span>
           </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto no-scrollbar">
            {/* Categories Grid */}
            <div className="flex flex-wrap gap-2.5">
                {UI_CATEGORIES.map(cat => {
                    const isSelected = selectedCats.includes(cat);
                    return (
                        <motion.button
                            key={cat}
                            onClick={() => toggleCat(cat)}
                            whileTap={{ scale: 0.95 }}
                            animate={{ 
                                backgroundColor: isSelected ? 'rgba(159, 80, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                                borderColor: isSelected ? 'rgba(159, 80, 255, 0.5)' : 'rgba(255, 255, 255, 0.08)',
                                color: isSelected ? '#ffffff' : '#9ca3af'
                            }}
                            className={`px-5 py-3 rounded-2xl text-sm font-bold border transition-all duration-200 relative overflow-hidden group`}
                        >
                            <span className="relative z-10">{cat}</span>
                            {isSelected && (
                                <motion.div 
                                    layoutId="glow"
                                    className="absolute inset-0 bg-primary/10 blur-md -z-0"
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Summary Box */}
            <div className={`p-4 rounded-2xl border ${tokens.border} bg-white/[0.02] flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-900/20 border border-primary/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-lg">radar</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Scouting</p>
                        <p className="text-sm font-bold text-white truncate max-w-[200px]">
                            {summaryText}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 mb-1">OPEN NOW</span>
                    <span className="text-[10px] font-mono text-gray-500">~2km</span>
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-2 pb-8 flex gap-3 border-t border-white/5 bg-black/20">
           <button 
             onClick={handleReset}
             className="px-6 py-4 rounded-2xl font-bold text-sm text-gray-400 hover:text-white transition-colors border border-white/10 bg-white/5 hover:bg-white/10"
           >
             Reset
           </button>
           <PrimaryButton onClick={handleApply} className="flex-1 shadow-neon">
             Show Results
           </PrimaryButton>
        </div>
      </GlassSheet>
    </div>
  );
};
