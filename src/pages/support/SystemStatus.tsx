import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface ServiceStatus {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  lastUpdated: string;
}

const services: ServiceStatus[] = [
  {
    id: 'streaming',
    name: 'Streaming Service',
    status: 'operational',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'vod',
    name: 'Video on Demand',
    status: 'operational',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'auth',
    name: 'Authentication',
    status: 'operational',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'api',
    name: 'API Services',
    status: 'operational',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'cdn',
    name: 'Content Delivery',
    status: 'operational',
    lastUpdated: new Date().toISOString()
  }
];

const SystemStatus: React.FC = () => {
  const [statuses, setStatuses] = useState<ServiceStatus[]>(services);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  useEffect(() => {
    // Simulate fetching status data
    setTimeout(() => {
      setLoading(false);
    }, 1000);

    // Update last checked time every minute
    const interval = setInterval(() => {
      setLastChecked(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'outage':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'maintenance':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational':
        return 'Operational';
      case 'degraded':
        return 'Performance Issues';
      case 'outage':
        return 'Service Disruption';
      case 'maintenance':
        return 'Scheduled Maintenance';
      default:
        return 'Unknown';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'degraded':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'outage':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'maintenance':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
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
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-dark-100 rounded-xl p-6">
                    <div className="h-6 bg-dark-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
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
            <Activity className="text-primary w-8 h-8 mr-4" />
            <h1 className="text-3xl font-bold text-white">System Status</h1>
          </div>

          <div className="bg-dark-100 rounded-xl p-8 border border-gray-800 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                <h2 className="text-xl font-semibold text-white">All Systems Operational</h2>
              </div>
              <span className="text-sm text-gray-400">
                Last checked: {lastChecked.toLocaleTimeString()}
              </span>
            </div>
            <p className="text-gray-400">
              Monitor the current status of Kristal Streams services. If you're experiencing issues,
              check here for any known disruptions or maintenance windows.
            </p>
          </div>

          <div className="space-y-4">
            {statuses.map((service) => (
              <div
                key={service.id}
                className="bg-dark-100 rounded-xl p-6 border border-gray-800 hover:border-primary transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-4">
                      {getStatusIcon(service.status)}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white mb-1">{service.name}</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm border ${getStatusClass(service.status)}`}>
                        {getStatusText(service.status)}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">
                    Updated {new Date(service.lastUpdated).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-dark-100 rounded-xl border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Need Help?</h3>
            <p className="text-gray-400 mb-4">
              If you're experiencing issues not reflected in the system status, please contact our support team.
            </p>
            <div className="flex space-x-4">
              <Link
                to="/support"
                className="bg-primary hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Contact Support
              </Link>
              <Link
                to="/support"
                className="bg-dark-200 hover:bg-dark-100 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Visit Help Center
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;