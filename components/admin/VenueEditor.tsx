
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Place, PlaceMedia } from '../../types';
import { supabase } from '../../supabase';
import { PrimaryButton } from '../Layouts';
import { showToast } from '../../utils/toast';
import { useTheme } from '../ThemeProvider';

interface VenueEditorProps {
  venue?: Place | null;
  onClose: () => void;
  onSave: () => void;
}

// JHB Zones for auto-detection
const JHB_ZONES = [
  { name: 'Sandton', minLat: -26.125, maxLat: -26.085, minLng: 28.030, maxLng: 28.085 },
  { name: 'Rosebank', minLat: -26.160, maxLat: -26.130, minLng: 28.025, maxLng: 28.055 },
  { name: 'Melville', minLat: -26.185, maxLat: -26.165, minLng: 27.995, maxLng: 28.020 },
  { name: 'Braamfontein', minLat: -26.198, maxLat: -26.185, minLng: 28.025, maxLng: 28.045 },
  { name: 'Maboneng', minLat: -26.208, maxLat: -26.200, minLng: 28.052, maxLng: 28.065 },
  { name: 'Fourways', minLat: -26.040, maxLat: -26.000, minLng: 27.990, maxLng: 28.035 },
  { name: 'Greenside', minLat: -26.155, maxLat: -26.140, minLng: 28.005, maxLng: 28.025 },
  { name: 'Parkhurst', minLat: -26.145, maxLat: -26.130, minLng: 28.010, maxLng: 28.030 },
  { name: 'Illovo', minLat: -26.135, maxLat: -26.120, minLng: 28.040, maxLng: 28.060 },
  { name: 'Soweto', minLat: -26.350, maxLat: -26.200, minLng: 27.750, maxLng: 27.950 },
  { name: 'Bryanston', minLat: -26.080, maxLat: -26.040, minLng: 27.990, maxLng: 28.050 }
];

const getArea = (lat: number, lng: number) => {
  for (const zone of JHB_ZONES) {
    if (lat >= zone.minLat && lat <= zone.maxLat && lng >= zone.minLng && lng <= zone.maxLng) {
      return zone.name;
    }
  }
  return 'Johannesburg';
};

const CATEGORIES = ['Nightlife', 'Dining', 'Cafe', 'Outdoors', 'Art', 'Music', 'Shopping', 'Wellness'];

