
import { createClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'where2_sb_url';
const STORAGE_KEY_KEY = 'where2_sb_key';
const DEMO_MODE_KEY = 'where2_demo_mode';

// Default credentials provided by user
const DEFAULT_URL = 'https://oikkizufrrsizlhbhuze.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pa2tpenVmcnJzaXpsaGJodXplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg5MzcyNCwiZXhwIjoyMDg0NDY5NzI0fQ.2rrif6HJa_zuGkleCBAKAuS7PKQeHfEcO5v0k_AiIjY';

const isBrowser = typeof window !== 'undefined';

const getStoredValue = (key: string) => {
  if (!isBrowser) return null;
  return localStorage.getItem(key);
};

// Check LocalStorage first, then environment variables, then default fallback
const storedUrl = getStoredValue(STORAGE_KEY_URL);
const storedKey = getStoredValue(STORAGE_KEY_KEY);

// Support both NEXT_PUBLIC_ prefix and non-prefixed versions for Vercel compatibility
const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabaseUrl = storedUrl || envUrl || DEFAULT_URL;
const supabaseKey = storedKey || envKey || DEFAULT_KEY;

console.log('[Supabase] Init:', { 
  url: supabaseUrl, 
  keyLen: supabaseKey?.length,
  keySource: storedKey ? 'localStorage' : envKey ? 'env' : 'default',
  envUrl: !!envUrl,
  envKey: !!envKey,
  allEnv: Object.keys(process.env).filter(k => k.toLowerCase().includes('supabase'))
});

// Initialize with valid values
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-client-info': 'where2-app',
    },
  },
});

export const isSupabaseConfigured = () => {
  const isDemo = isBrowser && localStorage.getItem(DEMO_MODE_KEY) === 'true';
  return (
    isDemo ||
    (supabaseUrl && 
    supabaseKey && 
    supabaseUrl !== 'https://your-project.supabase.co' &&
    !supabaseUrl.includes('placeholder'))
  );
};

export const saveSupabaseConfig = (url: string, key: string) => {
  if (!url || !key) return;
  if (!isBrowser) return;
  localStorage.setItem(STORAGE_KEY_URL, url);
  localStorage.setItem(STORAGE_KEY_KEY, key);
  localStorage.removeItem(DEMO_MODE_KEY); // Disable demo if real config added
  window.location.reload();
};

export const enableDemoMode = () => {
  if (!isBrowser) return;
  localStorage.setItem(DEMO_MODE_KEY, 'true');
  window.location.reload();
};

export const resetSupabaseConfig = () => {
  if (!isBrowser) return;
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_KEY);
  localStorage.removeItem(DEMO_MODE_KEY);
  window.location.reload();
};
