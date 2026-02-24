
import React from 'react';
import { FeedItem } from '../types';

interface BusinessCardProps {
  item: FeedItem;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({ item }) => {
  const isClosed = item.status === 'closed';

  return (
    <div className={`flex flex-col rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#181d25] ${isClosed ? 'opacity-80' : ''}`}>
      <div 
        className={`relative w-full aspect-[16/9] bg-center bg-cover ${isClosed ? 'grayscale' : ''}`} 
        style={{ backgroundImage: `url("${item.imageUrl}")` }}
      >
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-white/90 dark:bg-background-dark/90 px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm">
          <span className={`size-2 rounded-full ${isClosed ? 'bg-status-red' : 'bg-primary'}`}></span>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isClosed ? 'text-status-red' : 'text-primary'}`}>
            {isClosed ? 'Closed' : 'Open Now'}
          </span>
        </div>
        {!isClosed && item.distance && (
          <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg text-white text-[11px] flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">near_me</span> {item.distance}
          </div>
        )}
      </div>
      <div className={`p-4 ${isClosed ? 'bg-gray-50/50 dark:bg-gray-900/50' : ''}`}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className={`text-xl font-bold tracking-tight ${isClosed ? 'text-gray-500' : ''}`}>{item.name}</h3>
            <p className={`text-sm ${isClosed ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {item.category} {item.location && `• ${item.location}`} {isClosed && item.distance && `• ${item.distance}`}
            </p>
          </div>
          {!isClosed && (
            <button className="size-8 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800">
              <span className="material-symbols-outlined text-gray-400">favorite</span>
            </button>
          )}
        </div>

        {item.highlights && (
          <div className="bg-primary/10 dark:bg-primary/5 border-l-4 border-primary p-3 rounded-r-lg mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary text-[18px]">{item.highlights.icon}</span>
              <span className="text-xs font-bold text-primary uppercase">{item.highlights.title}</span>
            </div>
            <p className="text-sm font-semibold">{item.highlights.description.split('.')[0]}.</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.highlights.description.split('.')[1]}</p>
          </div>
        )}

        {isClosed && item.openingInfo && (
          <p className="text-xs text-gray-500 mb-4">{item.openingInfo}</p>
        )}

        <div className="flex gap-2">
          {isClosed ? (
            <button className="w-full bg-gray-200 dark:bg-gray-800 text-gray-500 py-2.5 rounded-lg font-bold text-sm">
              View Hours
            </button>
          ) : (
            <>
              <button className="flex-1 bg-primary text-white py-3 rounded-lg font-bold text-sm shadow-sm hover:opacity-90 transition-opacity">
                View Menu
              </button>
              <button className="px-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <span className="material-symbols-outlined">directions</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
