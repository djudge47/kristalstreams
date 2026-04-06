import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Tv, Check, Star, Trophy, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      id: '1',
      title: 'Crown Jewel 2025',
      date: 'October 11, 2025',
      time: '8:00 AM ET',
      venue: 'RAC Arena, Perth, Australia',
      sport: 'WWE',
      mainEvent: 'Crown Jewel Championship Matches',
      description: 'First Crown Jewel outside Saudi Arabia featuring Cody Rhodes vs Seth Rollins and John Cena vs AJ Styles',
      featured: true,
      image: 'https://images.pexels.com/photos/3621104/pexels-photo-3621104.jpeg'
    },
    {
      id: '2',
      title: 'UFC 321: Aspinall vs Gane',
      date: 'October 25, 2025',
      time: '3:00 PM ET',
      venue: 'Etihad Arena, Abu Dhabi',
      sport: 'UFC',
      mainEvent: 'Tom Aspinall vs Ciryl Gane',
      description: 'Heavyweight contenders clash in the Middle East',
      featured: true,
      image: 'https://images.pexels.com/photos/4761792/pexels-photo-4761792.jpeg'
    },
    {
      id: '3',
      title: 'UFC 322: Della Maddalena vs Makhachev',
      date: 'November 15, 2025',
      time: '10:00 PM ET',
      venue: 'Madison Square Garden, New York',
      sport: 'UFC',
      mainEvent: 'Lightweight Championship',
      description: 'Championship action at the world\'s most famous arena',
      featured: true,
      image: 'https://images.pexels.com/photos/3990856/pexels-photo-3990856.jpeg'
    },
    {
      id: '4',
      title: 'Survivor Series: WarGames 2025',
      date: 'November 29, 2025',
      time: '8:00 PM ET',
      venue: 'Petco Park, San Diego',
      sport: 'WWE',
      mainEvent: 'WarGames Matches',
      description: 'The ultimate WWE battle featuring dual WarGames cage matches',
      featured: true,
      image: 'https://images.pexels.com/photos/3621227/pexels-photo-3621227.jpeg'
    },
    {
      id: '5',
      title: 'UFC 323',
      date: 'December 6, 2025',
      time: '10:00 PM ET',
      venue: 'T-Mobile Arena, Las Vegas',
      sport: 'UFC',
      mainEvent: 'Championship Bout TBA',
      description: 'Final UFC PPV before new media deal takes effect in 2026',
      featured: true,
      image: 'https://images.pexels.com/photos/4761851/pexels-photo-4761851.jpeg'
    },
    {
      id: '6',
      title: 'Royal Rumble 2026',
      date: 'January 31, 2026',
      time: '3:00 PM ET',
      venue: 'Riyadh, Saudi Arabia',
      sport: 'WWE',
      mainEvent: '30-Man & 30-Woman Royal Rumble Matches',
      description: 'Historic first Royal Rumble outside North America as part of Riyadh Season',
      featured: true,
      image: 'https://images.pexels.com/photos/3621104/pexels-photo-3621104.jpeg'
    },
    {
      id: '7',
      title: 'NBA All-Star Weekend 2026',
      date: 'February 14, 2026',
      time: '8:00 PM ET',
      venue: 'Madison Square Garden, New York',
      sport: 'NBA',
      mainEvent: 'All-Star Game',
      description: 'The best basketball players compete in the annual All-Star Game',
      featured: false,
      image: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg'
    },
    {
      id: '8',
      title: 'UFC on Paramount: March Card',
      date: 'March 7, 2026',
      time: '10:00 PM ET',
      venue: 'TBA',
      sport: 'UFC',
      mainEvent: 'Championship Event TBA',
      description: 'Early 2026 championship action under new broadcast deal',
      featured: false,
      image: 'https://images.pexels.com/photos/4761792/pexels-photo-4761792.jpeg'
    },
    {
      id: '9',
      title: 'Super Bowl LX',
      date: 'February 8, 2026',
      time: '6:30 PM ET',
      venue: 'SoFi Stadium, Los Angeles',
      sport: 'NFL',
      mainEvent: 'NFL Championship Game',
      description: 'The biggest game in American sports returns to LA',
      featured: true,
      image: 'https://images.pexels.com/photos/159607/football-american-football-runner-player-159607.jpeg'
    },
    {
      id: '10',
      title: 'NBA Finals Game 7',
      date: 'June 21, 2026',
      time: '8:00 PM ET',
      venue: 'TBA',
      sport: 'NBA',
      mainEvent: 'Championship Clincher',
      description: 'Winner-take-all Game 7 for the NBA Championship',
      featured: true,
      image: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg'
    }
  ];

  const sports = ['all', 'UFC', 'WWE', 'NBA', 'NFL'];

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
            From October 2025 through March 2026, never miss the biggest fights and shows.
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
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
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
