
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  const [profileCity, setProfileCity] = useState<string>('');
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanDateTime, setNewPlanDateTime] = useState('');
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [votingVenueIds, setVotingVenueIds] = useState<Record<string, boolean>>({});
  const planRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [recentlyCreatedId, setRecentlyCreatedId] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetchProfile();
      fetchPlans();
      fetchSavedPlaces();
    } else {
      setPlans([]);
      setSavedForLater([]);
    }
  }, [session, tab]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('city').eq('id', session?.user?.id || '').maybeSingle();
      if (!error && data?.city) setProfileCity(data.city);
    } catch (e) {
      // silent
    }
  };

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
        if (recentlyCreatedId) {
          requestAnimationFrame(() => {
            const ref = planRefs.current[recentlyCreatedId];
            if (ref) {
              ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            setRecentlyCreatedId(null);
          });
        }
      }
    } catch (e) {
      console.error('Exception fetching plans:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!session) {
      onRequireAuth(() => {});
      return;
    }
    if (!newPlanTitle.trim()) {
      showToast('Please add a plan title', 'error');
      return;
    }
    if (!newPlanDateTime) {
      showToast('Select a date and time', 'error');
      return;
    }
    setCreatingPlan(true);
    try {
      const isoDate = new Date(newPlanDateTime).toISOString();
      const { data, error } = await supabase
        .from('plans')
        .insert({
          title: newPlanTitle.trim(),
          date_time: isoDate,
          city: profileCity || 'Unknown',
          creator_id: session.user.id,
          is_active: true,
        })
        .select(`
          *,
          venues:plan_venues (*, place:places (*))
        `)
        .single();

      if (error || !data) {
        showToast(error?.message || 'Failed to create plan', 'error');
        return;
      }

      setPlans((prev) => [data as any, ...prev]);
      setRecentlyCreatedId(data.id);
      setTab('Active');
      setNewPlanTitle('');
      setNewPlanDateTime('');
      showToast('Plan created. Share and start adding venues!', 'success');
      requestAnimationFrame(() => {
        const ref = planRefs.current[data.id];
        if (ref) ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    } catch (err: any) {
      showToast(err?.message || 'Error creating plan', 'error');
    } finally {
      setCreatingPlan(false);
    }
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

  const formatCountdown = (dateString: string) => {
    if (!dateString) return 'TBD';
    const target = new Date(dateString);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    const absDiff = Math.abs(diff);
    const hours = Math.floor(absDiff / 36e5);
    const days = Math.floor(hours / 24);
    const remHours = hours - days * 24;
    const isToday = target.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const isTomorrow = target.toDateString() === tomorrow.toDateString();

    if (diff < 0) return 'Past';
    if (isToday) return `Tonight at ${target.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    if (isTomorrow) return `Tomorrow at ${target.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    if (days > 0) return `In ${days}d ${remHours}h`;
    return `In ${remHours}h`;
  };

  const handleInvite = async (plan: Plan) => {
    const url = `https://where2.app/plan/${plan.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: plan.title, url });
      } catch (e) {
        // dismissed
      }
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      showToast('Link copied!', 'success');
    } else {
      showToast(url, 'info');
    }
  };

  const handleVote = async (planId: string, planVenueId: string) => {
    if (votingVenueIds[planVenueId]) return;
    setVotingVenueIds((prev) => ({ ...prev, [planVenueId]: true }));
    try {
      const plan = plans.find((p) => p.id === planId);
      const venue = plan?.venues?.find((v) => v.id === planVenueId);
      const nextCount = (venue?.vote_count || 0) + 1;
      const { error } = await supabase.from('plan_venues').update({ vote_count: nextCount }).eq('id', planVenueId);
      if (error) throw error;
      setPlans((prev) =>
        prev.map((p) =>
          p.id !== planId
            ? p
            : {
                ...p,
                venues: p.venues?.map((v) => (v.id === planVenueId ? { ...v, vote_count: nextCount } : v)),
              }
        )
      );
    } catch (e: any) {
      showToast(e?.message || 'Vote failed', 'error');
    } finally {
      setVotingVenueIds((prev) => {
        const { [planVenueId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleDeletePlan = async (plan: Plan) => {
    if (!window.confirm(`Delete ${plan.title}? This cannot be undone.`)) return;
    setDeletingPlanId(plan.id);
    try {
      const { error } = await supabase.from('plans').delete().eq('id', plan.id);
      if (error) throw error;
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      showToast('Plan deleted', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Failed to delete plan', 'error');
    } finally {
      setDeletingPlanId(null);
    }
  };

  const sortedPlans = useMemo(() => plans, [plans]);

  return (
    <div className="h-full pt-6 px-6 flex flex-col overflow-y-auto no-scrollbar pb-24">
       <h1 className="text-2xl font-bold mb-4">Your Plans</h1>

       {session && (
         <GlassCard className="p-4 mb-5 border border-white/10">
           <form className="space-y-3" onSubmit={handleCreatePlan}>
             <div className="flex gap-2">
               <input 
                 type="text" 
                 value={newPlanTitle}
                 onChange={(e) => setNewPlanTitle(e.target.value)}
                 placeholder="Plan title (e.g. Friday Night Groove)"
                 className="flex-1 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary"
               />
             </div>
             <div className="flex gap-2 items-center">
               <input
                 type="datetime-local"
                 value={newPlanDateTime}
                 onChange={(e) => setNewPlanDateTime(e.target.value)}
                 className="flex-1 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary"
               />
               <PrimaryButton
                 type="submit"
                 className="!w-auto px-4 py-2 text-sm"
                 disabled={creatingPlan}
               >
                 {creatingPlan ? 'Creating…' : 'Start Plan'}
               </PrimaryButton>
             </div>
           </form>
         </GlassCard>
       )}
       
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
         {!loading && plans.length === 0 && session && (
           <div className="space-y-4">
             <GlassCard className="p-6 text-center border-dashed border-white/20">
               <h2 className="text-xl font-display font-bold text-white mb-2">Plan your next night out</h2>
               <p className="text-sm text-gray-400 mb-4">Save venues, vote with friends, and figure out where2 go.</p>
               <PrimaryButton onClick={handleCreatePlan} className="py-3 text-sm" disabled={creatingPlan}>
                 {creatingPlan ? 'Creating…' : 'Start a Plan'}
               </PrimaryButton>
             </GlassCard>
             {savedForLater.length > 0 && (
               <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                 <div className="flex items-center justify-between mb-3">
                   <h3 className="text-sm font-bold text-white">Suggested from your saved spots</h3>
                   <span className="text-[11px] text-gray-500">Tap a plan later to add these</span>
                 </div>
                 <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                   {savedForLater.map((place) => (
                     <div key={place.id} className="w-36 shrink-0">
                       <div className="aspect-video rounded-xl overflow-hidden relative mb-2">
                         <IOSGlassImage src={place.cover_image || ''} alt={place.name} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-black/25" />
                       </div>
                       <p className="text-xs font-bold text-white truncate">{place.name}</p>
                       <p className="text-[11px] text-gray-500 truncate">{place.category}</p>
                     </div>
                   ))}
                 </div>
               </div>
             )}
           </div>
         )}
         {!loading && plans.length === 0 && !session && (
           <GlassCard className="p-6 text-center border-dashed border-white/20">
             <h3 className="font-bold mb-2">Sign in to start planning</h3>
             <p className="text-sm text-gray-400 mb-4">Coordinate nights out with friends.</p>
             <PrimaryButton onClick={() => onRequireAuth(() => {})} className="py-2 text-sm">
               Sign In
             </PrimaryButton>
           </GlassCard>
         )}

         {/* Plan List */}
         {!loading && sortedPlans.map(plan => {
           const sortedVenues = [...(plan.venues || [])].sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
           return (
             <div key={plan.id} ref={(el) => { planRefs.current[plan.id] = el; }}>
             <GlassCard
               className="p-4"
             >
                <div className="flex justify-between items-start mb-3 gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg truncate">{plan.title}</h3>
                    <p className="text-xs text-primary font-medium uppercase tracking-wide">
                        {plan.venues && plan.venues.length > 0 ? 'Voting in progress' : 'Planning'}
                    </p>
                    {plan.is_active && (
                      <p className="text-[11px] text-gray-400 mt-1">{formatCountdown(plan.date_time)}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="bg-white/10 px-2 py-1 rounded text-[10px] font-mono font-bold text-gray-300">
                      {formatDate(plan.date_time)}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleInvite(plan)}
                        className="text-[11px] font-bold text-primary hover:text-white transition-colors"
                      >
                        Invite
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan)}
                        disabled={deletingPlanId === plan.id}
                        className="text-[11px] font-bold text-red-400 hover:text-red-200 transition-colors"
                      >
                        {deletingPlanId === plan.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
                
                {sortedVenues.length > 0 ? (
                    <div className="space-y-3 mb-4 mt-2">
                        {sortedVenues.map((venue, idx) => {
                            const percent = calculateVotePercentage(plan, venue.vote_count);
                            const isTop = idx === 0 && (venue.vote_count || 0) > 0;
                            return (
                                <div key={venue.id} className="space-y-1.5 rounded-xl border border-white/5 p-3 bg-white/5">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                          <span className={`font-medium ${percent > 0 ? 'text-white' : 'text-gray-400'}`}>
                                              {venue.place?.name || 'Unknown Place'}
                                          </span>
                                          {isTop && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30">
                                              Top Pick ⭐
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => handleVote(plan.id, venue.id)}
                                            disabled={!!votingVenueIds[venue.id]}
                                            className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-white transition-colors"
                                          >
                                            <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                                            {venue.vote_count || 0}
                                          </button>
                                          <span className="text-[10px] text-gray-500 font-bold">{percent}%</span>
                                        </div>
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
                    onClick={() => showToast('Invite friends and add venues from Discover.', 'info')}
                    className="text-xs font-bold text-primary hover:text-white transition-colors"
                   >
                      View Details
                   </button>
                </div>
             </GlassCard>
             </div>
           );
         })}
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
