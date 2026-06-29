import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSupportCategories, getSupportArticles } from '../lib/api';
import { Search, BookOpen, ArrowRight, Clock, ThumbsUp } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

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

const KnowledgeBase: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, articlesData] = await Promise.all([
          getSupportCategories(),
          getSupportArticles('getting-started')
        ]);
        setCategories(categoriesData);
        setArticles(articlesData);
      } catch (err) {
        setError('Failed to load knowledge base content');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredArticles = filteredArticles.filter(article => article.is_featured);
  const regularArticles = filteredArticles.filter(article => !article.is_featured);

  if (loading) {
    return (
      <div className="min-h-screen py-12 bg-dark-300">
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
      <div className="min-h-screen py-12 bg-dark-300">
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

  return (
    <div className="min-h-screen py-12 bg-dark-300">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <BookOpen className="text-primary w-8 h-8 mr-4" />
            <h1 className="text-3xl font-bold text-white">Knowledge Base</h1>
          </div>

          <div className="mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-100 border border-gray-800 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/support/${category.slug}`}
                className="bg-dark-100 rounded-xl p-6 border border-gray-800 hover:border-primary transition-all duration-300"
              >
                <h3 className="text-xl font-semibold text-white mb-2">{category.name}</h3>
                <p className="text-gray-400 mb-4">{category.description}</p>
                <div className="flex items-center text-primary">
                  <span className="mr-2">Browse articles</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>

          {featuredArticles.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-semibold text-white mb-6">Featured Articles</h2>
              <div className="space-y-4">
                {featuredArticles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/support/article/${article.slug}`}
                    className="block bg-dark-100 rounded-xl p-6 border border-gray-800 hover:border-primary transition-all duration-300"
                  >
                    <h3 className="text-lg font-semibold text-white mb-2">{article.title}</h3>
                    <p className="text-gray-400 line-clamp-2 mb-4">
                      {article.content.split('\n\n')[0]}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(article.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        {article.helpful_count} found helpful
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {regularArticles.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">All Articles</h2>
              <div className="space-y-4">
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

export default KnowledgeBase;