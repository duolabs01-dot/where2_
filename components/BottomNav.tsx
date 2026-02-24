
import React, { useState, useEffect, useRef } from 'react';
import { NavTab } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptic } from '../utils/animations';
import { useTheme } from './ThemeProvider';

interface BottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onAdd: () => void;
}

type NavVisibility = 'visible' | 'hidden' | 'peek';

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onAdd }) => {
  const { trigger } = useHaptic();
  const { tokens } = useTheme();
  const [visibility, setVisibility] = useState<NavVisibility>('visible');
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<any>(null);

  useEffect(() => {
    const scrollHost = document.querySelector('[data-scroll-host="main"]');
    if (!scrollHost) return;

    const handleScroll = () => {
      const currentScrollY = scrollHost.scrollTop;
      const delta = currentScrollY - lastScrollY.current;
      
      // Clear peek timer on active scroll
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
        scrollTimeout.current = null;
      }

      // Logic
      if (currentScrollY < 50) {
        // Always visible at very top
        setVisibility('visible');
      } else if (delta > 12) {
        // Scrolling Down -> Hide
        setVisibility('hidden');
      } else if (delta < -8) {
        // Scrolling Up -> Show
        setVisibility('visible');
      }

      lastScrollY.current = currentScrollY;

      // Stop scrolling detection -> Peek
      if (currentScrollY > 50) {
        scrollTimeout.current = setTimeout(() => {
          setVisibility((prev) => (prev === 'hidden' ? 'peek' : 'peek'));
        }, 1200);
      }
    };

    // Use passive listener for best performance
    scrollHost.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollHost.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  const handleInteraction = () => {
    if (visibility !== 'visible') {
      setVisibility('visible');
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    }
  };

  const navItems = [
    { id: 'Discover', icon: 'explore', label: 'Home' },
    { id: 'Map', icon: 'map', label: 'Map' },
    { id: 'add', icon: 'add', label: 'Post' },
    { id: 'Plans', icon: 'calendar_today', label: 'Plans' },
    { id: 'Profile', icon: 'person', label: 'You' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] flex justify-center pointer-events-none pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ 
          y: visibility === 'hidden' ? 18 : 0, 
          scale: visibility === 'hidden' ? 0.92 : 1,
          opacity: visibility === 'hidden' ? 0.08 : (visibility === 'peek' ? 0.55 : 1),
          pointerEvents: visibility === 'hidden' ? 'none' : 'auto'
        }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 30, 
          mass: 0.5 
        }}
        onClick={handleInteraction}
        className="flex items-center gap-1 p-1.5 rounded-full bg-black/20 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden cursor-pointer"
      >
        {/* Subtle glass reflection */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isAdd = item.id === 'add';

          if (isAdd) {
            return (
              <motion.button
                key="add"
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { 
                    e.stopPropagation(); 
                    handleInteraction(); 
                    trigger(); 
                    onAdd(); 
                }}
                className="relative flex items-center justify-center w-12 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/5 mx-0.5"
              >
                <span className="material-symbols-outlined text-[24px] drop-shadow-md">add</span>
              </motion.button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={(e) => { 
                  e.stopPropagation();
                  handleInteraction();
                  trigger(); 
                  setActiveTab(item.id as NavTab); 
              }}
              className={`relative flex items-center justify-center h-10 rounded-full transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isActive ? 'px-5 bg-white/10 border border-white/5' : 'w-12 hover:bg-white/5'}`}
            >
              <div className="flex items-center justify-center gap-2 relative z-10">
                <span 
                  className={`material-symbols-outlined text-[22px] transition-colors duration-300 ${isActive ? 'text-white' : 'text-white/60'}`}
                  style={{
                    fontVariationSettings: isActive ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 300",
                    textShadow: isActive ? '0 0 12px rgba(255,255,255,0.3)' : 'none'
                  }}
                >
                  {item.icon}
                </span>
                
                <AnimatePresence>
                  {isActive && (
                    <motion.span 
                      initial={{ width: 0, opacity: 0, scale: 0.5 }}
                      animate={{ width: 'auto', opacity: 1, scale: 1 }}
                      exit={{ width: 0, opacity: 0, scale: 0.5 }}
                      className="text-[12px] font-bold text-white whitespace-nowrap overflow-hidden origin-left"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
};
