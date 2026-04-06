import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TrendingContent {
  id: number;
  title: string;
  image: string;
  category: string;
  releaseYear: number;
  rating: number;
  type: 'movie' | 'tv' | 'sports';
  tmdbId: number;
}

const trendingContent: TrendingContent[] = [
  {
    id: 501,
    tmdbId: 1233413,
    title: 'Sinners',
    image: 'https://media.themoviedb.org/t/p/w1280/4CkZl1LK6a5rXBqJB2ZP77h3N5i.jpg',
    category: 'Horror',
    releaseYear: 2025,
    rating: 7.6,
    type: 'movie'
  },
  {
    id: 502,
    tmdbId: 696506,
    title: 'Mickey 17',
    image: 'https://media.themoviedb.org/t/p/w1280/edKpE9B5qN3e559OuMCLZdW1iBZ.jpg',
    category: 'Sci-Fi',
    releaseYear: 2025,
    rating: 6.7,
    type: 'movie'
  },
  {
    id: 503,
    tmdbId: 1061474,
    title: 'Superman',
    image: 'https://media.themoviedb.org/t/p/w1280/wPLysNDLffQLOVebZQCbXJEv6E6.jpg',
    category: 'Action',
    releaseYear: 2025,
    rating: 7.1,
    type: 'movie'
  },
  {
    id: 504,
    tmdbId: 950387,
    title: 'A Minecraft Movie',
    image: 'https://media.themoviedb.org/t/p/w1280/yFHHfHcUgGAxziP1C3lLt0q2T4s.jpg',
    category: 'Adventure',
    releaseYear: 2025,
    rating: 5.6,
    type: 'movie'
  },
  {
    id: 505,
    tmdbId: 95396,
    title: 'Severance',
    image: 'https://media.themoviedb.org/t/p/w1280/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg',
    category: 'Thriller',
    releaseYear: 2025,
    rating: 8.7,
    type: 'tv'
  },
  {
    id: 506,
    tmdbId: 83867,
    title: 'Andor',
    image: 'https://media.themoviedb.org/t/p/w1280/khZqmwHQicTYoS7Flreb9EddFZC.jpg',
    category: 'Sci-Fi',
    releaseYear: 2025,
    rating: 8.4,
    type: 'tv'
  },
  {
    id: 507,
    tmdbId: 111803,
    title: 'The White Lotus',
    image: 'https://media.themoviedb.org/t/p/w1280/gbSaK9v1CbcYH1ISgbM7XObD2dW.jpg',
    category: 'Drama',
    releaseYear: 2025,
    rating: 7.9,
    type: 'tv'
  },
  {
    id: 508,
    tmdbId: 249042,
    title: 'Adolescence',
    image: 'https://media.themoviedb.org/t/p/w1280/20i4nShZZg1g1VFHSB8xpaYM4r7.jpg',
    category: 'Crime',
    releaseYear: 2025,
    rating: 8.1,
    type: 'tv'
  }
];

const TrendingSlider: React.FC = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const itemsPerPage = 4;

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
    setCurrentIndex(trendingContent.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPreviewPlaying) {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPreviewPlaying]);

  useEffect(() => {
    if (currentIndex >= trendingContent.length * 2) {
      const timeout = setTimeout(() => {
        setCurrentIndex(trendingContent.length);
      }, 500);
      return () => clearTimeout(timeout);
    } else if (currentIndex < trendingContent.length) {
      const timeout = setTimeout(() => {
        setCurrentIndex(trendingContent.length);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <section className="py-16 bg-dark-300">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-white mb-8">Trending Now</h2>
        
        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 25}%)` }}
            >
              {[...trendingContent, ...trendingContent, ...trendingContent].map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="w-1/4 flex-shrink-0 px-2"
                >
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => navigate(`/content/${item.type}/${item.id}`)}
                  >
                    <div className="aspect-[2/3] rounded-lg overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="text-white font-medium text-sm">
                            {item.title}
                          </div>
                          <div className="flex items-center text-xs text-gray-400 mt-1">
                            <span>{item.category}</span>
                            <span className="mx-1">•</span>
                            <span>{item.releaseYear}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <h3 className="text-white font-medium text-sm truncate">{item.title}</h3>
                      <div className="flex items-center text-xs text-gray-400 mt-1">
                        <span>{item.category}</span>
                        <span className="mx-1">•</span>
                        <span>{item.releaseYear}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handlePrevious}
            className="absolute left-0 top-1/3 -translate-y-1/2 -translate-x-4 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full transition-all duration-200"
            aria-label="Previous slides"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-0 top-1/3 -translate-y-1/2 translate-x-4 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full transition-all duration-200"
            aria-label="Next slides"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default TrendingSlider;