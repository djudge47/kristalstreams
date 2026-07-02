import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Play, Star } from 'lucide-react';
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
    type: 'tv',
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
    type: 'tv',
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
    type: 'movie',
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
    type: 'movie',
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
    type: 'movie',
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
    type: 'movie',
  },
  {
    id: 1,
    title: 'Sinners',
    image: 'https://www.themoviedb.org/t/p/w600_and_h900_bestv2/yqsCU5XOP2mkbFamzAqbqntmfav.jpg',
    videoPreview: '',
    viewers: 640000,
    language: 'English',
    quality: '4K',
    category: 'new',
    releaseYear: 2025,
    rating: 8.5,
    type: 'movie',
  },
];

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [user, setUser] = useState<unknown>(null);
  const currentContent = content[currentIndex];

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((index) => (index + 1) % content.length);
      window.setTimeout(() => setIsTransitioning(false), 500);
    }, 8000);
    return () => window.clearInterval(interval);
  }, []);

  const selectSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    window.setTimeout(() => setIsTransitioning(false), 500);
  };

  return (
    <section className="relative mt-16 flex h-[85vh] w-full items-center overflow-hidden">
      <div className="absolute inset-0">
        {currentContent.videoPreview ? (
          <video
            src={currentContent.videoPreview}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={currentContent.image}
            alt={currentContent.title}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-300/95 via-dark-300/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-300 via-transparent to-dark-300/30" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 md:grid-cols-2 lg:gap-16">
          <div className="max-w-2xl space-y-10">
            <div className="space-y-6">
              <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                Premium Streaming Experience
                <span className="mt-4 block text-xl text-primary sm:text-2xl lg:text-3xl">
                  21,000+ Channels • Movies • Sports • Shows
                </span>
              </h1>
              <p className="text-lg leading-relaxed text-gray-300">
                Experience crystal-clear HD and 4K streaming with our global content library. Watch anywhere, anytime, on any device.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 text-gray-300">
              {['Live Sports & PPV Events', 'Premium Movie Channels', 'International Content', '24/7 Customer Support'].map((feature) => (
                <div key={feature} className="flex items-center">
                  <Star className="mr-3 h-5 w-5 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-6 pt-4">
              <button
                onClick={() => navigate(user ? '/dashboard' : '/login')}
                className="group flex items-center rounded-lg bg-primary px-10 py-5 text-lg font-medium text-white transition hover:scale-105 hover:bg-red-700"
              >
                <Play size={28} className="mr-3" />
                Start Free Trial
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="group flex items-center rounded-lg bg-gray-800/80 px-10 py-5 text-lg font-medium text-white backdrop-blur-sm transition hover:scale-105 hover:bg-gray-700"
              >
                <Info size={28} className="mr-3" />
                Learn More
              </button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative mx-auto max-w-[350px]">
              <div className="absolute -inset-4 rounded-xl bg-gradient-to-r from-primary/30 to-primary/10 blur-xl" />
              <div className="relative rounded-xl border border-gray-800/50 bg-dark-200/80 p-8 backdrop-blur-sm">
                <div className="mb-6 aspect-[2/3] overflow-hidden rounded-lg">
                  <img src={currentContent.image} alt={currentContent.title} className="h-full w-full object-cover" />
                </div>
                <div className="flex items-center gap-3 text-primary">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  <span className="font-semibold">{currentContent.category === 'tv' ? 'TV SERIES' : 'NEW RELEASE'}</span>
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-white">{currentContent.title}</h3>
                <div className="mt-2 flex items-center gap-3 text-sm text-gray-400">
                  <span>{Math.round(currentContent.viewers / 1000)}k watching</span>
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

      <div className="absolute bottom-12 left-1/2 z-20 flex -translate-x-1/2 space-x-3">
        {content.map((item, index) => (
          <button
            key={item.id}
            onClick={() => selectSlide(index)}
            className={`h-2 rounded-full transition-all ${index === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-white/50 hover:bg-white/75'}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
