import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Monitor, ThumbsUp } from 'lucide-react';
import { getSetupGuide, incrementGuideViews } from '../../lib/api';

interface Guide {
  id: string;
  title: string;
  content: string;
  device_type: string;
  difficulty: string;
  estimated_time: number;
  views: number;
  helpful_count: number;
}

const Guide: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMarkedHelpful, setHasMarkedHelpful] = useState(false);

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        if (!slug) return;
        const data = await getSetupGuide(slug);
        setGuide(data);
        await incrementGuideViews(data.id);
      } catch (err) {
        setError('Failed to load guide');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGuide();
  }, [slug]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'text-green-500';
      case 'medium':
        return 'text-yellow-500';
      case 'hard':
        return 'text-red-500';
      default:
        return 'text-gray-500';
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

  if (error || !guide) {
    return (
      <div className="min-h-screen py-32 bg-dark-300">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
            <p className="text-gray-400">{error || 'Guide not found'}</p>
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
            <div className="flex items-center mb-4">
              <Monitor className="text-primary w-8 h-8 mr-4" />
              <h1 className="text-3xl font-bold text-white">{guide.title}</h1>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-400">{guide.device_type}</span>
              <span className={`${getDifficultyColor(guide.difficulty)}`}>
                {guide.difficulty}
              </span>
              <span className="text-gray-400">{guide.estimated_time} min</span>
              <span className="text-gray-400">{guide.views} views</span>
            </div>
          </div>

          <div className="prose prose-invert max-w-none mb-12">
            {guide.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-gray-300 mb-4">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setHasMarkedHelpful(true)}
                disabled={hasMarkedHelpful}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                  hasMarkedHelpful
                    ? 'bg-primary/20 text-primary cursor-default'
                    : 'bg-dark-100 hover:bg-dark-200 text-gray-300'
                }`}
              >
                <ThumbsUp size={18} />
                <span>Helpful ({guide.helpful_count})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Guide;