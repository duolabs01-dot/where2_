import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';
import { Venue, VenueScore } from '../lib/recommendationEngine';
import { isPlaceOpenNow } from '../lib/timeFilter';
import { getPlaceImageUrl } from '../utils/placeholders';
import { cardVariants, prefersReducedMotion, springs } from '../utils/animations';

type CrowdSignal = 'quiet' | 'vibes' | 'packed';

interface VenueCardProps {
  venue: Venue;
  recommendationScore?: VenueScore;
  onClick: () => void;
  onNavigate: () => void;
  index?: number;
}

const crowdLabelMap: Record<CrowdSignal, string> = {
  quiet: 'Quiet',
  vibes: 'Buzzing',
  packed: 'Packed',
};

const crowdStyleMap: Record<CrowdSignal, string> = {
  quiet: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  vibes: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  packed: 'bg-red-500/10 text-red-300 border-red-500/20',
};

export const VenueCard: React.FC<VenueCardProps> = ({
  venue,
  recommendationScore,
  onClick,
  onNavigate,
  index = 0,
}) => {
  const [crowdConsensus, setCrowdConsensus] = useState<CrowdSignal | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const visibleRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCrowdConsensus = async () => {
      try {
        const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
          .from('crowd_reports')
          .select('signal, created_at')
          .eq('place_id', venue.id)
          .gt('created_at', since)
          .limit(500);

        if (cancelled) return;

        if (error || !data || data.length === 0) {
          setCrowdConsensus(null);
          return;
        }

        const counts: Record<CrowdSignal, number> = { quiet: 0, vibes: 0, packed: 0 };
        for (const row of data) {
          const signal = row.signal as CrowdSignal;
          if (signal in counts) counts[signal] += 1;
        }

        const sorted = (Object.keys(counts) as CrowdSignal[]).sort((a, b) => counts[b] - counts[a]);
        const winner = sorted[0];
        setCrowdConsensus(counts[winner] > 0 ? winner : null);
      } catch (_err) {
        if (cancelled) return;
        setCrowdConsensus(null);
      }
    };

    fetchCrowdConsensus();
    return () => {
      cancelled = true;
    };
  }, [venue.id]);

  const images = useMemo(() => {
    const media = (venue as any).media as { url?: string }[] | undefined;
    const extra = media?.map((m) => m.url).filter(Boolean) ?? [];
    const cover = venue.cover_image || getPlaceImageUrl(venue as any);
    const unique = Array.from(new Set([cover, ...extra].filter(Boolean))) as string[];
    return unique.length > 0 ? unique : [getPlaceImageUrl(venue as any)];
  }, [venue]);

  useEffect(() => {
    const node = observerRef.current;
    if (!node || images.length <= 1) return;

    const onIntersect: IntersectionObserverCallback = (entries) => {
      visibleRef.current = entries[0]?.isIntersecting ?? false;
      if (!visibleRef.current && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else if (visibleRef.current && !intervalRef.current) {
        intervalRef.current = setInterval(() => {
          setCurrentImage((idx) => (idx + 1) % images.length);
        }, 4000);
      }
    };

    const io = new IntersectionObserver(onIntersect, { threshold: 0.4 });
    io.observe(node);

    return () => {
      io.disconnect();
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [images.length]);

  const handleAdvance = useCallback(
    (direction: 1 | -1) => {
      if (images.length <= 1) return;
      setCurrentImage((idx) => {
        const next = idx + direction;
        if (next < 0) return images.length - 1;
        if (next >= images.length) return 0;
        return next;
      });
    },
    [images.length]
  );

  const shouldAnimate = !prefersReducedMotion;
  const openStatus = useMemo(() => isPlaceOpenNow(venue), [venue]);
  const price = venue.price_level ? 'R'.repeat(Math.max(1, venue.price_level)) : 'RR';
  const distance = venue.distance || (venue.distanceNumeric ? `${Math.round(venue.distanceNumeric)}m` : 'Nearby');
  const scorePct = recommendationScore
    ? Math.round((Math.max(0, Math.min(3.6, recommendationScore.score || 0)) / 3.6) * 100)
    : null;

  const statusBadge = (() => {
    if (openStatus.open_hours_unknown) {
      return { label: 'Hours TBC', classes: 'bg-gray-500/20 text-gray-200 border-gray-500/30' };
    }
    if (openStatus.is_open) {
      return { label: 'Open Now', classes: 'bg-green-500/15 text-green-200 border-green-500/30' };
    }
    if (!openStatus.is_open && venue.opening_time) {
      return { label: `Opens ${venue.opening_time}`, classes: 'bg-amber-500/15 text-amber-200 border-amber-500/30' };
    }
    return { label: 'Closed', classes: 'bg-red-500/15 text-red-200 border-red-500/30' };
  })();

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="w-full h-[220px] text-left rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:bg-white/[0.05] transition-colors cursor-pointer relative"
      ref={observerRef}
      variants={shouldAnimate ? cardVariants : undefined}
      custom={index}
      initial={shouldAnimate ? 'hidden' : undefined}
      animate={shouldAnimate ? 'visible' : undefined}
      whileTap={shouldAnimate ? { scale: 0.97, transition: springs.micro } : undefined}
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0">
          {images.map((src, idx) => (
            <img
              key={src}
              src={src}
              alt={venue.name}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-400 ${idx === currentImage ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/80" />
        </div>
        {images.length > 1 && (
          <>
            <button
              aria-label="Previous image"
              className="absolute inset-y-0 left-0 w-[20%]"
              onClick={(e) => {
                e.stopPropagation();
                handleAdvance(-1);
              }}
            />
            <button
              aria-label="Next image"
              className="absolute inset-y-0 right-0 w-[20%]"
              onClick={(e) => {
                e.stopPropagation();
                handleAdvance(1);
              }}
            />
            <div className="absolute bottom-3 right-4 flex gap-1">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`size-2 rounded-full border border-white/40 ${idx === currentImage ? 'bg-white' : 'bg-white/20'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="absolute inset-0 flex flex-col justify-end p-4 gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-white font-bold text-lg leading-tight truncate">{venue.name}</h3>
            <div className="mt-0.5 text-xs text-gray-300 flex items-center gap-2">
              <span className="truncate">{venue.category}</span>
              <span className="size-1 rounded-full bg-gray-500" />
              <span>{distance}</span>
            </div>
          </div>
          {scorePct !== null && scorePct > 50 && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border border-cyan-500/40 text-cyan-100 bg-black/50">
              {scorePct}% match
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md border ${statusBadge.classes}`}>
            {statusBadge.label}
          </span>

          <span className="text-[10px] font-bold px-2.5 py-1 rounded-md border border-white/15 text-gray-200 bg-black/40">
            {price}
          </span>

          {crowdConsensus && (
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${crowdStyleMap[crowdConsensus]}`}>
              {crowdLabelMap[crowdConsensus]}
            </span>
          )}
        </div>

        <motion.button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate();
          }}
          whileTap={shouldAnimate ? { scale: 0.95, transition: springs.micro } : undefined}
          className="mt-2 w-full py-2.5 rounded-xl bg-black/50 text-white font-bold text-sm border border-white/10 hover:bg-black/70 transition-colors"
        >
          Go There ->
        </motion.button>
      </div>
    </motion.div>
  );
};
