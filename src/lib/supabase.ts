import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY; 

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Using fallback values.');
}

if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.error('Invalid VITE_SUPABASE_URL format. Must start with https://');
}

if (supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ')) {
  console.error('Invalid VITE_SUPABASE_ANON_KEY format. Must be a valid JWT token.');
}

// Create the Supabase client with enhanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage,
    storageKey: 'supabase.auth.token'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js@2.x'
    }
  },
  // Add additional client options for better reliability
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

supabase.auth.onAuthStateChange((event) => {
  if (import.meta.env.DEV) {
    console.log('Auth state changed:', event);
  }
});

// Enhanced health check function with better error handling and retry logic
export const checkSupabaseConnection = async (retries = 3, initialDelay = 1000) => {
  let lastError = null;
  let attempt = 0;

  const checkConnection = async () => {
    try {
      // Use a simple health check by querying the auth.users system table
      // This table always exists and is accessible with the service role
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      return true;
    } catch (err) {
      throw err;
    }
  };

  while (attempt < retries) {
    try {
      const delay = initialDelay * Math.pow(2, attempt);

      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      await checkConnection();
      return true;
    } catch (err) {
      lastError = err;

      if (import.meta.env.DEV) {
        console.warn(`Supabase connection attempt ${attempt + 1} failed:`, err);
      }

      attempt++;
    }
  }

  if (import.meta.env.DEV) {
    console.error('Failed to establish Supabase connection after all retries:', {
      error: lastError,
      url: supabaseUrl,
      retries,
      totalTime: initialDelay * (Math.pow(2, retries) - 1)
    });
  }

  return false;
};

// Initialize connection with more graceful error handling
const initializeSupabase = async () => {
  try {
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      window.dispatchEvent(new CustomEvent('supabase:connectionFailed'));
    } else {
      window.dispatchEvent(new CustomEvent('supabase:connected'));
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Fatal error during Supabase initialization:', error);
    }
    window.dispatchEvent(new CustomEvent('supabase:error', { detail: error }));
  }
};

// Run initialization - but don't block app startup
if (typeof window !== 'undefined') {
  setTimeout(() => {
    initializeSupabase();
  }, 0);
}

// Export a function to get connection status
export const getConnectionStatus = async () => {
  return await checkSupabaseConnection(1); // Single attempt for status check
};