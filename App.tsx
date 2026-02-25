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
import { showToast } from './utils/toast';
import { supabase } from './supabase';
import { FiltersProvider, useFilters } from './lib/filtersStore';
import { DiscoveryProvider, useDiscoveryContext } from './src/state/DiscoveryContext';
import { NavTab } from './types';

const AppShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('Discover');
  const [session, setSession] = useState<Session | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  const { state: discoveryState } = useDiscoveryContext();
  const { resetFilters } = useFilters();

  useEffect(() => {
    let mounted = true;

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

  const handleAddPost = useCallback(() => {
    handleRequireAuth(() => {
      const hasPlace = (discoveryState.venues || []).length > 0;
      if (!hasPlace) {
        showToast('Open a venue first, then post an update.', 'info');
        return;
      }
      setPostOpen(true);
    });
  }, [discoveryState.venues, handleRequireAuth]);

  const handleResetVibe = useCallback(() => {
    resetFilters();
    setActiveTab('Discover');
  }, [resetFilters]);

  const postPlaceId = useMemo(
    () => discoveryState.focusedPlaceId || discoveryState.venues[0]?.id || '',
    [discoveryState.focusedPlaceId, discoveryState.venues]
  );

  return (
    <div className="h-[100dvh] bg-background text-white overflow-hidden">
      <div data-scroll-host="main" className="h-full overflow-y-auto no-scrollbar pb-[calc(env(safe-area-inset-bottom)+92px)]">
        {activeTab === 'Discover' && (
          <Discover
            userCity="Johannesburg"
            onCityChange={() => undefined}
            userPreferences={[]}
            onRequireAuth={handleRequireAuth}
            session={session}
            initialIntent={null}
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
