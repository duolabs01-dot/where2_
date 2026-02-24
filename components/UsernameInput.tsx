
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';

interface UsernameInputProps {
  value: string;
  onChange: (value: string, isAvailable: boolean) => void;
}

// Helper to generate suggestions
const suggestAlternatives = (base: string): string[] => {
  const clean = base.toLowerCase().replace(/[^a-z0-9_]/g, '');
  return [
    `${clean}_${Math.floor(100 + Math.random() * 900)}`,    // john_doe_429
    `${clean}${Math.floor(10 + Math.random() * 90)}`,       // john_doe87
    `${clean.split('_')[0]}_${Math.floor(100 + Math.random() * 900)}` // john_512
  ];
};

export const UsernameInput: React.FC<UsernameInputProps> = ({ value, onChange }) => {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [hasTyped, setHasTyped] = useState(false); // Track if user manually interacted with THIS input
  const checkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Reset state if empty or too short
    if (!value || value.length < 3) {
      setIsAvailable(null);
      setSuggestions([]);
      return;
    }

    if (checkTimeout.current) clearTimeout(checkTimeout.current);

    setChecking(true);
    setIsAvailable(null);
    setSuggestions([]);

    checkTimeout.current = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('user_metadata')
          .select('username')
          .eq('username', value)
          .maybeSingle();
        
        if (data) {
           // Taken
           setIsAvailable(false);
           onChange(value, false);
           
           const alts = suggestAlternatives(value);

           if (!hasTyped) {
               // Auto-fix: Pick the first one and try it immediately
               // This triggers the useEffect again for the new value (recursive-like check)
               onChange(alts[0], false);
           } else {
               // Show suggestions if user manually typed it
               setSuggestions(alts);
           }
        } else {
           // Available
           setIsAvailable(true);
           onChange(value, true);
        }
      } catch (e) {
         // Fail open if DB is unreachable so we don't block signup
         setIsAvailable(true);
         onChange(value, true);
      } finally {
         setChecking(false);
      }
    }, 500);

    return () => {
        if (checkTimeout.current) clearTimeout(checkTimeout.current);
    };
  }, [value]); // Re-run when value changes (prop from parent)

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasTyped(true); // Mark as manually edited
      // Enforce lower case and allowed chars
      const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''); 
      onChange(val, false);
  };

  const applySuggestion = (suggestion: string) => {
      onChange(suggestion, false);
      setSuggestions([]);
  };

  return (
    <div className="space-y-1 animate-in slide-in-from-top-2">
      <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Username</label>
      <div className="relative group">
        <input 
          type="text" 
          value={value}
          onChange={handleManualChange}
          className={`w-full bg-white/5 border rounded-xl p-3.5 pl-10 text-white placeholder:text-gray-600 focus:outline-none transition-all ${
             isAvailable === true ? 'border-secondary/50 focus:border-secondary' :
             isAvailable === false ? 'border-status-red/50 focus:border-status-red' :
             'border-white/10 focus:border-primary/50'
          }`}
          placeholder="username"
          maxLength={30}
        />
        <span className="material-symbols-outlined absolute left-3 top-3.5 text-gray-500 text-lg group-focus-within:text-white transition-colors">alternate_email</span>
        
        <div className="absolute right-3 top-3.5 flex items-center gap-2">
            {checking ? (
                <span className="material-symbols-outlined animate-spin text-gray-500 text-sm">progress_activity</span>
            ) : isAvailable === true ? (
                <span className="material-symbols-outlined text-secondary text-sm">check_circle</span>
            ) : isAvailable === false ? (
                <span className="material-symbols-outlined text-status-red text-sm">cancel</span>
            ) : null}
        </div>
      </div>
      
      {/* Feedback UI */}
      {isAvailable === true && value.length > 0 && (
          <div className="flex items-center gap-1 ml-1 text-secondary animate-in slide-in-from-top-1">
             <span className="material-symbols-outlined text-[10px]">check_circle</span>
             <p className="text-[10px] font-bold">"{value}" is available!</p>
          </div>
      )}
      
      {isAvailable === false && (
          <div className="flex flex-col gap-2 ml-1 animate-in slide-in-from-top-1">
             <div className="flex items-center gap-1 text-status-red">
                <span className="material-symbols-outlined text-[10px]">cancel</span>
                <p className="text-[10px] font-bold">"{value}" is taken.</p>
             </div>
             {suggestions.length > 0 && (
                 <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-gray-500">Try:</span>
                    {suggestions.map((s, i) => (
                        <button 
                          key={s}
                          type="button"
                          onClick={() => applySuggestion(s)}
                          className="text-[10px] font-mono bg-white/10 px-2 py-1 rounded-lg hover:bg-primary/20 hover:text-primary transition-colors border border-white/5"
                        >
                           {s}
                        </button>
                    ))}
                 </div>
             )}
          </div>
      )}
    </div>
  );
};
