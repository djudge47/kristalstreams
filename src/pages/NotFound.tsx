import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section aria-labelledby="not-found-title" className="mx-auto w-full max-w-3xl px-4 py-16 sm:py-24">
      <div className="rounded-2xl border border-gray-800 bg-dark-100 p-6 sm:p-10">
        <p className="mb-3 text-sm font-semibold tracking-widest text-primary">404</p>
        <h1 id="not-found-title" className="mb-4 text-3xl font-bold text-white sm:text-4xl">Page not found</h1>
        <p className="max-w-xl text-gray-300">This address does not match a Kristal Streams page. Check the link, return home or use the help guides to find what you need.</p>
        <nav aria-label="Page recovery" className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to="/" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Go to Homepage</Link>
          <Link to="/knowledge-base" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-gray-600 px-5 py-3 font-semibold text-white hover:bg-dark-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Help Guides</Link>
          <Link to="/support" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-gray-600 px-5 py-3 font-semibold text-white hover:bg-dark-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Contact Support</Link>
        </nav>
      </div>
    </section>
  );
}
