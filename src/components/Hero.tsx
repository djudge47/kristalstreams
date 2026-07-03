import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Content {
  id: number;
  title: string;
  image: string;
  videoPreview: string;
  viewers: number;
  language: string;
  quality: string;
  category: 'classic' | 'new' | 'tv';
  releaseYear: number;
  rating: number;
  type: 'movie' | 'tv';
}

const content: Content[] = [
  {
    id: 514,
    title: 'The Last of Us',
    image: 'https://image.tmdb.org/t/p/w1280/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
    videoPreview: 'https://assets.mixkit.co/videos/preview/mixkit-post-apocalyptic-city-streets-4004-large.mp4',
    viewers: 480000,
    language: 'Multi',
    quality: '4K',
    category: 'tv',
    releaseYear: 2023,
    rating: 8.8,
    type: 'tv'
  },
  {
    id: 508,
    title: 'House of the Dragon',
    image: 'https://image.tmdb.org/t/p/w1280/1X4h40fcB4WWUmIBK0auT4zRBAV.jpg',
    videoPreview: 'https://assets.mixkit.co/videos/preview/mixkit-medieval-castle-on-a-hill-4544-large.mp4',
    viewers: 680000,
    language: 'Multi',
    quality: '4K',
    category: 'tv',
    releaseYear: 2024,
    rating: 8.5,
    type: 'tv'
  },
  {
    id: 502,
    title: 'Dune: Part Two',
    image: 'https://image.tmdb.org/t/p/w1280/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
    videoPreview: 'https://assets.mixkit.co/videos/preview/mixkit-red-desert-landscape-2361-large.mp4',
    viewers: 580000,
    language: 'Multi',
    quality: '4K',
    category: 'new',
    releaseYear: 2024,
    rating: 8.7,
    type: 'movie'
  },
  {
    id: 512,
    title: 'Kung Fu Panda 4',
    image: 'https://image.tmdb.org/t/p/w1280/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg',
    videoPreview: 'https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-2408-large.mp4',
    viewers: 950000,
    language: 'Multi',
    quality: '4K',
    category: 'new',
    releaseYear: 2024,
    rating: 7.3,
    type: 'movie'
  },
  {
    id: 507,
    title: 'Oppenheimer',
    image: 'https://image.tmdb.org/t/p/w1280/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    videoPreview: 'https://assets.mixkit.co/videos/preview/mixkit-explosion-with-fire-2771-large.mp4',
    viewers: 890000,
    language: 'Multi',
    quality: '4K',
    category: 'new',
    releaseYear: 2024,
    rating: 9.1,
    type: 'movie'
  },
  {
    id: 516,
    title: 'The Equalizer 3',
    image: 'https://image.tmdb.org/t/p/w1280/b0Ej6fnXAP8fK75hlyi2jKqdhHz.jpg',
    videoPreview: 'https://assets.mixkit.co/videos/preview/mixkit-city-night-lights-in-the-background-9566-large.mp4',
    viewers: 520000,
    language: 'Multi',
    quality: '4K',
    category: 'new',
    releaseYear: 2024,
    rating: 7.9,
    type: 'movie'
  },
  {
  id: 1,
  title: 'Sinners',
  image: 'https://www.themoviedb.org/t/p/w600_and_h900_bestv2/yqsCU5XOP2mkbFamzAqbqntmfav.jpg',
  category: 'Action',
  releaseYear: 2025,
  rating: 8.5,
  type: 'movie'
}
];

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const [currentContent, setCurrentContent] = useState<Content>(content[0]);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [user, setUser] = useState(null);
  const [showFeatures, setShowFeatures] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isVideoPlaying) {
      const interval = setInterval(() => {
        handleNext();
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [isVideoPlaying]);

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

  return (
    <section className="relative w-full h-[85vh] flex items-center overflow-hidden mt-16">
      <div className="absolute inset-0">
        <div className="relative w-full h-full">
          {currentContent.videoPreview ? (
            <video
              src={currentContent.videoPreview}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                isTransitioning ? 'opacity-0' : 'opacity-100'
              }`}
              autoPlay
              loop
              muted
              playsInline
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
            />
          ) : (
            <img 
              src={currentContent.image}
              alt={currentContent.title}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                isTransitioning ? 'opacity-0' : 'opacity-100'
              }`}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-dark-300/95 via-dark-300/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-dark-300 via-transparent to-dark-300/30"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="max-w-2xl space-y-12">
            <div className="space-y-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Premium Streaming Experience
                <span className="block text-xl sm:text-2xl lg:text-3xl mt-4 text-primary">
                  18,000+ Channels • Movies • Sports • Shows
                </span>
              </h1>
              
              <p className="text-lg text-gray-300 leading-relaxed mt-6">
                Experience crystal-clear HD and 4K streaming with our global content library. 
                Watch anywhere, anytime, on any device.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 text-base text-gray-300">
              <div className="space-y-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-primary mr-4" />
                  <span>Live Sports & PPV Events</span>
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

            <div className="flex flex-wrap gap-8 pt-6">
              <button 
                onClick={handleStartWatching}
                className="bg-primary hover:bg-red-700 text-white px-10 py-5 rounded-lg text-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center group"
              >
                <Play size={28} className="mr-3 group-hover:scale-110 transition-transform duration-200" />
                Start Free Trial
              </button>
              <button 
                onClick={handleLearnMore}
                className="bg-gray-800/80 hover:bg-gray-700 text-white px-10 py-5 rounded-lg text-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center group backdrop-blur-sm"
              >
                <Info size={28} className="mr-3 group-hover:rotate-12 transition-transform duration-200" />
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
                    src={currentContent.image}
                    alt={currentContent.title}
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