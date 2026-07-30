import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
  const [user, setUser] = useState(null);
  const [showFeatures, setShowFeatures] = useState(false);

  useEffect(() => {
    let mounted = true;
    let subscription: any;

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setUser(session?.user || null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };

    const timeoutId = setTimeout(checkUser, 500);

    const setupSubscription = async () => {
      try {
        const { data } = supabase.auth.onAuthStateChange((_, session) => {
          if (mounted) {
            setUser(session?.user || null);
          }
        });
        subscription = data.subscription;
      } catch (error) {
        console.error('Auth subscription error:', error);
      }
    };

    setupSubscription();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

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
    if (!user) {
      navigate('/login');
    } else {
      navigate('/dashboard');
    }
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
    <section className="relative w-full h-[85vh] flex items-center overflow-hidden mt-16">
      <style>{`
        .hero-desktop-image {
          object-position: var(--hero-image-position-desktop, center center);
        }

        .hero-mobile-poster {
          object-position: var(--hero-image-position-mobile, center top);
        }
      `}</style>
      <div className="absolute inset-0">
        <div className="relative w-full h-full">
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
          <div className="absolute inset-0 bg-gradient-to-r from-dark-300/55 via-dark-300/20 to-transparent sm:from-dark-300/70 sm:via-dark-300/40 lg:from-dark-300/95 lg:via-dark-300/80"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-dark-300/82 via-transparent to-dark-300/10 sm:from-dark-300 sm:via-transparent sm:to-dark-300/30"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="max-w-2xl space-y-8 lg:space-y-12">
            <div className="space-y-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight drop-shadow-[0_3px_12px_rgba(0,0,0,0.85)]">
                Premium Streaming Experience
                <span className="block text-xl sm:text-2xl lg:text-3xl mt-4 text-primary">
                  21,000+ Channels • Movies • Sports • Shows
                </span>
              </h1>
              
              <p className="text-lg text-gray-200 leading-relaxed mt-6 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] sm:text-gray-300">
                Experience crystal-clear HD and 4K streaming with our global content library. 
                Watch anywhere, anytime, on any device.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-8 text-sm sm:text-base text-gray-200 sm:text-gray-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              <div className="space-y-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-primary mr-4" />
                  <span>Live Sports Events</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-primary mr-4" />
                  <span>Premium Movie Channels</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-primary mr-4" />
                  <span>International Content</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-primary mr-4" />
                  <span>24/7 Customer Support</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-2 sm:pt-6">
              <button
                onClick={handleStartWatching}
                className="bg-primary hover:bg-red-700 text-white px-6 sm:px-10 py-4 sm:py-5 rounded-lg text-base sm:text-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center group"
              >
                <Play size={22} className="mr-3 group-hover:scale-110 transition-transform duration-200" />
                Start Free Trial
              </button>
              <button
                onClick={handleLearnMore}
                className="bg-gray-800/80 hover:bg-gray-700 text-white px-6 sm:px-10 py-4 sm:py-5 rounded-lg text-base sm:text-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center group backdrop-blur-sm"
              >
                <Info size={22} className="mr-3 group-hover:rotate-12 transition-transform duration-200" />
                Learn More
              </button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative max-w-[350px] mx-auto">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-primary/10 rounded-xl blur-xl"></div>
              <div className="relative bg-dark-200/80 backdrop-blur-sm p-8 rounded-xl border border-gray-800/50 transform hover:scale-[1.02] transition-all duration-300">
                <div className="aspect-[2/3] rounded-lg overflow-hidden mb-6">
                  <img
                    src={currentContent.poster}
                    alt={currentContent.title}
                    loading="lazy"
                    width="350"
                    height="525"
                    className="w-full h-full object-cover transition-all duration-700 ease-in-out transform hover:scale-110"
                  />
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-primary font-semibold">
                      {currentContent.category === 'new' ? 'NEW RELEASE' : 
                       currentContent.category === 'tv' ? 'TV SERIES' : 'FEATURED'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-white">{currentContent.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span>{(currentContent.viewers / 1000).toFixed(0)}k watching</span>
                      <span>•</span>
                      <span>{currentContent.quality}</span>
                      <span>•</span>
                      <span>{currentContent.releaseYear}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
        {content.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentContent.id === content[index].id
                ? 'bg-primary w-8'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
            disabled={isTransitioning}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;