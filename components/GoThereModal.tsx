import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Place } from '../types';
import { useTheme } from './ThemeProvider';
import { supabase } from '../supabase';
import { showToast } from '../utils/toast';
import { prefersReducedMotion, sheetVariants, springs } from '../utils/animations';

type TransportMode = 'drive' | 'uber' | 'bolt' | 'walk';

interface GoThereModalProps {
  place: Place | null;
  onClose: () => void;
  onDrive: () => void;
}

const isValidCoord = (value?: number) => typeof value === 'number' && Number.isFinite(value);

export const GoThereModal: React.FC<GoThereModalProps> = ({ place, onClose, onDrive }) => {
  const { tokens } = useTheme();
  const [launchingMode, setLaunchingMode] = useState<TransportMode | null>(null);

  const venue = useMemo(() => place, [place]);
  if (!venue) return null;

  const logGoThereEvent = async (mode: TransportMode) => {
    try {
      await supabase.from('go_there_events').insert({
        place_id: venue.id,
        transport_mode: mode,
      });
    } catch (error) {
      console.error('go_there_events insert failed', error);
    }
  };

  const maybeCreateCheckIn = async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) return;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('share_activity')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError || !profile?.share_activity) return;

      const { error: checkInError } = await supabase.from('check_ins').insert({
        user_id: authData.user.id,
        place_id: venue.id,
      });

      if (checkInError) {
        throw checkInError;
      }
    } catch (error) {
      console.error('check_ins insert failed', error);
    }
  };

  const requireCoords = () => {
    if (!isValidCoord(venue.latitude) || !isValidCoord(venue.longitude)) {
      showToast('Location coordinates not available for this venue.', 'error');
      return false;
    }
    return true;
  };

  const handleDrive = async () => {
    if (!requireCoords()) return;
    setLaunchingMode('drive');
    await logGoThereEvent('drive');

    const appleMapsUrl = `maps://?daddr=${venue.latitude},${venue.longitude}&dirflg=d`;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}&travelmode=driving`;

    window.location.href = appleMapsUrl;
    setTimeout(() => {
      if (document.visibilityState === 'visible') {
        window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
      }
    }, 1500);

    await maybeCreateCheckIn();
    onClose();
    setLaunchingMode(null);
  };

  const handleWalk = async () => {
    if (!requireCoords()) return;
    setLaunchingMode('walk');
    const walkUrl = `https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}&travelmode=walking`;
    window.open(walkUrl, '_blank', 'noopener,noreferrer');
    await logGoThereEvent('walk');
    await maybeCreateCheckIn();
    onClose();
    setLaunchingMode(null);
  };

  const handleBolt = async () => {
    if (!requireCoords()) return;
    setLaunchingMode('bolt');
    const boltUrl = `https://bolt.eu/en-za/ride/?destination_lat=${venue.latitude}&destination_lng=${venue.longitude}&destination_name=${encodeURIComponent(venue.name)}`;
    window.open(boltUrl, '_blank', 'noopener,noreferrer');
    await logGoThereEvent('bolt');
    await maybeCreateCheckIn();
    onClose();
    setLaunchingMode(null);
  };

  const handleUber = async () => {
    if (!requireCoords()) return;
    setLaunchingMode('uber');

    const uberUrl = `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${venue.latitude}&dropoff[longitude]=${venue.longitude}&dropoff[nickname]=${encodeURIComponent(venue.name)}`;
    const uberWebUrl = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${venue.latitude}&dropoff[longitude]=${venue.longitude}&dropoff[nickname]=${encodeURIComponent(venue.name)}`;

    let pageBecameHidden = false;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        pageBecameHidden = true;
      }
    };

    document.addEventListener('visibilitychange', onVisibility, { passive: true });

    window.location.href = uberUrl;
    window.setTimeout(() => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (!pageBecameHidden && document.visibilityState === 'visible') {
        window.open(uberWebUrl, '_blank', 'noopener,noreferrer');
      }
    }, 2000);

    await logGoThereEvent('uber');
    await maybeCreateCheckIn();
    onClose();
    setLaunchingMode(null);
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500]">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

        <motion.div
          variants={prefersReducedMotion ? undefined : sheetVariants}
          initial={prefersReducedMotion ? undefined : "hidden"}
          animate={prefersReducedMotion ? undefined : "visible"}
          exit={prefersReducedMotion ? undefined : "exit"}
          className={`absolute bottom-0 left-0 right-0 mx-auto w-full max-w-md rounded-t-3xl border-t border-white/10 bg-white/[0.04] ${tokens.surface} shadow-2xl`}
        >
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Go There</h3>
              <button onClick={onClose} className="rounded-full bg-black/40 text-white size-8 flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed">
              Choose a transport mode to {venue.name}.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                onClick={handleUber}
                disabled={launchingMode !== null}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                transition={prefersReducedMotion ? undefined : springs.micro}
                className="rounded-xl border border-white/10 bg-black/30 text-white font-bold py-3 hover:bg-white/10 disabled:opacity-60"
              >
                Uber
              </motion.button>
              <motion.button
                onClick={handleBolt}
                disabled={launchingMode !== null}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                transition={prefersReducedMotion ? undefined : springs.micro}
                className="rounded-xl border border-white/10 bg-black/30 text-white font-bold py-3 hover:bg-white/10 disabled:opacity-60"
              >
                Bolt
              </motion.button>
              <motion.button
                onClick={handleDrive}
                disabled={launchingMode !== null}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                transition={prefersReducedMotion ? undefined : springs.micro}
                className="rounded-xl border border-white/10 bg-black/30 text-white font-bold py-3 hover:bg-white/10 disabled:opacity-60"
              >
                Drive
              </motion.button>
              <motion.button
                onClick={handleWalk}
                disabled={launchingMode !== null}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                transition={prefersReducedMotion ? undefined : springs.micro}
                className="rounded-xl border border-white/10 bg-black/30 text-white font-bold py-3 hover:bg-white/10 disabled:opacity-60"
              >
                Walk
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GoThereModal;
