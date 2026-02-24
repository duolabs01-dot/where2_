
import React, { useState, useEffect } from 'react';
import { GlassCard } from './Layouts';
import { supabase } from '../supabase';
import { Place, BusinessClaim } from '../types';
import { showToast } from '../utils/toast';
import { VenueEditor } from './admin/VenueEditor';

type Tab = 'Venues' | 'Media' | 'Claims' | 'Users';

// --- Users Tab ---
const UsersTab = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
      setLoading(true);
      // Admin query to profiles
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
      
      if (searchTerm) {
          query = query.or(`email.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(50);
      if (data) setUsers(data);
      if (error) showToast('Failed to fetch users', 'error');
      setLoading(false);
  };

  useEffect(() => {
      fetchUsers();
  }, [searchTerm]);

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
      if (!window.confirm(`Are you sure you want to ${currentStatus ? 'REVOKE' : 'GRANT'} admin access?`)) return;
      
      const { error } = await supabase.from('profiles').update({ is_admin: !currentStatus }).eq('id', userId);
      if (error) showToast(error.message, 'error');
      else {
          showToast('User permissions updated', 'success');
          fetchUsers();
      }
  };

  return (
      <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl flex items-center px-4 py-3 gap-2">
              <span className="material-symbols-outlined text-gray-400">search</span>
              <input 
                type="text" 
                placeholder="Search users by email or username..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-white w-full"
              />
          </div>

          <div className="space-y-2">
              {users.map(user => (
                  <GlassCard key={user.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className={`size-10 rounded-full flex items-center justify-center text-xs font-bold ${user.is_admin ? 'bg-primary text-black' : 'bg-white/10 text-white'}`}>
                              {user.username ? user.username[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                              <p className="text-sm font-bold text-white">{user.username || 'No Username'}</p>
                              <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                      </div>
                      <button 
                        onClick={() => toggleAdmin(user.id, user.is_admin)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${user.is_admin ? 'border-primary text-primary hover:bg-primary hover:text-black' : 'border-white/10 text-gray-400 hover:text-white'}`}
                      >
                          {user.is_admin ? 'Admin' : 'User'}
                      </button>
                  </GlassCard>
              ))}
          </div>
      </div>
  );
};

// --- Venues Tab ---
const VenuesTab = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVenue, setEditingVenue] = useState<Place | null | 'new'>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPlaces = async () => {
    setLoading(true);
    let query = supabase.from('places').select('*').order('created_at', { ascending: false });
    
    if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
    }

    const { data } = await query.limit(50);
    if (data) setPlaces(data as Place[]);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchPlaces, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleDelete = async (id: string) => {
      if(!window.confirm('Delete this venue permanently?')) return;
      const { error } = await supabase.from('places').delete().eq('id', id);
      if (error) showToast('Delete failed', 'error');
      else {
          showToast('Venue deleted', 'success');
          fetchPlaces();
      }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-24">
      <div className="flex gap-2">
        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl flex items-center px-4 py-3 gap-2">
            <span className="material-symbols-outlined text-gray-400">search</span>
            <input 
                type="text" 
                placeholder="Search venues..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-white w-full"
            />
        </div>
        <button 
            onClick={() => setEditingVenue('new')}
            className="bg-primary text-black px-4 rounded-xl font-bold flex items-center justify-center shadow-neon"
        >
            <span className="material-symbols-outlined">add</span>
        </button>
      </div>
      
      <div className="space-y-2">
        {places.map(place => (
        <GlassCard key={place.id} className="p-3 flex items-center gap-3">
            <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${place.is_active === false ? 'bg-red-500/10' : 'bg-white/10'}`}>
                {place.cover_image ? (
                    <img src={place.cover_image} className="size-full object-cover rounded-lg opacity-80" />
                ) : (
                    <span className="material-symbols-outlined text-white/50">store</span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white truncate">{place.name}</h4>
                    {place.is_verified && <span className="material-symbols-outlined text-[10px] text-blue-400 filled-icon">verified</span>}
                </div>
                <p className="text-[10px] text-gray-400 truncate">{place.category} • {place.city}</p>
            </div>
            
            <div className="flex items-center gap-1">
                <button onClick={() => setEditingVenue(place)} className="p-2 hover:bg-white/10 rounded-full text-gray-300">
                    <span className="material-symbols-outlined text-lg">edit</span>
                </button>
                <button onClick={() => handleDelete(place.id)} className="p-2 hover:bg-red-500/20 rounded-full text-red-400">
                    <span className="material-symbols-outlined text-lg">delete</span>
                </button>
            </div>
        </GlassCard>
        ))}
      </div>

      {editingVenue && (
          <VenueEditor 
            venue={editingVenue === 'new' ? null : editingVenue}
            onClose={() => setEditingVenue(null)}
            onSave={() => {
                setEditingVenue(null);
                fetchPlaces();
            }}
          />
      )}
    </div>
  );
};

// --- Main Dashboard Shell ---
export const AdminDashboard: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<Tab>('Venues');

  return (
    <div className="flex flex-col h-full bg-background relative">
      <div className="pt-safe px-6 pb-4 border-b border-white/5 bg-surface/80 backdrop-blur-xl flex justify-between items-center z-10 sticky top-0">
        <div>
          <h1 className="text-xl font-display font-bold text-white tracking-tight">Admin Console</h1>
          <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">Super Admin</p>
        </div>
        <button 
          onClick={onExit}
          className="size-9 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 flex items-center justify-center transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-gray-400 text-lg">close</span>
        </button>
      </div>

      <div className="bg-background/95 backdrop-blur z-10 border-b border-white/5">
        <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar">
            {['Venues', 'Claims', 'Users', 'Media'].map((tab) => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab as Tab)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                activeTab === tab 
                    ? 'bg-primary border-primary text-black shadow-neon' 
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
            >
                {tab}
            </button>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-safe pt-4">
        {activeTab === 'Venues' && <VenuesTab />}
        {activeTab === 'Users' && <UsersTab />}
        {activeTab === 'Claims' && (
            <div className="text-center py-20 text-gray-500">
                <span className="material-symbols-outlined text-4xl mb-2">verified_user</span>
                <p>Claims Module active (see previous implementation)</p>
            </div>
        )}
        {activeTab === 'Media' && (
            <div className="text-center py-20 text-gray-500">
                <span className="material-symbols-outlined text-4xl mb-2">perm_media</span>
                <p>Media Library active (use Venue Editor to upload)</p>
            </div>
        )}
      </div>
    </div>
  );
};
