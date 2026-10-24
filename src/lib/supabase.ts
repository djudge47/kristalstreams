import { createClient } from '@supabase/supabase-js';

const configuredUrl = import.meta.env.VITE_SUPABASE_URL;
const configuredAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(configuredUrl && configuredAnonKey);

const supabaseUrl = configuredUrl || 'https://preview-placeholder.supabase.co';
const supabaseAnonKey = configuredAnonKey || 'preview-placeholder-key';

if (!hasSupabaseConfig) {
  console.warn('Supabase preview variables are missing. Public pages will load, but account features are unavailable in this preview.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: hasSupabaseConfig,
    autoRefreshToken: hasSupabaseConfig,
    detectSessionInUrl: hasSupabaseConfig,
    flowType: 'pkce',
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js@2.x',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// A password check must never replace the website's persisted account session.
export const createPasswordVerificationClient = () => {
  if (!hasSupabaseConfig) throw new Error('Website account services are unavailable.');
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'ks-password-verification',
    },
  });
};

export const invokeGeneralChat = async (
  body: { message: string; conversationHistory: { role: 'user' | 'assistant'; content: string }[] },
  ownerId: string | null,
  signal: AbortSignal,
) => {
  if (!hasSupabaseConfig || signal.aborted) throw new Error('Chat unavailable.');
  const { data, error } = await supabase.auth.getSession();
  if (signal.aborted || error || (data.session?.user.id ?? null) !== ownerId) throw new Error('Chat account changed.');
  // Pin the request's identity, including public/anon requests, so an SDK
  // token refresh or account switch cannot send old context as the next user.
  return supabase.functions.invoke('ai-chat', {
    body,
    headers: { Authorization: `Bearer ${data.session?.access_token ?? supabaseAnonKey}` },
  });
};

supabase.auth.onAuthStateChange((event) => {
  if (import.meta.env.DEV) {
    console.log('Auth state changed:', event);
  }
});

export const checkSupabaseConnection = async (retries = 3, initialDelay = 1000) => {
  if (!hasSupabaseConfig) return false;

  let attempt = 0;
  while (attempt < retries) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, initialDelay * Math.pow(2, attempt)));
      }

      const { error } = await supabase.auth.getSession();
      if (error) throw error;
      return true;
    } catch (error) {
      attempt += 1;
      if (import.meta.env.DEV) {
        console.warn(`Supabase connection attempt ${attempt} failed:`, error);
      }
    }
  }

  return false;
};

const initializeSupabase = async () => {
  if (!hasSupabaseConfig) {
    window.dispatchEvent(new CustomEvent('supabase:configurationMissing'));
    return;
  }

  try {
    const connected = await checkSupabaseConnection();
    window.dispatchEvent(new CustomEvent(connected ? 'supabase:connected' : 'supabase:connectionFailed'));
  } catch (error) {
    window.dispatchEvent(new CustomEvent('supabase:error', { detail: error }));
  }
};

if (typeof window !== 'undefined') {
  window.setTimeout(initializeSupabase, 0);
}

export const getConnectionStatus = async () => checkSupabaseConnection(1);
