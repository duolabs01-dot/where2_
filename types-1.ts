
export type Role = 'user' | 'business' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar_url?: string;
  role: Role;
  city: string;
  is_admin?: boolean; // Added for explicit admin flag
  is_verified?: boolean;
  is_founder?: boolean;
  follower_count?: number;
  following_count?: number;
}

export interface Place {
  id: string;
  name: string;
  description?: string;
  category: string;
  cover_image: string;
  cover_url?: string; // Optional override
  location: any; // PostGIS point
  latitude?: number;
  longitude?: number;
  city: string;
  address?: string;
  opening_time?: string;
  closing_time?: string;
  status?: 'OPEN' | 'CLOSED' | 'UNKNOWN';
  distance?: string; // Calculated on client
  phone_number?: string;
  price_level?: number; // 1-4 scale
  popular_items?: { name: string; price: string; }[];
  place_media?: PlaceMedia[]; // Joined media
  is_active?: boolean; // Soft delete
  is_verified?: boolean; // Admin verification
  vibe_tags?: string[]; // Tags
}

export interface PlaceMedia {
  id: string;
  place_id: string;
  url: string;
  type: 'image' | 'video';
  is_cover?: boolean;
}

export interface Review {
  id: string;
  place_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface Plan {
  id: string;
  title: string;
  date_time: string;
  city: string;
  is_active: boolean;
  creator_id: string;
  participants?: Profile[];
  venues?: PlanVenue[];
}

export interface PlanVenue {
  id: string;
  place_id: string;
  vote_count: number;
  place?: Place;
}

export interface BusinessClaim {
  id: string;
  place_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note?: string;
  created_at: string;
  updated_at?: string;
  // Extended fields
  evidence_text?: string;
  evidence_url?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  // Joins
  place?: Place;
  profile?: Profile;
}

export type NavTab = 'Discover' | 'Map' | 'Plans' | 'Profile' | 'Business' | 'Admin';

export interface Story {
  id: string;
  type: 'add' | 'live' | 'spec' | 'default';
  label: string;
  imageUrl?: string;
}

export interface FeedItem {
  id: string;
  type: 'business' | 'user_live';
  name: string;
  imageUrl: string;
  category?: string;
  location?: string;
  distance?: string;
  status?: 'open' | 'closed';
  openingInfo?: string;
  highlights?: {
    title: string;
    description: string;
    icon: string;
  };
  user?: {
    name: string;
    avatarUrl: string;
    lastActive: string;
    comment: string;
    watchCount: number;
    othersCount: number;
  };
}

// --- New Smart Search Intent ---
export interface SearchIntent {
  mode: 'smart_auto' | 'city_wide' | 'custom';
  timeMode: 'open_now' | 'any';
  categories: string[];
  groupContext: 'solo' | 'date' | 'group';
  initialRadius: number;
  autoExpand: boolean;
}
