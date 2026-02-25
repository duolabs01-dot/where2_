import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';
import { Venue, VenueScore } from '../lib/recommendationEngine';
import { isPlaceOpenNow } from '../lib/timeFilter';
import { getPlaceImageUrl } from '../utils/placeholders';

type CrowdSignal = 'quiet' | 'vibes' | 'packed';

interface VenueCardProps {
  venue: Venue;
  recommendationScore?: VenueScore;
  onClick: () => void;
  onNavigate: () => void;
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
}) => {
  const [crowdConsensus, setCrowdConsensus] = useState<CrowdSignal | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCrowdConsensus = async () => {
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
    };

    fetchCrowdConsensus();
    return () => {
      cancelled = true;
    };
  }, [venue.id]);

  const openStatus = useMemo(() => isPlaceOpenNow(venue), [venue]);
  const price = venue.price_level ? 'R'.repeat(Math.max(1, venue.price_level)) : 'RR';
  const distance = venue.distance || (venue.distanceNumeric ? `${Math.round(venue.distanceNumeric)}m` : 'Nearby');
  const imageSrc = getPlaceImageUrl(venue as any);
  const scorePct = recommendationScore ? Math.round(Math.max(0, Math.min(1, recommendationScore.score / 4)) * 100) : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:bg-white/[0.05] transition-colors cursor-pointer"
    >
      <div className="flex">
        <div className="w-28 h-28 shrink-0 bg-black/30">
          <img src={imageSrc} alt={venue.name} className="w-full h-full object-cover" loading="lazy" />
        </div>

        <div className="flex-1 min-w-0 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-white font-bold text-base leading-tight truncate">{venue.name}</h3>
            {scorePct !== null && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-500/25 text-cyan-300 bg-cyan-500/10">
                {scorePct}% match
              </span>
            )}
          </div>

          <div className="mt-1 text-xs text-gray-400 flex items-center gap-2">
            <span className="truncate">{venue.category}</span>
            <span className="size-1 rounded-full bg-gray-600" />
            <span>{distance}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                openStatus.open_hours_unknown
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                  : openStatus.is_open
                    ? 'bg-green-500/10 text-green-300 border-green-500/20'
                    : 'bg-red-500/10 text-red-300 border-red-500/20'
              }`}
            >
              {openStatus.open_hours_unknown ? 'Hours Unknown' : openStatus.is_open ? 'Open' : 'Closed'}
            </span>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/10 text-gray-300 bg-white/[0.03]">
              {price}
            </span>

            {crowdConsensus && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${crowdStyleMap[crowdConsensus]}`}>
                {crowdLabelMap[crowdConsensus]}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate();
          }}
          className="w-full py-2.5 rounded-xl bg-primary text-black font-bold text-sm hover:bg-white transition-colors"
        >
          Go there
        </button>
      </div>
    </div>
  );
};
