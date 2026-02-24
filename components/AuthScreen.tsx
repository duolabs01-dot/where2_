
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { PrimaryButton, GlassCard } from './Layouts';

export const AuthScreen: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        if (data.session) {
          // Success: Session returned immediately
          return; 
        } else if (data.user) {
          // User created but no session. Attempt to auto-login in case 'Confirm Email' is disabled.
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (signInData.session) {
             // Success: Auto-login worked
             return;
          }

          if (signInError) {
             // Auto-login failed, likely due to email confirmation being required or credentials issue.
             if (signInError.message.includes('Email not confirmed')) {
               setError('Account created! Please verify your email before logging in.');
             } else {
               setError('Account created, but could not auto-login. Please try signing in.');
             }
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col justify-center px-8 bg-background relative overflow-hidden">
       {/* Background Decor */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[80px]" />
       </div>

       <div className="z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
         <div className="text-center mb-10">
           <h1 className="text-4xl font-bold tracking-tighter mb-2">Where<span className="text-primary animate-neon-beat">2</span>?</h1>
           <p className="text-gray-400">Join the live neighborhood feed.</p>
         </div>

         <GlassCard className="p-6 bg-surface/80 backdrop-blur-xl border-white/10">
            <div className="flex bg-black/20 p-1 rounded-xl mb-6">
              <button 
                onClick={() => { setIsSignUp(false); setError(null); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isSignUp ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400'}`}
              >
                Sign In
              </button>
              <button 
                onClick={() => { setIsSignUp(true); setError(null); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isSignUp ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400'}`}
              >
                Sign Up
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 ml-1">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/20 border-white/10 rounded-xl p-3 text-white focus:ring-primary focus:border-primary placeholder:text-gray-600"
                  placeholder="name@example.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 ml-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/20 border-white/10 rounded-xl p-3 text-white focus:ring-primary focus:border-primary placeholder:text-gray-600"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-200">
                  {error}
                </div>
              )}

              <PrimaryButton onClick={handleAuth} className="mt-4">
                {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Welcome Back')}
              </PrimaryButton>
            </div>
         </GlassCard>
       </div>
    </div>
  );
};
