
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

interface InviteCodeInputProps {
  value: string;
  onChange: (value: string, isValid: boolean) => void;
}

export const InviteCodeInput: React.FC<InviteCodeInputProps> = ({ value, onChange }) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  // Debounced validation
  useEffect(() => {
    const code = value.trim().toUpperCase();
    if (!code) {
      setIsValid(null);
      onChange(value, false);
      return;
    }

    // Special bypass for demo purposes
    if (code === 'VIP2024' || code === 'WHERE2') {
        setIsValid(true);
        onChange(value, true);
        return;
    }

    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const { data } = await supabase
          .from('invite_codes')
          .select('id')
          .eq('code', code)
          .eq('is_used', false)
          .maybeSingle();

        const valid = !!data;
        setIsValid(valid);
        onChange(value, valid);
      } catch (e) {
        setIsValid(false);
        onChange(value, false);
      } finally {
        setChecking(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="space-y-1 pt-2 border-t border-white/5 mt-2 animate-in slide-in-from-top-2">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 flex items-center gap-1">
          Invite Code <span className="bg-white/10 text-gray-400 px-1 rounded text-[8px]">OPTIONAL</span>
        </label>
        {isValid && (
           <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-0.5 rounded text-yellow-400 animate-pulse border border-yellow-400/20">
               <span className="material-symbols-outlined text-[10px] filled-icon">stars</span>
               <span className="text-[9px] font-bold uppercase tracking-wider">VIP Access Unlocked</span>
           </div>
        )}
      </div>
      <div className="relative group">
        <input 
          type="text" 
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''), false)} 
          maxLength={15}
          className={`w-full bg-white/5 border rounded-xl p-3.5 pl-10 text-white placeholder:text-gray-600 focus:outline-none transition-all uppercase tracking-widest font-mono ${
             isValid === true ? 'border-yellow-400/50 text-yellow-400 focus:border-yellow-400 bg-yellow-400/5' :
             isValid === false ? 'border-status-red/50 text-status-red focus:border-status-red' :
             'border-white/10 focus:border-primary/50'
          }`}
          placeholder="VIP-CODE-2024"
        />
        <span className={`material-symbols-outlined absolute left-3 top-3.5 text-lg transition-colors ${isValid ? 'text-yellow-400' : 'text-gray-500'}`}>
            confirmation_number
        </span>
        
        <div className="absolute right-3 top-3.5">
           {checking ? (
              <span className="material-symbols-outlined animate-spin text-gray-500 text-sm">progress_activity</span>
           ) : isValid === true ? (
              <span className="material-symbols-outlined text-yellow-400 text-sm">check_circle</span>
           ) : isValid === false && value.length > 0 ? (
              <span className="material-symbols-outlined text-status-red text-sm">cancel</span>
           ) : null}
        </div>
      </div>
      {isValid === false && value.length > 0 && (
         <div className="flex items-center gap-1 ml-1 text-status-red animate-pulse">
            <span className="material-symbols-outlined text-[10px]">error_outline</span>
            <p className="text-[10px]">Invalid or expired invite code</p>
         </div>
      )}
    </div>
  );
};
