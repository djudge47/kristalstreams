import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Tv, Check, Star, Trophy, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import nflKickoffImage from '../assets/nflKickoffImage';

interface PPVEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  sport: string;
  mainEvent: string;
  description: string;
  featured: boolean;
  image: string;
}

const PPV: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState<string>('all');

  const ppvEvents: PPVEvent[] = [
    {
      id: '6',
      title: 'UFC 329: McGregor vs Holloway 2',
      date: 'July 11, 2026',
      time: '10:00 PM ET',
      venue: 'T-Mobile Arena, Las Vegas',
      sport: 'UFC',
      mainEvent: 'Conor McGregor vs Max Holloway',
      description: 'Conor McGregor returns for a blockbuster rematch with former champion Max Holloway during International Fight Week',
      featured: true,
      image: 'https://images.unsplash.com/photo-1611077479643-5b3c01381f9e?auto=format&fit=crop&w=1200&q=85'
    },
    {
      id: '2',
      title: '2026 MLB All-Star Game',
      date: 'July 14, 2026',
      time: '8:00 PM ET',
      venue: 'Citizens Bank Park, Philadelphia',
      sport: 'MLB',
      mainEvent: 'American League vs National League',
      description: 'Baseball\'s biggest stars take the field in Philadelphia for the Midsummer Classic',
      featured: true,
      image: 'https://images.unsplash.com/photo-1508344928928-7165b67de128?auto=format&fit=crop&w=1200&q=85'
    },
    {
      id: '1',
      title: 'WNBA All-Star Game 2026',
      date: 'July 25, 2026',
      time: 'Time TBA',
      venue: 'United Center, Chicago',
      sport: 'WNBA',
      mainEvent: 'WNBA All-Star Game',
      description: 'The league\'s brightest stars meet in Chicago for the 2026 WNBA All-Star showcase',
      featured: true,
      image: '/ppv/wnba-all-star-2026.svg'
    },
    {
      id: '7',
      title: 'WWE SummerSlam 2026',
      date: 'August 1–2, 2026',
      time: 'Start Time TBA',
      venue: 'U.S. Bank Stadium, Minneapolis',
      sport: 'WWE',
      mainEvent: 'Two-Night SummerSlam',
      description: 'WWE brings one of its biggest events of the year to Minneapolis for a massive two-night stadium show',
      featured: true,
      image: 'https://images.unsplash.com/photo-1488656711237-487ce1cc53b7?auto=format&fit=crop&w=1200&q=85'
    },
    {
      id: '4',
      title: 'Leagues Cup 2026',
      date: 'August 4 – September 6, 2026',
      time: 'Schedule Varies',
      venue: 'MLS & Liga MX Stadiums',
      sport: 'MLS',
      mainEvent: 'Leagues Cup Final',
      description: 'Top MLS and Liga MX clubs compete across North America for the Leagues Cup title',
      featured: true,
      image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=85'
    },
    {
      id: '8',
      title: 'UFC 330: Makhachev vs Garry',
      date: 'August 15, 2026',
      time: '9:00 PM ET',
      venue: 'Xfinity Mobile Arena, Philadelphia',
      sport: 'UFC',
      mainEvent: 'Islam Makhachev vs Ian Machado Garry',
      description: 'Islam Makhachev defends the welterweight championship against Ian Machado Garry in Philadelphia',
      featured: true,
      image: 'https://images.unsplash.com/photo-1680022548963-1d8e630a272b?auto=format&fit=crop&w=1200&q=85'
    },
    {
      id: '3',
      title: 'Mayer vs Cameron',
      date: 'August 29, 2026',
      time: 'Time TBA',
      venue: 'Birmingham, England',
      sport: 'Boxing',
      mainEvent: 'Super Welterweight Title Unification',
      description: 'Mikaela Mayer and Chantelle Cameron meet in a major world-title unification bout',
      featured: true,
      image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=85'
    },
    {
      id: '9',
      title: 'WWE Money in the Bank 2026',
      date: 'September 6, 2026',
      time: 'Start Time TBA',
      venue: 'Smoothie King Center, New Orleans',
      sport: 'WWE',
      mainEvent: 'Men\'s & Women\'s Money in the Bank Matches',
      description: 'WWE Superstars battle in signature ladder matches for guaranteed future championship opportunities',
      featured: true,
      image: 'https://images.unsplash.com/photo-1636391134068-083dd5e3209b?auto=format&fit=crop&w=1200&q=85'
    },
    {
      id: '11',
      title: '2026 NFL Kickoff: Patriots vs Seahawks',
      date: 'September 9, 2026',
      time: '8:20 PM ET',
      venue: 'Lumen Field, Seattle',
      sport: 'NFL',
      mainEvent: 'New England Patriots vs Seattle Seahawks',
      description: 'The 2026 NFL season opens with a prime-time Super Bowl LX rematch in Seattle',
      featured: true,
      image: nflKickoffImage
    },
    {
      id: '5',
      title: '2026 NHL Heritage Classic',
      date: 'October 25, 2026',
      time: 'Time TBA',
      venue: 'Princess Auto Stadium, Winnipeg',
      sport: 'NHL',
      mainEvent: 'Winnipeg Jets vs Montreal Canadiens',
      description: 'Canadian rivals meet outdoors in one of hockey\'s signature showcase events',
      featured: true,
      image: 'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?auto=format&fit=crop&w=1200&q=85'
    },
    {
      id: '10',
      title: 'NBA 2026 Season',
      date: '2026–27 Season',
      time: 'Schedule TBA',
      venue: 'NBA Arenas',
      sport: 'NBA',
      mainEvent: 'Regular Season & Playoffs',
      description: 'Follow marquee NBA matchups throughout the 2026–27 season',
      featured: true,
      image: '/ppv/nba-2026-season.svg'
    }
  ];

  const sports = ['all', 'UFC', 'WWE', 'NBA', 'NFL', 'Boxing', 'MLB', 'NHL', 'MLS'];

  const filteredEvents = selectedSport === 'all'
    ? ppvEvents
    : ppvEvents.filter(event => event.sport === selectedSport);

  return (
    <div className="min-h-screen bg-dark-300 py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Upcoming PPV Events
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            Watch every major Pay-Per-View event live in stunning HD and 4K quality.
            Throughout 2026, never miss the biggest fights, games, and shows.
          </p>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <div className="bg-dark-100 rounded-xl p-6 border border-gray-800 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
              <Tv className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">4K Quality</h3>
            <p className="text-gray-400 text-sm">Crystal clear streaming in up to 4K resolution</p>
          </div>
          <div className="bg-dark-100 rounded-xl p-6 border border-gray-800 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Live & On-Demand</h3>
            <p className="text-gray-400 text-sm">Watch live or replay anytime after the event</p>
          </div>
          <div className="bg-dark-100 rounded-xl p-6 border border-gray-800 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Extra Cost</h3>
            <p className="text-gray-400 text-sm">All PPV events included with your subscription</p>
          </div>
          <div className="bg-dark-100 rounded-xl p-6 border border-gray-800 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">All Devices</h3>
            <p className="text-gray-400 text-sm">Stream on any device, anywhere in the world</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {sports.map(sport => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                selectedSport === sport
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-dark-100 text-gray-400 border border-gray-800 hover:border-primary hover:text-white'
              }`}
            >
              {sport === 'all' ? 'All Events' : sport}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredEvents.map(event => (
            <div
              key={event.id}
              className="bg-dark-100 rounded-xl overflow-hidden border border-gray-800 hover:border-primary transition-all duration-300 group"
            >
              {/* Event Image */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />
                {event.featured && (
                  <div className="absolute top-4 right-4 bg-primary px-3 py-1 rounded-full flex items-center gap-2">
                    <Star className="w-4 h-4 text-white" fill="white" />
                    <span className="text-white text-sm font-semibold">Featured</span>
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-dark-300/90 px-3 py-1 rounded-full">
                  <span className="text-white text-sm font-semibold">{event.sport}</span>
                </div>
              </div>

              {/* Event Details */}
              <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                  {event.title}
                </h3>
                <p className="text-gray-400 mb-4">{event.description}</p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <Trophy className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Main Event</p>
                      <p className="text-white font-medium">{event.mainEvent}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Date & Time</p>
                      <p className="text-white font-medium">{event.date}</p>
                      <p className="text-gray-400 text-sm">{event.time}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Venue</p>
                      <p className="text-white font-medium">{event.venue}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-primary">
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-medium">Included with subscription</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary/10 to-red-900/10 rounded-2xl border border-primary/20 p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Never Miss a Moment
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Get instant access to all upcoming PPV events with any Kristal Streams subscription.
            No additional fees, no blackouts, just pure entertainment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/pricing"
              className="bg-primary hover:bg-red-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 inline-block"
            >
              View Pricing Plans
            </Link>
            <Link
              to="/free-trial"
              className="border-2 border-primary text-primary hover:bg-primary hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 inline-block"
            >
              Start Free Trial
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            PPV Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
              <h3 className="text-xl font-semibold text-white mb-3">
                Are PPV events included in my subscription?
              </h3>
              <p className="text-gray-400">
                Yes! All PPV events listed are included with your Kristal Streams subscription at no additional cost.
                This includes UFC, WWE, and all other major sporting events.
              </p>
            </div>
            <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
              <h3 className="text-xl font-semibold text-white mb-3">
                Can I watch PPV events after they air?
              </h3>
              <p className="text-gray-400">
                Absolutely! All PPV events are available on-demand after they air, so you can watch them anytime
                at your convenience. Replays are typically available within hours of the live event ending.
              </p>
            </div>
            <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
              <h3 className="text-xl font-semibold text-white mb-3">
                What quality can I stream PPV events in?
              </h3>
              <p className="text-gray-400">
                All PPV events are available in HD quality, and select events are available in stunning 4K resolution.
                The quality depends on your subscription plan and internet connection speed.
              </p>
            </div>
            <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
              <h3 className="text-xl font-semibold text-white mb-3">
                Can I watch on multiple devices?
              </h3>
              <p className="text-gray-400">
                Yes! You can stream PPV events on all your devices including Smart TVs, smartphones, tablets,
                computers, and streaming devices. The number of simultaneous streams depends on your subscription plan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PPV;
