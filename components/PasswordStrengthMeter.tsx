
import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const [strength, setStrength] = useState(0);

  useEffect(() => {
    let score = 0;
    if (password.length > 0) {
      if (password.length >= 8) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[a-z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;
    }
    setStrength(score);
  }, [password]);

  const getColor = (index: number) => {
    if (strength <= 2) return index <= strength ? 'bg-status-red shadow-[0_0_8px_rgba(255,68,68,0.4)]' : 'bg-white/5';
    if (strength <= 3) return index <= strength ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]' : 'bg-white/5';
    return index <= strength ? 'bg-secondary shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-white/5';
  };

  const getLabel = () => {
    if (strength === 0) return '';
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Medium';
    return 'Strong';
  };

  return (
    <div className="space-y-2 mt-2 transition-all duration-300">
      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
        <span>Password Strength</span>
        <span className={`transition-colors duration-300 ${
            strength <= 2 ? 'text-status-red' : 
            strength <= 3 ? 'text-yellow-400' : 
            'text-secondary'
        }`}>
          {getLabel()}
        </span>
      </div>
      
      <div className="flex gap-1 h-1.5 w-full">
        {[1, 2, 3, 4, 5].map((step) => (
          <div 
            key={step}
            className={`h-full rounded-full flex-1 transition-all duration-500 ${getColor(step)}`}
          />
        ))}
      </div>

      <AnimatePresence>
        {strength < 5 && password.length > 0 && (
           <ul className="text-[10px] text-gray-500 space-y-1 pt-1 grid grid-cols-2 gap-x-2">
              {!/[A-Z]/.test(password) && <li className="flex items-center gap-1"><span className="text-status-red text-[8px]">●</span> Uppercase</li>}
              {!/[a-z]/.test(password) && <li className="flex items-center gap-1"><span className="text-status-red text-[8px]">●</span> Lowercase</li>}
              {!/[0-9]/.test(password) && <li className="flex items-center gap-1"><span className="text-status-red text-[8px]">●</span> Number</li>}
              {password.length < 8 && <li className="flex items-center gap-1"><span className="text-status-red text-[8px]">●</span> 8+ Chars</li>}
              {!/[^A-Za-z0-9]/.test(password) && <li className="flex items-center gap-1"><span className="text-status-red text-[8px]">●</span> Symbol</li>}
           </ul>
        )}
      </AnimatePresence>
    </div>
  );
};
