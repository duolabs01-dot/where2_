
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../supabase';
import { GlassCard, PrimaryButton, GlassSheet } from './Layouts';
import { IOSGlassImage as IOSGlassImageFixed } from './IOSGlassImage';
import { Session } from '@supabase/supabase-js';
import { showToast } from '../utils/toast';
import { VibeQuickPickSheet } from './VibeQuickPickSheet';
import { useFilters } from '../lib/filtersStore';
import { useTheme, themeTokens } from './ThemeProvider';
import { getPrivacySettings, savePrivacySettings, PrivacySettings } from '../utils/security';
import { AnimatePresence, motion } from 'framer-motion';
import { getJoburgHour } from '../lib/timeFilter';
import { useHaptic } from '../utils/animations';
import { NeonLogo } from './NeonLogo';
import { TwoMark } from './brand/TwoMark'; // Import unified mark
import { FindFriendsSheet } from './FindFriendsSheet'; 
import { SavedPlacesSheet } from './SavedPlacesSheet'; 

interface ProfileProps {
  session: Session | null;
  onRequireAuth: () => void;
  onResetVibe: () => void;
  onOpenAdmin?: () => void;
}

// --- Icons ---
const VerifiedBadge = () => (
  <span className="material-symbols-outlined text-blue-400 text-[18px] filled-icon drop-shadow-sm" title="Verified User">verified</span>
);

// --- Futuristic Avatar Placeholder ---
const FuturisticAvatar: React.FC<{ size?: string }> = ({ size = "size-20" }) => (
  <div className={`relative ${size} rounded-full flex items-center justify-center bg-surface overflow-hidden border border-white/10 group shadow-[0_0_15px_rgba(159,80,255,0.2)]`}>
    {/* Animated Rings */}
    <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-[spin_4s_linear_infinite]" />
    <div className="absolute inset-2 border border-white/20 rounded-full animate-[spin_6s_linear_infinite_reverse]" />
    
    {/* Core Glow */}
    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 opacity-50 group-hover:opacity-80 transition-opacity" />
    
    {/* Icon */}
    <span className="material-symbols-outlined text-white/80 relative z-10 text-2xl group-hover:scale-110 transition-transform">
      face
    </span>
  </div>
);

