
import React, { useState, useEffect, useMemo } from 'react';
import { GlassSheet, PrimaryButton } from './Layouts';
import { SearchIntent } from '../types';
import { useFilters, FilterMode } from '../lib/filtersStore'; 

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

const CONTEXTS: { id: FilterMode; label: string; icon: string }[] = [
  { id: 'solo', label: 'Solo', icon: 'person' },
  { id: 'date', label: 'Date', icon: 'favorite' },
  { id: 'group', label: 'Group', icon: 'groups' }
];

export const VibeQuickPickSheet: React.FC<VibeQuickPickSheetProps> = ({ onApply, onClose }) => {
  const { 
      state, 
      setMode, 
      setCategories, 
      setOpenNowOnly, 
      setRadiusMeters,
      setOrigin,
      resetFilters,
      applyCustomise 
  } = useFilters();

  // Local state initialized from store (converting Store Categories -> UI Categories)
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [context, setContext] = useState<FilterMode>(state.mode);
  
  // Sync on mount
  useEffect(() => {
      const uiCats = state.categories
        .filter(c => c !== 'All')
        .map(c => TO_UI_MAP[c] || c);
      setSelectedCats(uiCats);
      setContext(state.mode);
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
    setMode(context);
    setCategories(storeCats);
    setOpenNowOnly(true); // "Vibe" implies NOW
    setRadiusMeters(600); // 8-min walk default
    setOrigin('preferences');
    applyCustomise();

    // 3. Log
    console.log('[Customise] Intent Updated:', { context, storeCats });

    // 4. Pass Intent to parent
    const intent: SearchIntent = {
      mode: 'custom',
      timeMode: 'open_now',
      categories: storeCats.length > 0 ? storeCats : ['All'],
      groupContext: context || 'solo',
      initialRadius: 600,
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
      const parts = [];
      
      // Context
      const ctxLabel = CONTEXTS.find(c => c.id === context)?.label || 'Solo';
      parts.push(ctxLabel);

      // Categories
      if (selectedCats.length > 0) {
          parts.push(selectedCats.join(' + '));
      } else {
          parts.push('Everything');
      }

      // Time & Radius (Fixed for this view)
      parts.push('Open now');
      parts.push('2km');

      return parts.join(' • ');
  }, [context, selectedCats]);

  return (
    <div className="fixed inset-0 z-[1100] flex flex-col justify-end isolate pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" 
        onClick={onClose} 
      />
      
      <GlassSheet className="relative z-10 p-6 pointer-events-auto pb-safe">
        <div className="flex justify-between items-center mb-6">
           <h3 className="font-display font-bold text-xl text-white">Customise vibe</h3>
           <button onClick={onClose} className="size-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white">
             <span className="material-symbols-outlined">close</span>
           </button>
        </div>

        {/* 1. Context Segmented Control */}
        <div className="bg-white/5 p-1 rounded-xl flex mb-6">
           {CONTEXTS.map(ctx => (
             <button
               key={ctx.id}
               onClick={() => setContext(ctx.id)}
               className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                 context === ctx.id 
                  ? 'bg-white text-black shadow-lg' 
                  : 'text-gray-400 hover:text-white'
               }`}
             >
               <span className="material-symbols-outlined text-lg">{ctx.icon}</span>
               {ctx.label}
             </button>
           ))}
        </div>

        {/* 2. Categories Grid */}
        <div className="mb-6">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">What are you feeling?</label>
          <div className="flex flex-wrap gap-2">
            {UI_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => toggleCat(cat)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all active:scale-95 ${
                  selectedCats.includes(cat)
                    ? 'bg-primary text-white border-primary shadow-neon'
                    : 'bg-white/5 text-gray-300 border-white/5 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Dynamic Summary */}
        <div className="mb-8 p-4 bg-white/5 rounded-xl border border-white/5 flex items-start gap-3">
            <div className="size-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20">
                <span className="material-symbols-outlined text-green-400 text-sm">radar</span>
            </div>
            <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Searching For</p>
                <p className="text-sm font-medium text-white leading-snug">
                    {summaryText}
                </p>
            </div>
        </div>

        {/* 4. Actions */}
        <div className="flex gap-3">
           <button 
             onClick={handleReset}
             className="px-6 py-4 rounded-2xl font-bold text-sm text-gray-400 hover:text-white transition-colors border border-white/5 bg-white/5"
           >
             Reset to Default
           </button>
           <PrimaryButton onClick={handleApply} className="flex-1 shadow-[0_0_30px_rgba(var(--color-primary),0.4)]">
             Show Results
           </PrimaryButton>
        </div>
      </GlassSheet>
    </div>
  );
};
