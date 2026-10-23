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

const ppvEvents: PPVEvent[] = [
  { id: '6', title: 'UFC Fight Night: Buckley vs Malott', date: 'October 17, 2026', time: '8:00 PM ET', venue: 'Rogers Place, Edmonton', sport: 'UFC', mainEvent: 'Joaquin Buckley vs Mike Malott', description: 'A high-stakes welterweight main event headlines UFC Fight Night in Edmonton', featured: true, image: '/ppv/UFC-Buckley-Malott-v1.png' },
  { id: '2', title: '2026 MLB Postseason', date: 'October 2026', time: 'Schedule Varies', venue: 'MLB Ballparks', sport: 'MLB', mainEvent: 'League Championship Series & World Series', description: 'Top baseball teams compete through the championship series and World Series', featured: true, image: '/ppv/MLB-Baseball.png' },
  { id: '1', title: '2026 WNBA Finals: Dream at Valkyries', date: 'October 17, 2026', time: '3:30 PM ET', venue: 'Chase Center, San Francisco', sport: 'WNBA', mainEvent: 'Atlanta Dream at Golden State Valkyries', description: 'Atlanta visits Golden State for Game 1 of the 2026 WNBA Finals', featured: true, image: '/ppv/WNBA-Finals-2026.jpeg' },
  { id: '7', title: 'WWE Monday Night Raw', date: 'October 12, 2026', time: '8:00 PM ET', venue: 'Brookshire Grocery Arena, Bossier City', sport: 'WWE', mainEvent: 'Monday Night Raw', description: 'WWE brings live Monday night action to Bossier City', featured: true, image: '/ppv/WWE-Pro-Wrestling-enhanced-v2.png' },
  { id: '4', title: '2026 MLS Cup Playoffs', date: 'November 18-December 18, 2026', time: 'Schedule Varies', venue: 'MLS Stadiums', sport: 'MLS', mainEvent: 'Road to MLS Cup', description: 'Top clubs compete through the 2026 MLS Cup Playoffs', featured: true, image: '/ppv/MLS-Playoffs-2026-dates-venue-v2.png' },
  { id: '8', title: 'UFC 333: Volkanovski vs Evloev', date: 'October 24, 2026', time: '2:00 PM ET', venue: 'Etihad Arena, Abu Dhabi', sport: 'UFC', mainEvent: 'Alexander Volkanovski vs Movsar Evloev', description: 'A major championship card headlines UFC 333 in Abu Dhabi', featured: true, image: '/ppv/UFC-MMA.png' },
  { id: '3', title: 'Dubois vs Wardley 2', date: 'October 17, 2026', time: '2:00 PM ET', venue: 'The O2, London', sport: 'Boxing', mainEvent: 'WBO Heavyweight Championship Rematch', description: 'Daniel Dubois and Fabio Wardley meet again in a major heavyweight title rematch', featured: true, image: '/ppv/Dubois-Wardley-2-official.jpg' },
  { id: '11', title: 'NFL Week 6: Seahawks vs Broncos', date: 'October 16, 2026', time: '8:15 PM ET', venue: 'Empower Field at Mile High, Denver', sport: 'NFL', mainEvent: 'Seattle Seahawks at Denver Broncos', description: 'Seattle visits Denver for a featured Week 6 prime-time matchup', featured: true, image: '/ppv/NFL-Week6-Seahawks-Broncos.jpeg' },
  { id: '5', title: '2026 NHL Heritage Classic', date: 'October 25, 2026', time: 'Time TBA', venue: 'Princess Auto Stadium, Winnipeg', sport: 'NHL', mainEvent: 'Winnipeg Jets vs Montreal Canadiens', description: 'Canadian rivals meet outdoors in a signature hockey showcase event', featured: true, image: '/ppv/NHL-Hockey-enhanced-v2.png' },
  { id: '10', title: 'NBA 2026-27 Season', date: 'October 2026-April 2027', time: 'Schedule Varies', venue: 'NBA Arenas', sport: 'NBA', mainEvent: 'Regular Season & NBA Cup', description: 'Follow marquee professional basketball matchups throughout the 2026-27 season', featured: true, image: '/ppv/NBA-Basketball-enhanced-v2.png' }
];

