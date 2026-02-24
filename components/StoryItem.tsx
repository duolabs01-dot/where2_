
import React from 'react';
import { Story } from '../types';

interface StoryItemProps {
  story: Story;
}

export const StoryItem: React.FC<StoryItemProps> = ({ story }) => {
  if (story.type === 'add') {
    return (
      <div className="flex shrink-0 flex-col items-center gap-2 w-16">
        <div className="relative w-16 h-16 rounded-full p-0.5 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center">
          <span className="material-symbols-outlined text-gray-400">add</span>
        </div>
        <p className="text-[11px] font-medium opacity-70 whitespace-nowrap">{story.label}</p>
      </div>
    );
  }

  const borderClass = 
    story.type === 'live' ? 'border-status-live' : 
    story.type === 'spec' ? 'border-primary' : 
    'border-gray-200 dark:border-gray-800';

  const badgeClass = story.type === 'live' ? 'bg-status-live' : story.type === 'spec' ? 'bg-primary' : null;
  const badgeText = story.type === 'live' ? 'LIVE' : story.type === 'spec' ? 'SPEC' : null;

  return (
    <div className={`flex shrink-0 flex-col items-center gap-2 w-16 ${story.type === 'default' ? 'opacity-80' : ''}`}>
      <div className={`relative w-16 h-16 rounded-full p-1 border-2 ${borderClass}`}>
        <div 
          className="w-full h-full bg-center bg-cover rounded-full" 
          style={{ backgroundImage: `url("${story.imageUrl}")` }}
        />
        {badgeText && (
          <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 ${badgeClass} text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white dark:ring-background-dark`}>
            {badgeText}
          </div>
        )}
      </div>
      <p className="text-[11px] font-medium truncate w-full text-center">{story.label}</p>
    </div>
  );
};
