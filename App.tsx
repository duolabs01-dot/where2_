'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Discover } from './components/Discover';
import { MapView } from './components/MapView';
import { Plans } from './components/Plans';
import { Profile } from './components/Profile';
import { BottomNav } from './components/BottomNav';
import { AuthModal } from './components/AuthModal';
import { PostModal } from './components/PostModal';
import { ThemeProvider } from './components/ThemeProvider';
import { WelcomeScreen } from './components/WelcomeScreen';
import { showToast } from './utils/toast';
import { supabase } from './supabase';
import { FiltersProvider, useFilters } from './lib/filtersStore';
import { DiscoveryProvider, useDiscoveryContext } from './src/state/DiscoveryContext';
import { SearchIntent, NavTab } from './types';
import { initTheme } from './utils/theme';
import { RecommendationEngine, VenueScore, Venue } from './lib/recommendationEngine';

const AppShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('Discover');
  const [session, setSession] = useState<Session | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [initialIntent, setInitialIntent] = useState<SearchIntent | null>(null);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const prefetchedRef = useRef<{ venues: Venue[]; scores: VenueScore[] } | null>(null);

  const { state: discoveryState } = useDiscoveryContext();
  const { resetFilters } = useFilters();

  useEffect(() => {
    let mounted = true;
    initTheme();

    const welcomed = localStorage.getItem('where2_welcomed');
    setShowWelcome(!welcomed);

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setSession(data.session);
      }
    };

    loadSession();
    const { data: authSub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      authSub.subscription.unsubscribe();
    };
  }, []);

  const handleWelcomeComplete = useCallback((intent: SearchIntent) => {
    setInitialIntent(intent);
    setShowWelcome(false);
    localStorage.setItem('where2_welcomed', 'true');
  }, []);

  // Prefetch for logged-in branding moment
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (!showWelcome || !session) return;

    const engine = new RecommendationEngine(supabase as any);

    const prefetch = async () => {
      try {
        let lat: number | null = null;
        let lng: number | null = null;
        if (navigator.geolocation) {
          await new Promise<void>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                lat = pos.coords.latitude;
                lng = pos.coords.longitude;
                resolve();
              },
              () => resolve(),
              { enableHighAccuracy: true, timeout: 4000, maximumAge: 60000 }
            );
          });
        }

        const { venues, scores } = await engine.getTopPicks({
          location: lat && lng ? { lat, lng } : null,
          radius: 5000,
          openNow: true,
          categories: [],
          userPreferences: [],
          searchQuery: '',
        });

        prefetchedRef.current = {
          venues: venues as Venue[],
          scores: scores as VenueScore[],
        };
      } catch (_err) {
        prefetchedRef.current = null;
      }
    };

    prefetch();
    timer = setTimeout(() => {
      handleWelcomeComplete({
        mode: 'smart_auto',
        timeMode: 'open_now',
        categories: ['All'],
        groupContext: 'solo',
        initialRadius: 600,
        autoExpand: true,
      });
    }, 5000);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [handleWelcomeComplete, session, showWelcome]);

  const handleRequireAuth = useCallback((action?: () => void) => {
    if (session) {
      action?.();
      return;
    }

    pendingActionRef.current = action || null;
    setAuthOpen(true);
  }, [session]);

  const handleAuthSuccess = useCallback(() => {
    const pending = pendingActionRef.current;
    pendingActionRef.current = null;
    if (pending) pending();
  }, []);

  const handleAddPost = useCallback(
    (tab: NavTab) => {
      if (tab === 'Discover') {
        handleRequireAuth(() => {
          const hasPlace = (discoveryState.venues || []).length > 0;
          if (!hasPlace) {
            showToast('Open a venue first, then post an update.', 'info');
            return;
          }
          setPostOpen(true);
        });
        return;
      }
      if (tab === 'Map') {
        showToast('Drop a pin mode coming soon.', 'info');
        return;
      }
      if (tab === 'Plans') {
        showToast('Creating a new plan...', 'info');
        setActiveTab('Plans');
        return;
      }
      // Profile tab: no action
    },
    [discoveryState.venues, handleRequireAuth]
  );

  const handleResetVibe = useCallback(() => {
    resetFilters();
    localStorage.removeItem('where2_welcomed');
    setActiveTab('Discover');
    setShowWelcome(true);
  }, [resetFilters]);

  const postPlaceId = useMemo(
    () => discoveryState.focusedPlaceId || discoveryState.venues[0]?.id || '',
    [discoveryState.focusedPlaceId, discoveryState.venues]
  );

  return (
    <div className="fixed inset-0 bg-background text-white overflow-hidden">
      {showWelcome ? (
        <WelcomeScreen
          onComplete={handleWelcomeComplete}
          onSignIn={() => setAuthOpen(true)}
          autoAdvanceMs={session ? 5000 : undefined}
        />
      ) : (
        <>
          <div data-scroll-host="main" className="h-full overflow-y-auto no-scrollbar" style={{ paddingBottom: 'var(--bottom-nav-safe)', paddingTop: 'env(safe-area-inset-top)' }}>
            {activeTab === 'Discover' && (
              <Discover
                userCity="Johannesburg"
                onCityChange={() => undefined}
                userPreferences={[]}
                onRequireAuth={handleRequireAuth}
                session={session}
                initialIntent={initialIntent}
                prefetchedVenues={prefetchedRef.current?.venues}
                prefetchedScores={prefetchedRef.current?.scores}
                onSwitchToMap={() => setActiveTab('Map')}
              />
            )}
            {activeTab === 'Map' && (
              <MapView userCity="Johannesburg" onRequireAuth={handleRequireAuth} />
            )}
            {activeTab === 'Plans' && (
              <Plans session={session} onRequireAuth={handleRequireAuth} />
            )}
            {activeTab === 'Profile' && (
              <Profile
                session={session}
                onRequireAuth={() => handleRequireAuth()}
                onResetVibe={handleResetVibe}
                onOpenAdmin={() => showToast('Admin console coming soon.', 'info')}
              />
            )}
          </div>

          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} onAdd={handleAddPost} />
        </>
      )}


      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <PostModal
        isOpen={postOpen}
        onClose={() => setPostOpen(false)}
        placeId={postPlaceId}
      />
    </div>
  );
};

export const App: React.FC = () => (
  <ThemeProvider>
    <DiscoveryProvider>
      <FiltersProvider>
        <AppShell />
      </FiltersProvider>
    </DiscoveryProvider>
  </ThemeProvider>
);

export default App;
