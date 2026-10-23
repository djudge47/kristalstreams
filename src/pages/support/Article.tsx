import { Link, useParams } from 'react-router-dom';
import { findHelpArticle } from '../../lib/help-content';
import SupportPage from './SupportPage';

export default function Article() {
  const { slug } = useParams<{ slug: string }>();
  const article = findHelpArticle(slug);
  if (!article) return (
    <div className="min-h-screen bg-dark-300 px-4 py-32 text-center">
      <h1 className="mb-4 text-3xl font-bold text-white">Article not found</h1>
      <p className="mb-6 text-gray-400">Choose an article from the Knowledge Base or contact support for help.</p>
      <Link to="/knowledge-base" className="text-primary hover:underline">Browse the Knowledge Base</Link>
    </div>
  );
  return <SupportPage {...article} backLink={{ title: 'Back to Knowledge Base', url: `/knowledge-base?category=${article.category}` }} />;
}
