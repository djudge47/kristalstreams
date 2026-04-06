import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSupportArticle, incrementArticleViews, markArticleHelpful } from '../../lib/api';
import { ThumbsUp } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
  helpful_count: number;
  support_categories: {
    name: string;
    slug: string;
  };
}

const Article: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMarkedHelpful, setHasMarkedHelpful] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        if (!slug) return;
        const data = await getSupportArticle(slug);
        setArticle(data);
        await incrementArticleViews(data.id);
      } catch (err) {
        setError('Failed to load article');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  const handleMarkHelpful = async () => {
    if (!article || hasMarkedHelpful) return;
    
    try {
      await markArticleHelpful(article.id);
      setArticle(prev => prev ? {
        ...prev,
        helpful_count: prev.helpful_count + 1
      } : null);
      setHasMarkedHelpful(true);
    } catch (err) {
      console.error('Failed to mark article as helpful:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-32 bg-dark-300">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-dark-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-dark-200 rounded w-3/4"></div>
              <div className="h-4 bg-dark-200 rounded w-2/3"></div>
              <div className="h-4 bg-dark-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen py-32 bg-dark-300">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
            <p className="text-gray-400">{error || 'Article not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-32 bg-dark-300">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="text-sm text-gray-400 mb-2">
              {article.support_categories.name}
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">{article.title}</h1>
          </div>

          <div className="prose prose-invert max-w-none mb-12">
            {article.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-gray-300 mb-4">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex items-center justify-between">
              <button
                onClick={handleMarkHelpful}
                disabled={hasMarkedHelpful}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                  hasMarkedHelpful
                    ? 'bg-primary/20 text-primary cursor-default'
                    : 'bg-dark-100 hover:bg-dark-200 text-gray-300'
                }`}
              >
                <ThumbsUp size={18} />
                <span>Helpful ({article.helpful_count})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Article;