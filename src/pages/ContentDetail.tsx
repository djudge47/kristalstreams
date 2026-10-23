import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Play } from 'lucide-react';
import { findCatalogPreview } from '../lib/catalog-preview';

export default function ContentDetail() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const content = findCatalogPreview(type, id);
  if (!content) return (
    <div className="min-h-screen bg-dark-300 px-4 py-32 text-center">
      <h1 className="mb-4 text-3xl font-bold text-white">Title preview not found</h1>
      <p className="mb-6 text-gray-300">Choose an example title from the catalog preview.</p>
      <Link to="/" className="text-primary underline">Back to Home</Link>
    </div>
  );
  return (
    <div className="min-h-screen bg-dark-300 pb-16">
      <div className="relative flex min-h-[65vh] items-end">
        <img src={content.image} alt={content.title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-300 via-dark-300/70 to-black/30" />
        <div className="container relative mx-auto px-4 pb-10 pt-32">
          <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-200 hover:text-white"><ArrowLeft size={18} aria-hidden="true" />Back to Home</Link>
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">Catalog Preview</p>
          <h1 className="mb-4 text-4xl font-bold text-white sm:text-6xl">{content.title}</h1>
          <p className="text-gray-200">{content.category} · {content.releaseYear} · {content.type === 'tv' ? 'Series' : 'Movie'}</p>
        </div>
      </div>
      <div className="container mx-auto space-y-8 px-4">
        <section aria-labelledby="viewing-information" className="rounded-xl border border-primary/30 bg-dark-100 p-6 sm:p-8">
          <h2 id="viewing-information" className="mb-3 text-xl font-semibold text-white">How to watch your service</h2>
          <p className="mb-5 max-w-3xl text-gray-300">This page shows example title information. Streaming is accessed through the player and login supplied for your service. Check that player for current title availability.</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/support/getting-started" className="rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-red-700">Streaming Setup</Link>
            <Link to="/client/subscription" className="rounded-lg border border-gray-600 px-5 py-3 font-semibold text-white hover:border-primary">My Subscription</Link>
            <Link to="/player-demo" className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-5 py-3 text-white hover:border-primary"><Play size={18} aria-hidden="true" />Try the Sample Player</Link>
          </div>
        </section>
        <section aria-labelledby="title-preview-overview" className="max-w-3xl">
          <h2 id="title-preview-overview" className="mb-4 text-2xl font-bold text-white">Example Title Overview</h2>
          <p className="leading-relaxed text-gray-300">{content.description}</p>
        </section>
      </div>
    </div>
  );
}
