import { Link, useLocation } from 'react-router-dom';
import { unavailableAdminModule } from '../../lib/admin-modules';

export default function AdminModuleUnavailable() {
  const module = unavailableAdminModule(useLocation().pathname);
  return (
    <section aria-labelledby="admin-module-title" className="mx-auto max-w-3xl rounded-xl border border-gray-700 bg-gray-800 p-6 sm:p-8">
      <p className="mb-3 text-sm font-medium text-amber-300">Unavailable module</p>
      <h1 id="admin-module-title" className="mb-4 text-2xl font-bold text-white">{module?.title ?? 'Admin module'}</h1>
      <p className="text-gray-300">{module?.description ?? 'This admin workflow is not available.'}</p>
      <p className="mt-4 text-sm text-gray-400">No records were loaded or saved by this screen. Use the Customer Workspace for existing streaming-customer records, received payments and follow-ups.</p>
      <nav aria-label="Available admin destinations" className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link to="/admin/crm" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Open Customer Workspace</Link>
        <Link to="/admin/modules" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-gray-600 px-5 py-3 font-semibold text-white hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">View Unavailable Modules</Link>
      </nav>
    </section>
  );
}
