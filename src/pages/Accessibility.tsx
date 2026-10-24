import { Link } from 'react-router-dom';

export default function Accessibility() {
  return (
    <section aria-labelledby="accessibility-title" className="mx-auto w-full max-w-3xl px-4 py-16 sm:py-24">
      <p className="mb-3 text-sm font-semibold tracking-widest text-primary">KRISTAL STREAMS SUPPORT</p>
      <h1 id="accessibility-title" className="mb-4 text-3xl font-bold text-white sm:text-4xl">Accessibility Help</h1>
      <p className="mb-8 text-lg text-gray-300">If a page or control makes it difficult to use Kristal Streams, contact us for help with that task and to report the barrier.</p>
      <div className="space-y-6">
        <div className="rounded-xl border border-gray-800 bg-dark-100 p-6">
          <h2 className="mb-3 text-xl font-semibold text-white">Ways to navigate</h2>
          <p className="text-gray-300">You can try your browser's zoom or text-size controls. With a keyboard, use Tab and Shift+Tab to move between links and controls, and Enter or Space to activate the focused control as appropriate.</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-dark-100 p-6">
          <h2 className="mb-3 text-xl font-semibold text-white">Report an accessibility barrier</h2>
          <p className="text-gray-300">Tell us which page or control you were using, what you were trying to do and what prevented it. If helpful, include your device, browser and assistive technology. Do not include passwords, payment details or private playback links.</p>
          <nav aria-label="Accessibility support" className="mt-5 flex flex-col gap-4 sm:items-start">
            <a href="mailto:support@kristalstream.com" className="min-h-11 break-all py-2 font-semibold text-white underline underline-offset-4 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Email support@kristalstream.com</a>
            <Link to="/client/support/new" className="min-h-11 py-2 font-semibold text-white underline underline-offset-4 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Open a Support Ticket</Link>
          </nav>
          <p className="mt-3 text-sm text-gray-400">A support ticket uses your website account. Email is available if you cannot use the sign-in or ticket form.</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-dark-100 p-6">
          <h2 className="mb-3 text-xl font-semibold text-white">Current scope</h2>
          <p className="text-gray-300">This page provides accessibility help and a reporting route. A complete accessibility evaluation of the website and streaming apps has not been completed, and compatibility with every device or assistive technology has not been verified.</p>
        </div>
      </div>
      <nav aria-label="More help" className="mt-8 flex flex-wrap gap-6">
        <Link to="/support" className="min-h-11 py-2 text-white underline underline-offset-4 hover:text-primary">Support Center</Link>
        <Link to="/knowledge-base" className="min-h-11 py-2 text-white underline underline-offset-4 hover:text-primary">Help Guides</Link>
      </nav>
    </section>
  );
}
