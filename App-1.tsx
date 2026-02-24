import React, { useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { Discover } from './components/Discover';
import { MapView } from './components/MapView';
import { Plans } from './components/Plans';
import { Profile } from './components/Profile';
import { ConfigScreen } from './components/ConfigScreen';
import { AuthModal } from './components/AuthModal';
import { PostModal } from './components/PostModal';
import { PreferenceNudge } from './components/PreferenceNudge';
import { WelcomeScreen } from './components/WelcomeScreen';
import { AdminLayout } from './components/AdminLayout';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { NavTab, SearchIntent } from './types';
import { Session } from '@supabase/supabase-js';
import { AnimatePresence, motion } from 'framer-motion';
import { initTheme } from './utils/theme';
import { ExploreProvider } from './lib/exploreState';
import { FiltersProvider } from './lib/filtersStore';
import { ThemeProvider } from './components/ThemeProvider';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Error Boundary
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: any): ErrorBoundaryState { return { hasError: true }; }
  
  componentDidCatch(error: any, errorInfo: any) { console.error(error, errorInfo); }
  
  render() {
    if (this.state.hasError) return <div className="p-8 text-white">Something went wrong. Please reload.</div>;
    return this.props.children;
  }
}

export const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('Discover');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  
  // Welcome Screen Logic
  const [showWelcome, setShowWelcome] = useState(true);
  const [initialIntent, setInitialIntent] = useState<SearchIntent | null>(null);

  // App Init
  useEffect(() => {
    initTheme();
    
    // Check local storage for welcome dismissal
    const welcomed = localStorage.getItem('where2_welcomed');
    if (welcomed) setShowWelcome(false);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // Check for password recovery flow
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
          setShowResetPassword(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleWelcomeComplete = (intent: SearchIntent) => {
      setInitialIntent(intent);
      setShowWelcome(false);
      localStorage.setItem('where2_welcomed', 'true');
  };

  const handleRequireAuth = (action?: () => void) => {
    if (session) {
      if (action) action();
    } else {
      setShowAuthModal(true);
    }
  };

  if (!isSupabaseConfigured()) {
    return <ConfigScreen />;
  }

  if (showAdmin) {
      return (
          <ErrorBoundary>
              <AdminLayout onExit={() => setShowAdmin(false)} />
          </ErrorBoundary>
      );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ExploreProvider>
          <FiltersProvider>
              <div className="h-full w-full bg-background flex flex-col relative overflow-hidden">
                  <AnimatePresence mode="wait">
                      {showWelcome ? (
                          <WelcomeScreen key="welcome" onComplete={handleWelcomeComplete} />
                      ) : (
                          <motion.div 
                              key="app"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }} 
                              className="flex-1 flex flex-col relative h-full overflow-hidden"
                          >
                              {/* Main Content Area */}
                              <div className="flex-1 relative overflow-hidden">
                                  {activeTab === 'Discover' && (
                                      <Discover 
                                          userCity="Johannesburg" 
                                          onCityChange={() => {}} 
                                          userPreferences={[]} 
                                          onRequireAuth={handleRequireAuth} 
                                          session={session}
                                          initialIntent={initialIntent}
                                          onSwitchToMap={() => setActiveTab('Map')}
                                      />
                                  )}
                                  {activeTab === 'Map' && (
                                      <MapView 
                                          userCity="Johannesburg" 
                                          onRequireAuth={handleRequireAuth}
                                      />
                                  )}
                                  {activeTab === 'Plans' && (
                                      <Plans 
                                          session={session} 
                                          onRequireAuth={handleRequireAuth} 
                                      />
                                  )}
                                  {activeTab === 'Profile' && (
                                      <Profile 
                                          session={session}
                                          onRequireAuth={handleRequireAuth}
                                          onResetVibe={() => {
                                              localStorage.removeItem('where2_welcomed');
                                              window.location.reload();
                                          }}
                                          onOpenAdmin={() => setShowAdmin(true)}
                                      />
                                  )}
                              </div>

                              {/* Bottom Navigation (Compacted) */}
                              <div className="shrink-0 bg-surface border-t border-white/10 flex items-center justify-around px-2 pt-2 pb-safe z-50 relative">
                                  <button 
                                      onClick={() => setActiveTab('Discover')}
                                      className={`flex flex-col items-center gap-0.5 p-1 w-14 transition-all active:scale-95 ${activeTab === 'Discover' ? 'text-primary' : 'text-gray-500 hover:text-white'}`}
                                  >
                                      <span className={`material-symbols-outlined text-xl ${activeTab === 'Discover' ? 'filled-icon' : ''}`}>explore</span>
                                      <span className="text-[9px] font-bold">Home</span>
                                  </button>

                                  <button 
                                      onClick={() => setActiveTab('Map')}
                                      className={`flex flex-col items-center gap-0.5 p-1 w-14 transition-all active:scale-95 ${activeTab === 'Map' ? 'text-primary' : 'text-gray-500 hover:text-white'}`}
                                  >
                                      <span className={`material-symbols-outlined text-xl ${activeTab === 'Map' ? 'filled-icon' : ''}`}>map</span>
                                      <span className="text-[9px] font-bold">Map</span>
                                  </button>

                                  {/* FAB Center (Slightly Reduced) */}
                                  <div className="-mt-6">
                                      <button 
                                          onClick={() => setShowPostModal(true)}
                                          className="size-12 rounded-full bg-primary text-white shadow-[0_0_20px_rgba(159,80,255,0.4)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform border-4 border-surface"
                                      >
                                          <span className="material-symbols-outlined text-xl">add</span>
                                      </button>
                                  </div>

                                  <button 
                                      onClick={() => setActiveTab('Plans')}
                                      className={`flex flex-col items-center gap-0.5 p-1 w-14 transition-all active:scale-95 ${activeTab === 'Plans' ? 'text-primary' : 'text-gray-500 hover:text-white'}`}
                                  >
                                      <span className={`material-symbols-outlined text-xl ${activeTab === 'Plans' ? 'filled-icon' : ''}`}>calendar_today</span>
                                      <span className="text-[9px] font-bold">Plans</span>
                                  </button>

                                  <button 
                                      onClick={() => setActiveTab('Profile')}
                                      className={`flex flex-col items-center gap-0.5 p-1 w-14 transition-all active:scale-95 ${activeTab === 'Profile' ? 'text-primary' : 'text-gray-500 hover:text-white'}`}
                                  >
                                      <span className={`material-symbols-outlined text-xl ${activeTab === 'Profile' ? 'filled-icon' : ''}`}>person</span>
                                      <span className="text-[9px] font-bold">You</span>
                                  </button>
                              </div>

                          </motion.div>
                      )}
                  </AnimatePresence>

                  {/* Modals */}
                  <AuthModal 
                      isOpen={showAuthModal} 
                      onClose={() => setShowAuthModal(false)} 
                      onSuccess={() => setShowAuthModal(false)} 
                  />
                  
                  <PostModal 
                      isOpen={showPostModal} 
                      onClose={() => setShowPostModal(false)} 
                  />

                  <PreferenceNudge 
                      onApply={(prefs) => { console.log('Nudge prefs', prefs); }} 
                  />

                  <ResetPasswordModal
                      isOpen={showResetPassword}
                      onClose={() => setShowResetPassword(false)}
                  />

              </div>
          </FiltersProvider>
        </ExploreProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};