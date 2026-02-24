
import React from 'react';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PostModal: React.FC<PostModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-4 sm:items-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-[#181d25] shadow-2xl transition-all animate-in slide-in-from-bottom duration-300">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Create Update</h3>
            <button onClick={onClose} className="material-symbols-outlined text-gray-400">close</button>
          </div>
          
          <div className="space-y-4">
            <button className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="size-12 rounded-full bg-status-live/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-status-live">sensors</span>
              </div>
              <div className="text-left">
                <p className="font-bold">Go Live</p>
                <p className="text-xs text-gray-500">Share what's happening right now</p>
              </div>
            </button>

            <button className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">add_a_photo</span>
              </div>
              <div className="text-left">
                <p className="font-bold">Post Photo/Video</p>
                <p className="text-xs text-gray-500">Add to the neighborhood story</p>
              </div>
            </button>

            <button className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="size-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-500">edit_location</span>
              </div>
              <div className="text-left">
                <p className="font-bold">Check-in</p>
                <p className="text-xs text-gray-500">Let neighbors know where you are</p>
              </div>
            </button>
          </div>

          <div className="mt-8 flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold bg-gray-100 dark:bg-gray-800">Cancel</button>
            <button className="flex-1 py-3 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20">Continue</button>
          </div>
        </div>
      </div>
    </div>
  );
};
