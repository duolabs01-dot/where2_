import React from 'react';
import type { CrowdFilter, PriceVibeFilter } from '../lib/filtersStore';

interface FilterBarProps {
  visible: boolean;
  tonightOnly: boolean;
  crowd: CrowdFilter;
  priceVibe: PriceVibeFilter;
  onToggleTonight: () => void;
  onCycleCrowd: () => void;
  onCyclePriceVibe: () => void;
}

const crowdLabel: Record<CrowdFilter, string> = {
  any: 'Crowd',
  quiet: 'Crowd: Quiet',
  vibes: 'Crowd: Vibes',
  packed: 'Crowd: Packed',
};

const priceLabel: Record<PriceVibeFilter, string> = {
  any: 'Price vibe',
  easy: 'Price vibe: Easy',
  mid: 'Price vibe: Mid',
  treat: 'Price vibe: Treat',
};

export const FilterBar: React.FC<FilterBarProps> = ({
  visible,
  tonightOnly,
  crowd,
  priceVibe,
  onToggleTonight,
  onCycleCrowd,
  onCyclePriceVibe,
}) => {
  if (!visible) return null;

  return (
    <div className="relative w-full mb-4">
      <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2 pt-1 px-4 w-full" style={{ touchAction: 'pan-x' }}>
        <button
          onClick={onToggleTonight}
          className={`shrink-0 flex items-center justify-center px-5 py-2.5 rounded-full text-xs font-bold border transition-all duration-300 whitespace-nowrap ${
            tonightOnly
              ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(159,80,255,0.6)]'
              : 'bg-white/5 backdrop-blur-xl text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
          }`}
        >
          {tonightOnly ? 'Tonight: On' : 'Tonight'}
        </button>

        <button
          onClick={onCycleCrowd}
          className={`shrink-0 flex items-center justify-center px-5 py-2.5 rounded-full text-xs font-bold border transition-all duration-300 whitespace-nowrap ${
            crowd !== 'any'
              ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(159,80,255,0.6)]'
              : 'bg-white/5 backdrop-blur-xl text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
          }`}
        >
          {crowdLabel[crowd]}
        </button>

        <button
          onClick={onCyclePriceVibe}
          className={`shrink-0 flex items-center justify-center px-5 py-2.5 rounded-full text-xs font-bold border transition-all duration-300 whitespace-nowrap ${
            priceVibe !== 'any'
              ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(159,80,255,0.6)]'
              : 'bg-white/5 backdrop-blur-xl text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
          }`}
        >
          {priceLabel[priceVibe]}
        </button>
        <div className="w-4 shrink-0" />
      </div>
    </div>
  );
};
