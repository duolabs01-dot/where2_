
import React from 'react';
import { NavTab } from '../types';
import { useHaptic } from '../utils/animations';

interface BottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onAdd: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onAdd }) => {
  const { trigger } = useHaptic();

  const handleInteraction = () => {};

  const navItems = [
    { id: 'Discover', icon: 'explore' },
    { id: 'Map', icon: 'map' },
    { id: 'add', icon: 'add' },
    { id: 'Plans', icon: 'calendar_today' },
    { id: 'Profile', icon: 'person' },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[600] flex items-end justify-center pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div
        onClick={handleInteraction}
        className="flex items-center justify-center gap-1 px-2 w-full max-w-md cursor-pointer pointer-events-auto"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isAdd = item.id === 'add';

          if (isAdd) {
            return (
              <button
                key="add"
                onClick={(e) => { 
                    e.stopPropagation(); 
                    handleInteraction(); 
                    trigger(); 
                    onAdd(activeTab); 
                }}
                className="relative flex items-center justify-center w-12 h-12 rounded-full bg-white/10 text-white"
              >
                <span className="material-symbols-outlined text-[24px]">add</span>
              </button>
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
              className={`relative flex items-center justify-center h-12 flex-1 ${isActive ? '' : 'opacity-60'}`}
            >
              <span className={`material-symbols-outlined text-[24px] ${isActive ? 'text-white' : 'text-white/60'}`}>
                {item.icon}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
