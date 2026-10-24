import { Link } from 'react-router-dom';
import { History } from 'lucide-react';

export default function ClientHistory() {
  return <div className="min-w-0 space-y-5">
    <header className="flex items-center gap-3"><History className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" /><h1 className="text-2xl font-bold text-white sm:text-3xl">Streaming history</h1></header>
    <section aria-labelledby="streaming-history-heading" className="rounded-2xl border border-gray-700 bg-dark-100 p-5 sm:p-7">
      <h2 id="streaming-history-heading" className="text-xl font-semibold text-white">Viewing history is unavailable here</h2>
      <p className="mt-3 text-sm leading-6 text-gray-300">Your streaming player's viewing history is not connected to this website. Check the history or recently watched section in your player, if it provides one.</p>
      <p className="mt-3 text-sm leading-6 text-gray-400">The website cannot tell whether you have watched anything. Saved service details and recorded payments are available on your Subscription page.</p>
    </section>
    <nav aria-label="History help" className="flex flex-wrap gap-3">
      <Link to="/client/subscription" className="inline-flex min-h-12 items-center rounded-xl bg-primary px-5 py-2 font-semibold text-white">View service &amp; payment records</Link>
      <Link to="/client/support/new" className="inline-flex min-h-12 items-center rounded-xl border border-gray-600 px-5 py-2 font-semibold text-white">Get account help</Link>
    </nav>
  </div>;
}
