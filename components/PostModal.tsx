
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';
import { showToast } from '../utils/toast';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeId: string;
}

const VIBE_OPTIONS = [
  {
    label: 'Happy Hour',
    icon: 'local_bar',
    description: 'Drink specials and social vibes',
  },
  {
    label: 'Live Music',
    icon: 'music_note',
    description: "What's playing right now",
  },
  {
    label: 'Special Offer',
    icon: 'local_offer',
    description: 'Deals people should know about',
  },
] as const;

export const PostModal: React.FC<PostModalProps> = ({ isOpen, onClose, placeId }) => {
  const [caption, setCaption] = useState('');
  const [vibeTag, setVibeTag] = useState<(typeof VIBE_OPTIONS)[number]['label']>('Happy Hour');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCaption('');
      setVibeTag('Happy Hour');
      setMediaFile(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFilePick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setMediaFile(file);
  };

  const uploadMedia = async (userId: string) => {
    if (!mediaFile) return null;

    const safeName = mediaFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${placeId}/${userId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('story-media')
      .upload(filePath, mediaFile, { upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('story-media').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (!placeId) {
        throw new Error('Missing place_id for story post.');
      }

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      const user = authData.user;
      if (!user) {
        throw new Error('You need to sign in to post a story.');
      }

      const mediaUrl = await uploadMedia(user.id);

      const { error: insertError } = await supabase.from('place_stories').insert({
        place_id: placeId,
        posted_by: user.id,
        media_url: mediaUrl,
        caption: caption.trim() || null,
        vibe_tag: vibeTag,
      });

      if (insertError) throw insertError;

      showToast('Story posted! Live for 24hrs', 'success');
      onClose();
    } catch (error: any) {
      showToast(error?.message || 'Failed to post story', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            {VIBE_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setVibeTag(option.label)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                  vibeTag === option.label
                    ? 'border-primary/40 bg-primary/5 dark:bg-primary/10'
                    : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">{option.icon}</span>
                </div>
                <div className="text-left">
                  <p className="font-bold">{option.label}</p>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </div>
              </button>
            ))}

            <div className="space-y-3">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption (optional)"
                className="w-full rounded-xl border border-gray-100 dark:border-gray-800 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary/50"
                rows={3}
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <button
                type="button"
                onClick={handleFilePick}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="size-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-500">add_a_photo</span>
                </div>
                <div className="text-left">
                  <p className="font-bold">Attach image</p>
                  <p className="text-xs text-gray-500">
                    {mediaFile ? mediaFile.name : 'Optional story image'}
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold bg-gray-100 dark:bg-gray-800">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block size-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                  Posting...
                </>
              ) : (
                'Post'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
