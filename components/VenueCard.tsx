import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';
import { Place, OperatingHour } from '../types'; // Import Place and OperatingHour
import { DiscoveryVenue } from '../src/lib/discoveryEngine'; // Import DiscoveryVenue
import { isPlaceOpenNow, formatTimeDisplay, getCATNow } from '../lib/timeFilter'; // Import formatTimeDisplay
import { getPlaceImageUrl } from '../utils/placeholders';
import { cardVariants, prefersReducedMotion, springs } from '../utils/animations';

interface VenueCardProps {
  venue: DiscoveryVenue; // Change Place to DiscoveryVenue
  recommendationScore?: { venueId: string; score: number; }; // Use direct type for VenueScore
  onClick: () => void;
  onNavigate: () => void;
  index?: number;
  heightClass?: string;
  badge?: string;
}

// Helper function to get day name from day of week (1=Mon, 7=Sun)
const getDayName = (dayOfWeek: number) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const adjustedDay = dayOfWeek === 7 ? 0 : dayOfWeek; // Convert 1-7 (Mon-Sun) to 0-6 (Sun-Sat)
  return days[adjustedDay];
};

export const VenueCard: React.FC<VenueCardProps> = ({
  venue,
  recommendationScore,
  onClick,
  onNavigate,
  index = 0,
  heightClass = 'h-[220px]',
  badge,
}) => {
  const [currentImage, setCurrentImage] = useState(0);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const visibleRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const images = useMemo(() => {
    const media = (venue as any).media as { url?: string }[] | undefined;
    const extra = media?.map((m) => m.url).filter(Boolean) ?? [];
    const cover = venue.cover_image || getPlaceImageUrl(venue); // Cast no longer needed
    const unique = Array.from(new Set([cover, ...extra].filter(Boolean))) as string[];
    return unique.length > 0 ? unique : [getPlaceImageUrl(venue)]; // Cast no longer needed
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
    if (venue.is_24_7) {
        return { label: 'Open 24/7', classes: 'bg-green-500/15 text-green-200 border-green-500/30' };
    }
    if (openStatus.open_hours_unknown) {
        return { label: 'Hours TBC', classes: 'bg-gray-500/20 text-gray-200 border-gray-500/30' };
    }
    if (openStatus.is_open) {
        const closingTime = openStatus.active_period?.close_time;
        return { label: 'Open Now', classes: 'bg-green-500/15 text-green-200 border-green-500/30', sub: `Until ${formatTimeDisplay(closingTime) || 'late'}` };
    }
    if (openStatus.opens_at) {
        let opensText = `Opens ${formatTimeDisplay(openStatus.opens_at)}`;
        if (openStatus.opens_today) {
            opensText = `Opens today ${formatTimeDisplay(openStatus.opens_at)}`;
        } else if (openStatus.next_opening_hours) {
            const nextDayName = getDayName(openStatus.next_opening_hours.day_of_week);
            opensText = `Opens ${nextDayName} ${formatTimeDisplay(openStatus.next_opening_hours.open_time)}`;
        }
        return { label: opensText, classes: 'bg-amber-500/15 text-amber-200 border-amber-500/30' };
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
      className={`w-full ${heightClass} text-left rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:bg-white/[0.05] transition-colors cursor-pointer relative`}
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
        {badge && (
          <span className="absolute top-3 left-3 z-20 px-3 py-1 rounded-full bg-amber-500/80 text-black text-[11px] font-bold shadow-lg flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">star</span>
            {badge}
          </span>
        )}
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
          Go There &rarr;
        </motion.button>
      </div>
    </motion.div>
  );
};
