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
const cache = new Map<string, { data: any; timestamp: number }>();

const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const isExpired = Date.now() - cached.timestamp > CACHE_TTL;
  if (isExpired) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
};

const setCachedData = (key: string, data: any) => {
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

export const getStreamUrl = async (channelId: string) => {
  // Mock stream URL for development
  const mockStreamUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
  
  // In development, return mock stream URL
  if (import.meta.env.DEV) {
    return mockStreamUrl;
  }

  // In production, use actual API
  const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;
  const API_KEY = import.meta.env.VITE_API_KEY;

  if (!API_ENDPOINT || !API_KEY) {
    console.warn('Using mock stream URL due to missing API configuration');
    return mockStreamUrl;
  }

  try {
    const response = await fetch(`${API_ENDPOINT}/stream/${channelId}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || 
        `API request failed with status ${response.status} (${response.statusText})`
      );
    }

    const data = await response.json();
    return data.streamUrl || mockStreamUrl;
  } catch (error) {
    console.error('Error fetching stream URL:', error);
    return mockStreamUrl;
  }
};

// Enhanced error handling for Supabase queries
const handleSupabaseQuery = async <T>(
  queryPromise: Promise<{ data: T; error: any }>,
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
  const cached = getCachedData(cacheKey);
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
  } catch (error) {
    // Silently handle connection errors and use fallback
    console.warn('Using fallback footer links due to connection issue');
  }

  setCachedData(cacheKey, fallbackFooterLinks);
  return fallbackFooterLinks;
};

export const getFooterSocialLinks = async () => {
  const cacheKey = 'footer_social_links';
  const cached = getCachedData(cacheKey);
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
  } catch (error) {
    // Silently handle connection errors and use fallback
    console.warn('Using fallback social links due to connection issue');
  }

  setCachedData(cacheKey, fallbackSocialLinks);
  return fallbackSocialLinks;
};

export const getSupportCategories = async () => {
  const cacheKey = 'support_categories';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('support_categories')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data) {
      setCachedData(cacheKey, data);
      return data;
    }
  } catch (error) {
    // Silently handle network errors
  }

  // Return fallback categories
  const fallbackCategories = [
    {
      id: '1',
      name: 'Getting Started',
      slug: 'getting-started',
      description: 'Learn the basics of using Kristal Streams',
      icon: 'play-circle'
    },
    {
      id: '2',
      name: 'Account & Billing',
      slug: 'billing',
      description: 'Manage your subscription and billing information',
      icon: 'credit-card'
    },
    {
      id: '3',
      name: 'Technical Support',
      slug: 'technical',
      description: 'Troubleshoot streaming and technical issues',
      icon: 'settings'
    },
    {
      id: '4',
      name: 'Device Setup',
      slug: 'device-setup',
      description: 'Set up Kristal Streams on your devices',
      icon: 'smartphone'
    }
  ];
  
  setCachedData(cacheKey, fallbackCategories);
  return fallbackCategories;
};

export const getSupportArticles = async (categorySlug?: string) => {
  const cacheKey = categorySlug ? `support_articles_${categorySlug}` : 'support_articles_all';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    let query = supabase
      .from('support_articles')
      .select(`
        *,
        support_categories (
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false });

    if (categorySlug) {
      query = query.eq('support_categories.slug', categorySlug);
    }

    const { data, error } = await query;

    if (!error && data) {
      setCachedData(cacheKey, data);
      return data;
    }
  } catch (error) {
    // Silently handle network errors
  }

  // Return fallback articles
  const fallbackArticles = [
    {
      id: '1',
      title: 'How to Get Started with Kristal Streams',
      slug: 'getting-started-guide',
      content: 'Welcome to Kristal Streams! This comprehensive guide will help you get started with our streaming service.\n\nFirst, make sure you have a stable internet connection and a compatible device. Then, log into your account and browse our extensive channel library.',
      is_featured: true,
      views: 1250,
      helpful_count: 89,
      created_at: new Date().toISOString(),
      support_categories: {
        name: 'Getting Started',
        slug: 'getting-started'
      }
    },
    {
      id: '2',
      title: 'Setting Up Your Account',
      slug: 'account-setup',
      content: 'Learn how to set up your Kristal Streams account and customize your preferences.\n\nYou can manage your profile, payment methods, and viewing preferences from your account dashboard.',
      is_featured: true,
      views: 980,
      helpful_count: 67,
      created_at: new Date().toISOString(),
      support_categories: {
        name: 'Getting Started',
        slug: 'getting-started'
      }
    },
    {
      id: '3',
      title: 'Troubleshooting Streaming Issues',
      slug: 'streaming-troubleshooting',
      content: 'Having trouble with streaming? Here are common solutions to resolve playback issues.\n\nCheck your internet speed, clear your browser cache, and ensure your device meets the minimum requirements.',
      is_featured: false,
      views: 756,
      helpful_count: 45,
      created_at: new Date().toISOString(),
      support_categories: {
        name: 'Technical Support',
        slug: 'technical'
      }
    }
  ];

  // Filter by category if specified
  const filteredArticles = categorySlug 
    ? fallbackArticles.filter(article => article.support_categories.slug === categorySlug)
    : fallbackArticles;
  
  setCachedData(cacheKey, filteredArticles);
  return filteredArticles;
};

export const getSupportArticle = async (slug: string) => {
  const cacheKey = `support_article_${slug}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const data = await handleSupabaseQuery(
    supabase
      .from('support_articles')
      .select(`
        *,
        support_categories (
          name,
          slug
        )
      `)
      .eq('slug', slug)
      .single(),
    'Failed to fetch support article'
  );
  
  setCachedData(cacheKey, data);
  return data;
};

export const incrementArticleViews = async (articleId: string) => {
  await handleSupabaseQuery(
    supabase.rpc('increment_article_views', {
      article_id: articleId
    }),
    'Failed to increment article views'
  );
};

export const markArticleHelpful = async (articleId: string) => {
  await handleSupabaseQuery(
    supabase.rpc('increment_article_helpful', {
      article_id: articleId
    }),
    'Failed to mark article as helpful'
  );
};

export const getSetupGuides = async () => {
  const cacheKey = 'setup_guides';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const data = await handleSupabaseQuery(
    supabase
      .from('setup_guides')
      .select('*')
      .order('created_at', { ascending: false }),
    'Failed to fetch setup guides'
  );
  
  setCachedData(cacheKey, data);
  return data;
};

export const getSetupGuide = async (slug: string) => {
  const cacheKey = `setup_guide_${slug}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const data = await handleSupabaseQuery(
    supabase
      .from('setup_guides')
      .select('*')
      .eq('slug', slug)
      .single(),
    'Failed to fetch setup guide'
  );
  
  setCachedData(cacheKey, data);
  return data;
};

export const incrementGuideViews = async (guideId: string) => {
  await handleSupabaseQuery(
    supabase.rpc('increment_guide_views', {
      guide_id: guideId
    }),
    'Failed to increment guide views'
  );
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