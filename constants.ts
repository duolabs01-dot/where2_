
import { Story, FeedItem } from './types';

export const STORIES: Story[] = [
  { id: 'add', type: 'add', label: 'Post' },
  { 
    id: 'sarah', 
    type: 'live', 
    label: 'Sarah', 
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop' 
  },
  { 
    id: 'mint', 
    type: 'spec', 
    label: 'The Mint', 
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=150&h=150&fit=crop' 
  },
  { 
    id: 'alex', 
    type: 'default', 
    label: 'Alex', 
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop' 
  },
  { 
    id: 'pasta', 
    type: 'default', 
    label: 'Pasta Bar', 
    imageUrl: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=150&h=150&fit=crop' 
  },
  { 
    id: 'mike', 
    type: 'live', 
    label: 'Mike', 
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop' 
  }
];

export const FEED_ITEMS: FeedItem[] = [
  {
    id: 'f1',
    type: 'business',
    name: 'The Mint Lounge',
    category: 'Cocktail Bar',
    location: 'Union Square',
    distance: '200m away',
    status: 'open',
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    highlights: {
      title: 'Happening Now',
      description: 'Happy Hour: 50% off cocktails until 7 PM. Live Jazz starting at 8 PM tonight.',
      icon: 'auto_awesome'
    }
  },
  {
    id: 'f2',
    type: 'user_live',
    name: 'Blue Bottle Coffee',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
    user: {
      name: 'Sarah',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
      lastActive: '5 mins ago',
      comment: '"The seasonal latte is amazing! Best one yet ☕️💖"',
      watchCount: 42,
      othersCount: 12
    }
  },
  {
    id: 'f3',
    type: 'business',
    name: 'Chic Shop',
    category: 'Boutique',
    distance: '1.2km away',
    status: 'closed',
    openingInfo: 'Opens tomorrow at 10:00 AM',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80'
  },
  {
    id: 'f4',
    type: 'business',
    name: 'Iron Horse Brew',
    category: 'Gastropub',
    location: 'SOMA',
    distance: '450m away',
    status: 'open',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    highlights: {
      title: 'Trending',
      description: 'Taco Tuesday starts now. 3 for $10 and $5 Margaritas.',
      icon: 'local_fire_department'
    }
  },
  {
    id: 'f5',
    type: 'user_live',
    name: 'Dolores Park',
    imageUrl: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=800&q=80',
    user: {
      name: 'Mike',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      lastActive: 'Just now',
      comment: '"Sun is out! The park is packed but vibes are 10/10 ☀️"',
      watchCount: 128,
      othersCount: 45
    }
  }
];
