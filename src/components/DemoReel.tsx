import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Clock, Film, Globe, Star, Tv, Users, Wifi, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DemoReelItem {
  id: string;
  title: string;
  category: string;
  channel: string;
  badge: string;
  meta: string;
  image_url: string;
  sort_order: number;
}

const fallbackScenes: DemoReelItem[] = [
  {
    id: 'fallback-1',
    title: 'Nightly News',
    category: 'News',
    channel: 'NBC NEWS',
    badge: 'NEW',
    meta: 'HD · Tonight at 6:30 PM',
    image_url: 'https://images.unsplash.com/photo-1522083165195-3424ed129620?auto=format&fit=crop&w=1600&q=80',
    sort_order: 1,
  },
  {
    id: 'fallback-2',
    title: 'Premier League Live',
    category: 'Sports',
    channel: 'SPORTS',
    badge: 'LIVE',
    meta: 'Live match coverage',
    image_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80',
    sort_order: 2,
  },
  {
    id: 'fallback-3',
    title: 'Blockbuster Cinema',
    category: 'Movies',
    channel: 'CINEMA',
    badge: '4K',
    meta: 'Premium movie collection',
    image_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
    sort_order: 3,
  },
  {
    id: 'fallback-4',
    title: 'Breaking News',
    category: 'News',
    channel: 'NEWS',
    badge: 'LIVE',
    meta: 'Updates throughout the day',
    image_url: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80',
    sort_order: 4,
  },
];

const channels = [
  ['201', 'ESPN'],
  ['301', 'HBO'],
  ['401', 'CNN'],
  ['105', 'FOX'],
  ['104', 'NBC'],
  ['502', 'SKY'],
  ['360', 'FOX NEWS'],
  ['245', 'TNT'],
];

const features = [
  { label: '4K HDR', icon: Zap },
  { label: '5 Screens', icon: Users },
  { label: 'Catch-Up TV', icon: Clock },
  { label: 'EPG Guide', icon: Star },
];

const stats = [
  { label: 'Live Channels', value: '18,000+', icon: Tv },
  { label: 'Movies & Shows', value: '60,000+', icon: Film },
  { label: 'Countries', value: '150+', icon: Globe },
  { label: 'Uptime', value: '99.9%', icon: Wifi },
];

function badgeClass(badge: string) {
  switch (badge.toUpperCase()) {
    case 'LIVE': return 'bg-green-600';
    case '4K': return 'bg-blue-600';
    case 'NEW': return 'bg-yellow-500';
    default: return 'bg-red-600';
  }
}

const DemoReel: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<DemoReelItem[]>(fallbackScenes);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    supabase
      .from('demo_reel_items')
      .select('id,title,category,channel,badge,meta,image_url,sort_order')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setItems(data as DemoReelItem[]);
      });
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex(index => (index + 1) % items.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [items.length]);

  const scene = useMemo(() => items[activeIndex] ?? fallbackScenes[0], [items, activeIndex]);
  const thumbnails = items.slice(0, 4);

  return (
    <section className="relative overflow-hidden bg-[#09090d] py-20 sm:py-24">
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center sm:mb-14">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-red-500">See It in Action</p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">The Streaming Experience You Deserve</h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-gray-400 sm:text-lg">
            18,000+ channels, 60,000+ titles, crystal-clear 4K — all on one platform.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-5 lg:grid-cols-[1fr_288px] lg:gap-7">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/60">
            <div className="relative aspect-video overflow-hidden">
              <img src={scene.image_url} alt={scene.title} className="h-full w-full object-cover grayscale" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/35" />
              <div className="absolute inset-x-0 top-0 h-[2px] bg-red-500" />

              <div className="absolute left-4 top-4 flex items-center gap-2">
                <span className={`${badgeClass(scene.badge)} rounded px-2 py-1 text-[10px] font-bold uppercase text-white`}>
                  {scene.badge}
                </span>
                <span className="rounded bg-black/70 px-2 py-1 text-xs font-semibold text-white">{scene.channel}</span>
              </div>

              <div className="absolute bottom-16 left-5 right-5">
                <p className="mb-1 text-xs uppercase tracking-widest text-gray-400">{scene.category}</p>
                <h3 className="text-2xl font-bold text-white sm:text-3xl">{scene.title}</h3>
                <p className="mt-1 text-sm text-gray-300">{scene.meta}</p>
              </div>

              <div className="absolute inset-x-0 bottom-0 flex overflow-x-auto bg-black/75 px-2 py-2 backdrop-blur-sm sm:px-4">
                {channels.map(([number, name], index) => (
                  <button
                    key={number}
                    onClick={() => setActiveIndex(index % items.length)}
                    className={`min-w-[54px] flex-1 rounded px-2 py-1 text-center transition ${
                      index % items.length === activeIndex ? 'bg-red-500/25 text-red-400' : 'text-gray-500 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="block text-[10px] font-bold">{number}</span>
                    <span className="hidden truncate text-[9px] sm:block">{name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              {thumbnails.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setActiveIndex(index)}
                  className={`relative aspect-video overflow-hidden rounded-xl border-2 transition ${
                    index === activeIndex ? 'border-red-500' : 'border-transparent opacity-65 hover:opacity-100'
                  }`}
                >
                  <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/35" />
                  <span className={`absolute left-1.5 top-1.5 ${badgeClass(item.badge)} rounded px-1.5 py-0.5 text-[8px] font-bold text-white`}>
                    {item.badge}
                  </span>
                  <span className="absolute bottom-1.5 left-1.5 right-1.5 truncate text-left text-[10px] font-semibold text-white">
                    {item.title}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {features.map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
                  <Icon size={17} className="text-red-500" />
                  <span className="text-xs font-medium text-white">{label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
              {stats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Icon size={15} className="text-red-500/80" />
                    {label}
                  </div>
                  <span className="text-sm font-bold text-white">{value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/pricing')}
              className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Start Free Trial
              <ChevronRight size={16} />
            </button>
            <p className="text-center text-xs text-gray-600">No credit card required. Cancel anytime.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoReel;
