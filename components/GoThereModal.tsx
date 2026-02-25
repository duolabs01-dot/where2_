import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Place } from '../types';
import { useTheme } from './ThemeProvider';

interface GoThereModalProps {
  place: Place | null;
  onClose: () => void;
  onDrive: () => void;
}

export const GoThereModal: React.FC<GoThereModalProps> = ({ place, onClose, onDrive }) => {
  const { tokens } = useTheme();
  if (!place) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500]"
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          className={`absolute bottom-0 left-0 right-0 mx-auto w-full max-w-md rounded-t-3xl border-t border-white/10 bg-white/[0.04] ${tokens.surface} shadow-2xl`}
        >
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">{place.name}</h3>
              <button
                onClick={onClose}
                className="rounded-full bg-black/40 text-white size-8 flex items-center justify-center"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-sm text-gray-300">
              This is just a stubbed navigation hint. Tap “Drive now” to trigger
              the navigation workflow.
            </p>
            <button
              onClick={() => {
                onDrive();
                onClose();
              }}
              className="w-full rounded-2xl bg-primary text-black font-bold py-3"
            >
              Drive now
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GoThereModal;
