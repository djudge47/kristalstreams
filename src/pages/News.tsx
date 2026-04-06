import React, { useState } from 'react';
import { Newspaper, Calendar, Clock, TrendingUp, Tv, Wifi, Zap, Globe } from 'lucide-react';

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  trending?: boolean;
}

const newsArticles: NewsArticle[] = [
  {
    id: '1',
    title: 'The Future of IPTV: 8K Streaming Becomes Reality',
    excerpt: 'Major IPTV providers are now rolling out 8K streaming capabilities, marking a new era in home entertainment quality.',
    content: 'The IPTV industry is experiencing a revolutionary shift as 8K streaming technology becomes increasingly accessible to consumers. Leading providers are investing heavily in infrastructure upgrades to support ultra-high-definition content delivery.',
    category: 'Technology',
    date: '2025-11-02',
    readTime: '5 min read',
    image: 'https://images.pexels.com/photos/1201996/pexels-photo-1201996.jpeg',
    trending: true
  },
  {
    id: '2',
    title: 'IPTV Market Growth Surges 45% in 2025',
    excerpt: 'Industry analysts report unprecedented growth in IPTV subscriptions as cord-cutting continues to accelerate globally.',
    content: 'The global IPTV market has witnessed remarkable expansion in 2025, with subscriber numbers increasing by 45% year-over-year. This growth is driven by improved streaming quality, competitive pricing, and the declining appeal of traditional cable services.',
    category: 'Industry',
    date: '2025-10-28',
    readTime: '4 min read',
    image: 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg',
    trending: true
  },
  {
    id: '3',
    title: 'New Regulations Reshape IPTV Landscape',
    excerpt: 'Governments worldwide implement new guidelines to ensure quality standards and consumer protection in IPTV services.',
    content: 'Recent regulatory frameworks are bringing significant changes to the IPTV industry. These new regulations focus on content licensing, data privacy, and quality assurance, ensuring consumers receive reliable and legitimate services.',
    category: 'Regulation',
    date: '2025-10-25',
    readTime: '6 min read',
    image: 'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg'
  },
  {
    id: '4',
    title: 'AI-Powered Content Recommendations Transform Viewing',
    excerpt: 'Advanced artificial intelligence algorithms are revolutionizing how IPTV platforms suggest content to subscribers.',
    content: 'IPTV providers are leveraging cutting-edge AI technology to deliver personalized viewing experiences. Machine learning algorithms analyze viewing patterns, preferences, and behaviors to offer highly accurate content recommendations.',
    category: 'Technology',
    date: '2025-10-20',
    readTime: '5 min read',
    image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg'
  },
  {
    id: '5',
    title: 'Sports Broadcasting Revolution Through IPTV',
    excerpt: 'Live sports streaming via IPTV reaches new heights with multi-angle viewing and interactive features.',
    content: 'The sports broadcasting industry is being transformed by IPTV technology. Viewers can now enjoy multiple camera angles, real-time statistics, and interactive features that traditional broadcasting cannot match.',
    category: 'Sports',
    date: '2025-10-15',
    readTime: '4 min read',
    image: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg',
    trending: true
  },
  {
    id: '6',
    title: '5G Networks Accelerate IPTV Mobile Streaming',
    excerpt: 'The rollout of 5G infrastructure enables seamless IPTV streaming on mobile devices without buffering.',
    content: 'The widespread deployment of 5G networks is eliminating one of the last barriers to mobile IPTV adoption. Users can now stream 4K content on smartphones and tablets without experiencing lag or quality degradation.',
    category: 'Technology',
    date: '2025-10-10',
    readTime: '5 min read',
    image: 'https://images.pexels.com/photos/4065876/pexels-photo-4065876.jpeg'
  },
  {
    id: '7',
    title: 'Cloud DVR Features Become Industry Standard',
    excerpt: 'IPTV providers universally adopt cloud-based recording capabilities, offering unlimited storage for subscribers.',
    content: 'Cloud DVR functionality has evolved from a premium feature to a standard offering across the IPTV industry. Subscribers now enjoy unlimited recording capabilities, cross-device playback, and intelligent content management.',
    category: 'Features',
    date: '2025-10-05',
    readTime: '4 min read',
    image: 'https://images.pexels.com/photos/1092671/pexels-photo-1092671.jpeg'
  },
  {
    id: '8',
    title: 'International Content Accessibility Expands',
    excerpt: 'IPTV platforms break down geographical barriers, offering global content libraries to subscribers worldwide.',
    content: 'The IPTV industry is making international content more accessible than ever. Advanced licensing agreements and geo-unblocking technologies allow subscribers to access diverse programming from around the world.',
    category: 'Global',
    date: '2025-09-30',
    readTime: '5 min read',
    image: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg'
  }
];