export const VenueEditor: React.FC<VenueEditorProps> = ({ venue, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'media'>('details');
  const [mediaItems, setMediaItems] = useState<PlaceMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const { tokens } = useTheme();

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<Partial<Place>>({
    defaultValues: venue || {
      name: '',
      category: 'Dining',
      city: 'Johannesburg',
      status: 'OPEN',
      price_level: 2,
      is_active: true,
      is_verified: false,
      latitude: -26.1,
      longitude: 28.05
    }
  });

  useEffect(() => {
    if (activeTab === 'media' && venue?.id) {
        fetchMedia();
    }
  }, [activeTab, venue]);

  const fetchMedia = async () => {
      const { data } = await supabase
        .from('place_media')
        .select('*')
        .eq('place_id', venue!.id)
        .order('created_at', { ascending: false });
      if (data) setMediaItems(data as PlaceMedia[]);
  };

  // Auto-derive neighborhood
  const lat = watch('latitude');
  const lng = watch('longitude');

  useEffect(() => {
    if (lat && lng) {
        const detected = getArea(Number(lat), Number(lng));
        setValue('city', detected);
    }
  }, [lat, lng, setValue]);

  const onSubmit = async (data: Partial<Place>) => {
    try {
      const payload = {
        ...data,
        updated_at: new Date().toISOString(),
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
      };

      if (venue?.id) {
        const { error } = await supabase.from('places').update(payload).eq('id', venue.id);
        if (error) throw error;
        showToast('Venue updated', 'success');
      } else {
        const { error } = await supabase.from('places').insert([payload]);
        if (error) throw error;
        showToast('Venue created', 'success');
      }
      onSave();
    } catch (e: any) {
      console.error(e);
      showToast(e.message || 'Failed to save', 'error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!venue?.id) return;
    if (!e.target.files || !e.target.files.length) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${venue.id}/${Date.now()}.${fileExt}`;
    const type = file.type.startsWith('video') ? 'video' : 'image';

    setUploading(true);
    try {
        const { error: uploadError } = await supabase.storage
            .from('where2-media')
            .upload(fileName, file);
        
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('where2-media')
            .getPublicUrl(fileName);

        const { error: dbError } = await supabase
            .from('place_media')
            .insert({
                place_id: venue.id,
                url: publicUrl,
                type: type,
                is_cover: false
            });
        
        if (dbError) throw dbError;
        
        showToast('Media uploaded', 'success');
        fetchMedia();
    } catch (e: any) {
        console.error(e);
        showToast(e.message || 'Upload failed', 'error');
    } finally {
        setUploading(false);
    }
  };

  const handleSetCover = async (media: PlaceMedia) => {
      // 1. Update places table (Source of Truth)
      await supabase.from('places').update({ cover_image: media.url }).eq('id', venue!.id);
      
      // 2. Update media flags (Optional metadata)
      await supabase.from('place_media').update({ is_cover: false }).eq('place_id', venue!.id);
      await supabase.from('place_media').update({ is_cover: true }).eq('id', media.id);
      
      showToast('Cover updated', 'success');
      fetchMedia();
  };

  const handleDeleteMedia = async (media: PlaceMedia) => {
      if(!window.confirm("Delete this media?")) return;
      
      await supabase.from('place_media').delete().eq('id', media.id);
      
      // Cleanup storage (Best effort)
      const path = media.url.split('/').slice(-2).join('/'); // venueId/filename
      await supabase.storage.from('where2-media').remove([path]);
      
      showToast('Media deleted', 'success');
      fetchMedia();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-lg ${tokens.surface} border ${tokens.border} rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col`}>
        
        <div className={`p-6 pb-2 border-b ${tokens.border} flex justify-between items-center sticky top-0 ${tokens.surface} z-10`}>
          <div>
             <h3 className="text-lg font-bold text-white">{venue ? 'Edit Venue' : 'New Venue'}</h3>
             <div className="flex gap-4 mt-2">
                <button 
                    onClick={() => setActiveTab('details')}
                    className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition-colors ${activeTab === 'details' ? `${tokens.accentPurple} border-primary` : 'text-gray-500 border-transparent hover:text-white'}`}
                >
                    Details
                </button>
                <button 
                    onClick={() => setActiveTab('media')}
                    disabled={!venue?.id}
                    className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition-colors ${activeTab === 'media' ? `${tokens.accentPurple} border-primary` : 'text-gray-500 border-transparent hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'}`}
                >
                    Media
                </button>
             </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white mb-auto">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {activeTab === 'details' ? (
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            
            {/* Name */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Venue Name</label>
                <input 
                {...register('name', { required: 'Name is required' })}
                className={`w-full ${tokens.surface2} border ${tokens.border} rounded-xl p-3 text-white focus:border-primary`}
                placeholder="e.g. The Golden Cup"
                />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>

            {/* Category & Price */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                    <select 
                        {...register('category')}
                        className={`w-full ${tokens.surface2} border ${tokens.border} rounded-xl p-3 text-white focus:border-primary`}
                    >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Price Level (1-4)</label>
                    <select 
                        {...register('price_level')}
                        className={`w-full ${tokens.surface2} border ${tokens.border} rounded-xl p-3 text-white focus:border-primary`}
                    >
                        {[1, 2, 3, 4].map(p => <option key={p} value={p}>{'R'.repeat(p)}</option>)}
                    </select>
                </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Latitude</label>
                    <input 
                    type="number" 
                    step="any"
                    {...register('latitude', { required: true })}
                    className={`w-full ${tokens.surface2} border ${tokens.border} rounded-xl p-3 text-white focus:border-primary`}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Longitude</label>
                    <input 
                    type="number" 
                    step="any"
                    {...register('longitude', { required: true })}
                    className={`w-full ${tokens.surface2} border ${tokens.border} rounded-xl p-3 text-white focus:border-primary`}
                    />
                </div>
            </div>

            {/* Derived City */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Neighborhood / City</label>
                <input 
                {...register('city')}
                className={`w-full ${tokens.surface2} border ${tokens.border} rounded-xl p-3 text-white/70 focus:border-primary`}
                readOnly 
                />
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
                <input 
                type="tel"
                {...register('phone_number')}
                className={`w-full ${tokens.surface2} border ${tokens.border} rounded-xl p-3 text-white focus:border-primary`}
                placeholder="+27 11 123 4567"
                />
            </div>

            {/* Hours */}
            <div className="flex flex-col justify-center space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('is_24_7')} className="rounded bg-white/10 border-white/20 text-primary focus:ring-primary" />
                    <span className="text-sm text-white">Open 24/7</span>
                </label>
            </div>

            {/* Status & Verification */}
            <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                    <select 
                        {...register('status')}
                        className={`w-full ${tokens.surface2} border ${tokens.border} rounded-xl p-3 text-white focus:border-primary`}
                    >
                        <option value="OPEN">Open</option>
                        <option value="CLOSED">Closed</option>
                        <option value="UNKNOWN">Unknown</option>
                    </select>
                </div>
                
                <div className="flex flex-col justify-center space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" {...register('is_verified')} className="rounded bg-white/10 border-white/20 text-primary focus:ring-primary" />
                        <span className="text-sm text-white">Verified Venue</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" {...register('is_active')} className="rounded bg-white/10 border-white/20 text-green-500 focus:ring-green-500" />
                        <span className="text-sm text-white">Active (Visible)</span>
                    </label>
                </div>
            </div>

            <div className="pt-4 flex gap-3">
                <button 
                type="button" 
                onClick={onClose}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-sm transition-colors"
                >
                Cancel
                </button>
                <PrimaryButton 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1"
                >
                {isSubmitting ? 'Saving...' : 'Save Venue'}
                </PrimaryButton>
            </div>

            </form>
        ) : (
            <div className="p-6">
                <div className="mb-6">
                    <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-white/5 transition-colors ${uploading ? 'border-primary opacity-50' : 'border-white/20'}`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {uploading ? (
                                <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-3xl text-gray-400 mb-2">cloud_upload</span>
                                    <p className="text-xs text-gray-400"><span className="font-bold text-white">Click to upload</span> or drag and drop</p>
                                    <p className="text-[10px] text-gray-500">Image or Short Video</p>
                                </>
                            )}
                        </div>
                        <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploading} />
                    </label>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {mediaItems.map(item => (
                        <div key={item.id} className={`relative aspect-square rounded-xl overflow-hidden group bg-gray-900 border ${tokens.border}`}>
                            {item.type === 'video' ? (
                                <video src={item.url} className="w-full h-full object-cover" />
                            ) : (
                                <img src={item.url} alt="Venue Media" className="w-full h-full object-cover" />
                            )}
                            
                            {/* Overlay Actions */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button 
                                    onClick={() => handleSetCover(item)} 
                                    title="Set as Cover"
                                    className={`p-2 rounded-full hover:bg-white/20 ${item.is_cover ? 'text-yellow-400' : 'text-white'}`}
                                >
                                    <span className={`material-symbols-outlined text-lg ${item.is_cover ? 'filled-icon' : ''}`}>star</span>
                                </button>
                                <button 
                                    onClick={() => handleDeleteMedia(item)} 
                                    title="Delete"
                                    className="p-2 rounded-full hover:bg-white/20 text-red-400"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                            </div>

                            {/* Cover Badge */}
                            {item.is_cover && (
                                <div className="absolute top-1 right-1 bg-yellow-400 text-black text-[8px] font-bold px-1.5 py-0.5 rounded">
                                    COVER
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                
                {mediaItems.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-xs">
                        No media uploaded yet.
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};