// --- Edit Profile Modal ---
const EditProfileModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    profile: any; 
    onUpdate: () => void;
    highlightField?: string;
}> = ({ isOpen, onClose, profile, onUpdate, highlightField }) => {
    const { tokens } = useTheme();
    
    // Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dob, setDob] = useState('');
    const [city, setCity] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    
    // Status State
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Refs for auto-scrolling
    const fieldRefs = {
        firstName: useRef<HTMLInputElement>(null),
        lastName: useRef<HTMLInputElement>(null),
        dob: useRef<HTMLInputElement>(null),
        city: useRef<HTMLInputElement>(null),
    };

    // Sync state when profile loads
    useEffect(() => {
        if (profile) {
            setFirstName(profile.first_name || '');
            setLastName(profile.last_name || '');
            setDob(profile.dob || '');
            setCity(profile.city || ''); // Using 'city' column for Neighborhood/Suburb
            setAvatarUrl(profile.avatar_url || '');
        }
    }, [profile, isOpen]);

    // Check for changes (Dirty State)
    const isDirty = useMemo(() => {
        if (!profile) return false;
        return (
            firstName !== (profile.first_name || '') ||
            lastName !== (profile.last_name || '') ||
            dob !== (profile.dob || '') ||
            city !== (profile.city || '') ||
            avatarUrl !== (profile.avatar_url || '')
        );
    }, [firstName, lastName, dob, city, avatarUrl, profile]);

    // Auto-focus logic
    useEffect(() => {
        if (isOpen && highlightField && fieldRefs[highlightField as keyof typeof fieldRefs]?.current) {
            setTimeout(() => {
                fieldRefs[highlightField as keyof typeof fieldRefs].current?.focus();
                fieldRefs[highlightField as keyof typeof fieldRefs].current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    }, [isOpen, highlightField]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return;
            setUploading(true);
            
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${profile.id}/${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('where2-media')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('where2-media').getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl);
            showToast('Image uploaded', 'success');
        } catch (error: any) {
            showToast('Error uploading image', 'error');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!firstName.trim()) {
            showToast('First Name is required', 'error');
            return;
        }
        if (!lastName.trim()) {
            showToast('Last Name is required', 'error');
            return;
        }
        if (!city.trim()) {
            showToast('Neighbourhood is required', 'error');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ 
                    first_name: firstName.trim(), 
                    last_name: lastName.trim(),
                    full_name: `${firstName.trim()} ${lastName.trim()}`, 
                    dob: dob || null,
                    city: city.trim(), // Maps to neighborhood
                    avatar_url: avatarUrl || null
                })
                .eq('id', profile.id);
            
            if (error) throw error;
            showToast('Profile updated successfully', 'success');
            onUpdate();
            onClose();
        } catch (e: any) {
            showToast(e.message || 'Update failed', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 isolate">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                onClick={onClose} 
            />
            
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className={`relative w-full max-w-sm ${tokens.surface} border ${tokens.border} rounded-[32px] p-6 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar`}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-display font-bold text-white">Edit Profile</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-gray-400">close</span>
                    </button>
                </div>
                
                {/* Avatar Section */}
                <div className="flex justify-center mb-8">
                    <div className="relative group cursor-pointer">
                        <div className={`size-28 rounded-full overflow-hidden border-2 border-dashed ${uploading ? 'border-primary' : 'border-white/20'} bg-black/20 relative`}>
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover transition-opacity group-hover:opacity-50" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                    <span className="material-symbols-outlined text-3xl mb-1">add_a_photo</span>
                                    <span className="text-[9px] uppercase font-bold">Upload</span>
                                </div>
                            )}
                            
                            {/* Upload Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                <span className="material-symbols-outlined text-white text-2xl">edit</span>
                            </div>
                        </div>
                        
                        <label className="absolute inset-0 cursor-pointer">
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                        </label>

                        {uploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-full z-10">
                                <span className="material-symbols-outlined animate-spin text-primary text-2xl">progress_activity</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">First Name *</label>
                            <input 
                                ref={fieldRefs.firstName}
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className={`w-full ${tokens.surface2} border ${highlightField === 'firstName' ? 'border-primary shadow-[0_0_10px_rgba(159,80,255,0.3)]' : tokens.border} rounded-xl p-3.5 text-white text-sm focus:border-primary focus:outline-none transition-all placeholder:text-gray-600`}
                                placeholder="Mandla"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Surname *</label>
                            <input 
                                ref={fieldRefs.lastName}
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className={`w-full ${tokens.surface2} border ${highlightField === 'lastName' ? 'border-primary shadow-[0_0_10px_rgba(159,80,255,0.3)]' : tokens.border} rounded-xl p-3.5 text-white text-sm focus:border-primary focus:outline-none transition-all placeholder:text-gray-600`}
                                placeholder="Ngwenya"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Neighbourhood / Suburb *</label>
                        <input 
                            ref={fieldRefs.city}
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className={`w-full ${tokens.surface2} border ${highlightField === 'city' ? 'border-primary shadow-[0_0_10px_rgba(159,80,255,0.3)]' : tokens.border} rounded-xl p-3.5 text-white text-sm focus:border-primary focus:outline-none transition-all placeholder:text-gray-600`}
                            placeholder="e.g. Sandton"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Date of Birth</label>
                        <input 
                            ref={fieldRefs.dob}
                            type="date"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            className={`w-full ${tokens.surface2} border ${highlightField === 'dob' ? 'border-primary shadow-[0_0_10px_rgba(159,80,255,0.3)]' : tokens.border} rounded-xl p-3.5 text-white text-sm focus:border-primary focus:outline-none transition-all [color-scheme:dark]`}
                        />
                    </div>

                    <div className="space-y-1.5 opacity-60 pointer-events-none">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Username (Immutable)</label>
                        <div className={`w-full bg-black/40 border border-white/5 rounded-xl p-3.5 text-gray-400 italic text-sm flex items-center gap-2`}>
                            <span className="material-symbols-outlined text-sm">lock</span>
                            @{profile?.username || 'user'}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/5 text-gray-300 font-bold text-sm hover:bg-white/10 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <PrimaryButton 
                        onClick={handleSave} 
                        disabled={!isDirty || saving || uploading} 
                        className="flex-1 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        {saving ? (
                            <span className="flex items-center gap-2">
                                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                Saving...
                            </span>
                        ) : 'Save Changes'}
                    </PrimaryButton>
                </div>
            </motion.div>
        </div>
    );
};

// --- Settings Sheet (UNIFIED & UPGRADED) ---
const SettingsSheet: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onSignOut: () => void; 
    onGhost: () => void; 
    ghostMode: boolean 
}> = ({ isOpen, onClose, onSignOut, onGhost, ghostMode }) => {
    const { tokens } = useTheme(); 
    const [view, setView] = useState<'main' | 'delete'>('main');
    const [loading, setLoading] = useState(false);

    // Reset view on open
    useEffect(() => { if(isOpen) setView('main'); }, [isOpen]);

    const handleReport = () => {
        const email = "support@where2.app";
        const subject = encodeURIComponent("Issue Report - Where2");
        const body = encodeURIComponent("Please describe the issue you're experiencing:\n\n\n--\nDevice Info: " + navigator.userAgent);
        const mailto = `mailto:${email}?subject=${subject}&body=${body}`;
        
        window.location.href = mailto;
        
        // Fallback toast if mail app doesn't open
        setTimeout(() => {
            showToast('Opening mail app...', 'info');
        }, 500);
    };

    const handleDeleteAccount = async () => {
        setLoading(true);
        try {
            // 1. Try to delete public profile row directly
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('profiles').delete().eq('id', user.id);
            }

            // 2. Try Edge Function (Admin Delete - Backup)
            try {
                await supabase.functions.invoke('delete-account');
            } catch (err) {
                console.warn("Edge function delete attempt failed (expected in dev environment)", err);
            }

            // 3. Client Cleanup & Sign Out
            await supabase.auth.signOut();
            localStorage.clear();
            showToast('Account deleted', 'info');
            window.location.reload();
        } catch (e: any) {
            console.error(e);
            // Even if backend deletion fails, we clear the client to respect the user's intent locally
            await supabase.auth.signOut();
            localStorage.clear();
            window.location.reload();
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <GlassSheet className={`fixed bottom-0 z-[1200] w-full max-h-[85vh] flex flex-col !p-0 ${tokens.surface} border-t ${tokens.border}`}>
            {/* Header */}
            <div className={`p-6 border-b ${tokens.border} flex justify-between items-center bg-black/10 backdrop-blur-md`}>
                <div className="flex items-center gap-3">
                    {view !== 'main' && (
                        <button onClick={() => setView('main')} className="p-1 -ml-2 rounded-full hover:bg-white/10 text-white transition-colors">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                    )}
                    <h3 className="font-display font-bold text-xl text-white">
                        {view === 'main' ? 'Settings' : 'Delete Account'}
                    </h3>
                </div>
                <button onClick={onClose} className="bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined text-white text-lg">close</span>
                </button>
            </div>

            <div className="p-6 overflow-y-auto no-scrollbar pb-safe">
                <AnimatePresence mode="wait">
                    {view === 'main' && (
                        <motion.div 
                            key="main"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {/* Privacy Section */}
                            <section>
                                <h4 className={`text-xs font-bold ${tokens.mutedText} uppercase tracking-widest mb-3 ml-1`}>Privacy & Safety</h4>
                                <div className={`${tokens.surface2} rounded-2xl border ${tokens.border} overflow-hidden`}>
                                    <div className="flex items-center justify-between p-4 border-b border-white/5 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                                                <span className="material-symbols-outlined text-lg">visibility_off</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">Ghost Mode</p>
                                                <p className={`text-[10px] ${tokens.mutedText}`}>Hide your precise location</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={onGhost}
                                            className={`w-12 h-6 rounded-full relative transition-colors ${ghostMode ? 'bg-purple-500' : 'bg-white/10'}`}
                                        >
                                            <div className={`absolute top-1 bottom-1 size-4 bg-white rounded-full transition-all shadow-sm ${ghostMode ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* Support Section */}
                            <section>
                                <h4 className={`text-xs font-bold ${tokens.mutedText} uppercase tracking-widest mb-3 ml-1`}>Support</h4>
                                <div className={`${tokens.surface2} rounded-2xl border ${tokens.border} overflow-hidden`}>
                                    <button onClick={handleReport} className="w-full flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                <span className="material-symbols-outlined text-lg">mail</span>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-white">Contact Support</p>
                                                <p className={`text-[10px] ${tokens.mutedText}`}>Report a bug or suggest features</p>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-gray-500 text-sm">open_in_new</span>
                                    </button>
                                    
                                    <a href="#" className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-white/10 flex items-center justify-center text-gray-300">
                                                <span className="material-symbols-outlined text-lg">policy</span>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-white">Privacy Policy</p>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-gray-500 text-sm">chevron_right</span>
                                    </a>
                                </div>
                            </section>

                            {/* Account Actions */}
                            <section className="pt-2">
                                <button 
                                    onClick={onSignOut}
                                    className={`w-full p-4 rounded-xl border ${tokens.border} bg-white/5 text-white font-bold text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2 mb-3`}
                                >
                                    <span className="material-symbols-outlined text-lg">logout</span>
                                    Sign Out
                                </button>
                                
                                <button 
                                    onClick={() => setView('delete')}
                                    className={`w-full py-2 text-xs font-bold ${tokens.dangerRed} hover:text-red-300 transition-colors opacity-80 hover:opacity-100`}
                                >
                                    Delete Account
                                </button>
                            </section>
                            
                            <p className={`text-center text-[10px] ${tokens.mutedText} font-mono pt-2`}>
                                Version 2.6.0 (Build 422)
                            </p>
                        </motion.div>
                    )}

                    {view === 'delete' && (
                        <motion.div 
                            key="delete"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-6 text-center pt-4"
                        >
                            <div className="size-24 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-2 animate-pulse">
                                <span className="material-symbols-outlined text-5xl text-red-500">warning</span>
                            </div>
                            
                            <div className="space-y-2">
                                <h4 className="text-2xl font-bold text-white">Are you absolutely sure?</h4>
                                <p className={`text-sm ${tokens.mutedText} leading-relaxed max-w-[280px] mx-auto`}>
                                    This action is <span className="text-red-400 font-bold">permanent</span>. You will immediately lose all saved places, plans, and profile data. There is no undo.
                                </p>
                            </div>

                            <div className="space-y-3 pt-4">
                                <button 
                                    onClick={handleDeleteAccount}
                                    disabled={loading}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-red-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                            Deleting...
                                        </>
                                    ) : (
                                        'Yes, Delete My Account'
                                    )}
                                </button>
                                <button 
                                    onClick={() => setView('main')}
                                    className={`w-full py-3 text-sm font-bold ${tokens.mutedText} hover:text-white transition-colors`}
                                >
                                    Cancel, keep my account
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </GlassSheet>
    );
};

export const Profile: React.FC<ProfileProps> = ({ session, onRequireAuth, onResetVibe, onOpenAdmin }) => {
  const [profile, setProfile] = useState<any | null>(null);
  const [showVibeSheet, setShowVibeSheet] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showFindFriends, setShowFindFriends] = useState(false);
  const [showSavedPlaces, setShowSavedPlaces] = useState(false); 
  const [editProfileHighlight, setEditProfileHighlight] = useState<string | undefined>(undefined);
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings State - from context now
  const { theme, setTheme } = useTheme();
  const [privacy, setPrivacy] = useState<PrivacySettings>(getPrivacySettings());
  const { state: filterState, resetFilters } = useFilters();
  const { trigger } = useHaptic();

  // Smart Greeting
  const hour = getJoburgHour();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    if (session?.user) {
      fetchProfile(session.user.id);
    } else {
      setProfile(null);
    }
    setPrivacy(getPrivacySettings());
  }, [session]);

  const fetchProfile = async (userId: string) => {
      try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (data) setProfile(data);
      } catch (e) {}
  };

  const handleSignOut = async () => {
    trigger();
    await supabase.auth.signOut();
    resetFilters(); 
    showToast('Signed out successfully', 'success');
  };

  // --- Actions ---
  const toggleTheme = (mode: 'default' | 'matrix' | 'neo') => {
      trigger();
      setTheme(mode);
  };

  const toggleGhostMode = () => {
      trigger();
      const newState = !privacy.ghostMode;
      const newSettings = { ...privacy, ghostMode: newState };
      setPrivacy(newSettings);
      savePrivacySettings(newSettings);
      showToast(newState ? 'Ghost Mode Enabled 👻' : 'Ghost Mode Disabled', 'info');
  };

  const handleInvite = () => {
      trigger();
      if (navigator.share) {
          navigator.share({
              title: 'Where2',
              text: 'Check out Where2 - the live neighborhood feed.',
              url: window.location.origin
          });
      } else {
          navigator.clipboard.writeText(window.location.origin);
          showToast('Invite link copied!', 'success');
      }
  };

  const handleFindFriends = () => {
      trigger();
      setShowFindFriends(true); 
  };

  // Calculate missing fields
  const missingFields = React.useMemo(() => {
      if (!profile) return [];
      const missing = [];
      if (!profile.first_name) missing.push({ label: 'First Name', field: 'firstName' });
      if (!profile.last_name) missing.push({ label: 'Surname', field: 'lastName' });
      if (!profile.city) missing.push({ label: 'Neighbourhood', field: 'city' });
      return missing;
  }, [profile]);

  const handleCompleteProfile = () => {
      if (missingFields.length > 0) {
          setEditProfileHighlight(missingFields[0].field);
          setShowEditProfile(true);
      }
  };

  // --- Render ---

  if (!session) {
      // --- GUEST VIEW (Enhanced) ---
      return (
        <div className="h-full flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1/4 left-1/4 size-64 bg-primary/10 rounded-full blur-[80px]" />
                <div className="absolute bottom-1/4 right-1/4 size-64 bg-secondary/10 rounded-full blur-[80px]" />
            </div>

            <GlassCard className="relative z-10 w-full max-w-sm p-8 text-center border-white/10 bg-surface/40 backdrop-blur-xl">
                <div className="size-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 mx-auto shadow-neon">
                    <span className="material-symbols-outlined text-3xl text-gray-300">person_off</span>
                </div>
                
                <h1 className="text-2xl font-display font-bold text-white mb-2">Guest Mode</h1>
                <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                    Sign in to customize your profile, save spots, and unlock the full neighborhood experience.
                </p>
                
                <PrimaryButton onClick={onRequireAuth} className="w-full mb-6 shadow-lg">
                    Sign In / Sign Up
                </PrimaryButton>
                
                {/* Theme Switcher (Guest Access) */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-black/20 rounded-xl border border-white/5">
                    <button onClick={() => toggleTheme('default')} className={`py-2 rounded-lg text-[10px] font-bold transition-all ${theme === 'default' ? 'bg-white/10 text-white' : 'text-gray-500'}`}>iOS</button>
                    <button onClick={() => toggleTheme('matrix')} className={`py-2 rounded-lg text-[10px] font-bold transition-all ${theme === 'matrix' ? 'bg-green-500/20 text-green-400' : 'text-gray-500'}`}>Matrix</button>
                    <button onClick={() => toggleTheme('neo')} className={`py-2 rounded-lg text-[10px] font-bold transition-all ${theme === 'neo' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500'}`}>Neo</button>
                </div>

                {/* Ghost Mode Toggle (Guest) */}
                <div className="flex items-center justify-between mt-6 px-2">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Ghost Mode</span>
                    <button onClick={toggleGhostMode} className={`w-10 h-5 rounded-full relative transition-colors ${privacy.ghostMode ? 'bg-purple-500' : 'bg-white/10'}`}>
                        <div className={`absolute top-1 bottom-1 w-3 bg-white rounded-full transition-all ${privacy.ghostMode ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>
            </GlassCard>
            
            {/* Disabled Quick Actions (Teaser) */}
            <div className="flex gap-4 mt-8 opacity-50 grayscale pointer-events-none">
                {['bookmark', 'calendar_today', 'ios_share', 'settings'].map(icon => (
                    <div key={icon} className="size-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center">
                        <span className="material-symbols-outlined text-lg text-white">{icon}</span>
                    </div>
                ))}
            </div>
        </div>
      );
  }

  // --- LOGGED IN VIEW ---
  // Determine display name: First Name > Full Name > Username > "Explorer"
  const displayName = profile?.first_name || profile?.full_name?.split(' ')[0] || profile?.username || 'Explorer';
  
  // Use DB counts or Mock if 0 (as requested for Founder)
  const followers = profile?.follower_count || (profile?.is_founder ? 1000 : 0);
  const following = profile?.following_count || (profile?.is_founder ? 124 : 0);

  return (
    <div className="h-full px-5 pt-safe pb-nav-safe overflow-y-auto no-scrollbar bg-background">
       
       {/* 1. Header Card */}
       <div className="mt-6 mb-6 relative space-y-4">
           
           {/* Profile Card */}
           <GlassCard className="p-5 flex items-center gap-5 border-white/10 bg-surface/60 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
               {profile?.avatar_url ? (
                   <div className="size-20 rounded-full border border-white/10 overflow-hidden shadow-lg shrink-0">
                       <IOSGlassImageFixed src={profile.avatar_url} alt={displayName} className="size-full" />
                   </div>
               ) : (
                   <FuturisticAvatar size="size-20" />
               )}
               
               <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-1">
                       <h1 className="text-xl font-display font-bold text-white truncate">
                           {greeting}, {displayName}
                       </h1>
                       
                       {/* Identity Badges (Inline) - Tighter Spacing & Optical Sizing */}
                       <div className="flex items-center gap-1 shrink-0 ml-1">
                           {profile?.is_verified && <VerifiedBadge />}
                           {profile?.is_founder && <TwoMark size={20} />}
                       </div>
                   </div>
                   
                   <p className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
                       {profile?.username ? `@${profile.username}` : 'No username set'}
                   </p>

                   <button 
                        onClick={() => { setEditProfileHighlight(undefined); setShowEditProfile(true); }}
                        className="text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full transition-colors border border-white/5"
                   >
                       Edit Profile
                   </button>
               </div>
           </GlassCard>

           {/* Complete Profile Nudge (Conditional) */}
           {missingFields.length > 0 && (
               <motion.button
                  onClick={handleCompleteProfile}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full bg-secondary/10 border border-secondary/30 p-4 rounded-2xl flex flex-col gap-3 text-left hover:bg-secondary/20 transition-all group"
               >
                   <div className="flex items-center justify-between w-full">
                       <div className="flex items-center gap-2">
                           <div className="size-6 rounded-full bg-secondary/20 flex items-center justify-center text-secondary shrink-0">
                               <span className="material-symbols-outlined text-[14px]">edit_note</span>
                           </div>
                           <span className="text-sm font-bold text-white">Complete your profile</span>
                       </div>
                       <span className="material-symbols-outlined text-gray-500 text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                   </div>
                   
                   {/* Checklist */}
                   <div className="flex flex-wrap gap-2">
                       {missingFields.map((item, i) => (
                           <span key={i} className="flex items-center gap-1 text-[10px] text-gray-400 bg-black/20 px-2 py-1 rounded-md border border-white/5">
                               <span className="size-1.5 rounded-full border border-gray-500"></span>
                               {item.label}
                           </span>
                       ))}
                   </div>
               </motion.button>
           )}
       </div>

       {/* 2. Stats & Find Friends */}
       <div className="grid grid-cols-2 gap-3 mb-6">
           <GlassCard className="p-4 flex flex-col items-center justify-center bg-white/[0.02]">
               <div className="flex items-center gap-4 mb-2">
                   <div className="text-center">
                       <span className="block text-lg font-bold text-white">{followers}</span>
                       <span className="text-[9px] text-gray-500 uppercase tracking-wider">Followers</span>
                   </div>
                   <div className="w-px h-6 bg-white/10" />
                   <div className="text-center">
                       <span className="block text-lg font-bold text-white">{following}</span>
                       <span className="text-[9px] text-gray-500 uppercase tracking-wider">Following</span>
                   </div>
               </div>
           </GlassCard>
           
           <button onClick={handleFindFriends} className="flex flex-col items-center justify-center bg-primary/10 border border-primary/20 rounded-2xl hover:bg-primary/20 transition-colors group">
               <span className="material-symbols-outlined text-primary text-2xl mb-1 group-hover:scale-110 transition-transform">group_add</span>
               <span className="text-[10px] font-bold text-white uppercase tracking-wider">Find Friends</span>
           </button>
       </div>

       {/* 3. Quick Actions */}
       <div className="grid grid-cols-4 gap-3 mb-8">
           {[
               { icon: 'bookmark', label: 'Saved', action: () => setShowSavedPlaces(true) },
               { icon: 'ios_share', label: 'Invite', action: handleInvite },
               { icon: 'tune', label: 'Vibe', action: () => setShowVibeSheet(true) },
               { icon: 'settings', label: 'Settings', action: () => setShowSettings(true) },
           ].map((item, i) => (
               <motion.button 
                 key={i} 
                 whileTap={{ scale: 0.95 }}
                 onClick={() => { trigger(); item.action(); }}
                 className="flex flex-col items-center gap-2 group"
               >
                   <div className="size-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all shadow-sm">
                       <span className="material-symbols-outlined text-gray-300 group-hover:text-white transition-colors">{item.icon}</span>
                   </div>
                   <span className="text-[10px] font-bold text-gray-500 group-hover:text-gray-300 transition-colors">{item.label}</span>
               </motion.button>
           ))}
       </div>

       {/* 4. Modes & Themes */}
       <div className="space-y-4 mb-8">
           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Personalize</h3>
           
           {/* Vibe Customization (New) */}
           <button 
               onClick={() => { trigger(); setShowVibeSheet(true); }}
               className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between group hover:bg-white/10 transition-colors"
           >
               <div className="flex items-center gap-3">
                   <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                       <span className="material-symbols-outlined">tune</span>
                   </div>
                   <div className="text-left">
                       <p className="text-sm font-bold text-white">Customise Vibe</p>
                       <p className="text-[10px] text-gray-400">Set your mood and interests</p>
                   </div>
               </div>
               <span className="material-symbols-outlined text-gray-500 text-sm">chevron_right</span>
           </button>

           {/* Theme Picker (Full Width) */}
           <GlassCard className="p-4 bg-white/[0.02] border-white/5 flex items-center justify-between gap-4">
               <div className="flex items-center gap-2 shrink-0">
                   <span className="material-symbols-outlined text-green-400">palette</span>
                   <span className="text-xs font-bold text-white">Theme</span>
               </div>
               <div className="flex bg-black/40 p-1 rounded-lg border border-white/10 flex-1 max-w-[200px]">
                   {['default', 'matrix', 'neo'].map((t) => (
                       <button
                           key={t}
                           onClick={() => toggleTheme(t as any)}
                           className={`flex-1 h-8 rounded-md transition-all flex items-center justify-center ${theme === t ? 'bg-white/20 shadow-sm' : ''}`}
                       >
                           <div className={`w-3 h-3 rounded-full ${t === 'default' ? 'bg-purple-500' : t === 'matrix' ? 'bg-green-500' : 'bg-cyan-500'}`} />
                       </button>
                   ))}
               </div>
           </GlassCard>
       </div>

       {/* 5. Admin Entry */}
       {profile?.is_admin && (
            <button 
                onClick={() => { trigger(); onOpenAdmin?.(); }}
                className="w-full py-4 rounded-2xl border border-primary/20 bg-primary/5 text-primary font-bold text-sm hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 mb-4"
            >
                <span className="material-symbols-outlined">admin_panel_settings</span>
                Admin Console
            </button>
       )}
       
       <p className="text-center text-[9px] text-gray-700 mt-2 font-mono pb-8">
           v2.6.0 • Where2 JHB
       </p>

       {/* Modals */}
       <AnimatePresence>
           {showVibeSheet && (
               <VibeQuickPickSheet 
                 onApply={(intent) => {
                     setShowVibeSheet(false);
                     showToast('Vibe updated successfully', 'success');
                 }} 
                 onClose={() => setShowVibeSheet(false)} 
               />
           )}
       </AnimatePresence>

       <AnimatePresence>
           {showFindFriends && session && (
               <FindFriendsSheet 
                   session={session} 
                   isOpen={showFindFriends} 
                   onClose={() => setShowFindFriends(false)}
                   onFollowChange={() => {
                       if(session.user) fetchProfile(session.user.id);
                   }}
               />
           )}
       </AnimatePresence>

       <AnimatePresence>
           {showSavedPlaces && (
               <SavedPlacesSheet 
                   isOpen={showSavedPlaces}
                   onClose={() => setShowSavedPlaces(false)}
                   onNavigateTo={() => {
                       setShowSavedPlaces(false);
                       showToast('Tap "Map" to navigate', 'info');
                   }}
               />
           )}
       </AnimatePresence>

       <EditProfileModal 
          isOpen={showEditProfile} 
          onClose={() => setShowEditProfile(false)} 
          profile={profile}
          onUpdate={() => fetchProfile(session.user.id)}
          highlightField={editProfileHighlight}
       />

       <SettingsSheet 
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSignOut={handleSignOut}
          onGhost={toggleGhostMode}
          ghostMode={privacy.ghostMode}
       />
    </div>
  );
};
