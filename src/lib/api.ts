import { create } from 'zustand';
import { supabase } from './supabase';

// Stream store
interface StreamState {
  streamUrl: string | null;
  isPlaying: boolean;
  setStreamUrl: (url: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
}

export const useStreamStore = create<StreamState>((set) => ({
  streamUrl: null,
  isPlaying: false,
  setStreamUrl: (url) => set({ streamUrl: url }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
}));

// Notification store
interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  incrementUnreadCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
}));

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// Simple cache implementation
const cache = new Map<string, { data: unknown; timestamp: number }>();

const getCachedData = <T>(key: string): T | null => {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const isExpired = Date.now() - cached.timestamp > CACHE_TTL;
  if (isExpired) {
    cache.delete(key);
    return null;
  }
  
  return cached.data as T;
};

const setCachedData = (key: string, data: unknown) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Subscribe to realtime updates
export const subscribeToTickets = (userId: string) => {
  const subscription = supabase
    .channel('ticket-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'support_tickets',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          useNotificationStore.getState().incrementUnreadCount();
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

// Get unread ticket count
export const getUnreadTicketCount = async (userId: string) => {
  const { count, error } = await supabase
    .from('support_tickets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'unread');

  if (error) throw error;
  useNotificationStore.getState().setUnreadCount(count || 0);
  return count;
};

// Enhanced error handling for Supabase queries
const handleSupabaseQuery = async <T>(
  queryPromise: PromiseLike<{ data: T | null; error: unknown }>,
  errorMessage: string
): Promise<T | null> => {
  try {
    const { data, error } = await queryPromise;
    
    if (error) {
      console.error(`${errorMessage}:`, error);
      throw error;
    }
    
    if (!data) {
      throw new Error('No data returned from query');
    }
    
    return data as T;
  } catch (error) {
    // Handle network errors gracefully
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.warn(`${errorMessage}: Network connectivity issue, using fallback data`);
      return null;
    }
    
    console.error(`${errorMessage}:`, error);
    throw error;
  }
};

export const getFooterLinks = async () => {
  const cacheKey = 'footer_links';
  const cached = getCachedData<{ id: string; title: string; url: string; order: number }[]>(cacheKey);
  if (cached) return cached;

  // Define fallback footer links
  const fallbackFooterLinks = [
    {
      id: '1',
      title: 'Privacy Policy',
      url: '/privacy',
      order: 1
    },
    {
      id: '2',
      title: 'Terms of Service',
      url: '/terms',
      order: 2
    },
    {
      id: '3',
      title: 'Support',
      url: '/support',
      order: 3
    }
  ];

  // Return fallback data immediately if in development or if Supabase URL is not properly configured
  if (import.meta.env.DEV || !import.meta.env.VITE_SUPABASE_URL?.startsWith('https://')) {
    setCachedData(cacheKey, fallbackFooterLinks);
    return fallbackFooterLinks;
  }

  try {
    const { data, error } = await supabase
      .from('footer_links')
      .select('*')
      .order('order', { ascending: true });

    if (!error && data) {
      setCachedData(cacheKey, data);
      return data;
    }
  } catch {
    // Silently handle connection errors and use fallback
    console.warn('Using fallback footer links due to connection issue');
  }

  setCachedData(cacheKey, fallbackFooterLinks);
  return fallbackFooterLinks;
};

export const getFooterSocialLinks = async () => {
  const cacheKey = 'footer_social_links';
  const cached = getCachedData<{ id: string; platform: string; url: string; order: number }[]>(cacheKey);
  if (cached) return cached;

  // Define fallback social links
  const fallbackSocialLinks = [
    {
      id: '1',
      platform: 'facebook',
      url: 'https://www.facebook.com/kristalstreams',
      icon: 'facebook',
      order: 1
    },
    {
      id: '2',
      platform: 'twitter',
      url: 'https://x.com/kristalstreams',
      icon: 'twitter',
      order: 2
    },
    {
      id: '3',
      platform: 'instagram',
      url: 'https://www.instagram.com/kristalstreams',
      icon: 'instagram',
      order: 3
    },
    {
      id: '4',
      platform: 'youtube',
      url: 'https://www.youtube.com/@kristalstreams',
      icon: 'youtube',
      order: 4
    },
    {
      id: '5',
      platform: 'tiktok',
      url: 'https://www.tiktok.com/@kristalstreams',
      icon: 'tiktok',
      order: 5
    },
    {
      id: '6',
      platform: 'linkedin',
      url: 'https://www.linkedin.com/company/kristalstreams',
      icon: 'linkedin',
      order: 6
    },
    {
      id: '7',
      platform: 'discord',
      url: 'https://discord.gg/kristalstreams',
      icon: 'discord',
      order: 7
    }
  ];

  // Return fallback data immediately if in development or if Supabase URL is not properly configured
  if (import.meta.env.DEV || !import.meta.env.VITE_SUPABASE_URL?.startsWith('https://')) {
    setCachedData(cacheKey, fallbackSocialLinks);
    return fallbackSocialLinks;
  }

  try {
    const { data, error } = await supabase
      .from('footer_social_links')
      .select('*')
      .order('order', { ascending: true });

    if (!error && data) {
      setCachedData(cacheKey, data);
      return data;
    }
  } catch {
    // Silently handle connection errors and use fallback
    console.warn('Using fallback social links due to connection issue');
  }

  setCachedData(cacheKey, fallbackSocialLinks);
  return fallbackSocialLinks;
};

export const sendSupportEmail = async (subject: string, message: string) => {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-email`;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subject, message }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending support email:', error);
    throw error;
  }
};

// New optimized functions for dashboard data
export const getDashboardData = async (userId: string) => {
  try {
    const [profileResponse, ticketsResponse] = await Promise.all([
      handleSupabaseQuery(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        'Failed to fetch profile data'
      ),
      handleSupabaseQuery(
        supabase
          .from('support_tickets')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10),
        'Failed to fetch tickets data'
      )
    ]);

    return {
      profile: profileResponse,
      tickets: ticketsResponse
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};
