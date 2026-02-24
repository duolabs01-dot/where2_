
import React, { useState } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { PrimaryButton, IOSHeader } from './Layouts';
import { IOSGlassImage } from './IOSGlassImage';
import { useTheme } from './ThemeProvider';
import { useFilters } from '../lib/filtersStore';

const CATEGORY_COLORS: Record<string, string> = {
  Nightlife: '#8B5CF6', 
  Dining: '#10B981',    
  Coffee: '#F59E0B',    
  Outdoors: '#22C55E',  
  Art: '#EC4899',       
  Music: '#06B6D4',     
};

const IMAGE_SOURCES: Record<string, string> = {
  Nightlife: 'https://images.unsplash.com/photo-1518925253626-5d3c30a48d08?w=800&q=80',
  Dining: 'https://images.unsplash.com/photo-1546069901-6728b41c948d?w=800&q=80',
  Art: 'https://images.unsplash.com/photo-1552550782-6a31d54d191b?w=800&q=80',
  Outdoors: 'https://images.unsplash.com/photo-1504937009722-11e6b1f6d0e3?w=800&q=80',
  Music: 'https://images.unsplash.com/photo-1512036852818-4344e2d60e8d?w=800&q=80',
  Coffee: 'https://images.unsplash.com/photo-1510323062569-4c5f8c7b16c8?w=800&q=80',
};

const INTERESTS = [
  { id: 'Nightlife', label: 'Nightlife' },
  { id: 'Dining', label: 'Dining' },
  { id: 'Coffee', label: 'Coffee' },
  { id: 'Outdoors', label: 'Outdoors' },
  { id: 'Art', label: 'Art' },
  { id: 'Music', label: 'Music' },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { type: "spring", stiffness: 300, damping: 24 } }
};
const sweepAnimation: Variants = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: '200%', opacity: [0, 0.3, 0], transition: { duration: 1.5, repeat: Infinity, repeatDelay: 6, ease: "easeInOut" } }
};

interface VibeGlassChipProps {
  category: { id: string; label: string };
  isSelected: boolean;
  onSelect: () => void;
  isMatrixMode: boolean;
  glassToken: string;
}

const VibeGlassChip: React.FC<VibeGlassChipProps> = ({ category, isSelected, onSelect, isMatrixMode, glassToken }) => {
  const color = isMatrixMode ? '#00FF41' : (CATEGORY_COLORS[category.id] || '#ffffff');
  return (
    <motion.div variants={cardVariants} className="relative group isolate" style={{ touchAction: 'manipulation' }}>
      <motion.div animate={{ opacity: isSelected ? 0.6 : 0 }} transition={{ duration: 0.4 }} className="absolute -inset-1 rounded-3xl blur-2xl z-[-1] pointer-events-none" style={{ backgroundColor: color }} />
      <motion.button
        onClick={onSelect}
        whileTap={{ scale: 0.96 }}
        animate={{ scale: isSelected ? 1.02 : 1, borderColor: isSelected ? `rgba(${parseInt(color.slice(1,3),16)}, ${parseInt(color.slice(3,5),16)}, ${parseInt(color.slice(5,7),16)}, 0.8)` : 'rgba(255,255,255,0.1)' }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`relative w-full h-40 overflow-hidden rounded-2xl transition-all duration-300 ${glassToken}`}
        style={{ boxShadow: isSelected ? `0 0 20px ${color}40, inset 0 0 15px ${color}20` : '0 4px 20px rgba(0,0,0,0.5)' }}
      >
        <div className="absolute inset-0 z-0">
           <motion.div animate={{ opacity: isSelected ? 1 : 0.4, scale: isSelected ? 1.1 : 1, filter: isSelected ? 'grayscale(0%)' : 'grayscale(100%)' }} transition={{ duration: 0.5 }} className="w-full h-full">
             <IOSGlassImage src={IMAGE_SOURCES[category.id]} alt={category.label} className="w-full h-full object-cover" width={400} />
           </motion.div>
           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
        </div>
        <AnimatePresence>{isSelected && (<motion.div variants={sweepAnimation} initial="initial" animate="animate" exit={{ opacity: 0 }} className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 pointer-events-none" />)}</AnimatePresence>
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20 flex justify-between items-end">
          <motion.h3 animate={{ color: isSelected ? '#ffffff' : '#9ca3af', x: isSelected ? 4 : 0 }} className="text-lg font-display font-bold tracking-wide" style={{ textShadow: isSelected ? `0 0 10px ${color}` : 'none' }}>{category.label}</motion.h3>
          <motion.div animate={{ scale: isSelected ? 1 : 0, opacity: isSelected ? 1 : 0 }} className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: color }} />
        </div>
        <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none z-30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]" />
      </motion.button>
    </motion.div>
  );
};

export const PreferencesScreen: React.FC<{ onComplete: (prefs: string[]) => void }> = ({ onComplete }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const { theme, tokens } = useTheme();
  const isMatrixMode = theme === 'matrix';
  const { setCategories } = useFilters();

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleComplete = () => {
    // Update global state immediately
    if (selected.length > 0) {
      setCategories(selected);
    }
    onComplete(selected);
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-y-auto no-scrollbar">
      <div className="px-6 py-8 flex flex-col items-center min-h-full">
        <IOSHeader className="animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-4xl font-bold text-white mb-2">
            What's your vibe <span className="bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">tonight?</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-md mx-auto">Tap what moves you. We'll handle the rest.</p>
        </IOSHeader>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 gap-4 w-full max-w-lg pb-32">
            {INTERESTS.map(item => (
                <VibeGlassChip key={item.id} category={item} isSelected={selected.includes(item.id)} onSelect={() => toggle(item.id)} isMatrixMode={isMatrixMode} glassToken={tokens.glass} />
            ))}
        </motion.div>

        <div className="fixed bottom-8 left-6 right-6 z-50 max-w-md mx-auto">
            <AnimatePresence mode="wait">
                <motion.div key={selected.length === 0 ? 'skip' : 'continue'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    {/* Fixed: removed redundant whileTap prop already handled in PrimaryButton definition */}
                    <PrimaryButton 
                        onClick={handleComplete} 
                        className={`!py-4 !rounded-xl text-white shadow-lg transition-all ${selected.length > 0 ? `${tokens.accentBg} shadow-[0_0_25px_rgba(var(--color-primary),0.4)] hover:shadow-[0_0_35px_rgba(var(--color-primary),0.6)]` : `${tokens.surface2} hover:bg-white/20 !shadow-none border ${tokens.border}`}`}
                    >
                        {selected.length === 0 ? 'Surprise Me' : `Continue (${selected.length})`}
                    </PrimaryButton>
                </motion.div>
            </AnimatePresence>
            <p className="text-center text-[10px] text-gray-500 mt-3 font-medium">{selected.length === 0 ? "Or customise your vibe first" : "Great choices! Let's go."}</p>
         </div>
      </div>
    </div>
  );
};
