import { Link } from 'react-router-dom';
import { Activity, HelpCircle } from 'lucide-react';

const services = [
  { id: 'streaming', name: 'Streaming Service' },
  { id: 'vod', name: 'Video on Demand' },
  { id: 'auth', name: 'Website Sign-In' },
  { id: 'api', name: 'API Services' },
  { id: 'cdn', name: 'Content Delivery' },
];

export default function SystemStatus() {
  return (
    <div className="min-h-screen bg-dark-300 py-32">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-8 flex items-center gap-4">
          <Activity className="h-8 w-8 text-primary" aria-hidden="true" />
          <h1 className="text-3xl font-bold text-white">System Status</h1>
        </div>
        <section aria-labelledby="status-availability" className="mb-8 rounded-xl border border-gray-800 bg-dark-100 p-6 sm:p-8">
          <h2 id="status-availability" className="mb-3 text-xl font-semibold text-white">Live status unavailable</h2>
          <p className="text-gray-300">Verified service-health information is not currently available on this page. Contact support to confirm whether a service disruption is affecting you.</p>
        </section>
        <ul aria-label="Service verification" className="space-y-4">
          {services.map(service => (
            <li key={service.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-800 bg-dark-100 p-6">
              <div className="flex items-center gap-3"><HelpCircle className="h-5 w-5 text-gray-400" aria-hidden="true" /><h2 className="text-lg font-medium text-white">{service.name}</h2></div>
              <span className="rounded-full border border-gray-700 bg-gray-500/10 px-3 py-1 text-sm text-gray-300">Not verified</span>
            </li>
          ))}
        </ul>
        <section aria-labelledby="status-help" className="mt-8 rounded-xl border border-gray-800 bg-dark-100 p-6">
          <h2 id="status-help" className="mb-3 text-lg font-semibold text-white">Having trouble?</h2>
          <p className="mb-5 text-gray-400">Include your device model, channel or title, the time the problem occurred and any error message when contacting support. Keep passwords and playback links private.</p>
          <nav aria-label="Status help" className="flex flex-wrap gap-5 text-sm">
            <Link to="/support" className="text-primary hover:underline">Contact Support</Link>
            <Link to="/support/streaming" className="text-gray-300 hover:text-white">Playback troubleshooting</Link>
            <Link to="/support/issues" className="text-gray-300 hover:text-white">Known Issues</Link>
            <Link to="/support/maintenance" className="text-gray-300 hover:text-white">Maintenance Schedule</Link>
            <Link to="/support/status-history" className="text-gray-300 hover:text-white">Status History</Link>
          </nav>
        </section>
      </div>
    </div>
  );
}
