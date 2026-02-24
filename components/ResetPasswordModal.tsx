
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { PrimaryButton } from './Layouts';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { showToast } from '../utils/toast';
import { formatSupabaseError } from '../utils/errorHelper';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tokens } = useTheme();

  const handleUpdatePassword = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: password });
      
      if (error) throw error;

      showToast('Password updated successfully', 'success');
      onClose();
    } catch (err: any) {
      const msg = formatSupabaseError(err);
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center px-4" aria-modal="true" role="dialog">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
      />
      
      <motion.div 
         initial={{ scale: 0.95, opacity: 0, y: 20 }}
         animate={{ scale: 1, opacity: 1, y: 0 }}
         exit={{ scale: 0.95, opacity: 0, y: 20 }}
         className={`relative w-full max-w-md border ${tokens.border} ${tokens.radius} shadow-2xl overflow-hidden p-6 ${tokens.surface}`}
      >
         <h2 className="text-2xl font-bold text-white font-display mb-2">Reset Password</h2>
         <p className="text-sm text-gray-400 mb-6">Enter your new password below.</p>

         <div className="space-y-4">
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">New Password</label>
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full ${tokens.surface2} border ${tokens.border} rounded-xl p-3.5 text-white focus:outline-none focus:border-primary/50`}
                    placeholder="••••••••"
                />
                <PasswordStrengthMeter password={password} />
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Confirm Password</label>
                <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full ${tokens.surface2} border ${tokens.border} rounded-xl p-3.5 text-white focus:outline-none focus:border-primary/50`}
                    placeholder="••••••••"
                />
            </div>

            {error && (
                <div className={`p-3 border rounded-xl flex items-start gap-3 ${tokens.closedBg}`}>
                    <span className={`material-symbols-outlined text-lg shrink-0 ${tokens.closedRed}`}>error</span>
                    <p className={`text-xs break-words ${tokens.closedRed}`}>{error}</p>
                </div>
            )}

            <PrimaryButton 
                onClick={handleUpdatePassword} 
                disabled={loading} 
                className="w-full mt-2"
            >
                {loading ? 'Updating...' : 'Update Password'}
            </PrimaryButton>
         </div>
      </motion.div>
    </div>
  );
};
