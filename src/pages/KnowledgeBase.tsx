import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, BookOpen, Search } from 'lucide-react';
import { filterHelpArticles, helpCategories } from '../lib/help-content';

export default function KnowledgeBase() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const query = params.get('q') || '';
  const articles = filterHelpArticles(category, query);
  const topic = helpCategories.find(item => item.slug === category);
  return (
    <div className="min-h-screen bg-dark-300 py-24">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-8 flex items-center gap-4"><BookOpen className="h-8 w-8 text-primary" /><h1 className="text-3xl font-bold text-white">Knowledge Base</h1></div>
        <label className="mb-2 block text-sm text-gray-300" htmlFor="help-search">Search help articles</label>
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input id="help-search" type="search" value={query} placeholder="Search articles..." onChange={event => {
            const next = new URLSearchParams(params);
            if (event.target.value) next.set('q', event.target.value); else next.delete('q');
            setParams(next, { replace: true });
          }} className="w-full rounded-lg border border-gray-800 bg-dark-100 py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:border-primary focus:outline-none" />
        </div>
        <nav aria-label="Help topics" className="mb-10 grid gap-4 sm:grid-cols-2">
          {helpCategories.map(item => (
            <Link key={item.slug} to={`/knowledge-base?category=${item.slug}`} aria-current={item.slug === category ? 'page' : undefined} className={`rounded-xl border bg-dark-100 p-5 transition-colors hover:border-primary ${item.slug === category ? 'border-primary' : 'border-gray-800'}`}>
              <h2 className="mb-2 text-lg font-semibold text-white">{item.name}</h2><p className="mb-3 text-sm text-gray-400">{item.description}</p>
              <span className="inline-flex items-center gap-2 text-primary">Browse articles<ArrowRight size={16} /></span>
            </Link>
          ))}
        </nav>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">{topic ? topic.name : category ? 'Help topic not found' : 'All Articles'}</h2>
          {(category || query) && <Link to="/knowledge-base" className="text-sm text-primary hover:underline">Browse all topics</Link>}
        </div>
        <div className="space-y-4" aria-live="polite">
          {articles.length === 0 ? <p className="rounded-xl border border-gray-800 bg-dark-100 p-6 text-gray-400">No articles match your search or topic. Try another term or browse all topics.</p>
            : articles.map(article => (
              <Link key={article.slug} to={`/support/article/${article.slug}`} className="block rounded-xl border border-gray-800 bg-dark-100 p-6 transition-colors hover:border-primary">
                {article.featured && <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-wide text-primary">Featured guide</span>}
                <h3 className="mb-2 text-lg font-semibold text-white">{article.title}</h3><p className="mb-3 text-gray-400">{article.description}</p>
                <span className="inline-flex items-center gap-2 text-sm text-primary">Read article<ArrowRight size={16} /></span>
              </Link>
            ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-5 text-sm"><Link to="/support/devices" className="text-primary hover:underline">Device setup guides</Link><Link to="/support" className="text-gray-400 hover:text-white">Back to Support</Link></div>
      </div>
    </div>
  );
}
