import React from 'react';
import { motion } from 'framer-motion';
import { Place } from '../types';
import { useHaptic } from '../utils/animations';
import { showToast } from '../utils/toast';
import { useTheme } from './ThemeProvider';

interface GoThereModalProps {
  place: Place;
  onClose: () => void;
  onDrive: () => void;
}

const buildGoogleDirUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

const buildUberUrl = (lat: number, lng: number) =>
  `uber://?action=setPickup&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}`;

const buildBoltUrl = (lat: number, lng: number) =>
  `bolt://?action=setPickup&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}`;

const buildGeoUrl = (lat: number, lng: number) => `geo:${lat},${lng}`;

export const GoThereModal: React.FC<GoThereModalProps> = ({ place, onClose, onDrive }) => {
  const { trigger } = useHaptic();
  const { tokens } = useTheme();

  const hasCoords = typeof place.latitude === 'number' && typeof place.longitude === 'number';
  const lat = hasCoords ? Number(place.latitude) : -26.2041;
  const lng = hasCoords ? Number(place.longitude) : 28.0473;

  const handleDrive = () => {
    trigger();
    onDrive();
    onClose();
  };

  const handleUber = () => {
    trigger();
    window.location.href = buildUberUrl(lat, lng);
    showToast('Opening Uber...', 'info');
  };

  const handleBolt = () => {
    trigger();
    window.location.href = buildBoltUrl(lat, lng);
    showToast('Opening Bolt...', 'info');
  };

  const handleExternalMaps = () => {
    trigger();
    const opened = window.open(buildGoogleDirUrl(lat, lng), '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = buildGeoUrl(lat, lng);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1200] flex flex-col justify-end isolate pointer-events-auto"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`relative z-10 ${tokens.surface} border-t ${tokens.border} rounded-t-[32px] pb-safe shadow-2xl overflow-hidden`}
      >
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-4 mb-6" />
        <div className="px-6 pb-8">
          <h3 className="text-2xl font-display font-bold text-white mb-1">Go there</h3>
          <p className="text-sm text-gray-400 mb-6">Choose your route option.</p>

          <div className="space-y-3">
            <button
              onClick={handleDrive}
              className={`w-full group relative overflow-hidden rounded-2xl ${tokens.surface2} border ${tokens.border} p-1 text-left transition-all active:scale-98`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-4 flex items-center gap-4">
                <div className="size-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
                  <span className="material-symbols-outlined text-white text-xl">map</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base text-white">Drive</div>
                  <div className="text-xs text-blue-200/70 truncate">In-app map route preview</div>
                </div>
                <div className="size-8 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-sm">north_east</span>
                </div>
              </div>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleUber}
                className={`relative overflow-hidden rounded-2xl bg-black border ${tokens.border} p-4 flex flex-col items-center gap-2 hover:bg-white/5 transition-colors active:scale-95`}
              >
                <span className="font-display font-bold text-lg tracking-tight">Uber</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Open app</span>
              </button>
              <button
                onClick={handleBolt}
                className="relative overflow-hidden rounded-2xl bg-[#34D186]/10 border border-[#34D186]/20 p-4 flex flex-col items-center gap-2 hover:bg-[#34D186]/20 transition-colors active:scale-95"
              >
                <span className="font-display font-bold text-lg tracking-tight text-[#34D186]">Bolt</span>
                <span className="text-[10px] text-[#34D186]/70 font-bold uppercase tracking-wider">Open app</span>
              </button>
            </div>

            <button
              onClick={handleExternalMaps}
              className="w-full py-4 text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
            >
              External maps fallback
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
