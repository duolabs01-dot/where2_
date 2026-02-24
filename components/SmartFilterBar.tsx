
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PreciseLocation } from '../lib/location';
import { motion, AnimatePresence } from 'framer-motion';
import { getSearchPlaceholder } from '../lib/timeFilter';

interface SmartFilterBarProps {
  userCity: string;
  location: PreciseLocation | null;
  radius: number;
  activeTime: string;
  onOpenLocationSheet: () => void;
  onSearch: (query: string) => void;
  resultCount?: number;
  refreshTick: number;
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
  userCity,
  location,
  radius,
  activeTime,
  onOpenLocationSheet,
  onSearch,
  resultCount,
  refreshTick,
  isCollapsed = false,
  activeCategories = [],
  isDefaultRadius = true
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const radiusLabel = radius >= 1000 ? `${radius/1000}km` : `${radius}m`;
  const defaultPlaceholder = getSearchPlaceholder(); // Time-based placeholder

  // Dynamic Location Label Logic
  let locationLabel = userCity; 
  if (location) {
    locationLabel = radius <= 3000 ? 'Near you' : 'Around you';
  }

  // --- Active Filter Logic ---
  const isTimeModified = activeTime !== 'now';
  const isCategoryModified = activeCategories.length > 0 && !activeCategories.includes('All');
  const isRadiusModified = !isDefaultRadius;
  const hasActiveFilters = isTimeModified || isCategoryModified || isRadiusModified;

  // --- Summary Line Generation ---
  const summaryLine = useMemo(() => {
      if (!hasActiveFilters) return defaultPlaceholder;

      const parts = [];
      
      // Time
      if (activeTime === 'now') parts.push('⚡️ Open');
      else parts.push('📅 Any time');

      // Categories (Take up to 2)
      if (isCategoryModified) {
          const firstCat = activeCategories[0];
          const icon = CATEGORY_ICONS[firstCat] || '';
          parts.push(`${icon} ${firstCat}`);
          if (activeCategories.length > 1) {
              parts.push(`+${activeCategories.length - 1}`);
          }
      }

      // Radius (Only if modified)
      if (isRadiusModified) {
          parts.push(`📍 ${radiusLabel}`);
      }

      return parts.join(' • ');
  }, [hasActiveFilters, activeTime, isCategoryModified, activeCategories, isRadiusModified, radiusLabel, defaultPlaceholder]);


  // Animation State Trigger
  const [triggerPulse, setTriggerPulse] = useState(false);

  useEffect(() => {
    if (refreshTick > 0 && !isSearching) {
        setTriggerPulse(true);
        const timer = setTimeout(() => setTriggerPulse(false), 1000);
        return () => clearTimeout(timer);
    }
  }, [refreshTick, isSearching]);

