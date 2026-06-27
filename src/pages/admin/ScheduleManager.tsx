import React from 'react';
import { Calendar } from 'lucide-react';

const ScheduleManager: React.FC = () => (
  <div>
    <h1 className="text-2xl font-bold text-white mb-6">Schedule Manager</h1>
    <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
      <Calendar size={48} className="mx-auto text-gray-600 mb-4" />
      <p className="text-gray-400">Manage channel schedules and programming</p>
      <p className="text-gray-500 text-sm mt-2">Coming soon</p>
    </div>
  </div>
);
export default ScheduleManager;
