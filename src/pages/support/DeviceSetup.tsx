import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Monitor, Clock, BarChart, ArrowRight } from 'lucide-react';
import { getSetupGuides } from '../../lib/api';

interface SetupGuide {
  id: string;
  title: string;
  slug: string;
  device_type: string;
  difficulty: string;
  estimated_time: number;
  views: number;
}

const DeviceSetup: React.FC = () => {
  const [guides, setGuides] = useState<SetupGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeviceType, setSelectedDeviceType] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const data = await getSetupGuides();
        setGuides(data);
      } catch (err) {
        setError('Failed to load setup guides');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGuides();
  }, []);

  const deviceTypes = Array.from(new Set(guides.map(guide => guide.device_type)));
  const filteredGuides = selectedDeviceType
    ? guides.filter(guide => guide.device_type === selectedDeviceType)
    : guides;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'text-green-500';
      case 'medium':
        return 'text-yellow-500';
      case 'hard':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-32 bg-dark-300">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-8 bg-dark-200 rounded w-1/3"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-dark-100 rounded-xl p-6">
                    <div className="h-6 bg-dark-200 rounded w-1/2 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-dark-200 rounded w-3/4"></div>
                      <div className="h-4 bg-dark-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-32 bg-dark-300">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Error Loading Guides</h2>
            <p className="text-gray-400 mb-8">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-primary hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-32 bg-dark-300">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <Monitor className="text-primary w-8 h-8 mr-4" />
            <h1 className="text-3xl font-bold text-white">Device Setup Guides</h1>
          </div>

          {/* Platform Support Section */}
          <div className="bg-dark-100 rounded-xl p-8 border border-gray-800 mb-12">
            <h2 className="text-2xl font-semibold text-white mb-6">Supported Platforms</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
              <div className="flex flex-col items-center">
                <img 
                  src="https://raw.githubusercontent.com/google/material-design-icons/master/android/1x_web/ic_android_white_48dp.png" 
                  alt="Android"
                  className="h-12 mb-2 opacity-80 hover:opacity-100 transition-opacity"
                />
                <span className="text-gray-400">Android</span>
              </div>
              <div className="flex flex-col items-center">
                <img 
                  src="https://www.apple.com/ac/structured-data/images/knowledge_graph_logo.png" 
                  alt="Apple"
                  className="h-12 mb-2 opacity-80 hover:opacity-100 transition-opacity"
                />
                <span className="text-gray-400">Apple</span>
              </div>
              <div className="flex flex-col items-center">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/5/5f/Windows_logo_-_2012.svg" 
                  alt="Windows"
                  className="h-12 mb-2 opacity-80 hover:opacity-100 transition-opacity"
                />
                <span className="text-gray-400">Windows</span>
              </div>
              <div className="flex flex-col items-center">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/1/1d/Amazon_Fire_TV_stick_logo.svg" 
                  alt="Fire TV"
                  className="h-12 mb-2 opacity-80 hover:opacity-100 transition-opacity"
                />
                <span className="text-gray-400">Fire TV</span>
              </div>
              <div className="flex flex-col items-center">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/8/8c/Roku_logo.svg" 
                  alt="Roku"
                  className="h-12 mb-2 opacity-80 hover:opacity-100 transition-opacity"
                />
                <span className="text-gray-400">Roku</span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedDeviceType(null)}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                  !selectedDeviceType
                    ? 'bg-primary text-white'
                    : 'bg-dark-100 text-gray-400 hover:bg-dark-200'
                }`}
              >
                All Devices
              </button>
              {deviceTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedDeviceType(type)}
                  className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                    selectedDeviceType === type
                      ? 'bg-primary text-white'
                      : 'bg-dark-100 text-gray-400 hover:bg-dark-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            {filteredGuides.map((guide) => (
              <Link
                key={guide.id}
                to={`/support/guide/${guide.slug}`}
                className="block bg-dark-100 rounded-xl p-6 border border-gray-800 hover:border-primary transition-all duration-300"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{guide.title}</h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-400">{guide.device_type}</span>
                      <span className={`${getDifficultyColor(guide.difficulty)}`}>
                        {guide.difficulty}
                      </span>
                      <span className="flex items-center text-gray-400">
                        <Clock className="w-4 h-4 mr-1" />
                        {guide.estimated_time} min
                      </span>
                      <span className="flex items-center text-gray-400">
                        <BarChart className="w-4 h-4 mr-1" />
                        {guide.views} views
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="text-primary w-5 h-5 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceSetup;