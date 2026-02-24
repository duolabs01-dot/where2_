
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { PrimaryButton } from './Layouts';
import { sanitizeInput } from '../utils/security';
import { showToast } from '../utils/toast';
import { AnimatePresence, motion } from 'framer-motion';
import { triggerConfetti } from '../utils/animations';
import { SignUpForm } from './SignUpForm';
import { NeonLogo } from './NeonLogo';
import { useTheme } from './ThemeProvider';
import { formatSupabaseError } from '../utils/errorHelper';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type AuthMode = 'signIn' | 'signUp' | 'forgotPassword';

// SVG Icons for Social Buttons
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const AppleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24.02-1.44.62-2.2.44-3.06-.48C2.7 15.25 3.51 7.59 10.2 7.31c1.35.07 2.27.74 3.08.74s2.29-.89 3.84-.71a4.9 4.9 0 0 1 3.61 2.01c-3.15 1.89-2.62 5.76.65 7.18a11 11 0 0 1-2.23 4.25q-1.07 1.5-2.1 1.5zM12.98 5.16C12.44 2.24 16.03.35 17.5 0c.1 2.86-3.23 5.39-4.52 5.16z"/>
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [viewMode, setViewMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  
  const { tokens } = useTheme();

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setViewMode('signIn');
      setEmail('');
      setPassword('');
      setResetSent(false);
    }
  }, [isOpen]);

  const handleSignIn = async () => {
    if (!email || !password) {
        setError("Please enter both email and password.");
        return;
    }
    setLoading(true);
    setError(null);

    try {
        const { error } = await supabase.auth.signInWithPassword({ 
            email: sanitizeInput(email), 
            password 
        });
        
        if (error) throw error;
        
        triggerConfetti();
        onSuccess();
        onClose();
        showToast('Welcome back!', 'success');
    } catch (err: any) {
        setError(formatSupabaseError(err));
    } finally {
        setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
      if (!email) {
          setError("Please enter your email address first.");
          return;
      }
      setLoading(true);
      setError(null);
      
      try {
          const { error } = await supabase.auth.resetPasswordForEmail(sanitizeInput(email), {
              redirectTo: window.location.origin + '#type=recovery'
          });
          
          if (error) throw error;
          
          setResetSent(true);
          showToast('Reset link sent!', 'success');
      } catch (e: any) {
          setError(formatSupabaseError(e));
      } finally {
          setLoading(false);
      }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
      try {
          const { error } = await supabase.auth.signInWithOAuth({
              provider,
              options: {
                  redirectTo: window.location.origin
              }
          });
          if (error) throw error;
      } catch (e: any) {
          showToast(`Could not connect to ${provider}.`, 'error');
          setError(formatSupabaseError(e));
      }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 isolate" role="dialog" aria-modal="true">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl" 
            onClick={onClose} 
          />
          
          <motion.div 
             initial={{ scale: 0.95, opacity: 0, y: 20 }}
             animate={{ scale: 1, opacity: 1, y: 0 }}
             exit={{ scale: 0.95, opacity: 0, y: 20 }}
             className={`relative w-full max-w-md ${tokens.surface} border ${tokens.border} rounded-[32px] shadow-2xl overflow-hidden transition-colors duration-300`}
          >
             {/* Background Decor */}
             <div className="absolute -top-20 -right-20 size-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none opacity-60" />
             <div className="absolute -bottom-20 -left-20 size-64 bg-secondary/10 rounded-full blur-[80px] pointer-events-none opacity-40" />

             <div className="relative z-10 p-8 flex flex-col items-center">
                <NeonLogo size="sm" className="mb-6" />
                
                {/* Dynamic Title */}
                <h2 className="text-2xl font-display font-bold text-white mb-2 tracking-tight text-center">
                   {resetSent 
                     ? 'Check your inbox' 
                     : viewMode === 'signUp' 
                        ? 'Join the Vibe' 
                        : viewMode === 'forgotPassword' 
                            ? 'Recover Account' 
                            : 'Welcome Back'}
                </h2>
                
                {/* Dynamic Subtitle */}
                <p className={`text-sm ${tokens.mutedText} mb-8 text-center max-w-[260px] leading-relaxed`}>
                   {resetSent 
                     ? `We sent a password reset link to ${email}. Check your spam folder if you don't see it.` 
                     : viewMode === 'signUp' 
                        ? 'Your city is waiting. Create an account to start exploring.' 
                        : viewMode === 'forgotPassword' 
                            ? 'Enter your email and we’ll send you a reset link.' 
                            : 'Sign in to access your plans and saved places.'}
                </p>

                {/* Content Switcher */}
                <AnimatePresence mode="wait">
                    {resetSent ? (
                        <motion.div
                            key="resetSent"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full space-y-4"
                        >
                            <div className={`p-4 ${tokens.surface2} border ${tokens.border} rounded-2xl flex flex-col items-center gap-2`}>
                                <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-1">
                                    <span className="material-symbols-outlined text-2xl">mark_email_read</span>
                                </div>
                                <p className="text-xs text-center text-gray-300">Link sent successfully</p>
                            </div>
                            <PrimaryButton 
                                onClick={() => { setResetSent(false); setViewMode('signIn'); }} 
                                className="w-full"
                            >
                                Back to Sign In
                            </PrimaryButton>
                        </motion.div>
                    ) : viewMode === 'signUp' ? (
                        <motion.div
                           key="signup"
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: -20 }}
                           className="w-full"
                        >
                            <SignUpForm 
                                onSuccess={() => {
                                    triggerConfetti();
                                    onSuccess();
                                    onClose();
                                }}
                                onSwitchToSignIn={() => setViewMode('signIn')} 
                            />
                        </motion.div>
                    ) : (
                        <motion.div 
                           key="signin"
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: 20 }}
                           className="w-full space-y-5"
                        >
                            {/* Social Buttons (Only in SignIn View) */}
                            {viewMode === 'signIn' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => handleSocialLogin('google')}
                                        className={`flex items-center justify-center gap-2 py-3 ${tokens.surface2} hover:bg-white/10 border ${tokens.border} rounded-2xl transition-all active:scale-95 group`}
                                    >
                                        <div className="text-white opacity-80 group-hover:opacity-100 transition-opacity"><GoogleIcon /></div>
                                        <span className="text-sm font-bold text-white">Google</span>
                                    </button>
                                    <button 
                                        onClick={() => handleSocialLogin('apple')}
                                        className={`flex items-center justify-center gap-2 py-3 ${tokens.surface2} hover:bg-white/10 border ${tokens.border} rounded-2xl transition-all active:scale-95 group`}
                                    >
                                        <div className="text-white opacity-80 group-hover:opacity-100 transition-opacity"><AppleIcon /></div>
                                        <span className="text-sm font-bold text-white">Apple</span>
                                    </button>
                                </div>
                            )}

                            {viewMode === 'signIn' && (
                                <div className="relative flex items-center py-1">
                                    <div className={`flex-grow border-t ${tokens.border}`}></div>
                                    <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Or with email</span>
                                    <div className={`flex-grow border-t ${tokens.border}`}></div>
                                </div>
                            )}

                            {/* Form Inputs */}
                            <div className="space-y-4">
                                <div className="group">
                                    <input 
                                        type="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={`w-full ${tokens.surface2} border ${tokens.border} rounded-2xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-medium`}
                                        placeholder="Email address"
                                    />
                                </div>
                                {viewMode !== 'forgotPassword' && (
                                    <div className="group">
                                        <input 
                                            type="password" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className={`w-full ${tokens.surface2} border ${tokens.border} rounded-2xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-medium`}
                                            placeholder="Password"
                                        />
                                        <div className="flex justify-end mt-2">
                                            <button 
                                                onClick={() => { setError(null); setViewMode('forgotPassword'); }} 
                                                className="text-xs font-bold text-gray-500 hover:text-white transition-colors"
                                            >
                                                Forgot password?
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Error Banner */}
                            {error && (
                                <div className={`p-4 ${tokens.closedBg} border ${tokens.border} rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1`}>
                                    <span className={`material-symbols-outlined ${tokens.closedRed} text-lg shrink-0 mt-0.5`}>error_outline</span>
                                    <p className={`text-xs font-medium ${tokens.closedRed} leading-snug break-words`}>{error}</p>
                                </div>
                            )}

                            {/* Primary Action */}
                            <PrimaryButton 
                                onClick={viewMode === 'signIn' ? handleSignIn : handleForgotPassword} 
                                disabled={loading} 
                                className="w-full shadow-neon !py-4 !rounded-2xl"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                        {viewMode === 'signIn' ? 'Signing In...' : 'Sending...'}
                                    </span>
                                ) : (
                                    viewMode === 'signIn' ? 'Sign In' : 'Send Reset Link'
                                )}
                            </PrimaryButton>

                            {/* Footer Links */}
                            {viewMode === 'signIn' && (
                                <p className="text-center text-xs text-gray-500 mt-2">
                                    New here? <button onClick={() => { setError(null); setViewMode('signUp'); }} className="text-white font-bold hover:underline decoration-primary underline-offset-2">Create an account</button>
                                </p>
                            )}
                            
                            {viewMode === 'forgotPassword' && (
                                <button onClick={() => { setError(null); setViewMode('signIn'); }} className="w-full text-center text-xs text-gray-500 font-bold hover:text-white mt-2 transition-colors">
                                    Back to Sign In
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <button 
                    onClick={onClose} 
                    className="absolute top-6 right-6 p-2 rounded-full text-gray-500 hover:bg-white/10 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
