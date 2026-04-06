import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Plus, ThumbsUp, Share2, Star, Calendar, Clock, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import VideoPlayer from '../components/VideoPlayer';

interface ContentData {
  id: number;
  tmdbId: number;
  title: string;
  image: string;
  category: string;
  releaseYear: number;
  rating: number;
  type: 'movie' | 'tv' | 'sports';
  description: string;
  duration?: string;
  cast?: string[];
  director?: string;
  seasons?: number;
  episodes?: number;
  streamUrl?: string;
}

const contentDatabase: Record<number, ContentData> = {
  501: {
    id: 501,
    tmdbId: 1233413,
    title: 'Sinners',
    image: 'https://media.themoviedb.org/t/p/w1280/4CkZl1LK6a5rXBqJB2ZP77h3N5i.jpg',
    category: 'Horror',
    releaseYear: 2025,
    rating: 7.6,
    type: 'movie',
    description: 'Trying to leave their troubled lives behind, twin brothers return to their hometown to start again, only to discover that an even greater evil is waiting to welcome them back.',
    duration: '2h 17m',
    director: 'Ryan Coogler',
    cast: ['Michael B. Jordan', 'Hailee Steinfeld', 'Jack O\'Connell', 'Wunmi Mosaku'],
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
  },
  502: {
    id: 502,
    tmdbId: 696506,
    title: 'Mickey 17',
    image: 'https://media.themoviedb.org/t/p/w1280/edKpE9B5qN3e559OuMCLZdW1iBZ.jpg',
    category: 'Sci-Fi',
    releaseYear: 2025,
    rating: 6.7,
    type: 'movie',
    description: 'Mickey Barnes has found himself in the extraordinary circumstance of working for an employer who demands the ultimate commitment to the job... to die, for a living.',
    duration: '2h 30m',
    director: 'Bong Joon-ho',
    cast: ['Robert Pattinson', 'Naomi Ackie', 'Steven Yeun', 'Toni Collette', 'Mark Ruffalo'],
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
  },
  503: {
    id: 503,
    tmdbId: 1061474,
    title: 'Superman',
    image: 'https://media.themoviedb.org/t/p/w1280/wPLysNDLffQLOVebZQCbXJEv6E6.jpg',
    category: 'Action',
    releaseYear: 2025,
    rating: 7.1,
    type: 'movie',
    description: 'Superman embarks on a journey to reconcile his Kryptonian heritage with his human upbringing as Clark Kent of Smallville, Kansas.',
    duration: '2h 15m',
    director: 'James Gunn',
    cast: ['David Corenswet', 'Rachel Brosnahan', 'Nicholas Hoult', 'Edi Gathegi'],
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
  },
  504: {
    id: 504,
    tmdbId: 950387,
    title: 'A Minecraft Movie',
    image: 'https://media.themoviedb.org/t/p/w1280/yFHHfHcUgGAxziP1C3lLt0q2T4s.jpg',
    category: 'Adventure',
    releaseYear: 2025,
    rating: 5.6,
    type: 'movie',
    description: 'Four misfits find themselves struggling with ordinary problems when they are suddenly pulled through a mysterious portal into the Overworld: a bizarre, cubic wonderland that thrives on imagination.',
    duration: '1h 45m',
    director: 'Jared Hess',
    cast: ['Jason Momoa', 'Jack Black', 'Danielle Brooks', 'Emma Myers'],
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
  },
  505: {
    id: 505,
    tmdbId: 95396,
    title: 'Severance',
    image: 'https://media.themoviedb.org/t/p/w1280/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg',
    category: 'Thriller',
    releaseYear: 2025,
    rating: 8.7,
    type: 'tv',
    description: 'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. Season 2 continues as Mark and his friends learn the dire consequences of trifling with the severance barrier.',
    seasons: 2,
    episodes: 20,
    cast: ['Adam Scott', 'Britt Lower', 'Zach Cherry', 'Patricia Arquette'],
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
  },
  506: {
    id: 506,
    tmdbId: 83867,
    title: 'Andor',
    image: 'https://media.themoviedb.org/t/p/w1280/khZqmwHQicTYoS7Flreb9EddFZC.jpg',
    category: 'Sci-Fi',
    releaseYear: 2025,
    rating: 8.4,
    type: 'tv',
    description: 'In an era filled with danger, deception and intrigue, Cassian Andor will discover the difference he can make in the struggle against the tyrannical Galactic Empire.',
    seasons: 2,
    episodes: 24,
    cast: ['Diego Luna', 'Genevieve O\'Reilly', 'Stellan Skarsgård', 'Adria Arjona'],
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
  },
  507: {
    id: 507,
    tmdbId: 111803,
    title: 'The White Lotus',
    image: 'https://media.themoviedb.org/t/p/w1280/gbSaK9v1CbcYH1ISgbM7XObD2dW.jpg',
    category: 'Drama',
    releaseYear: 2025,
    rating: 7.9,
    type: 'tv',
    description: 'A social satire set at an exclusive Thai resort following various guests and employees over the span of a week as darker complexities emerge.',
    seasons: 3,
    episodes: 6,
    cast: ['Natasha Rothwell', 'Parker Posey', 'Jason Isaacs', 'Michelle Monaghan'],
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
  },
  508: {
    id: 508,
    tmdbId: 249042,
    title: 'Adolescence',
    image: 'https://media.themoviedb.org/t/p/w1280/20i4nShZZg1g1VFHSB8xpaYM4r7.jpg',
    category: 'Crime',
    releaseYear: 2025,
    rating: 8.1,
    type: 'tv',
    description: 'When a 13-year-old is accused of the murder of a classmate, his family, therapist and the detective in charge are all left asking: what really happened? Winner of 8 Emmy Awards including Outstanding Limited Series.',
    seasons: 1,
    episodes: 8,
    cast: ['Stephen Graham', 'Owen Cooper', 'Erin Doherty', 'Ashley Walters'],
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
  }
};

