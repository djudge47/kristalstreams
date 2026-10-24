import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import { parsePlaybackPreferences, playbackPreferencesEvent, playbackPreferencesKey, storePlaybackPreferences, type PlaybackPreferences } from './playback-preferences';

interface PreferenceState { accountId: string | null; loading: boolean; preferences: PlaybackPreferences | null; error: string | null }
const initial: PreferenceState = { accountId: null, loading: true, preferences: null, error: null };

export function usePlaybackPreferences() {
  const [state, setState] = useState<PreferenceState>(initial);
  const [saving, setSaving] = useState(false);
  const generation = useRef(0);
  const busy = useRef(false);
  const account = useRef<string | null>(null);
  const active = useRef(false);
  const load = useCallback(async () => {
    const version = ++generation.current;
    account.current = null;
    setState(initial);
    try {
      const result = await supabase.auth.getUser();
      if (!active.current || version !== generation.current) return;
      if (result.error?.name === 'AuthSessionMissingError') {
        setState({ accountId: null, loading: false, preferences: null, error: null });
        return;
      }
      if (result.error) throw Error('Account check unavailable.');
      const id = result.data.user?.is_anonymous ? null : result.data.user?.id ?? null;
      account.current = id;
      if (!id) { setState({ accountId: null, loading: false, preferences: null, error: null }); return; }
      try {
        const preferences = parsePlaybackPreferences(window.localStorage.getItem(playbackPreferencesKey(id)));
        setState({ accountId: id, loading: false, preferences, error: null });
      } catch {
        setState({ accountId: id, loading: false, preferences: null, error: 'Saved playback preferences could not be read in this browser. Choose your settings and try saving again.' });
      }
    } catch {
      if (active.current && version === generation.current) setState({ accountId: null, loading: false, preferences: null, error: 'Your account could not be checked. Sign in again or refresh before saving preferences.' });
    }
  }, []);

  useEffect(() => {
    active.current = true;
    void load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' || (session?.user.id ?? null) !== account.current) {
        generation.current += 1;
        account.current = null;
        setState(initial);
        // Auth callbacks must return before making another SDK request.
        queueMicrotask(() => { if (active.current) void load(); });
      }
    });
    const changed = (event: Event) => {
      const id = account.current;
      if (!id) return;
      if (event instanceof StorageEvent && event.key !== null && event.key !== playbackPreferencesKey(id)) return;
      if (event instanceof CustomEvent && event.detail !== id) return;
      try {
        const preferences = parsePlaybackPreferences(window.localStorage.getItem(playbackPreferencesKey(id)));
        setState({ accountId: id, loading: false, preferences, error: null });
      } catch {
        setState({ accountId: id, loading: false, preferences: null, error: 'Saved playback preferences could not be read in this browser.' });
      }
    };
    window.addEventListener('storage', changed);
    window.addEventListener(playbackPreferencesEvent, changed);
    return () => {
      active.current = false; generation.current += 1; account.current = null;
      subscription.unsubscribe();
      window.removeEventListener('storage', changed);
      window.removeEventListener(playbackPreferencesEvent, changed);
    };
  }, [load]);

  const save = useCallback(async (preferences: PlaybackPreferences): Promise<boolean> => {
    if (busy.current || !account.current || state.loading) return false;
    const id = account.current, version = generation.current;
    busy.current = true; setSaving(true);
    try {
      const result = await supabase.auth.getUser();
      if (!active.current || generation.current !== version || account.current !== id) return false;
      if (!result.error && (result.data.user?.id !== id || result.data.user?.is_anonymous)) {
        generation.current += 1; account.current = null;
        setState({ accountId: null, loading: false, preferences: null, error: 'Your account changed. Sign in again or reload your preferences.' });
        return false;
      }
      if (result.error) throw Error('Account check failed.');
      storePlaybackPreferences(window.localStorage, id, preferences);
      setState({ accountId: id, loading: false, preferences: { ...preferences }, error: null });
      window.dispatchEvent(new CustomEvent(playbackPreferencesEvent, { detail: id }));
      return true;
    } catch {
      if (active.current && generation.current === version) setState(previous => ({ ...previous, error: 'Playback preferences were not saved. Check your sign-in and browser storage, then try again.' }));
      return false;
    } finally {
      busy.current = false;
      if (active.current) setSaving(false);
    }
  }, [state.loading]);
  return { ...state, saving, save, reload: load };
}
