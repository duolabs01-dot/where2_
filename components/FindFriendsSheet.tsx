
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { GlassSheet, OptimizedImage } from './Layouts';
import { showToast } from '../utils/toast';
import { Profile } from '../types';
import { Session } from '@supabase/supabase-js';
import { useTheme } from './ThemeProvider';
import { useHaptic } from '../utils/animations';

interface FindFriendsSheetProps {
  session: Session;
  isOpen: boolean;
  onClose: () => void;
  onFollowChange?: () => void; // To refresh parent profile counts
}

// Result type extending Profile with follow state
type SearchResult = Profile & { isFollowing: boolean; isLoading?: boolean };

export const FindFriendsSheet: React.FC<FindFriendsSheetProps> = ({ session, isOpen, onClose, onFollowChange }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { tokens } = useTheme();
  const { trigger } = useHaptic();

  // Search logic
  useEffect(() => {
    const fetchUsers = async () => {
      if (!query.trim() || query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        // 1. Search Profiles
        // We match against username, first name, or last name
        const { data: users, error } = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name, full_name, avatar_url, is_verified, follower_count')
          .or(`username.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
          .neq('id', session.user.id) // Exclude self
          .limit(20);

        if (error) throw error;

        if (users && users.length > 0) {
          // 2. Check "Am I following them?" status
          const userIds = users.map(u => u.id);
          const { data: follows } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', session.user.id)
            .in('following_id', userIds);

          const followingIds = new Set(follows?.map(f => f.following_id));

          // 3. Merge data
          const merged = users.map((u: any) => ({
            ...u,
            role: 'user', // Default role for type compliance
            city: 'Johannesburg', // Default city
            isFollowing: followingIds.has(u.id),
            isLoading: false
          }));
          
          setResults(merged);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, 400); // Debounce
    return () => clearTimeout(timer);
  }, [query, session.user.id]);

  const handleFollowToggle = async (targetUser: SearchResult) => {
    trigger();
    
    // Optimistic Update
    setResults(prev => prev.map(u => 
      u.id === targetUser.id ? { ...u, isFollowing: !u.isFollowing, isLoading: true } : u
    ));

    try {
      if (targetUser.isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .match({ follower_id: session.user.id, following_id: targetUser.id });
        
        if (error) throw error;
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({ 
              follower_id: session.user.id, 
              following_id: targetUser.id,
              status: 'approved'
          });
        
        if (error) throw error;
      }

      // Sync completed state
      setResults(prev => prev.map(u => 
        u.id === targetUser.id ? { ...u, isLoading: false } : u
      ));
      
      // Notify parent to refresh "Following" count
      if (onFollowChange) onFollowChange();

    } catch (err: any) {
      // Revert on error
      console.error(err);
      showToast('Action failed. Please try again.', 'error');
      setResults(prev => prev.map(u => 
        u.id === targetUser.id ? { ...u, isFollowing: targetUser.isFollowing, isLoading: false } : u
      ));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex flex-col justify-end isolate pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      
      <GlassSheet className="relative z-10 p-0 pointer-events-auto h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300 overflow-hidden">
        
        {/* Header */}
        <div className={`p-4 border-b ${tokens.border} flex justify-between items-center ${tokens.glass}`}>
          <h2 className="text-lg font-display font-bold text-white">Find Friends</h2>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${tokens.surface2} hover:bg-white/10`}>
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className={`p-4 ${tokens.surface}`}>
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${tokens.border} ${tokens.surface2} focus-within:ring-1 focus-within:ring-primary transition-all`}>
            <span className="material-symbols-outlined text-gray-400">search</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username or name..."
              className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-500 text-sm"
              autoFocus
            />
            {loading && <span className="material-symbols-outlined animate-spin text-primary text-sm">progress_activity</span>}
          </div>
        </div>

        {/* Results List */}
        <div className={`flex-1 overflow-y-auto p-4 pt-0 space-y-3 no-scrollbar ${tokens.surface}`}>
          {results.length === 0 && !loading && query.length > 2 && (
             <div className="text-center py-10 text-gray-500">
               <p className="text-sm">No users found.</p>
               <p className="text-xs mt-1">Try searching for a full username.</p>
             </div>
          )}

          {results.map((user) => {
             const displayName = user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.full_name || 'Explorer';
             const handle = user.username || 'user'; // Fallback

             return (
               <div key={user.id} className={`flex items-center justify-between p-3 rounded-2xl border ${tokens.border} ${tokens.surface2}`}>
                  <div className="flex items-center gap-3 min-w-0">
                     <div className="size-10 rounded-full bg-white/10 overflow-hidden shrink-0 border border-white/5">
                        {user.avatar_url ? (
                           <OptimizedImage src={user.avatar_url} alt={displayName} className="size-full object-cover" />
                        ) : (
                           <div className="size-full flex items-center justify-center text-gray-400">
                              <span className="material-symbols-outlined text-lg">person</span>
                           </div>
                        )}
                     </div>
                     <div className="min-w-0">
                        <div className="flex items-center gap-1">
                           <p className="text-sm font-bold text-white truncate">{displayName}</p>
                           {user.is_verified && <span className="material-symbols-outlined text-[12px] text-blue-400 filled-icon">verified</span>}
                        </div>
                        <p className="text-xs text-gray-400 truncate">@{handle} • {user.follower_count || 0} followers</p>
                     </div>
                  </div>

                  <button
                    onClick={() => handleFollowToggle(user)}
                    disabled={user.isLoading}
                    className={`ml-3 px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 min-w-[90px] flex items-center justify-center ${
                       user.isFollowing
                         ? `bg-transparent text-gray-300 border-white/20 hover:border-red-500/50 hover:text-red-400`
                         : `${tokens.accentBg} text-white border-transparent shadow-lg hover:brightness-110`
                    }`}
                  >
                    {user.isLoading ? (
                       <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    ) : user.isFollowing ? (
                       'Following'
                    ) : (
                       'Follow'
                    )}
                  </button>
               </div>
             );
          })}
        </div>
        
      </GlassSheet>
    </div>
  );
};
