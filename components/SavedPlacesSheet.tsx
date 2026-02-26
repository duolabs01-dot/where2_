
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { GlassSheet, CardSkeleton } from './Layouts';
import { VenueCard } from './VenueCard';
import { Place } from '../types';
import { DiscoveryVenue } from '../src/lib/discoveryEngine'; // Import DiscoveryVenue
import { enrichPlacesWithImages } from '../utils/imageEnricher';
import { useTheme } from './ThemeProvider';

interface SavedPlacesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTo: (place: Place) => void;
}

export const SavedPlacesSheet: React.FC<SavedPlacesSheetProps> = ({ isOpen, onClose, onNavigateTo }) => {
  const [savedVenues, setSavedVenues] = useState<DiscoveryVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const { tokens } = useTheme();

  useEffect(() => {
    if (isOpen) {
      fetchSavedPlaces();
    }
  }, [isOpen]);

  const fetchSavedPlaces = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('saved_places')
        .select(`
          created_at,
          place:places(*, is_24_7, operating_hours(*))
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const rawPlaces = data.map((item: any) => item.place).filter(Boolean);
        const enriched = await enrichPlacesWithImages(rawPlaces as Place[]);
        
        const discoveryVenues: DiscoveryVenue[] = enriched.map(p => ({
            ...p,
            distanceNumeric: 0, // Default for saved places, not actively calculated here
            open_now: false // Default for saved places, open status is checked in VenueCard
        }));
        
        setSavedVenues(discoveryVenues);
      }
    } catch (e) {
      console.error('Error fetching saved places', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex flex-col justify-end isolate pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" 
        onClick={onClose} 
      />
      
      <GlassSheet className="relative z-10 p-0 pointer-events-auto h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300 overflow-hidden">
        
        {/* Header */}
        <div className={`p-4 border-b ${tokens.border} flex justify-between items-center ${tokens.glass}`}>
          <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-red-400 filled-icon">favorite</span>
            Saved Places
          </h2>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${tokens.surface2} hover:bg-white/10`}>
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar ${tokens.surface}`}>
            {loading ? (
                <>
                    <CardSkeleton />
                    <CardSkeleton />
                </>
            ) : savedVenues.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center opacity-60">
                    <span className="material-symbols-outlined text-4xl mb-2">bookmark_border</span>
                    <p className="text-sm font-bold">No saved places yet</p>
                    <p className="text-xs">Tap the heart on any place to save it here.</p>
                </div>
            ) : (
                savedVenues.map((venue, index) => (
                    <VenueCard 
                        key={venue.id} 
                        venue={venue} 
                        index={index}
                        onClick={() => {}} // Could open detail
                        // Fixed type mismatch: casting Venue to Place for onNavigateTo prop
                        onNavigate={() => onNavigateTo(venue as DiscoveryVenue)}
                    />
                ))
            )}
        </div>
      </GlassSheet>
    </div>
  );
};
