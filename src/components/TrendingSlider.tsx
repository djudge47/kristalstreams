import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { catalogPreviewItems as trendingContent } from '../lib/catalog-preview';

const TrendingSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 767px)');
    const update = () => setItemsPerPage(mobile.matches ? 1 : 4);
    update();
    mobile.addEventListener('change', update);
    return () => mobile.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    setCurrentIndex(trendingContent.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
        <h2 className="mb-3 text-2xl font-bold text-white">Catalog Preview</h2>
        <p className="mb-8 text-sm text-gray-300">Browse example titles. Check your streaming player for current availability. <Link to="/support/getting-started" className="text-primary underline">Streaming setup</Link></p>
        
        <div className="relative">
          <div
            className="overflow-hidden"
            style={{ touchAction: 'pan-y' }}
            onTouchStart={(event) => {
              const touch = event.touches[0];
              touchStart.current = { x: touch.clientX, y: touch.clientY };
              swiped.current = false;
            }}
            onTouchEnd={(event) => {
              if (!touchStart.current) return;
              const touch = event.changedTouches[0];
              const dx = touch.clientX - touchStart.current.x;
              const dy = touch.clientY - touchStart.current.y;
              touchStart.current = null;
              if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
                swiped.current = true;
                if (dx < 0) handleNext();
                else handlePrevious();
              }
            }}
            onTouchCancel={() => { touchStart.current = null; }}
            onClickCapture={(event) => {
              if (swiped.current) {
                event.preventDefault();
                event.stopPropagation();
                swiped.current = false;
              }
            }}
          >
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)` }}
            >
              {[...trendingContent, ...trendingContent, ...trendingContent].map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="w-full md:w-1/4 flex-shrink-0 px-0 md:px-2"
                >
                  <Link
                    className="relative block group"
                    to={`/content/${item.type}/${item.id}`}
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
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handlePrevious}
            className="absolute left-0 top-1/3 -translate-y-1/2 translate-x-2 md:--translate-x-2 md:translate-x-4 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full transition-all duration-200"
            aria-label="Previous slides"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-0 top-1/3 -translate-y-1/2 -translate-x-2 md:translate-x-4 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full transition-all duration-200"
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