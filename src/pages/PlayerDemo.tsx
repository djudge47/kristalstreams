import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';

// Deliberate opt-in sample only. Never used as a provider/content fallback.
const sampleVideo = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

export default function PlayerDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-dark-300 py-32">
      <div className="container mx-auto max-w-5xl px-4">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">Sample Video Only</p>
        <h1 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Website Player Demo</h1>
        <p className="mb-6 max-w-3xl text-gray-300">Try the website player with Big Buck Bunny, a public test video. This demonstration does not confirm streaming access, a subscription or the availability of any catalog title.</p>
        {open ? (
          <section aria-labelledby="sample-player-heading" className="rounded-xl border border-gray-700 bg-dark-100 p-3 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4"><h2 id="sample-player-heading" className="font-semibold text-white">Big Buck Bunny · Sample Video</h2><button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-semibold text-white hover:border-primary">Close Sample Player</button></div>
            <VideoPlayer src={sampleVideo} title="Big Buck Bunny · Sample Video" autoplay={true} immersive={false} />
            <p className="mt-4 text-sm text-gray-400">Your website playback preferences apply. If autoplay is off or blocked, use the play control.</p>
          </section>
        ) : <button type="button" onClick={() => setOpen(true)} className="mb-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-red-700"><Play size={18} aria-hidden="true" />Open Sample Player</button>}
        <p className="mt-5 text-xs leading-relaxed text-gray-400">Big Buck Bunny © 2008, Blender Foundation / <a href="https://www.bigbuckbunny.org/" className="underline">bigbuckbunny.org</a>. <a href="https://creativecommons.org/licenses/by/3.0/" className="underline">CC BY 3.0</a>. HLS test stream hosted by <a href="https://test-streams.mux.dev/" className="underline">Mux</a>.</p>
        <nav aria-label="Player demo navigation" className="mt-8 flex flex-wrap gap-5 text-sm"><Link to="/support/getting-started" className="text-primary underline">Streaming Setup</Link><Link to="/client/settings" className="text-primary underline">Website Playback Preferences</Link><Link to="/support/streaming" className="text-primary underline">Playback Help</Link><Link to="/" className="text-gray-300 underline">Back to Home</Link></nav>
      </div>
    </div>
  );
}
