
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
  is_admin?: boolean;
  is_verified?: boolean;
  is_founder?: boolean;
  follower_count?: number;
  following_count?: number;
  dob?: string;
  share_activity?: boolean;
}

export interface OperatingHour {
  id: number;
  created_at: string;
  place_id: string;
  day_of_week: number; // ISO 8601: 1 = Monday, 7 = Sunday
  open_time: string; // "HH:mm:ss" format
  close_time: string; // "HH:mm:ss" format
}

export interface Place {
  id: string;
  name: string;
  description?: string;
  category: string;
  cover_image?: string; // Made optional for compatibility with Venue
  cover_url?: string;
  latitude?: number;
  longitude?: number;
  city: string;
  address?: string;
  status?: 'OPEN' | 'CLOSED' | 'UNKNOWN';
  distance?: string;
  price_level?: number;
  vibe_tags?: string[];
  is_active?: boolean;
  is_verified?: boolean;
  phone_number?: string;
  popular_items?: { name: string; price: string; }[];
  location?: any;
  is_24_7?: boolean;
  operating_hours?: OperatingHour[];
}

export interface PlaceMedia {
  id: string;
  place_id: string;
  url: string;
  type: 'image' | 'video';
  is_cover?: boolean;
}

export interface PlaceStory {
  id: string;
  place_id: string;
  posted_by: string;
  media_url?: string | null;
  caption?: string | null;
  vibe_tag?: string | null;
  created_at: string;
  expires_at: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  place_id: string;
  message?: string | null;
  created_at: string;
  expires_at: string;
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
  evidence_text?: string;
  evidence_url?: string;
  reviewed_by?: string;
  reviewed_at?: string;
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

export interface SearchIntent {
  mode: 'smart_auto' | 'city_wide' | 'custom';
  timeMode: 'open_now' | 'any';
  categories: string[];
  groupContext: 'solo' | 'date' | 'group';
  initialRadius: number;
  autoExpand: boolean;
}

export interface CanvasBlock {
  id: string;
  type: 'text' | 'image' | 'video';
  content: string;
  x: number;
  y: number;
  width: number;
  isLoading?: boolean;
}
