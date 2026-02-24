
import React from 'react';

interface RadiusExpansionBannerProps {
  expansionCount: number;
  finalRadius: number; // in meters
  usedFallback: boolean;
  isLaterMode?: boolean;
  onResetFilters?: () => void;
  userCity?: string;
}

export const RadiusExpansionBanner: React.FC<RadiusExpansionBannerProps> = ({ 
  expansionCount, 
  finalRadius, 
  usedFallback,
  isLaterMode = false,
  onResetFilters,
  userCity = 'your city'
}) => {
  // If no changes to search scope, no banner needed
  if (expansionCount <= 0 && !usedFallback && !isLaterMode) return null;

  const radiusKm = (finalRadius / 1000).toFixed(0);

  // Scenario 1: City Fallback (GPS Fail or Denial)
  if (usedFallback) {
    return (
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4 animate-in fade-in slide-in-from-top-2">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-400 text-xl shrink-0 mt-0.5">info</span>
          <div>
            <p className="font-medium text-blue-400 text-sm">
              🌍 Showing venues across {userCity}
            </p>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
              No venues found nearby. Showing city-wide results. 
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Scenario 2: Later Mode (Nothing Open within max radius)
  if (isLaterMode) {
    return (
       <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-4 animate-in fade-in slide-in-from-top-2 shadow-neon">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-purple-400 text-xl shrink-0 mt-0.5">bedtime</span>
          <div>
            <p className="font-bold text-purple-400 text-sm">
              You're viewing later options.
            </p>
            <p className="text-gray-300 text-xs mt-1 leading-relaxed">
              Most nearby spots are closed right now. Open-now filter is off, so we're showing options across {radiusKm}km.
            </p>
            <div className="mt-2 flex gap-2">
                 <button 
                    onClick={onResetFilters}
                    className="text-[10px] font-bold bg-purple-500/20 px-3 py-1.5 rounded-lg text-purple-300 hover:text-white transition-colors"
                 >
                    Adjust Vibe
                 </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Scenario 3: Progressive Radius Expansion (Standard Ladder)
  // e.g. "Siyakhulisa" (We are growing/expanding it) vibe
  const expansionText = expansionCount === 1 
    ? `Extended search to ${radiusKm}km`
    : `Widened the circle to ${radiusKm}km`;

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-yellow-400 text-xl shrink-0 mt-0.5">radar</span>
        <div>
          <p className="font-bold text-yellow-400 text-sm">
             {expansionText}
          </p>
          <div className="text-gray-400 text-xs mt-1 leading-relaxed">
            Couldn't find anything open right next door, so we looked a bit further out. found some gems!
          </div>
        </div>
      </div>
    </div>
  );
};
