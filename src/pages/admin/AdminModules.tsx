import { Link } from 'react-router-dom';
import { unavailableAdminModules } from '../../lib/admin-modules';

export default function AdminModules() {
  return (
    <section aria-labelledby="admin-modules-title" className="mx-auto max-w-5xl">
      <h1 id="admin-modules-title" className="mb-3 text-2xl font-bold text-white">Unavailable Modules</h1>
      <p className="mb-6 max-w-3xl text-gray-300">These admin modules are unfinished. Their lists, reports and editing workflows are unavailable; this does not mean your saved customer records are empty.</p>
      <Link to="/admin/crm" className="mb-8 inline-flex min-h-12 items-center rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Open Customer Workspace</Link>
      <ul className="grid gap-4 md:grid-cols-2">
        {unavailableAdminModules.map(module => (
          <li key={module.path} className="rounded-xl border border-gray-700 bg-gray-800 p-5">
            <p className="mb-2 text-sm font-medium text-amber-300">Unavailable</p>
            <h2 className="mb-3 text-lg font-semibold text-white"><Link to={module.path} className="underline underline-offset-4 hover:text-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">{module.title}</Link></h2>
            <p className="text-sm leading-6 text-gray-300">{module.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