const sports = ['all', 'UFC', 'WWE', 'NBA', 'WNBA', 'NFL', 'Boxing', 'MLB', 'NHL', 'MLS'];
const features = [
  { icon: Tv, title: '4K Quality', text: 'Crystal clear streaming in up to 4K resolution' },
  { icon: Clock, title: 'Live & On-Demand', text: 'Watch live or replay anytime after the event' },
  { icon: Shield, title: 'No Extra Cost', text: 'All PPV events included with your subscription' },
  { icon: Star, title: 'All Devices', text: 'Stream on any device, anywhere in the world' }
];
const faqs = [
  ['Are PPV events included in my subscription?', 'Yes! All PPV events listed are included with your Kristal Streams subscription at no additional cost. This includes UFC, WWE, and all other major sporting events.'],
  ['Can I watch PPV events after they air?', 'Absolutely! All PPV events are available on-demand after they air, so you can watch them anytime at your convenience. Replays are typically available within hours of the live event ending.'],
  ['What quality can I stream PPV events in?', 'All PPV events are available in HD quality, and select events are available in stunning 4K resolution. The quality depends on your subscription plan and internet connection speed.'],
  ['Can I watch on multiple devices?', 'Yes! You can stream PPV events on all your devices including Smart TVs, smartphones, tablets, computers, and streaming devices. The number of simultaneous streams depends on your subscription plan.']
];

const PayPerView: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState('all');
  const filteredEvents = selectedSport === 'all' ? ppvEvents : ppvEvents.filter(event => event.sport === selectedSport);

  return (
    <div className="min-h-screen bg-dark-300 py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6"><Trophy className="w-8 h-8 text-primary" /></div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">Upcoming PPV Events</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">Watch every major Pay-Per-View event live in stunning HD and 4K quality. Throughout 2026, never miss the biggest fights, games, and shows.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-dark-100 rounded-xl p-6 border border-gray-800 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4"><Icon className="w-6 h-6 text-primary" /></div>
              <h3 className="text-lg font-semibold text-white mb-2">{title}</h3><p className="text-gray-400 text-sm">{text}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {sports.map(sport => (
            <button key={sport} onClick={() => setSelectedSport(sport)} className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${selectedSport === sport ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-dark-100 text-gray-400 border border-gray-800 hover:border-primary hover:text-white'}`}>{sport === 'all' ? 'All Events' : sport}</button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredEvents.map(event => (
            <div key={event.id} className="bg-dark-100 rounded-xl overflow-hidden border border-gray-800 hover:border-primary transition-all duration-300 group">
              <div className="relative h-56 overflow-hidden">
                <img src={event.image} alt={event.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />
                {event.featured && <div className="absolute top-4 right-4 bg-primary px-3 py-1 rounded-full flex items-center gap-2"><Star className="w-4 h-4 text-white" fill="white" /><span className="text-white text-sm font-semibold">Featured</span></div>}
                <div className="absolute top-4 left-4 bg-dark-300/90 px-3 py-1 rounded-full"><span className="text-white text-sm font-semibold">{event.sport}</span></div>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-primary transition-colors">{event.title}</h3>
                <p className="text-gray-400 mb-4">{event.description}</p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3"><Trophy className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" /><div><p className="text-sm text-gray-500">Main Event</p><p className="text-white font-medium">{event.mainEvent}</p></div></div>
                  <div className="flex items-start gap-3"><Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" /><div><p className="text-sm text-gray-500">Date & Time</p><p className="text-white font-medium">{event.date}</p><p className="text-gray-400 text-sm">{event.time}</p></div></div>
                  <div className="flex items-start gap-3"><MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" /><div><p className="text-sm text-gray-500">Venue</p><p className="text-white font-medium">{event.venue}</p></div></div>
                </div>
                <div className="flex items-center gap-2 text-primary"><Check className="w-5 h-5" /><span className="text-sm font-medium">Included with subscription</span></div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-gradient-to-r from-primary/10 to-red-900/10 rounded-2xl border border-primary/20 p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Never Miss a Moment</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">Get instant access to all upcoming PPV events with any Kristal Streams subscription. No additional fees, no blackouts, just pure entertainment.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pricing" className="bg-primary hover:bg-red-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 inline-block">View Pricing Plans</Link>
            <Link to="/free-trial" className="border-2 border-primary text-primary hover:bg-primary hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 inline-block">Start Free Trial</Link>
          </div>
        </div>
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">PPV Frequently Asked Questions</h2>
          <div className="space-y-6">{faqs.map(([question, answer]) => <div key={question} className="bg-dark-100 rounded-xl p-6 border border-gray-800"><h3 className="text-xl font-semibold text-white mb-3">{question}</h3><p className="text-gray-400">{answer}</p></div>)}</div>
        </div>
      </div>
    </div>
  );
};

export default PayPerView;
