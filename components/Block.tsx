
import React from 'react';
import { CanvasBlock } from '../types';
import { Sparkles, Trash2, Maximize2, Video } from 'lucide-react';

interface BlockProps {
  block: CanvasBlock;
  isActive: boolean;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onAIExpand: (id: string) => void;
  onAIVisualize: (id: string) => void;
  onAIAnimate: (id: string) => void;
  onSelect: (id: string) => void;
}

export const Block: React.FC<BlockProps> = ({ 
  block, 
  isActive, 
  onUpdate, 
  onDelete, 
  onAIExpand, 
  onAIVisualize,
  onAIAnimate,
  onSelect 
}) => {
  const isImage = block.type === 'image';
  const isVideo = block.type === 'video';

  return (
    <div 
      className={`absolute group transition-all duration-300 ${isActive ? 'z-50' : 'z-10'}`}
      style={{ left: block.x, top: block.y, width: block.width }}
      onClick={() => onSelect(block.id)}
    >
      <div className={`
        relative p-4 rounded-xl transition-shadow duration-300
        ${isActive ? 'glass shadow-2xl ring-2 ring-indigo-200' : 'hover:shadow-lg'}
        ${block.isLoading ? 'animate-pulse bg-gray-50' : ''}
      `}>
        {/* Toolbar */}
        <div className={`
          absolute -top-12 left-0 right-0 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity
          ${isActive ? 'opacity-100' : ''}
        `}>
          <button onClick={() => onAIExpand(block.id)} className="p-2 bg-white shadow-sm border rounded-full hover:text-indigo-600" title="Expand with AI">
            <Sparkles size={16} />
          </button>
          {!isImage && !isVideo && (
            <button onClick={() => onAIVisualize(block.id)} className="p-2 bg-white shadow-sm border rounded-full hover:text-indigo-600" title="Visualize with AI">
              <Maximize2 size={16} />
            </button>
          )}
          {isImage && (
            <button onClick={() => onAIAnimate(block.id)} className="p-2 bg-white shadow-sm border rounded-full hover:text-indigo-600" title="Bring to Life">
              <Video size={16} />
            </button>
          )}
          <button onClick={() => onDelete(block.id)} className="p-2 bg-white shadow-sm border rounded-full hover:text-red-600" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>

        {/* Content */}
        {isVideo ? (
          <video 
            src={block.content} 
            className="w-full rounded-lg shadow-inner" 
            autoPlay 
            loop 
            muted 
          />
        ) : isImage ? (
          <img 
            src={block.content} 
            alt="AI Generated" 
            className="w-full h-auto rounded-lg shadow-sm" 
          />
        ) : (
          <textarea
            className="w-full bg-transparent border-none focus:ring-0 text-lg leading-relaxed resize-none serif min-h-[100px]"
            value={block.content}
            onChange={(e) => onUpdate(block.id, e.target.value)}
            placeholder="Start typing your vision..."
          />
        )}

        {block.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-xl">
            <div className="text-sm font-medium text-indigo-600 animate-bounce">Dreaming...</div>
          </div>
        )}
      </div>
    </div>
  );
};
