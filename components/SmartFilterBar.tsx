
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PreciseLocation } from '../lib/location';
import { getSearchPlaceholder } from '../lib/timeFilter';

interface SmartFilterBarProps {
  userCity: string;
  location: PreciseLocation | null;
  radius: number;
  activeTime: string;
  onOpenLocationSheet: () => void;
  onSearch: (query: string) => void;
  resultCount?: number;
  refreshTick?: number;
  isCollapsed?: boolean;
  activeCategories?: string[];
  isDefaultRadius?: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
    'Nightlife': '🍸',
    'Dining': '🍽️',
    'Cafe': '☕',
    'Coffee': '☕',
    'Outdoors': '🌲',
    'Art': '🎨',
    'Music': '🎵',
    'Hidden Gems': '💎',
    'All': '🌍'
};

export const SmartFilterBar: React.FC<SmartFilterBarProps> = ({
  radius,
  activeTime,
  onOpenLocationSheet,
  onSearch,
  resultCount,
  isCollapsed = false,
  activeCategories = [],
  isDefaultRadius = true
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const radiusLabel = radius >= 1000 ? `${radius/1000}km` : `${radius}m`;
  const defaultPlaceholder = getSearchPlaceholder();

  const isTimeModified = activeTime !== 'now';
  const isCategoryModified = activeCategories.length > 0 && !activeCategories.includes('All');
  const isRadiusModified = !isDefaultRadius;
  const hasActiveFilters = isTimeModified || isCategoryModified || isRadiusModified;

  const summaryLine = useMemo(() => {
      if (!hasActiveFilters) return defaultPlaceholder;

      const parts = [];
      
      if (activeTime === 'now') parts.push('⚡️ Open');
      else parts.push('📅 Any time');

      if (isCategoryModified) {
          const firstCat = activeCategories[0];
          const icon = CATEGORY_ICONS[firstCat] || '';
          parts.push(`${icon} ${firstCat}`);
          if (activeCategories.length > 1) {
              parts.push(`+${activeCategories.length - 1}`);
          }
      }

      if (isRadiusModified) {
          parts.push(`📍 ${radiusLabel}`);
      }

      return parts.join(' • ');
  }, [hasActiveFilters, activeTime, isCategoryModified, activeCategories, isRadiusModified, radiusLabel, defaultPlaceholder]);

  useEffect(() => {
      if (isSearching && inputRef.current) {
          inputRef.current.focus();
      }
  }, [isSearching]);

  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSearch(searchQuery);
      inputRef.current?.blur();
      if (!searchQuery.trim()) {
          setIsSearching(false);
      }
  };

  const handleClear = () => {
      setSearchQuery('');
      onSearch('');
      setIsSearching(false);
  };

  return (
    <div className="sticky top-0 z-50 pt-2 pointer-events-none bg-transparent">
        <div className="px-2 flex items-center pointer-events-auto">
            {/* Compact Glass Pill */}
            <div 
                className={`flex items-center justify-between w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-full ${
                    isSearching ? 'h-11 px-3' : (isCollapsed ? 'h-8 px-2' : 'h-10 px-3')
                }`}
            >
                {/* Search Mode */}
                {isSearching ? (
                    <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 w-full">
                        <span className="material-symbols-outlined text-gray-300 text-[16px]">search</span>
                        <input 
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={defaultPlaceholder}
                            className="flex-1 bg-transparent border-none text-white text-[13px] placeholder:text-gray-400 focus:ring-0 p-0 font-medium"
                            onBlur={() => { if (!searchQuery) setIsSearching(false); }}
                        />
                        {searchQuery && (
                            <button type="button" onClick={handleClear} className="p-1 text-gray-400 hover:text-white">
                                <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                        )}
                    </form>
                ) : (
                    <div 
                        className="flex items-center gap-2 w-full cursor-pointer" 
                        onClick={() => isCollapsed ? onOpenLocationSheet() : setIsSearching(true)}
                    >
                        <span className="material-symbols-outlined text-white/70 text-[16px]">search</span>
                        <span className="text-[12px] font-medium text-white truncate flex-1">
                            {summaryLine}
                        </span>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onOpenLocationSheet(); }}
                            className="flex items-center text-gray-300"
                        >
                            <span className="material-symbols-outlined text-[18px] filled-icon">tune</span>
                            {hasActiveFilters && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full"></span>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Result Count */}
        {!isCollapsed && !isSearching && resultCount !== undefined && (
            <div className="px-3 mt-1">
                <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">
                    {resultCount} {resultCount === 1 ? 'Place' : 'Places'}
                </p>
            </div>
        )}
    </div>
  );
};
