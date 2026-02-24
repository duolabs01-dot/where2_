
import React, { useState, useEffect } from 'react';
import { GlassCard, PrimaryButton } from './Layouts';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { Plan, Place } from '../types';
import { showToast } from '../utils/toast';
import { enrichPlacesWithImages } from '../utils/imageEnricher';
import { IOSGlassImage } from './IOSGlassImage';

interface PlansProps {
  session: Session | null;
  onRequireAuth: (action?: () => void) => void;
}

export const Plans: React.FC<PlansProps> = ({ session, onRequireAuth }) => {
  const [tab, setTab] = useState<'Active' | 'Past'>('Active');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [savedForLater, setSavedForLater] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      fetchPlans();
      fetchSavedPlaces();
    } else {
      setPlans([]);
      setSavedForLater([]);
    }
  }, [session, tab]);

  const fetchSavedPlaces = async () => {
      const { data } = await supabase.from('saved_places').select('place:places(*)').limit(5).order('created_at', {ascending: false});
      if(data) {
          const raw = data.map((d: any) => d.place);
          const enriched = await enrichPlacesWithImages(raw);
          setSavedForLater(enriched);
      }
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('plans')
        .select(`
          *,
          venues:plan_venues (
            *,
            place:places (*)
          )
        `)
        .eq('is_active', tab === 'Active')
        .order('date_time', { ascending: true });

      if (error) {
        // console.error('Error fetching plans:', error);
      } 
      
      if (data) {
        setPlans(data as any);
      }
    } catch (e) {
      console.error('Exception fetching plans:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = () => {
    onRequireAuth(() => {
      showToast('Plan creation wizard coming soon!', 'success');
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase();
  };

  const calculateVotePercentage = (plan: Plan, venueVoteCount: number) => {
    const totalVotes = plan.venues?.reduce((acc, v) => acc + (v.vote_count || 0), 0) || 0;
    if (totalVotes === 0) return 0;
    return Math.round((venueVoteCount / totalVotes) * 100);
  };

  return (
    <div className="h-full pt-6 px-6 flex flex-col overflow-y-auto no-scrollbar pb-24">
       <h1 className="text-2xl font-bold mb-6">Your Plans</h1>
       
       <div className="flex bg-white/5 p-1 rounded-xl mb-6 shrink-0">
         {['Active', 'Past'].map(t => (
           <button 
             key={t}
             onClick={() => setTab(t as any)}
             className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
               tab === t ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400'
             }`}
           >
             {t}
           </button>
         ))}
       </div>

       <div className="space-y-4 mb-8">
         {/* Loading State */}
         {loading && (
            <div className="flex flex-col gap-4">
               {[1, 2].map(i => (
                 <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
               ))}
            </div>
         )}

         {/* Empty State */}
         {!loading && plans.length === 0 && (
           <GlassCard className="p-6 text-center border-dashed border-white/20">
             <div className="size-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
               <span className="material-symbols-outlined">add_location_alt</span>
             </div>
             <h3 className="font-bold mb-1">
               {session ? `No ${tab.toLowerCase()} plans` : 'Start Planning'}
             </h3>
             <p className="text-xs text-gray-400 mb-4">
               {session 
                 ? 'Start a vote or coordinate a night out.' 
                 : 'Sign in to coordinate nights out with friends.'}
             </p>
             <PrimaryButton onClick={handleCreatePlan} className="py-2 text-sm">
               {session ? 'Create Plan' : 'Sign In to Plan'}
             </PrimaryButton>
           </GlassCard>
         )}

         {/* Plan List */}
         {!loading && plans.map(plan => (
             <GlassCard key={plan.id} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{plan.title}</h3>
                    <p className="text-xs text-primary font-medium uppercase tracking-wide">
                        {plan.venues && plan.venues.length > 0 ? 'Voting in progress' : 'Planning'}
                    </p>
                  </div>
                  <div className="bg-white/10 px-2 py-1 rounded text-[10px] font-mono font-bold text-gray-300">
                    {formatDate(plan.date_time)}
                  </div>
                </div>
                
                {plan.venues && plan.venues.length > 0 ? (
                    <div className="space-y-3 mb-4 mt-2">
                        {plan.venues.map(venue => {
                            const percent = calculateVotePercentage(plan, venue.vote_count);
                            return (
                                <div key={venue.id} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className={`font-medium ${percent > 0 ? 'text-white' : 'text-gray-400'}`}>
                                            {venue.place?.name || 'Unknown Place'}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-bold">{percent}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${percent >= 50 ? 'bg-primary' : 'bg-white/20'}`} 
                                            style={{ width: `${percent}%` }} 
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                  <div className="p-3 bg-white/5 rounded-lg mb-4 text-xs text-gray-400 text-center">
                    No venues added yet.
                  </div>
                )}

                <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                   <div className="flex -space-x-2">
                      <div className="size-6 rounded-full border-2 border-[#181d25] bg-gray-600 flex items-center justify-center text-[8px]">
                        <span className="material-symbols-outlined text-[14px]">person</span>
                      </div>
                      {/* Placeholder for other participants */}
                      <div className="size-6 rounded-full border-2 border-[#181d25] bg-white/10 flex items-center justify-center text-[9px] font-bold">
                        +
                      </div>
                   </div>
                   <button 
                    onClick={() => showToast('Opening plan details...', 'info')}
                    className="text-xs font-bold text-primary hover:text-white transition-colors"
                   >
                      View Details
                   </button>
                </div>
             </GlassCard>
         ))}
       </div>

       {/* Saved For Later Section */}
       {savedForLater.length > 0 && (
           <div className="mt-4">
               <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Saved for later</h2>
               <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4">
                   {savedForLater.map(place => (
                       <div key={place.id} className="w-32 shrink-0">
                           <div className="aspect-square rounded-xl overflow-hidden mb-2 relative">
                               <IOSGlassImage src={place.cover_image || ''} alt={place.name} className="w-full h-full object-cover" />
                               <div className="absolute inset-0 bg-black/20" />
                           </div>
                           <p className="text-xs font-bold text-white truncate">{place.name}</p>
                           <p className="text-[10px] text-gray-500 truncate">{place.category}</p>
                       </div>
                   ))}
                   <button 
                    className="w-32 aspect-square rounded-xl border border-white/10 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors shrink-0 mb-6"
                    onClick={() => showToast('View all saved places in Profile tab', 'info')}
                   >
                       <span className="material-symbols-outlined text-gray-400">arrow_forward</span>
                       <span className="text-xs font-bold text-gray-500">View All</span>
                   </button>
               </div>
           </div>
       )}
    </div>
  );
};