  useEffect(() => {
      if (isSearching && inputRef.current) {
          inputRef.current.focus();
      }
  }, [isSearching]);

  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSearch(searchQuery);
      inputRef.current?.blur();
      // Keep search bar open if there is a query, otherwise close
      if (!searchQuery.trim()) {
          setIsSearching(false);
      }
  };

  const handleClear = () => {
      setSearchQuery('');
      onSearch(''); // Clear results
      setIsSearching(false);
  };

  return (
    <div className="sticky top-0 z-50 pt-safe pointer-events-none bg-transparent">
        <div className="p-2 flex flex-col items-center pointer-events-auto bg-transparent">
            {/* iOS 26 Premium Glass Pill - Ultra Compact Dynamic Island */}
            <motion.div 
                layout
                initial={false}
                animate={{ 
                    // Search state expands to full width
                    width: isSearching ? '100%' : 'auto',
                    maxWidth: isSearching ? '100%' : '320px',
                    
                    // Pulse logic merged with collapse logic
                    scale: (!isSearching && triggerPulse) ? [1, 1.02, 1] : 1,
                    
                    // Glass Borders & Backgrounds (Lighter, more translucent)
                    borderColor: triggerPulse ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.12)",
                    backgroundColor: triggerPulse 
                        ? "rgba(10,10,12,0.55)" // Pulse (slightly darker)
                        : (isSearching ? "rgba(10,10,12,0.50)" : "rgba(10,10,12,0.35)"), // Search : Default (Very transparent)
                    
                    // Shadows with Inner Highlight for Glass edge
                    boxShadow: triggerPulse 
                        ? "0 0 20px rgba(159,80,255,0.3), 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 0 rgba(255,255,255,0.15)"
                        : (isCollapsed && !isSearching 
                            ? "0 2px 10px rgba(0,0,0,0.1), inset 0 1px 0 0 rgba(255,255,255,0.1)" 
                            : "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 0 rgba(255,255,255,0.1)"),
                    
                    // Compact Dimensions: 42px expanded, 30px collapsed
                    height: (isCollapsed && !isSearching) ? 30 : 42,
                    borderRadius: (isCollapsed && !isSearching) ? 15 : 21,
                }}
                transition={{ 
                    type: "spring", stiffness: 500, damping: 30, mass: 0.8
                }}
                className={`relative overflow-hidden flex items-center backdrop-blur-2xl group transition-all duration-300 ${isCollapsed && !isSearching ? 'px-2.5 min-w-[100px]' : 'px-1'}`}
            >
                {/* Search Mode */}
                {isSearching ? (
                    <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 pl-3 pr-2 w-full">
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
                    /* Default Pill Mode */
                    <div 
                        className={`flex items-center justify-between w-full h-full cursor-pointer ${(isCollapsed && !isSearching) ? '' : 'px-2.5'}`} 
                        onClick={() => {
                            if (isCollapsed) {
                                onOpenLocationSheet(); // Tap collapsed to open settings
                            } else {
                                setIsSearching(true); // Tap expanded to search
                            }
                        }}
                    >
                        {/* Triggered Shimmer Layer */}
                        <AnimatePresence>
                            {triggerPulse && (
                                <motion.div 
                                    initial={{ x: '100%', opacity: 0 }}
                                    animate={{ x: '-200%', opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.8, ease: "easeInOut" }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
                                />
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {isCollapsed ? (
                                <motion.div 
                                    key="collapsed"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-[13px] text-primary">search</span>
                                    
                                    <span className="text-[10px] font-bold text-white whitespace-nowrap font-mono leading-none">{radiusLabel}</span>
                                    
                                    <div className="flex items-center gap-1">
                                        {activeTime === 'now' ? (
                                            <span className="text-[8px] text-green-400">🟢</span>
                                        ) : (
                                            <span className="text-[9px] text-gray-400">✨</span>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="expanded"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex items-center gap-2 w-full justify-center"
                                >
                                    {/* Icon + Search Prompt (Implicit) */}
                                    <div className="flex items-center gap-2 text-white/70 group-hover:text-white transition-colors">
                                        <span className={`material-symbols-outlined text-[16px] ${hasActiveFilters ? 'text-primary' : ''}`}>search</span>
                                        <span className={`text-[12px] font-medium whitespace-nowrap leading-none ${hasActiveFilters ? 'text-white font-bold' : ''}`}>
                                            {summaryLine}
                                        </span>
                                    </div>

                                    {/* Divider (Hidden on small screens if space tight) */}
                                    <div className="w-px h-3 bg-white/20 mx-0.5" />

                                    {/* Settings Trigger */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onOpenLocationSheet(); }}
                                        className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors relative"
                                    >
                                        <span className="material-symbols-outlined text-[16px] filled-icon">tune</span>
                                        
                                        {/* Active Filter Dot */}
                                        {hasActiveFilters && (
                                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full border border-black shadow-[0_0_8px_var(--color-primary)]"></span>
                                        )}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>

            {/* Result Count (Hidden on collapse/search) */}
            <AnimatePresence>
                {!isCollapsed && !isSearching && resultCount !== undefined && (
                    <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        key={resultCount}
                        className="mt-1.5"
                    >
                        <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest backdrop-blur-sm px-2 py-0.5 rounded-full bg-black/10">
                            {resultCount} {resultCount === 1 ? 'Place' : 'Places'} Found
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
};
