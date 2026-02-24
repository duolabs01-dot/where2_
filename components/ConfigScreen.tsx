import React, { useState } from 'react';
import { saveSupabaseConfig, enableDemoMode } from '../supabase';
import { PrimaryButton } from './Layouts';
import { NeonLogo } from './NeonLogo';

export const ConfigScreen: React.FC = () => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');

  const handleConnect = () => {
    if (url && key) {
      saveSupabaseConfig(url, key);
    }
  };

  return (
    <div className="h-full flex flex-col justify-center px-8 bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 text-center mb-12">
        <div className="flex items-center justify-center mb-4 gap-2">
            <h1 className="text-5xl font-display font-bold tracking-tighter text-white">Where</h1>
            <NeonLogo size="md" />
            <span className="text-5xl font-display font-bold text-white">?</span>
        </div>
        <p className="text-gray-400 text-sm font-medium tracking-wide">Connect to your data source to begin.</p>
      </div>

      <div className="relative z-10 space-y-6">
        <div className="space-y-2 text-left">
          <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 tracking-widest">Supabase Project URL</label>
          <input 
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://xyz.supabase.co" 
            className="liquid-glass w-full bg-white/5 border-white/10 rounded-2xl p-4 text-white focus:ring-primary focus:border-primary placeholder:text-gray-700 backdrop-blur-sm transition-all" 
          />
        </div>

        <div className="space-y-2 text-left">
          <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 tracking-widest">Anon Public Key</label>
          <input 
            type="password" 
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="eyJh..." 
            className="liquid-glass w-full bg-white/5 border-white/10 rounded-2xl p-4 text-white focus:ring-primary focus:border-primary placeholder:text-gray-700 backdrop-blur-sm transition-all" 
          />
        </div>
        
        <div className="pt-6">
          <PrimaryButton onClick={handleConnect} className="shadow-[0_0_30px_rgba(var(--color-primary),0.3)]">
            Connect Database
          </PrimaryButton>
        </div>
        
        <div className="text-center pt-4">
            <button 
              onClick={enableDemoMode}
              className="text-[10px] font-bold text-gray-600 hover:text-white uppercase tracking-[0.2em] transition-colors py-2 px-4 border-b border-transparent hover:border-white/20"
            >
              CONTINUE AS GUEST (DEMO MODE)
            </button>
        </div>
      </div>
    </div>
  );
};