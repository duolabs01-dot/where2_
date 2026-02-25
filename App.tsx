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
import { BottomNav } from './components/BottomNav';

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

const DEFAULT_PREFS: string[] = [];
const SIGNED_IN_SPLASH_MS = 5000;
const DEFAULT_WELCOME_INTENT: SearchIntent = {
  mode: 'smart_auto',
  timeMode: 'open_now',
  categories: ['All'],
  groupContext: 'solo',
  initialRadius: 600,
  autoExpand: true,
};

const AppChrome: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div className="where2-shell">
    <div className="where2-wrap h-full w-full bg-background flex flex-col relative overflow-hidden">
      {children}
    </div>
  </div>
);

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
  const [welcomeStartedAt, setWelcomeStartedAt] = useState<number>(() => Date.now());

  // App Init
  useEffect(() => {
    initTheme();

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

  useEffect(() => {
    if (showWelcome) setWelcomeStartedAt(Date.now());
  }, [showWelcome]);

  useEffect(() => {
    if (!showWelcome || !session) return;
    const elapsed = Date.now() - welcomeStartedAt;
    const remaining = Math.max(0, SIGNED_IN_SPLASH_MS - elapsed);
    const timer = window.setTimeout(() => {
      handleWelcomeComplete(DEFAULT_WELCOME_INTENT);
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [showWelcome, session, welcomeStartedAt]);

  const finalizeWelcome = (intent: SearchIntent) => {
    setInitialIntent(intent);
    setShowWelcome(false);
  };

  const handleWelcomeComplete = (intent: SearchIntent) => {
      const elapsed = Date.now() - welcomeStartedAt;
      const remaining = session ? Math.max(0, SIGNED_IN_SPLASH_MS - elapsed) : 0;
      if (remaining > 0) {
        window.setTimeout(() => finalizeWelcome(intent), remaining);
        return;
      }
      finalizeWelcome(intent);
  };

  const handleRequireAuth = (action?: () => void) => {
    if (session) {
      if (action) action();
    } else {
      setShowAuthModal(true);
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <ErrorBoundary>
        <AppChrome>
          <ConfigScreen />
        </AppChrome>
      </ErrorBoundary>
    );
  }

  if (showAdmin) {
      return (
          <ErrorBoundary>
              <ThemeProvider>
                <AppChrome>
                  <AdminLayout onExit={() => setShowAdmin(false)} />
                </AppChrome>
              </ThemeProvider>
          </ErrorBoundary>
      );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ExploreProvider>
          <FiltersProvider>
              <AppChrome>
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
                                          userPreferences={DEFAULT_PREFS} 
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
                                              window.location.reload();
                                          }}
                                          onOpenAdmin={() => setShowAdmin(true)}
                                      />
                                  )}
                              </div>

                              {/* Floating Bottom Navigation */}
                              <BottomNav 
                                  activeTab={activeTab} 
                                  setActiveTab={setActiveTab} 
                                  onAdd={() => setShowPostModal(true)} 
                              />

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
                      onApply={() => { /* preferences are persisted via preferenceEngine */ }}
                      isAuthenticated={!!session}
                      activeTab={activeTab}
                      isBlocked={showWelcome || showAuthModal || showPostModal || showResetPassword}
                  />

                  <ResetPasswordModal
                      isOpen={showResetPassword}
                      onClose={() => setShowResetPassword(false)}
                  />

              </AppChrome>
          </FiltersProvider>
        </ExploreProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};
