import { useCallback, useEffect, useRef, useState } from 'react';
import { Edit2, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { loadAccountProfile, saveAccountName, ProfileFailure, type AccountProfile } from '../lib/account-profile';

type ProfileState = { status: 'loading' | 'unavailable' | 'missing' | 'changed'; profile?: never } | { status: 'ready'; profile: AccountProfile };
type Notice = { kind: 'saved' | 'error' | 'uncertain'; message: string } | null;
export default function AccountProfileEditor({ accountId }: { accountId: string }) {
  const [state, setState] = useState<ProfileState>({ status: 'loading' });
  const [editing, setEditing] = useState(false), [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false), [notice, setNotice] = useState<Notice>(null);
  const active = useRef(false), version = useRef(0), reloadRequired = useRef(false);
  const timers = useRef(new Set<number>());
  const reading = useRef<AbortController | null>(null), writing = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    if (!active.current || writing.current) return;
    reading.current?.abort();
    const controller = new AbortController(); reading.current = controller;
    const generation = ++version.current;
    const isCurrent = () => active.current && generation === version.current && reading.current === controller;
    setState({ status: 'loading' }); setEditing(false); setDraft(''); setNotice(null);
    const deadline = window.setTimeout(() => {
      timers.current.delete(deadline);
      if (!isCurrent()) return;
      reading.current = null; controller.abort(); setState({ status: 'unavailable' });
    }, 20000);
    timers.current.add(deadline);
    try {
      const profile = await loadAccountProfile(supabase, accountId, { signal: controller.signal, isCurrent });
      if (!isCurrent()) return;
      reloadRequired.current = false;
      setState({ status: 'ready', profile }); setDraft(profile.fullName || '');
    } catch (error) {
      if (isCurrent()) setState({ status: error instanceof ProfileFailure && ['changed', 'missing'].includes(error.code) ? error.code as 'changed' | 'missing' : 'unavailable' });
    } finally { window.clearTimeout(deadline); timers.current.delete(deadline); if (reading.current === controller) reading.current = null; }
  }, [accountId]);
  useEffect(() => {
    active.current = true; const pendingTimers = timers.current; void load();
    return () => { for (const timer of pendingTimers) window.clearTimeout(timer); pendingTimers.clear(); active.current = false; reading.current?.abort(); writing.current?.abort(); reading.current = null; writing.current = null; };
  }, [load]);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!active.current || writing.current || reloadRequired.current || state.status !== 'ready' || state.profile.accountId !== accountId || !editing) return;
    const controller = new AbortController(); writing.current = controller;
    const generation = version.current;
    const isCurrent = () => active.current && generation === version.current && writing.current === controller;
    setSaving(true); setNotice(null);
    const deadline = window.setTimeout(() => {
      timers.current.delete(deadline);
      if (!isCurrent()) return;
      writing.current = null; controller.abort(); reloadRequired.current = true; setSaving(false);
      setNotice({ kind: 'uncertain', message: 'The name update could not be confirmed. Reload your profile before trying again.' });
    }, 20000);
    timers.current.add(deadline);
    try {
      const profile = await saveAccountName(supabase, state.profile, draft, { signal: controller.signal, isCurrent });
      if (!isCurrent()) return;
      setState({ status: 'ready', profile }); setDraft(profile.fullName || ''); setEditing(false);
      setNotice({ kind: 'saved', message: 'Your name has been saved.' });
    } catch (error) {
      if (!isCurrent()) return;
      const code = error instanceof ProfileFailure ? error.code : 'uncertain';
      if (code === 'changed') { setState({ status: 'changed' }); setEditing(false); setDraft(''); setNotice(null); }
      else if (code === 'uncertain') { reloadRequired.current = true; setNotice({ kind: 'uncertain', message: 'The name update could not be confirmed. Reload your profile before trying again.' }); }
      else { if (code === 'not_saved') reloadRequired.current = true; setNotice({ kind: 'error', message: code === 'invalid_name' ? 'Use 200 characters or fewer for your name.' : code === 'not_saved' ? 'No profile was updated. Reload your profile before trying again.' : 'Your account could not be verified. Reload your profile before saving.' }); }
    } finally { window.clearTimeout(deadline); timers.current.delete(deadline); if (writing.current === controller) { writing.current = null; if (active.current) setSaving(false); } }
  };
  if (state.status === 'loading' || (state.status === 'ready' && state.profile.accountId !== accountId)) return <p role="status" className="text-sm text-gray-400">Loading your account details…</p>;
  if (state.status !== 'ready') return <section role="alert" className="rounded-xl border border-amber-500/30 p-4 text-sm text-amber-200">
    <p>{state.status === 'missing' ? 'Your website profile was not found. Contact support for help with this account.' : state.status === 'changed' ? 'Your account changed. Reload your account details to continue.' : 'Your account details could not be loaded. Please try again.'}</p>
    <button type="button" onClick={() => void load()} className="mt-3 min-h-12 rounded-xl border border-gray-600 px-4 font-semibold text-white">Reload profile</button>
  </section>;
  const profile = state.profile;
  return <section aria-label="Your website account" className="rounded-xl border border-gray-800 bg-dark-100 p-5 sm:p-8">
    <div className="space-y-6">
      <div><p className="mb-2 text-sm font-medium text-gray-400">Email address</p><div className="flex min-w-0 items-center rounded-lg bg-dark-200 px-4 py-3"><Mail className="mr-3 h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" /><span className="min-w-0 break-all text-white">{profile.email}</span></div></div>
      <div><label htmlFor={editing ? 'account-full-name' : undefined} className="mb-2 block text-sm font-medium text-gray-400">Full name</label>
        {editing ? <form onSubmit={event => void save(event)} className="space-y-3">
          <input id="account-full-name" type="text" autoComplete="name" maxLength={200} disabled={saving} value={draft} onChange={event => setDraft(event.target.value)} className="min-h-12 w-full min-w-0 rounded-lg border border-gray-700 bg-dark-200 px-4 py-2 text-white focus:border-primary focus:outline-none disabled:opacity-50" />
          <div className="grid grid-cols-2 gap-3"><button type="submit" disabled={saving || reloadRequired.current} className="min-h-12 rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save name'}</button>
            <button type="button" disabled={saving} onClick={() => { if (writing.current) return; setEditing(false); setDraft(profile.fullName || ''); }} className="min-h-12 rounded-lg bg-dark-200 px-4 py-2 font-semibold text-white disabled:opacity-50">Cancel</button></div>
        </form> : <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-dark-200 px-4 py-3"><span className="min-w-0 break-words text-white">{profile.fullName?.trim() || 'Not set'}</span><button type="button" disabled={reloadRequired.current} aria-label="Edit full name" onClick={() => { if (writing.current || reloadRequired.current) return; setDraft(profile.fullName || ''); setEditing(true); setNotice(null); }} className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:text-white disabled:opacity-50"><Edit2 className="h-5 w-5" aria-hidden="true" /></button></div>}
      </div>
      <div><p className="mb-2 text-sm font-medium text-gray-400">Website account created</p><div className="rounded-lg bg-dark-200 px-4 py-3 text-white">{profile.createdAt ? <time dateTime={profile.createdAt}>{new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</time> : 'Not recorded'}</div></div>
    </div>
    {notice && <p role={notice.kind === 'saved' ? 'status' : 'alert'} className={`mt-4 text-sm ${notice.kind === 'saved' ? 'text-green-300' : 'text-amber-200'}`}>{notice.message}</p>}
    <button type="button" disabled={saving} onClick={() => void load()} className="mt-5 min-h-12 rounded-xl border border-gray-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Reload profile</button>
  </section>;
}
