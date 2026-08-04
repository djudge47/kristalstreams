import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, Star } from 'lucide-react';

interface Content {
  id: number;
  title: string;
  image: string;
  poster: string;
  videoPreview: string;
  viewers: number;
  language: string;
  quality: string;
  category: 'classic' | 'new' | 'tv';
  releaseYear: number;
  rating: number;
  type: 'movie' | 'tv';
  imagePosition?: string;
  mobileImagePosition?: string;
}

const content: Content[] = [
  {
    id: 1,
    title: 'Sinners',
    image: 'https://image.tmdb.org/t/p/original/nAxGnGHOsfzufThz20zgmRwKur3.jpg',
    mobileImagePosition: 'center top',
    poster: 'https://image.tmdb.org/t/p/w780/705nQHqe4JGdEisrQmVYmXyjs1U.jpg',
    videoPreview: 'https://assets.mixkit.co/videos/preview/mixkit-dark-city-street-at-night-4007-large.mp4',
    viewers: 920000,
    language: 'Multi',
    quality: '4K',
    category: 'new',
    releaseYear: 2025,
    rating: 8.5,
    type: 'movie'
  },
  {
    id: 2,
    title: 'Avengers: Doomsday',
    image: 'https://image.tmdb.org/t/p/original/rGyYhezSXlgk3sqOgGSNooJSXLJ.jpg',
    mobileImagePosition: 'center top',
    poster: 'https://image.tmdb.org/t/p/w780/s2Fkuq0tj7mjAHEdbfQkFkdbeRI.jpg',
    videoPreview: 'https://assets.mixkit.co/videos/preview/mixkit-explosion-with-fire-2771-large.mp4',
    viewers: 1850000,
    language: 'Multi',
    quality: '4K',
    category: 'new',
    releaseYear: 2026,
    rating: 9.0,
    type: 'movie'
  },
  {
    id: 3,
    title: 'The Mandalorian & Grogu',
    image: 'https://image.tmdb.org/t/p/original/arjGfQaakBlmfWQGNdG2nFxrpMQ.jpg',
    mobileImagePosition: 'center top',
    poster: 'https://image.tmdb.org/t/p/w780/7QujwMB124KqSPbWlLRHBO5wygE.jpg',
    videoPreview: 'https://assets.mixkit.co/videos/preview/mixkit-red-desert-landscape-2361-large.mp4',
    viewers: 1100000,
    language: 'Multi',
    quality: '4K',
    category: 'new',
    releaseYear: 2026,
    rating: 8.9,
    type: 'movie'
  },
  {
    id: 4,
    title: 'Severance',
    image: 'https://image.tmdb.org/t/p/original/ixgFmf1X59PUZam2qbAfskx2gQr.jpg',
    mobileImagePosition: 'center top',
    poster: 'https://image.tmdb.org/t/p/w780/Rb7sga832Cyqvafd7CqOzbwdK4.jpg',
    videoPreview: 'https://assets.mixkit.co/videos/preview/mixkit-city-night-lights-in-the-background-9566-large.mp4',
    viewers: 780000,
    language: 'Multi',
    quality: '4K',
    category: 'tv',
    releaseYear: 2025,
    rating: 8.7,
    type: 'tv'
  },
  {
    id: 5,
    title: 'Andor Season 2',
    image: 'https://image.tmdb.org/t/p/original/6YncDyLRRVHp98fvGYOXXv2hflu.jpg',
    mobileImagePosition: 'center top',
    poster: 'https://image.tmdb.org/t/p/w780/ugkhd9olFiJwDgO3tK1ZrPxUdxQ.jpg',
    videoPreview: 'https://assets.mixkit.co/videos/preview/mixkit-post-apocalyptic-city-streets-4004-large.mp4',
    viewers: 860000,
    language: 'Multi',
    quality: '4K',
    category: 'tv',
    releaseYear: 2025,
    rating: 8.8,
    type: 'tv'
  },
  {
    id: 6,
    title: 'Superman',
    image: 'https://image.tmdb.org/t/p/original/eU7IfdWq8KQy0oNd4kKXS0QUR08.jpg',
    imagePosition: 'center top',
    mobileImagePosition: 'center top',
    poster: 'https://image.tmdb.org/t/p/w780/wPLysNDLffQLOVebZQCbXJEv6E6.jpg',
    videoPreview: 'https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-2408-large.mp4',
    viewers: 1400000,
    language: 'Multi',
    quality: '4K',
    category: 'new',
    releaseYear: 2025,
    rating: 7.8,
    type: 'movie'
  },
  {
    id: 7,
    title: 'The White Lotus S3',
    image: 'https://image.tmdb.org/t/p/original/qVBIAcZkK5j6WRq7JehJcOMbdgb.jpg',
    mobileImagePosition: 'center top',
    poster: 'https://image.tmdb.org/t/p/w780/3mpkSKUAkN1UGqrrigmxWbe9q9D.jpg',
    videoPreview: 'https://assets.mixkit.co/videos/preview/mixkit-medieval-castle-on-a-hill-4544-large.mp4',
    viewers: 690000,
    language: 'Multi',
    quality: '4K',
    category: 'tv',
    releaseYear: 2025,
    rating: 8.2,
    type: 'tv'
  }
];

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const [currentContent, setCurrentContent] = useState<Content>(content[0]);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

  useEffect(() => {
    const interval = setInterval(handleNext, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setDirection('next');
    setCurrentContent(prevContent => {
      const currentIndex = content.findIndex(item => item.id === prevContent.id);
      const nextIndex = (currentIndex + 1) % content.length;
      return content[nextIndex];
    });
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handleDotClick = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setDirection(index > content.findIndex(item => item.id === currentContent.id) ? 'next' : 'prev');
    setCurrentContent(content[index]);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handleStartWatching = () => {
    navigate('/free-trial');
  };

  const handleLearnMore = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      setShowFeatures(true);
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const heroImageStyle = {
    '--hero-image-position-mobile': currentContent.mobileImagePosition ?? 'center top',
    '--hero-image-position-desktop': currentContent.imagePosition ?? 'center center',
  } as React.CSSProperties;

  return (
    <section className="relative mt-16 flex h-[82vh] w-full items-end overflow-hidden sm:h-[85vh] sm:items-center">
      <style>{`
        .hero-desktop-image {
          object-position: var(--hero-image-position-desktop, center center);
        }

        .hero-mobile-poster {
          object-position: var(--hero-image-position-mobile, center top);
        }
      `}</style>
      <div className="absolute inset-0">
        <div className="relative h-full w-full">
          <img
            src={currentContent.poster}
            alt={currentContent.title}
            loading="eager"
            className={`hero-mobile-poster absolute inset-0 h-full w-full object-cover transition-opacity duration-500 sm:hidden ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
            style={heroImageStyle}
          />
          <img
            src={currentContent.image}
            alt={currentContent.title}
            loading="eager"
            className={`hero-desktop-image absolute inset-0 hidden h-full w-full object-cover transition-opacity duration-500 sm:block ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
            style={heroImageStyle}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90 sm:bg-gradient-to-r sm:from-dark-300/70 sm:via-dark-300/40 sm:to-transparent lg:from-dark-300/95 lg:via-dark-300/80"></div>
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-dark-300 via-dark-300/45 to-transparent sm:h-full sm:bg-gradient-to-t sm:from-dark-300 sm:via-transparent sm:to-dark-300/30"></div>
        </div>
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <div className="hidden max-w-2xl space-y-8 sm:block lg:space-y-12">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold leading-tight text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.85)] lg:text-5xl">
                Premium Streaming Experience
                <span className="mt-4 block text-2xl text-primary lg:text-3xl">
                  21,000+ Channels • Movies • Sports • Shows
                </span>
              </h1>
              
              <p className="mt-6 text-lg leading-relaxed text-gray-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                Experience crystal-clear HD and 4K streaming with our global content library. 
                Watch anywhere, anytime, on any device.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] md:gap-8 md:text-base">
              <div className="space-y-4">
                <div className="flex items-center">
                  <Star className="mr-4 h-5 w-5 text-primary" />
                  <span>Live Sports Events</span>
                </div>
                <div className="flex items-center">
                  <Star className="mr-4 h-5 w-5 text-primary" />
                  <span>Premium Movie Channels</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Star className="mr-4 h-5 w-5 text-primary" />
                  <span>International Content</span>
                </div>
                <div className="flex items-center">
                  <Star className="mr-4 h-5 w-5 text-primary" />
                  <span>24/7 Customer Support</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-6">
              <button
                onClick={handleStartWatching}
                className="group flex items-center justify-center rounded-lg bg-primary px-10 py-5 text-lg font-medium text-white transition-all duration-300 hover:scale-105 hover:bg-red-700"
              >
                <Play size={22} className="mr-3 transition-transform duration-200 group-hover:scale-110" />
                Start Free Trial
              </button>
              <button
                onClick={handleLearnMore}
                className="group flex items-center justify-center rounded-lg bg-gray-800/80 px-10 py-5 text-lg font-medium text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-gray-700"
              >
                <Info size={22} className="mr-3 transition-transform duration-200 group-hover:rotate-12" />
                Learn More
              </button>
            </div>
          </div>

          <div className="mb-12 space-y-4 pb-6 sm:hidden">
            <div className="inline-flex items-center rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/85 shadow-lg shadow-black/30">
              {currentContent.category === 'tv' ? 'Featured Series' : 'Featured Movie'}
            </div>

            <div className="max-w-[82%] space-y-2">
              <h1 className="text-3xl font-bold leading-[0.95] text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.95)]">
                {currentContent.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-white/85 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                <span>{currentContent.releaseYear}</span>
                <span className="h-1 w-1 rounded-full bg-primary"></span>
                <span>{currentContent.quality}</span>
                <span className="h-1 w-1 rounded-full bg-primary"></span>
                <span>{currentContent.type === 'tv' ? 'TV Series' : 'Movie'}</span>
              </div>
            </div>

            <p className="max-w-[88%] text-sm leading-relaxed text-white/80 drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
              Premium channels, movies, sports, and shows — ready to stream on your favorite device.
            </p>

            <div className="flex max-w-[92%] gap-2 pt-1">
              <button
                onClick={handleStartWatching}
                className="flex flex-1 items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/30 transition hover:bg-red-700"
              >
                <Play size={16} className="mr-2" />
                Start Trial
              </button>
              <button
                onClick={handleLearnMore}
                className="flex flex-1 items-center justify-center rounded-xl bg-white/12 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/18"
              >
                <Info size={16} className="mr-2" />
                Details
              </button>
            </div>
          </div>

          <div className="hidden lg:block"></div>
        </div>

        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-8">
          {content.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleDotClick(index)}
              className={`h-1.5 rounded-full transition-all duration-300 sm:h-2 ${
                item.id === currentContent.id ? 'w-7 bg-primary sm:w-8' : 'w-1.5 bg-white/50 hover:bg-white/80 sm:w-2'
              }`}
              aria-label={`Show ${item.title}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;