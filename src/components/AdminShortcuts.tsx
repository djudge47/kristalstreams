import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { adminShortcuts } from '../lib/admin-modules';

export default function AdminShortcuts() {
  return (
    <nav aria-label="Admin shortcuts" className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-amber-600/30 bg-amber-600/10 px-4 py-3">
      <Shield className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
      <span className="mr-2 text-sm font-medium text-amber-400">Admin</span>
      {adminShortcuts.map(({ label, path }) => (
        <Link key={path} to={path} className="inline-flex min-h-11 items-center rounded-lg border border-amber-600/30 bg-amber-600/20 px-3 py-2 text-xs text-amber-300 transition-colors hover:bg-amber-600/40 hover:text-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{label}</Link>
      ))}
    </nav>
  );
}
