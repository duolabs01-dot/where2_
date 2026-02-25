import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Venue, VenueScore } from '../lib/recommendationEngine';
import { IOSGlassImage } from './IOSGlassImage';
import { getCATNow, isPlaceOpenNow } from '../lib/timeFilter';
import { showToast } from '../utils/toast';
import { isLocallySaved, toggleLocalSave } from '../lib/savedStore';
import { supabase } from '../supabase';
import { useHaptic } from '../utils/animations';
import { getPlaceImageUrl, isPlaceholderImage, normalizeCategory } from '../utils/placeholders';
import { preferenceEngine } from '../lib/preferenceEngine';
import { GoThereModal } from './GoThereModal';
import { getVenuePsychSignals } from '../lib/mockSignals';

interface VenueCardProps {
  venue: Venue;
  recommendationScore?: VenueScore;
  socialProof?: { savedCount: number; friendsCount: number };
  onClick?: () => void;
  onNavigate?: () => void;
}

const JHB_AREAS = [
  'Sandton', 'Rosebank', 'Melville', 'Maboneng', 'Fourways', 'Woodmead',
  'Randburg', 'Braamfontein', 'Bryanston', 'Midrand', 'Bedfordview',
  'Greenside', 'Parkhurst', 'Illovo', 'Norwood', 'Linden', 'Soweto', 'Newtown',
];

const JHB_ZONES = [
  { name: 'Sandton', minLat: -26.125, maxLat: -26.085, minLng: 28.03, maxLng: 28.085 },
  { name: 'Rosebank', minLat: -26.16, maxLat: -26.13, minLng: 28.025, maxLng: 28.055 },
  { name: 'Melville', minLat: -26.185, maxLat: -26.165, minLng: 27.995, maxLng: 28.02 },
  { name: 'Braamfontein', minLat: -26.198, maxLat: -26.185, minLng: 28.025, maxLng: 28.045 },
  { name: 'Maboneng', minLat: -26.208, maxLat: -26.2, minLng: 28.052, maxLng: 28.065 },
  { name: 'Newtown', minLat: -26.208, maxLat: -26.198, minLng: 28.025, maxLng: 28.038 },
  { name: 'Fourways', minLat: -26.04, maxLat: -26.0, minLng: 27.99, maxLng: 28.035 },
  { name: 'Greenside', minLat: -26.155, maxLat: -26.14, minLng: 28.005, maxLng: 28.025 },
  { name: 'Parkhurst', minLat: -26.145, maxLat: -26.13, minLng: 28.01, maxLng: 28.03 },
  { name: 'Illovo', minLat: -26.135, maxLat: -26.12, minLng: 28.04, maxLng: 28.06 },
  { name: 'Linden', minLat: -26.14, maxLat: -26.115, minLng: 27.975, maxLng: 28.005 },
  { name: 'Soweto', minLat: -26.35, maxLat: -26.2, minLng: 27.75, maxLng: 27.95 },
  { name: 'Bryanston', minLat: -26.08, maxLat: -26.04, minLng: 27.99, maxLng: 28.05 },
];

const LOCATION_FALLBACK = 'Around you';
const LOCATION_BLOCKLIST = ['johannesburg', 'gauteng', 'south africa', 'za'];
const STREET_HINTS = ['street', 'st ', ' road', ' rd', 'avenue', ' ave', 'drive', ' dr', 'lane', ' ln', 'highway', 'mall', 'shop', 'centre'];

const getJhbAreaFromLatLng = (lat?: number, lng?: number): string | null => {
  if (lat === undefined || lng === undefined) return null;
  for (const zone of JHB_ZONES) {
    if (lat >= zone.minLat && lat <= zone.maxLat && lng >= zone.minLng && lng <= zone.maxLng) {
      return zone.name;
    }
  }
  return null;
};

const parseSuburbFromAddress = (address?: string): string | null => {
  if (!address) return null;
  const lowerAddress = address.toLowerCase();

  for (const area of JHB_AREAS) {
    if (lowerAddress.includes(area.toLowerCase())) return area;
  }

  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const candidate = parts[i];
    const lower = candidate.toLowerCase();
    if (LOCATION_BLOCKLIST.some((blocked) => lower.includes(blocked))) continue;
    if (STREET_HINTS.some((hint) => lower.includes(hint))) continue;
    if (/\d/.test(candidate)) continue;
    if (candidate.length < 3) continue;
    return candidate;
  }

  return null;
};

const normalizeTagKey = (tag: string) => tag.toLowerCase().replace(/[^a-z0-9]+/g, '');

