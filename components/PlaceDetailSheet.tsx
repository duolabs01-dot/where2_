
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../supabase';
import { Place, Review, Plan, OperatingHour } from '../types'; // Added OperatingHour import
import { showToast } from '../utils/toast';
import { useSwipe } from './Layouts';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { prefersReducedMotion, sheetVariants, springs, triggerConfetti, useHaptic } from '../utils/animations';
import { IOSGlassImage } from './IOSGlassImage';
import { preferenceEngine } from '../lib/preferenceEngine';
import { setIntentNow } from '../lib/intentEngine';
import { isLocallySaved, toggleLocalSave } from '../lib/savedStore';
import { GoThereModal } from './GoThereModal';
import { getPlaceImageUrl } from '../utils/placeholders';
import { useTheme } from './ThemeProvider';
import { getCATNow, isPlaceOpenNow } from '../lib/timeFilter';

interface PlaceDetailSheetProps {
  place: Place | null;
  onClose: () => void;
  onShowMap?: () => void;
  onRequireAuth: (action?: () => void) => void;
}

type CrowdSignal = 'quiet' | 'vibes' | 'packed';

const PlaceDetailContent: React.FC<{ place: Place; onClose: () => void; onShowMap?: () => void; onRequireAuth: (action?: () => void) => void }> = ({ place, onClose, onShowMap, onRequireAuth }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [showGoThere, setShowGoThere] = useState(false);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [userPlans, setUserPlans] = useState<Plan[]>([]);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [crowdReportThanks, setCrowdReportThanks] = useState(false);
  const [reportingSignal, setReportingSignal] = useState<CrowdSignal | null>(null);
  const [crowdConsensus, setCrowdConsensus] = useState<CrowdSignal | null>(null);
  const [showMapSheet, setShowMapSheet] = useState(false);
  const thanksTimerRef = useRef<number | null>(null);
  
  const { triggerSuccess, trigger } = useHaptic();
  const { tokens } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollY = useMotionValue(0);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => scrollY.set(e.currentTarget.scrollTop);

  const imageY = useTransform(scrollY, [0, 400], [0, 200]);
  const imageOpacity = useTransform(scrollY, [200, 400], [1, 0.4]);
  const swipeHandlers = useSwipe({ onSwipeDown: () => { if (scrollY.get() < 20) onClose(); } });
  const displayImage = getPlaceImageUrl(place);

  useEffect(() => {
    fetchReviews();
    checkSaveState();
    setCrowdReportThanks(false);
    let cancelled = false;
    const fetchConsensus = async () => {
      setCrowdConsensus(null);
      try {
        const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
          .from('crowd_reports')
          .select('signal, created_at')
          .eq('place_id', place.id)
          .gt('created_at', since)
          .limit(500);
        if (cancelled) return;
        if (error || !data || data.length === 0) {
          setCrowdConsensus(null);
          return;
        }
        const counts: Record<CrowdSignal, number> = { quiet: 0, vibes: 0, packed: 0 };
        for (const row of data) {
          const sig = row.signal as CrowdSignal;
          if (sig in counts) counts[sig] += 1;
        }
        const total = counts.quiet + counts.vibes + counts.packed;
        if (total < 2) {
          setCrowdConsensus(null);
          return;
        }
        const sorted = (Object.keys(counts) as CrowdSignal[]).sort((a, b) => counts[b] - counts[a]);
        setCrowdConsensus(counts[sorted[0]] > 0 ? sorted[0] : null);
      } catch (_err) {
        if (!cancelled) setCrowdConsensus(null);
      }
    };
    fetchConsensus();
    return () => {
      cancelled = true;
    };
  }, [place]);

  useEffect(() => {
    return () => {
      if (thanksTimerRef.current !== null) {
        window.clearTimeout(thanksTimerRef.current);
      }
    };
  }, []);

  const checkSaveState = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
          setIsSaved(isLocallySaved(place.id));
      } else {
          const { data } = await supabase.from('saved_places').select('id').eq('place_id', place.id).eq('user_id', session.user.id).maybeSingle();
          setIsSaved(!!data);
      }
  };

  const fetchReviews = async () => {
    try {
      const { data } = await supabase.from('reviews').select(`*, user:profiles(full_name, avatar_url)`).eq('place_id', place.id).order('created_at', { ascending: false }).limit(3);
      if (data) setReviews(data as any);
    } catch (e) {}
  };

  const fetchUserPlans = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from('plans').select('*').eq('creator_id', session.user.id).eq('is_active', true);
      if (data) setUserPlans(data as any);
  };

  const handleOpenPlanSelector = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      if (onRequireAuth) onRequireAuth(() => { setShowPlanSelector(true); fetchUserPlans(); });
      else showToast('Please sign in to create plans.', 'info');
      return;
    }
    setShowPlanSelector(true);
    fetchUserPlans();
  };

  const handleAddToPlan = async (plan: Plan) => {
    const { error } = await supabase.from('plan_venues').insert({ plan_id: plan.id, place_id: place.id, vote_count: 0 });
    if (error && error.code !== '23505') showToast('Failed to add to plan', 'error');
    else {
       triggerSuccess();
       showToast(`Added to ${plan.title}`, 'success');
       setShowPlanSelector(false);
       preferenceEngine.updateFromBehavior('save', place as Place); // Changed Venue to Place
    }
  };

  const handleCreatePlan = async () => {
      if (!newPlanTitle.trim()) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from('plans').insert({ title: newPlanTitle, date_time: getCATNow().toISOString(), city: place.city, is_active: true, creator_id: session.user.id }).select().single();
      if (data) handleAddToPlan(data as any);
  };

  const handleNavigate = () => {
    trigger();
    const hasCoords = place.latitude && place.longitude;
    if (!hasCoords) {
      showToast('Location not available', 'error');
      return;
    }
    setShowGoThere(true);
    setIntentNow('detail_navigate_click');
  };
  const handleViewMap = () => {
    const hasCoords = place.latitude && place.longitude;
    if (!hasCoords) {
      showToast('Location not available', 'error');
      return;
    }
    setShowMapSheet(true);
  };
  const handleDriveInternal = () => setShowGoThere(false);

  const handleSave = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentState = isSaved;
    setIsSaved(!currentState);
    triggerSuccess();
    if (!session) {
        const newState = toggleLocalSave(place.id);
        setIsSaved(newState);
        if (newState) { triggerConfetti(); showToast('Saved to your list', 'success'); }
    } else {
        if (!currentState) {
            const { error } = await supabase.from('saved_places').insert({ place_id: place.id, user_id: session.user.id });
            if (error && error.code !== '23505') { setIsSaved(currentState); showToast('Failed to save', 'error'); }
            else { triggerConfetti(); showToast('Saved to your list', 'success'); preferenceEngine.updateFromBehavior('save', place as Place); } // Changed Venue to Place
        } else {
            const { error } = await supabase.from('saved_places').delete().match({ place_id: place.id, user_id: session.user.id });
            if (error) { setIsSaved(currentState); showToast('Failed to remove', 'error'); }
            else showToast('Removed from saves', 'info');
        }
    }
  };

  const handleShare = async () => {
    trigger();
    const shareUrl = new URL(window.location.origin);
    shareUrl.searchParams.set('place_id', place.id);
    const urlStr = shareUrl.toString();
    if (navigator.share) { try { await navigator.share({ title: place.name, text: `Check out ${place.name} on Where2!`, url: urlStr }); } catch (err) { } }
    else { navigator.clipboard.writeText(urlStr); showToast('Link copied', 'success'); }
  };

  const handleClaimBusiness = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { onRequireAuth(() => handleClaimBusiness()); return; }
      if (window.confirm(`Are you the owner or manager of ${place.name}? Request verification to manage this profile.`)) {
          const { error } = await supabase.from('business_claims').insert({ place_id: place.id, user_id: session.user.id, status: 'pending' });
          if (error) { if (error.code === '23505') showToast('You already have a pending claim.', 'info'); else showToast('Failed to submit claim.', 'error'); }
          else showToast('Claim submitted! Reviewing shortly.', 'success');
      }
  };

  const getLastCrowdReportedAt = () => {
    if (typeof window === 'undefined') return null;
    const key = `last_reported_${place.id}`;
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const ts = Number(raw);
    return Number.isFinite(ts) ? ts : null;
  };

  const setLastCrowdReportedAt = (ts: number) => {
    if (typeof window === 'undefined') return;
    const key = `last_reported_${place.id}`;
    window.sessionStorage.setItem(key, String(ts));
  };

  const handleCrowdReport = async (signal: CrowdSignal) => {
    const lastReportedAt = getLastCrowdReportedAt();
    const now = Date.now();
    const rateLimitMs = 30 * 60 * 1000;

    if (lastReportedAt && now - lastReportedAt < rateLimitMs) {
      const minsLeft = Math.max(1, Math.ceil((rateLimitMs - (now - lastReportedAt)) / 60000));
      showToast(`You can report again in ${minsLeft} min`, 'info');
      return;
    }

    setReportingSignal(signal);
    try {
      const { error } = await supabase.from('crowd_reports').insert({
        place_id: place.id,
        signal,
      });
      if (error) throw error;

      setLastCrowdReportedAt(now);
      setCrowdReportThanks(true);
      if (thanksTimerRef.current !== null) {
        window.clearTimeout(thanksTimerRef.current);
      }
      thanksTimerRef.current = window.setTimeout(() => {
        setCrowdReportThanks(false);
      }, 2000);
    } catch (error: any) {
      showToast(error?.message || 'Failed to report crowd signal', 'error');
    } finally {
      setReportingSignal(null);
    }
  };

  const formatTimeDisplay = (timeStr?: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const date = getCATNow();
    date.setHours(parseInt(h), parseInt(m));
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(' ', '');
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    // DB uses 1-7 for Mon-Sun. JS getDay() is 0-6 for Sun-Sat.
    // Adjust dayOfWeek to be 0-indexed for array access, with Sunday being last.
    const adjustedDay = dayOfWeek === 7 ? 0 : dayOfWeek;
    return days[adjustedDay];
  };

  const openStatus = useMemo(() => isPlaceOpenNow(place), [place]);
  const priceStr = place.price_level ? 'R'.repeat(place.price_level) : 'RR';
  const rating = 4.8; 
  const distance = place.distance || 'Nearby';

  const timeStatus = (() => {
    if (place.is_24_7) {
      return { label: 'Open 24/7', color: 'text-green-400', sub: 'Always open' };
    }
    if (openStatus.open_hours_unknown) {
      return { label: 'Hours TBC', color: 'text-amber-300', sub: 'Please confirm before visiting' };
    }
    if (openStatus.is_open) {
      const closingTime = openStatus.active_period?.close_time || '';
      return { label: 'Open Now', color: 'text-green-400', sub: `Closes at ${formatTimeDisplay(closingTime) || 'late'}` };
    }
    if (openStatus.opens_at) {
        let opensText = `Opens at ${formatTimeDisplay(openStatus.opens_at)}`;
        if (openStatus.opens_today) {
            opensText = `Opens today ${formatTimeDisplay(openStatus.opens_at)}`;
        } else if (openStatus.next_opening_hours) {
            const nextDayName = getDayName(openStatus.next_opening_hours.day_of_week);
            opensText = `Opens ${nextDayName} ${formatTimeDisplay(openStatus.next_opening_hours.open_time)}`;
        }
      return { label: opensText, color: 'text-amber-300', sub: '' };
    }
    return { label: 'Closed', color: 'text-red-400', sub: '' };
  })();

  return (
    <motion.div className="fixed inset-0 z-[400] flex flex-col justify-end isolate pointer-events-none">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto" onClick={onClose} />
      <motion.div
        variants={prefersReducedMotion ? undefined : sheetVariants}
        initial={prefersReducedMotion ? undefined : "hidden"}
        animate={prefersReducedMotion ? undefined : "visible"}
        exit={prefersReducedMotion ? undefined : "exit"}
        className={`fixed bottom-0 w-full h-[95vh] rounded-t-[32px] overflow-hidden shadow-2xl flex flex-col pointer-events-auto ${tokens.surface}`}
      >
          <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-center pointer-events-none">
              <button onClick={onClose} className="pointer-events-auto size-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-black/60 active:scale-95 transition-all"><span className="material-symbols-outlined">expand_more</span></button>
              <div className="flex gap-2 pointer-events-auto">
                 <button onClick={handleShare} className="size-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-black/60 active:scale-95 transition-all"><span className="material-symbols-outlined text-[20px]">ios_share</span></button>
                 <button onClick={handleSave} className={`size-10 rounded-full backdrop-blur-xl border border-white/10 flex items-center justify-center transition-all active:scale-95 ${isSaved ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-black/40 text-white hover:bg-black/60'}`}><span className={`material-symbols-outlined text-[20px] ${isSaved ? 'filled-icon' : ''}`}>favorite</span></button>
              </div>
          </div>
          <motion.div style={{ y: imageY, opacity: imageOpacity }} className="absolute top-0 w-full h-[45vh] z-0"><IOSGlassImage src={displayImage} alt={place.name} className="w-full h-full object-cover" priority={true} /><div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#050505]" /></motion.div>
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 no-scrollbar flex flex-col"
            style={{ willChange: 'transform', WebkitOverflowScrolling: 'touch' }}
            {...swipeHandlers}
          >
             <div className="w-full h-[38vh] shrink-0" />
             <div className={`${tokens.surface} min-h-[60vh] rounded-t-[32px] relative px-6 pb-sheet-safe border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]`}>
                 <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-6" />
                <div className="mb-6">
                   <h1 className="text-3xl font-display font-bold text-white leading-tight mb-1">{place.name}</h1>
                   <div className="flex items-center gap-2 text-sm font-medium text-gray-400"><span>{place.category}</span><span className="size-1 rounded-full bg-gray-600" /><span>{place.city}</span>{place.is_verified && <span className="material-symbols-outlined text-blue-400 text-sm filled-icon ml-1">verified</span>}</div>
                   <div className="mt-3 w-full">
                     <div className="w-full text-center text-sm font-bold px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white flex items-center justify-center gap-2">
                       <span className="material-symbols-outlined text-base">{openStatus.is_open ? 'schedule' : 'av_timer'}</span>
                       <span>{timeStatus.label}</span>
                     </div>
                     {timeStatus.sub && <p className="text-center text-xs text-gray-400 mt-1">{timeStatus.sub}</p>}
                   </div>
                   <div className={`mt-4 p-3 rounded-2xl border ${tokens.border} ${tokens.surface2}`}>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Crowd right now</p>
                        <AnimatePresence mode="wait">
                          {crowdReportThanks && (
                            <motion.span
                              key="crowd-thanks"
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="text-[11px] font-bold text-green-300"
                            >
                              Thanks!
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                      {crowdConsensus && (
                        <p className="text-xs text-gray-400 mb-2">Current vibe: {crowdConsensus === 'vibes' ? 'Buzzing' : crowdConsensus.charAt(0).toUpperCase() + crowdConsensus.slice(1)}</p>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        <motion.button
                          type="button"
                          disabled={reportingSignal !== null}
                          onClick={() => handleCrowdReport('quiet')}
                          whileTap={prefersReducedMotion ? undefined : { scale: 0.92, y: 2 }}
                          transition={prefersReducedMotion ? undefined : springs.bouncy}
                          className={`rounded-xl border px-2 py-2 text-xs font-bold transition-colors ${tokens.border} bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-60`}
                        >
                          Quiet
                        </motion.button>
                        <motion.button
                          type="button"
                          disabled={reportingSignal !== null}
                          onClick={() => handleCrowdReport('vibes')}
                          whileTap={prefersReducedMotion ? undefined : { scale: 0.92, y: 2 }}
                          transition={prefersReducedMotion ? undefined : springs.bouncy}
                          className={`rounded-xl border px-2 py-2 text-xs font-bold transition-colors ${tokens.border} bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-60`}
                        >
                          Buzzing
                        </motion.button>
                        <motion.button
                          type="button"
                          disabled={reportingSignal !== null}
                          onClick={() => handleCrowdReport('packed')}
                          whileTap={prefersReducedMotion ? undefined : { scale: 0.92, y: 2 }}
                          transition={prefersReducedMotion ? undefined : springs.bouncy}
                          className={`rounded-xl border px-2 py-2 text-xs font-bold transition-colors ${tokens.border} bg-red-500/10 text-red-300 hover:bg-red-500/20 disabled:opacity-60`}
                        >
                          Packed
                        </motion.button>
                      </div>
                    </div>
                 </div>
                 <div className="grid grid-cols-4 gap-2 mb-8">
                    <div className={`${tokens.surface2} rounded-2xl p-3 flex flex-col items-center justify-center gap-1 border ${tokens.border}`}><span className="material-symbols-outlined text-gray-400 text-lg">schedule</span><span className={`text-xs font-bold ${timeStatus.color}`}>{timeStatus.label}</span></div>
                    <div className={`${tokens.surface2} rounded-2xl p-3 flex flex-col items-center justify-center gap-1 border ${tokens.border}`}><span className="material-symbols-outlined text-gray-400 text-lg">directions_car</span><span className="text-xs font-bold text-white">{distance}</span></div>
                    <div className={`${tokens.surface2} rounded-2xl p-3 flex flex-col items-center justify-center gap-1 border ${tokens.border}`}><span className="material-symbols-outlined text-gray-400 text-lg">star</span><span className="text-xs font-bold text-white">{rating}</span></div>
                    <div className={`${tokens.surface2} rounded-2xl p-3 flex flex-col items-center justify-center gap-1 border ${tokens.border}`}><span className="material-symbols-outlined text-gray-400 text-lg">payments</span><span className="text-xs font-bold text-white">{priceStr}</span></div>
                 </div>
                 <div className="space-y-8">
                    <div className="space-y-3"><h3 className="font-display font-bold text-white text-lg">Why you'll like it</h3><p className="text-sm text-gray-400 leading-relaxed">{place.description || `Experience the true vibe of ${place.category} at ${place.name}. Known for its unique atmosphere.`}</p><div className="flex flex-wrap gap-2 pt-1">{(place.category ? [place.category, 'Popular', 'Trending'] : ['Trending']).map(tag => (<span key={tag} className={`px-3 py-1 ${tokens.surface2} border ${tokens.border} rounded-full text-xs font-medium text-gray-300`}>{tag}</span>))}</div></div>
                    <div className={`${tokens.surface2} rounded-2xl p-5 border ${tokens.border}`}><div className="flex items-center gap-2 mb-4"><span className={`material-symbols-outlined ${tokens.accentPurple}`}>restaurant_menu</span><h3 className="font-display font-bold text-white">Highlights</h3></div><div className="space-y-3">{(place.popular_items || [{ name: "Signature Dish", price: "R --" }, { name: "House Drink", price: "R --" }]).map((item, idx) => (<div key={idx} className={`flex justify-between text-sm border-b ${tokens.border} last:border-0 pb-2 last:pb-0`}><span className="text-gray-300 font-medium">{item.name}</span><span className="text-white font-bold">{item.price}</span></div>))}</div></div>
                    <div><div className="flex justify-between items-center mb-4"><h3 className="font-display font-bold text-white">Reviews</h3><button className={`text-xs font-bold ${tokens.accentPurple}`}>See All</button></div>{reviews.length > 0 ? (<div className="space-y-3">{reviews.map(r => (<div key={r.id} className={`${tokens.surface2} p-3 rounded-xl border ${tokens.border}`}><div className="flex items-center gap-2 mb-2"><div className="size-6 rounded-full bg-gray-600 overflow-hidden">{r.user?.avatar_url && <img src={r.user.avatar_url} className="w-full h-full object-cover"/>}</div><span className="text-xs font-bold text-gray-200">{r.user?.full_name || 'User'}</span><div className="flex text-yellow-500 text-[10px] ml-auto">{[...Array(5)].map((_,i) => <span key={i} className="material-symbols-outlined filled-icon" style={{fontSize:'10px'}}>{i<r.rating?'star':'star_border'}</span>)}</div></div><p className="text-xs text-gray-400 pl-8">{r.comment}</p></div>))}</div>) : (<p className={`text-xs text-gray-500 italic p-4 text-center ${tokens.surface2} rounded-xl border ${tokens.border}`}>No reviews yet. Be the first!</p>)}</div>
                    <div><h3 className="font-display font-bold text-white mb-3">Location</h3><button onClick={onShowMap} className={`w-full h-32 bg-gray-800 rounded-2xl relative overflow-hidden group border ${tokens.border}`}><div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10" /><div className="absolute inset-0 flex items-center justify-center z-20"><span className={`bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold text-white flex items-center gap-2 border ${tokens.border}`}><span className="material-symbols-outlined text-sm">map</span>View on Map</span></div><img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&q=80" className="w-full h-full object-cover opacity-60 grayscale" alt="Map Preview" /></button><p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span>{place.address || `${place.city}, South Africa`}</p></div>
                    {!place.is_verified && (<div className={`pt-8 border-t ${tokens.border}`}><button onClick={handleClaimBusiness} className="text-xs text-gray-500 hover:text-white underline underline-offset-4 decoration-white/20 hover:decoration-white transition-all w-full text-center">Own this business? Claim it now</button></div>)}
                 </div>
             </div>
          </div>
          <div
            className={`sticky bottom-0 left-0 right-0 p-4 ${tokens.surface} backdrop-blur-xl border-t border-white/10 z-50 flex gap-3`}
            style={{ paddingBottom: 'var(--bottom-nav-safe)' }}
          >
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleOpenPlanSelector} className="flex-1 py-4 rounded-2xl bg-white/10 border border-white/10 text-white font-bold text-sm hover:bg-white/20 transition-colors flex items-center justify-center gap-2"><span className="material-symbols-outlined text-lg">calendar_add_on</span>Add to Plan</motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleNavigate} className={`flex-[2] py-4 rounded-2xl ${tokens.accentBg} text-black font-bold text-sm shadow-[0_0_30px_rgba(159,80,255,0.3)] hover:shadow-[0_0_40px_rgba(159,80,255,0.5)] transition-all flex items-center justify-center gap-2 relative overflow-hidden group`}><div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[100%] group-hover:animate-[shimmer_1.5s_infinite]" /><span className="material-symbols-outlined text-lg">near_me</span>Go there</motion.button>
          </div>
          <AnimatePresence>{showPlanSelector && (<motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className={`absolute inset-0 z-[60] ${tokens.surface} flex flex-col`}><div className={`p-6 border-b border-white/10 flex items-center justify-between ${tokens.surface} backdrop-blur-xl sticky top-0 z-10`}><h3 className="text-lg font-bold text-white">Add to Plan</h3><button onClick={() => setShowPlanSelector(false)} className="size-8 rounded-full bg-white/10 flex items-center justify-center text-white"><span className="material-symbols-outlined">close</span></button></div><div className="p-6 space-y-4"><div className={`${tokens.surface2} p-4 rounded-2xl border ${tokens.border}`}><h4 className="font-bold text-sm mb-3 text-white">Create New Plan</h4><div className="flex gap-2"><input type="text" value={newPlanTitle} onChange={(e) => setNewPlanTitle(e.target.value)} placeholder="e.g. Friday Night" className={`flex-1 bg-black/20 border ${tokens.border} rounded-xl px-4 py-3 text-sm text-white focus:ring-primary focus:border-primary`} /><button onClick={handleCreatePlan} disabled={!newPlanTitle.trim()} className={`${tokens.accentBg} px-4 rounded-xl font-bold text-sm text-black`}>Create</button></div></div><div className="space-y-2">{userPlans.map(plan => (<button key={plan.id} onClick={() => handleAddToPlan(plan)} className={`w-full p-4 ${tokens.surface2} border ${tokens.border} rounded-xl flex items-center justify-between hover:bg-white/10 text-left`}><span className="font-bold text-white text-sm">{plan.title}</span><span className={`material-symbols-outlined ${tokens.accentPurple}`}>add_circle</span></button>))}</div></div></motion.div>)}</AnimatePresence>
          <AnimatePresence>
            {showMapSheet && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 280, damping: 30 }}
                className={`absolute inset-0 z-[58] ${tokens.surface} flex flex-col`}
              >
                <div className={`p-6 border-b border-white/10 flex items-center justify-between ${tokens.surface} backdrop-blur-xl sticky top-0 z-10`}>
                  <h3 className="text-lg font-bold text-white">Map Preview</h3>
                  <button onClick={() => setShowMapSheet(false)} className="size-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/30">
                    <iframe
                      title="Map"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${(place.longitude || 0) - 0.01},${(place.latitude || 0) - 0.01},${(place.longitude || 0) + 0.01},${(place.latitude || 0) + 0.01}&marker=${place.latitude || 0},${place.longitude || 0}`}
                      className="w-full"
                      style={{ height: 300 }}
                      loading="lazy"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setShowMapSheet(false);
                      handleNavigate();
                    }}
                    className="w-full py-3 rounded-xl bg-primary text-black font-bold text-sm shadow-lg"
                  >
                    Get Directions
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>{showGoThere && (<GoThereModal place={place} onClose={() => setShowGoThere(false)} onDrive={handleDriveInternal} />)}</AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export const PlaceDetailSheet: React.FC<PlaceDetailSheetProps> = ({ place, onClose, onShowMap, onRequireAuth }) => {
  if (!place) return null;
  return (<PlaceDetailContent place={place} onClose={onClose} onShowMap={onShowMap} onRequireAuth={onRequireAuth} />);
};