const categories = ['All', 'Technology', 'Industry', 'Sports', 'Features', 'Global', 'Regulation'];

const News: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  const trendingArticles = newsArticles.filter(article => article.trending);

  const filteredArticles = selectedCategory === 'All'
    ? newsArticles.filter(article => !article.trending)
    : newsArticles.filter(article => article.category === selectedCategory && !article.trending);

  if (selectedArticle) {
    return (
      <div className="min-h-screen py-32 bg-dark-300">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setSelectedArticle(null)}
              className="text-primary hover:text-red-700 mb-6 transition-colors duration-200"
            >
              &larr; Back to News
            </button>

            <div className="bg-dark-100 rounded-xl overflow-hidden border border-gray-800">
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="w-full h-96 object-cover"
              />

              <div className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                    {selectedArticle.category}
                  </span>
                  <div className="flex items-center text-gray-400 text-sm">
                    <Calendar size={16} className="mr-2" />
                    {new Date(selectedArticle.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="flex items-center text-gray-400 text-sm">
                    <Clock size={16} className="mr-2" />
                    {selectedArticle.readTime}
                  </div>
                </div>

                <h1 className="text-4xl font-bold text-white mb-6">
                  {selectedArticle.title}
                </h1>

                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 text-lg leading-relaxed mb-6">
                    {selectedArticle.content}
                  </p>
                  <p className="text-gray-300 text-lg leading-relaxed mb-6">
                    The implications of these developments are far-reaching for both consumers and industry stakeholders.
                    As technology continues to evolve, IPTV services are becoming increasingly sophisticated, offering
                    features and capabilities that were unimaginable just a few years ago.
                  </p>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    Industry experts predict that these trends will continue to accelerate, fundamentally transforming
                    how we consume media content. The convergence of improved infrastructure, advanced technology, and
                    changing consumer preferences is creating an exciting new era for streaming entertainment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-32 bg-dark-300">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Newspaper className="text-primary w-12 h-12 mr-4" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">IPTV News</h1>
            </div>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Stay updated with the latest trends, technology, and developments in the IPTV streaming industry
            </p>
          </div>

          {trendingArticles.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <TrendingUp className="text-primary w-6 h-6 mr-2" />
                <h2 className="text-2xl font-bold text-white">Trending Now</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {trendingArticles.map((article) => (
                  <div
                    key={article.id}
                    className="bg-dark-100 rounded-xl overflow-hidden border border-primary/30 hover:border-primary transition-all duration-300 cursor-pointer card-hover"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <div className="relative">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 bg-primary text-white rounded text-xs font-bold">
                          TRENDING
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                        {article.category}
                      </span>
                      <h3 className="text-lg font-semibold text-white mt-3 mb-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-gray-500 text-xs">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          {new Date(article.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="flex items-center">
                          <Clock size={14} className="mr-1" />
                          {article.readTime}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8">
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                    selectedCategory === category
                      ? 'bg-primary text-white'
                      : 'bg-dark-100 text-gray-400 hover:bg-dark-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                className="bg-dark-100 rounded-xl overflow-hidden border border-gray-800 hover:border-primary transition-all duration-300 cursor-pointer card-hover"
                onClick={() => setSelectedArticle(article)}
              >
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                    {article.category}
                  </span>
                  <h3 className="text-xl font-semibold text-white mt-3 mb-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-gray-500 text-xs">
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-1" />
                      {new Date(article.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      {article.readTime}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
              <div className="bg-primary/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Tv className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Industry Insights</h3>
              <p className="text-gray-400 text-sm">
                Get expert analysis on IPTV market trends, growth patterns, and future predictions from industry leaders.
              </p>
            </div>

            <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
              <div className="bg-primary/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Tech Updates</h3>
              <p className="text-gray-400 text-sm">
                Stay informed about the latest technological advancements in streaming quality, compression, and delivery.
              </p>
            </div>

            <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
              <div className="bg-primary/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Global Coverage</h3>
              <p className="text-gray-400 text-sm">
                Follow worldwide IPTV developments, regulatory changes, and international market expansions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default News;
