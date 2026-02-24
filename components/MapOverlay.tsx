
import React from 'react';

interface MapOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MapOverlay: React.FC<MapOverlayProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-white dark:bg-[#181d25] animate-in fade-in zoom-in duration-300">
      {/* Map Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md z-10">
        <button onClick={onClose} className="size-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="text-center">
          <p className="text-sm font-bold">Where2 Map</p>
          <p className="text-[10px] text-primary font-bold uppercase tracking-widest">SF • Union Square</p>
        </div>
        <button className="size-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <span className="material-symbols-outlined">my_location</span>
        </button>
      </div>

      {/* Placeholder Map */}
      <div className="flex-1 relative bg-gray-200 dark:bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-40 mix-blend-multiply dark:mix-blend-overlay">
          <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&q=80" className="w-full h-full object-cover" alt="Map Grid" />
        </div>
        
        {/* Mock Map Markers */}
        <div className="absolute top-1/3 left-1/4 animate-bounce">
          <div className="size-12 rounded-full border-4 border-white dark:border-background-dark shadow-xl bg-status-live p-0.5 overflow-hidden ring-4 ring-status-live/20">
             <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" className="rounded-full" alt="User" />
          </div>
        </div>

        <div className="absolute top-1/2 right-1/3 animate-pulse">
           <div className="bg-primary text-white p-2 rounded-lg shadow-lg flex items-center gap-2">
             <span className="material-symbols-outlined text-sm">local_bar</span>
             <span className="text-[10px] font-bold">The Mint (LIVE)</span>
           </div>
        </div>

        <div className="absolute bottom-1/4 left-1/2">
           <div className="size-6 bg-white dark:bg-background-dark rounded-full flex items-center justify-center shadow-md">
             <div className="size-2 bg-blue-500 rounded-full animate-ping"></div>
           </div>
        </div>
      </div>

      {/* Map Search Overlay */}
      <div className="absolute bottom-8 left-4 right-4 z-10">
        <div className="bg-white/95 dark:bg-background-dark/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800">
           <div className="flex items-center gap-3 mb-3">
             <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2 flex items-center gap-2">
               <span className="material-symbols-outlined text-gray-400 text-sm">search</span>
               <input type="text" placeholder="Search neighborhood..." className="bg-transparent border-none text-sm focus:ring-0 w-full" />
             </div>
           </div>
           <div className="flex gap-2 overflow-x-auto no-scrollbar">
             {['Nearby', 'Hotspots', 'Friends', 'Events'].map(chip => (
               <button key={chip} className="shrink-0 px-4 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-[10px] font-bold">{chip}</button>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};
