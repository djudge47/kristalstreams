import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Save } from 'lucide-react';
import NotificationSettings from '../../components/NotificationSettings';
import { defaultPlaybackPreferences, videoQualities, type PlaybackPreferences, type VideoQuality } from '../../lib/playback-preferences';
import { usePlaybackPreferences } from '../../lib/usePlaybackPreferences';

export default function ClientSettings() {
  const saved = usePlaybackPreferences();
  const [draftState, setDraftState] = useState<{ accountId: string | null; preferences: PlaybackPreferences }>({ accountId: null, preferences: defaultPlaybackPreferences });
  const draft = draftState.accountId === saved.accountId ? draftState.preferences : saved.preferences ?? defaultPlaybackPreferences;
  const [success, setSuccess] = useState<{ accountId: string; message: string } | null>(null);
  useEffect(() => {
    setDraftState({ accountId: saved.accountId, preferences: saved.preferences ?? defaultPlaybackPreferences });
  }, [saved.accountId, saved.loading, saved.preferences]);
  useEffect(() => { setSuccess(null); }, [saved.accountId, saved.loading]);

  return (
    <div>
      <div className="mb-8 flex items-center gap-4"><Settings className="h-8 w-8 text-primary" aria-hidden="true" /><h1 className="text-3xl font-bold text-white">Settings</h1></div>
      <div className="space-y-6">
        <NotificationSettings />
        <section aria-labelledby="playback-preferences-heading" className="rounded-xl border border-gray-800 bg-dark-100 p-6 sm:p-8">
          <h2 id="playback-preferences-heading" className="mb-3 text-xl font-semibold text-white">Website Video Preferences</h2>
          <p id="playback-preferences-help" className="mb-5 text-sm text-gray-300">These preferences apply to website videos for this signed-in account in this browser. They do not sync to other browsers or change your streaming app.</p>
          {saved.loading ? <p role="status" className="text-gray-400">Checking your playback preferences…</p> : !saved.accountId ? <p className="text-gray-300"><Link to="/login" className="text-primary underline">Sign in</Link> to save your own playback preferences.</p> : (
            <form aria-describedby="playback-preferences-help" onSubmit={async event => {
              event.preventDefault(); setSuccess(null);
              const accountId = saved.accountId;
              if (await saved.save(draft) && accountId) setSuccess({ accountId, message: 'Playback preferences saved for your account in this browser.' });
            }} className="space-y-5">
              <fieldset disabled={saved.saving} className="space-y-5">
                <legend className="sr-only">Website video preferences</legend>
                <div>
                  <label htmlFor="preferred-video-quality" className="mb-2 block text-sm font-medium text-gray-300">Preferred video quality</label>
                  <select id="preferred-video-quality" value={draft.quality} onChange={event => { setSuccess(null); setDraftState({ accountId: saved.accountId, preferences: { ...draft, quality: event.target.value as VideoQuality } }); }} className="w-full rounded-lg border border-gray-700 bg-dark-200 px-4 py-2 text-white">
                    {videoQualities.map(quality => <option key={quality} value={quality}>{quality === 'auto' ? 'Automatic' : quality === '4k' ? '4K' : quality}</option>)}
                  </select>
                  <p className="mt-2 text-sm text-gray-400">Available quality depends on the video. The website player uses the closest lower quality when possible; some browsers choose quality automatically.</p>
                </div>
                <label className="flex items-center gap-3"><input type="checkbox" checked={draft.autoplay} onChange={event => { setSuccess(null); setDraftState({ accountId: saved.accountId, preferences: { ...draft, autoplay: event.target.checked } }); }} className="h-5 w-5 rounded border-gray-700 bg-dark-200 text-primary" /><span className="text-gray-300">Start website videos automatically when the browser allows it</span></label>
              </fieldset>
              <button type="submit" disabled={saved.saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 font-semibold text-white hover:bg-red-700 disabled:bg-gray-700"><Save className="h-5 w-5" aria-hidden="true" />{saved.saving ? 'Saving…' : 'Save Playback Preferences'}</button>
            </form>
          )}
          {saved.error && <div role="alert" className="mt-4 text-sm text-red-300"><p>{saved.error}</p><button type="button" disabled={saved.saving} onClick={() => void saved.reload()} className="mt-2 text-primary underline">Reload preferences</button></div>}
          {success && !saved.loading && success.accountId === saved.accountId && <p role="status" className="mt-4 text-sm text-green-300">{success.message}</p>}
        </section>
        <section aria-labelledby="language-settings-heading" className="rounded-xl border border-gray-800 bg-dark-100 p-6 sm:p-8">
          <h2 id="language-settings-heading" className="mb-3 text-xl font-semibold text-white">Language and Streaming App</h2>
          <p className="text-sm text-gray-300">The website is currently in English. Website translation preferences are not available. Choose audio language, subtitles and playback settings in your streaming player where supported.</p>
        </section>
      </div>
    </div>
  );
}
