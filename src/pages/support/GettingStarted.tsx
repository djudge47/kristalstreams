import React, { useEffect, useState } from 'react';
import { getSupportArticles } from '../../lib/api';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, Clock } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  is_featured: boolean;
  views: number;
  helpful_count: number;
  created_at: string;
}

const GettingStarted: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const data = await getSupportArticles('getting-started');
        setArticles(data);
      } catch (err) {
        setError('Failed to load articles');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen py-32 bg-dark-300">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-12 bg-dark-200 rounded-lg w-1/3"></div>
              <div className="h-6 bg-dark-200 rounded w-3/4"></div>
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-dark-100 rounded-xl p-6">
                    <div className="h-6 bg-dark-200 rounded w-1/2 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-dark-200 rounded w-3/4"></div>
                      <div className="h-4 bg-dark-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-32 bg-dark-300">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Error Loading Content</h2>
            <p className="text-gray-400 mb-8">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-primary hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const featuredArticles = articles.filter(article => article.is_featured);
  const regularArticles = articles.filter(article => !article.is_featured);

  return (
    <div className="min-h-screen py-32 bg-dark-300">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <BookOpen className="text-primary w-8 h-8 mr-4" />
            <h1 className="text-3xl font-bold text-white">Getting Started Guide</h1>
          </div>

          <p className="text-lg text-gray-300 mb-12">
            Welcome to Kristal Streams! Find everything you need to know to get started
            with our streaming service and make the most of your subscription.
          </p>

          {featuredArticles.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-semibold text-white mb-6">Featured Guides</h2>
              <div className="grid gap-6">
                {featuredArticles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/support/article/${article.slug}`}
                    className="block bg-dark-100 rounded-xl p-6 border border-gray-800 hover:border-primary transition-all duration-300"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">{article.title}</h3>
                        <p className="text-gray-400 line-clamp-2">
                          {article.content.split('\n\n')[0]}
                        </p>
                      </div>
                      <ArrowRight className="text-primary w-5 h-5 flex-shrink-0 mt-1" />
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(article.created_at).toLocaleDateString()}
                      </span>
                      <span>Views: {article.views}</span>
                      <span>Helpful: {article.helpful_count}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {regularArticles.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">More Resources</h2>
              <div className="grid gap-4">
                {regularArticles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/support/article/${article.slug}`}
                    className="block bg-dark-100 rounded-lg p-4 hover:bg-dark-200 transition-colors duration-200"
                  >
                    <h3 className="text-lg font-medium text-white mb-1">{article.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-1">
                      {article.content.split('\n\n')[0]}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GettingStarted;