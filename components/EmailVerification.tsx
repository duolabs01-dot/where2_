
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { PrimaryButton } from './Layouts';
import { showToast } from '../utils/toast';
import { triggerConfetti } from '../utils/animations';

interface EmailVerificationProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({ email, onVerified, onBack }) => {
  const [resendTimer, setResendTimer] = useState(0);
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, []);

  const startPolling = () => {
    stopPolling();
    pollInterval.current = setInterval(async () => {
      // 1. Check session (if user clicked link in this tab/window)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        handleSuccess();
        return;
      }
      
      // 2. Refresh session (if user clicked link in another tab)
      // Note: This forces Supabase to check the server state
      const { data: refreshData } = await supabase.auth.refreshSession();
      if (refreshData.session) {
        handleSuccess();
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollInterval.current) clearInterval(pollInterval.current);
  };

  const handleSuccess = () => {
    stopPolling();
    triggerConfetti();
    onVerified();
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      
      showToast('Verification email resent', 'success');
      setResendTimer(60);
      const timer = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) clearInterval(timer);
          return prev - 1;
        });
      }, 1000);
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  return (
    <div className="text-center space-y-6 animate-in zoom-in-95 duration-300 py-4">
      <div className="relative size-24 mx-auto">
        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
        <div className="relative size-24 bg-primary/10 rounded-full flex items-center justify-center border border-primary/50 shadow-[0_0_30px_rgba(159,80,255,0.3)]">
          <span className="material-symbols-outlined text-4xl text-primary">mark_email_unread</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-white">Check your inbox</h3>
        <p className="text-sm text-gray-400 max-w-[250px] mx-auto">
          We sent a secure link to <br/>
          <span className="text-white font-bold">{email}</span>
        </p>
      </div>

      <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-xs text-gray-400 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="size-2 bg-secondary rounded-full animate-pulse" />
          <span className="font-bold text-secondary">Waiting for confirmation...</span>
        </div>
        <p>Tap the link in the email to automatically sign in.</p>
      </div>

      <div className="flex flex-col gap-4">
        <PrimaryButton 
          onClick={handleResend}
          disabled={resendTimer > 0}
          className="w-full !bg-white/10 !border-white/20 hover:!bg-white/20 !text-white !shadow-none"
        >
          {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Email'}
        </PrimaryButton>
        <button onClick={onBack} className="text-gray-500 text-xs hover:text-white transition-colors">
          Back to Sign In
        </button>
      </div>
    </div>
  );
};
