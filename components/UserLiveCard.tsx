
import React from 'react';
import { FeedItem } from '../types';

interface UserLiveCardProps {
  item: FeedItem;
}

export const UserLiveCard: React.FC<UserLiveCardProps> = ({ item }) => {
  if (!item.user) return null;

  return (
    <div className="flex flex-col rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#181d25]">
      <div className="p-3 flex items-center gap-3">
        <div className="relative size-10 rounded-full p-0.5 border-2 border-status-live">
          <div 
            className="size-full bg-center bg-cover rounded-full" 
            style={{ backgroundImage: `url("${item.user.avatarUrl}")` }}
          />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">{item.user.name} <span className="font-normal text-gray-500">is at</span> {item.name}</p>
          <p className="text-[10px] text-status-live font-bold flex items-center gap-1">
            <span className="size-1.5 bg-status-live rounded-full animate-pulse"></span> LIVE • {item.user.lastActive}
          </p>
        </div>
        <button className="material-symbols-outlined text-gray-400">more_horiz</button>
      </div>
      <div 
        className="relative w-full aspect-square bg-center bg-cover" 
        style={{ backgroundImage: `url("${item.imageUrl}")` }}
      >
        <div className="absolute top-4 right-4 bg-status-live text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg">
          <span className="material-symbols-outlined text-[16px]">sensors</span> {item.user.watchCount} Watching
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-4">{item.user.comment}</p>
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {[...Array(2)].map((_, i) => (
              <div 
                key={i}
                className="size-6 rounded-full border-2 border-white dark:border-background-dark bg-cover" 
                style={{ backgroundImage: `url("https://picsum.photos/50/50?random=${i + 10}")` }}
              />
            ))}
            <div className="size-6 rounded-full border-2 border-white dark:border-background-dark bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[8px] font-bold">
              +{item.user.othersCount}
            </div>
          </div>
          <button className="flex items-center gap-2 px-6 py-2 bg-status-live text-white rounded-lg font-bold text-xs shadow-md hover:bg-[#ff4d1f] transition-colors">
            <span className="material-symbols-outlined text-[16px]">play_circle</span>
            Join Live
          </button>
        </div>
      </div>
    </div>
  );
};
