import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Monitor } from 'lucide-react';
import { setupGuides } from '../../lib/help-content';

export default function DeviceSetup() {
  return (
    <div className="min-h-screen bg-dark-300 py-32">
      <div className="container mx-auto max-w-4xl px-4">
        <Link to="/support" className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white"><ArrowLeft size={18} />Back to Support</Link>
        <h1 className="mb-4 text-3xl font-bold text-white">Device Setup Guides</h1>
        <p className="mb-8 text-gray-400">Choose your device. Confirm the exact approved installer with support before updating an existing app, and preserve its saved users and settings.</p>
        <div className="grid gap-6 sm:grid-cols-2">
          {setupGuides.map(guide => (
            <Link key={guide.slug} to={`/support/guide/${guide.slug}`} className="rounded-xl border border-gray-800 bg-dark-100 p-6 transition-colors hover:border-primary">
              <Monitor className="mb-4 h-7 w-7 text-primary" />
              <h2 className="mb-2 text-xl font-semibold text-white">{guide.title}</h2>
              <p className="mb-3 text-sm text-primary">{guide.deviceType}</p>
              <p className="mb-4 text-gray-400">{guide.description}</p>
              <span className="inline-flex items-center gap-2 text-primary">Read setup guide<ArrowRight size={16} /></span>
            </Link>
          ))}
        </div>
        <p className="mt-8 text-gray-400">Not sure which guide applies? <Link to="/client/support/new" className="text-primary hover:underline">Contact support</Link> with your device model and operating system.</p>
      </div>
    </div>
  );
}