const ContentDetail: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [content, setContent] = useState<ContentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);

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
    if (id) {
      const contentData = contentDatabase[parseInt(id)];
      if (contentData) {
        setContent(contentData);
      }
      setIsLoading(false);
    }
  }, [id]);

  const handleWatch = () => {
    if (!user) {
      navigate('/login');
    } else {
      setShowPlayer(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-400 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-dark-400 flex items-center justify-center">
        <div className="text-white text-xl">Content not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-400">
      {showPlayer && content?.streamUrl && (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setShowPlayer(false)}
              className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-lg"
            >
              <X size={28} />
            </button>
          </div>
          <div className="w-full h-full max-w-7xl px-4 flex items-center justify-center">
            <div className="w-full">
              <VideoPlayer
                src={content.streamUrl}
                poster={content.image}
                title={content.title}
                autoplay={true}
              />
            </div>
          </div>
        </div>
      )}

      <div className="relative h-[70vh]">
        <div className="absolute inset-0">
          <img
            src={content.image}
            alt={content.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-400 via-dark-400/60 to-transparent" />
        </div>

        <div className="relative container mx-auto px-4 h-full flex flex-col justify-end pb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">{content.title}</h1>

          <div className="flex items-center gap-4 text-white mb-6">
            <div className="flex items-center gap-2">
              <Star className="text-yellow-400 fill-yellow-400" size={20} />
              <span className="font-medium">{content.rating}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={20} />
              <span>{content.releaseYear}</span>
            </div>
            {content.duration && (
              <div className="flex items-center gap-2">
                <Clock size={20} />
                <span>{content.duration}</span>
              </div>
            )}
            {content.seasons && (
              <span>{content.seasons} Season{content.seasons > 1 ? 's' : ''}</span>
            )}
            <span className="px-3 py-1 bg-white/20 rounded-md text-sm">{content.category}</span>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={handleWatch}
              className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors"
            >
              <Play size={20} fill="white" />
              Watch Now
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors">
              <Plus size={20} />
              My List
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors">
              <ThumbsUp size={20} />
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              {content.description}
            </p>

            {content.cast && content.cast.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-3">Cast</h3>
                <div className="flex flex-wrap gap-2">
                  {content.cast.map((actor, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-dark-300 text-gray-300 rounded-lg text-sm"
                    >
                      {actor}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {content.director && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-3">Director</h3>
                <span className="px-4 py-2 bg-dark-300 text-gray-300 rounded-lg">
                  {content.director}
                </span>
              </div>
            )}
          </div>

          <div>
            <div className="bg-dark-300 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Details</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-gray-400 text-sm">Type</dt>
                  <dd className="text-white capitalize">{content.type}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-sm">Genre</dt>
                  <dd className="text-white">{content.category}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-sm">Release Year</dt>
                  <dd className="text-white">{content.releaseYear}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-sm">Rating</dt>
                  <dd className="text-white">{content.rating}/10</dd>
                </div>
                {content.duration && (
                  <div>
                    <dt className="text-gray-400 text-sm">Duration</dt>
                    <dd className="text-white">{content.duration}</dd>
                  </div>
                )}
                {content.seasons && (
                  <>
                    <div>
                      <dt className="text-gray-400 text-sm">Seasons</dt>
                      <dd className="text-white">{content.seasons}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-400 text-sm">Episodes</dt>
                      <dd className="text-white">{content.episodes}</dd>
                    </div>
                  </>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentDetail;