export const VenueCard: React.FC<VenueCardProps> = ({ venue, recommendationScore, socialProof, onClick, onNavigate }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showGoThere, setShowGoThere] = useState(false);
  const [activeSignalIndex, setActiveSignalIndex] = useState(0);
  const { trigger } = useHaptic();

  const isOpen = isPlaceOpenNow(venue);
  const hasHours = !!(venue.opening_time && venue.closing_time);
  const rating = 4.0 + ((venue.price_level || 2) * 0.2) + (venue.name.length % 5) * 0.1;

  const displayImage = getPlaceImageUrl(venue);
  const isPlaceholder = isPlaceholderImage(displayImage);
  const placeholderCategory = isPlaceholder ? normalizeCategory(venue.category) : '';

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);

      if (!session) {
        setIsSaved(isLocallySaved(venue.id));
      } else {
        const { data } = await supabase
          .from('saved_places')
          .select('id')
          .eq('place_id', venue.id)
          .eq('user_id', session.user.id)
          .maybeSingle();
        setIsSaved(!!data);
      }
    };

    init();

    const handleLocalUpdate = (e: CustomEvent) => {
      if (e.detail.id === venue.id && !isAuthenticated) {
        setIsSaved(e.detail.isSaved);
      }
    };
    window.addEventListener('where2-local-save-change', handleLocalUpdate as EventListener);
    return () => window.removeEventListener('where2-local-save-change', handleLocalUpdate as EventListener);
  }, [venue.id, isAuthenticated]);

  const handleNavigateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trigger();
    setShowGoThere(true);
  };

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    trigger();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const newState = toggleLocalSave(venue.id);
      setIsSaved(newState);
      if (newState) showToast('Saved on this device', 'success');
      return;
    }

    const previousState = isSaved;
    setIsSaved(!previousState);

    if (!previousState) {
      const { error } = await supabase.from('saved_places').insert({
        place_id: venue.id,
        user_id: session.user.id,
      });
      if (error) {
        setIsSaved(previousState);
        if (error.code === '23505') {
          setIsSaved(true);
        } else {
          showToast('Failed to save', 'error');
        }
      } else {
        showToast('Saved to your list', 'success');
        preferenceEngine.updateFromBehavior('save', venue);
      }
      return;
    }

    const { error } = await supabase.from('saved_places').delete().match({
      place_id: venue.id,
      user_id: session.user.id,
    });
    if (error) {
      setIsSaved(previousState);
      showToast('Failed to remove', 'error');
    } else {
      showToast('Removed from saves', 'info');
      preferenceEngine.updateFromBehavior('unsave', venue);
    }
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    trigger();
    const shareUrl = new URL(window.location.origin);
    shareUrl.searchParams.set('place_id', venue.id);
    const urlString = shareUrl.toString();

    if (navigator.share) {
      try {
        await navigator.share({
          title: venue.name,
          text: `Check out ${venue.name} on Where2`,
          url: urlString,
        });
      } catch {}
      return;
    }

    navigator.clipboard.writeText(urlString);
    showToast('Link copied', 'success');
  };

  const formatTime = (timeText?: string) => {
    if (!timeText) return '';
    const [h, m] = timeText.split(':');
    return `${h}:${m}`;
  };

  const badgeState = useMemo(() => {
    if (!hasHours) {
      return {
        bg: 'bg-gray-600/90',
        text: 'HOURS UNKNOWN',
        icon: 'help',
        textClass: 'text-white',
      };
    }

    if (isOpen) {
      return {
        bg: 'bg-emerald-500/90',
        text: 'OPEN NOW',
        icon: 'check_circle',
        textClass: 'text-white',
      };
    }

    const now = getCATNow();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    let opensSoon = false;
    let nextTime = '';

    if (venue.opening_time) {
      const [h, m] = venue.opening_time.split(':').map(Number);
      const openMins = h * 60 + m;
      const diff = (openMins - currentMins + 24 * 60) % (24 * 60);
      if (diff > 0 && diff <= 120) opensSoon = true;
      nextTime = `${h}:${(m || 0).toString().padStart(2, '0')}`;
    }

    if (opensSoon) {
      return {
        bg: 'bg-amber-500/90',
        text: `OPENS SOON${nextTime ? ' • ' + nextTime : ''}`,
        icon: 'schedule',
        textClass: 'text-amber-950',
      };
    }

    return {
      bg: 'bg-red-600/95',
      text: `CLOSED NOW${nextTime ? ' • Opens ' + nextTime : ''}`,
      icon: 'lock_clock',
      textClass: 'text-red-50',
    };
  }, [hasHours, isOpen, venue.opening_time]);

  const displayArea = useMemo(() => {
    const parsed = parseSuburbFromAddress(venue.address);
    if (parsed) return parsed;

    const geoArea = getJhbAreaFromLatLng(venue.latitude, venue.longitude);
    if (geoArea) return geoArea;

    const city = (venue.city || '').trim();
    if (city && !LOCATION_BLOCKLIST.some((blocked) => city.toLowerCase().includes(blocked))) {
      return city;
    }

    return LOCATION_FALLBACK;
  }, [venue.address, venue.city, venue.latitude, venue.longitude]);

  const displayTags = useMemo(() => {
    const raw = [venue.category, ...(venue.vibe_tags || [])]
      .filter(Boolean)
      .map((tag) => tag.trim());

    const unique: string[] = [];
    const seen = new Set<string>();
    raw.forEach((tag) => {
      const key = normalizeTagKey(tag);
      if (!key || seen.has(key)) return;
      seen.add(key);
      unique.push(tag);
    });
    return unique.slice(0, 2);
  }, [venue.category, venue.vibe_tags]);

  const psychSignals = useMemo(
    () => getVenuePsychSignals(venue as any, displayArea),
    [venue, displayArea]
  );

  useEffect(() => {
    if (psychSignals.rotatingSignals.length <= 1) {
      setActiveSignalIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setActiveSignalIndex((prev) => (prev + 1) % psychSignals.rotatingSignals.length);
    }, 12000);

    return () => window.clearInterval(timer);
  }, [psychSignals.rotatingSignals]);

  const distanceKm = (venue.distanceNumeric || 0) / 1000;
  const driveMins = venue.distanceNumeric ? Math.ceil(distanceKm / 0.5) : 0;
  const distanceStr = venue.distanceNumeric
    ? venue.distanceNumeric < 1000
      ? `${Math.round(venue.distanceNumeric)}m`
      : `${distanceKm.toFixed(1)}km`
    : (venue.distance || 'Nearby');
  const etaStr = driveMins > 0
    ? venue.distanceNumeric && venue.distanceNumeric < 1000
      ? `${Math.ceil(venue.distanceNumeric / 83)} min walk`
      : `${driveMins} min drive`
    : '--';

  const priceTier = Math.max(1, Math.min(4, venue.price_level || 2));
  const priceLabel = 'R'.repeat(priceTier);
  const timeLabel = useMemo(() => {
    if (!isOpen) return '';
    if (venue.closing_time) return `Open until ${formatTime(venue.closing_time)}`;
    return 'Open now';
  }, [isOpen, venue.closing_time]);

  const categoryColor = useMemo(() => {
    const lower = (venue.category || '').toLowerCase();
    if (lower.includes('night') || lower.includes('bar') || lower.includes('club')) return '#8B5CF6';
    if (lower.includes('food') || lower.includes('dining') || lower.includes('restaurant')) return '#10B981';
    if (lower.includes('coffee') || lower.includes('cafe')) return '#F59E0B';
    if (lower.includes('outdoors') || lower.includes('park')) return '#22C55E';
    if (lower.includes('art') || lower.includes('museum')) return '#EC4899';
    if (lower.includes('music')) return '#06B6D4';
    return '#6B7280';
  }, [venue.category]);

  const priceStyle = useMemo(() => {
    if (priceTier <= 1) return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' };
    if (priceTier === 2) return { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' };
    if (priceTier === 3) return { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400' };
    return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' };
  }, [priceTier]);

  const socialProofLabel = useMemo(() => {
    if (isSaved) return { text: 'Saved by you', icon: 'favorite', color: 'text-red-400' };
    if (socialProof?.savedCount && socialProof.savedCount > 5) {
      return { text: `${socialProof.savedCount} locals saved this`, icon: 'bookmark', color: 'text-purple-400' };
    }
    if (recommendationScore && recommendationScore.score > 0.95) {
      return { text: 'Trending nearby', icon: 'trending_up', color: 'text-amber-400' };
    }
    if (rating >= 4.6) {
      return { text: 'Popular right now', icon: 'local_fire_department', color: 'text-orange-400' };
    }
    if (venue.distanceNumeric && venue.distanceNumeric < 500) {
      return { text: 'Quick walk', icon: 'directions_walk', color: 'text-blue-400' };
    }
    return null;
  }, [isSaved, socialProof, recommendationScore, rating, venue.distanceNumeric]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      className="relative flex flex-col bg-[#0F1012] rounded-[24px] overflow-hidden mb-3 border border-white/5 group cursor-pointer"
      style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 20px 50px -10px ${categoryColor}15` }}
    >
      <div className="relative h-44 w-full overflow-hidden">
        <IOSGlassImage
          src={displayImage}
          alt={venue.name}
          className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-105"
          priority={!!recommendationScore}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 mix-blend-overlay opacity-30" style={{ backgroundColor: categoryColor }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1012] via-[#0F1012]/50 to-transparent opacity-90" />

        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 max-w-[75%]">
          <div className="relative overflow-hidden backdrop-blur-md rounded-full border border-white/10 shadow-lg group/badge">
            <div className={`absolute inset-0 ${badgeState.bg}`} />
            <div className="relative px-2.5 py-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[11px] text-white">{badgeState.icon}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider drop-shadow-md ${badgeState.textClass}`}>
                {badgeState.text}
              </span>
            </div>
          </div>

          {psychSignals.rotatingSignals.length > 0 && (
            <div className="backdrop-blur-md bg-black/50 px-2 py-1 rounded-full border border-white/10 shadow-sm">
              <span className="text-[10px] font-bold text-white/95">
                {psychSignals.rotatingSignals[activeSignalIndex]}
              </span>
            </div>
          )}

          {isPlaceholder && (
            <div className="backdrop-blur-md bg-black/60 px-2.5 py-1 rounded-full border border-white/10 shadow-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[10px] text-white/70">auto_awesome</span>
              <span className="text-[9px] font-bold text-white/90 uppercase tracking-widest">{placeholderCategory} Vibe</span>
            </div>
          )}
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleShareClick}
            className="size-8 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white hover:bg-black/50 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">ios_share</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSaveClick}
            className={`size-8 rounded-full backdrop-blur-md border flex items-center justify-center transition-colors ${isSaved ? 'bg-red-500/90 border-red-500 text-white' : 'bg-black/30 border-white/10 text-white hover:bg-black/50'}`}
          >
            <span className={`material-symbols-outlined text-[16px] ${isSaved ? 'filled-icon' : ''}`}>favorite</span>
          </motion.button>
        </div>

        <div className="absolute bottom-3 right-3 z-20">
          <div className="backdrop-blur-xl bg-black/60 border border-white/10 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
            <span className="material-symbols-outlined text-[12px] text-yellow-400 filled-icon">star</span>
            <span className="text-[10px] font-bold text-white">{rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-4 pb-4 -mt-8 flex flex-col gap-1">
        <div>
          <h3 className="text-xl font-display font-bold text-white leading-tight drop-shadow-lg line-clamp-1">{venue.name}</h3>
          <p className="text-[11px] font-medium text-white/75 mt-1 line-clamp-1">
            {psychSignals.reasons.join(' • ')}
          </p>
          {socialProofLabel && (
            <div className="flex items-center gap-1.5 mt-1 mb-0.5">
              <span className={`material-symbols-outlined text-[12px] ${socialProofLabel.color}`}>{socialProofLabel.icon}</span>
              <span className={`text-[10px] font-bold tracking-wide ${socialProofLabel.color} opacity-90 shadow-black drop-shadow-sm`}>
                {socialProofLabel.text}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 mb-0.5">
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold text-gray-200">
            <span className="material-symbols-outlined text-[10px] text-white">location_on</span>
            {displayArea}
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-300">
            <span className="material-symbols-outlined text-[10px]">explore</span>
            {distanceStr}
          </div>

          {driveMins > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-[9px] font-bold text-purple-300">
              <span className="material-symbols-outlined text-[10px]">directions_car</span>
              {etaStr}
            </div>
          )}

          <div className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[9px] font-bold ${priceStyle.bg} ${priceStyle.border} ${priceStyle.text}`}>
            <span className="material-symbols-outlined text-[10px]">payments</span>
            <span className="tracking-[0.08em]">{priceLabel}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {displayTags.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide border backdrop-blur-sm shadow-sm"
              style={{
                backgroundColor: `${categoryColor}15`,
                borderColor: `${categoryColor}30`,
                color: categoryColor,
                textShadow: `0 0 10px ${categoryColor}40`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {isOpen ? (
          <div className="flex items-center gap-1.5 mt-1 min-h-[16px] relative z-20">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-bold text-emerald-100 tracking-wide shadow-black drop-shadow-md">{timeLabel}</span>
          </div>
        ) : (
          <div className="min-h-[16px] mt-1" />
        )}

        <div className="mt-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleNavigateClick}
            className="relative w-full h-9 bg-primary text-white rounded-lg font-bold text-xs tracking-wide shadow-[0_0_15px_rgba(159,80,255,0.4)] hover:shadow-[0_0_25px_rgba(159,80,255,0.6)] flex items-center justify-center gap-1.5 overflow-hidden border border-white/10 group transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="material-symbols-outlined text-[16px] filled-icon relative z-10">near_me</span>
            <span className="relative z-10">Go there</span>
          </motion.button>
        </div>
      </div>

      {showGoThere && (
        <GoThereModal
          place={venue as any}
          onClose={() => setShowGoThere(false)}
          onDrive={() => {
            preferenceEngine.updateFromBehavior('navigate', venue);
            onNavigate?.();
          }}
        />
      )}
    </motion.div>
  );
};
