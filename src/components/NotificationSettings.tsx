import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';

export default function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported' | null>(null);
  const checkPermission = () => setPermission(typeof window !== 'undefined' && 'Notification' in window ? window.Notification.permission : 'unsupported');
  useEffect(() => { checkPermission(); }, []);
  const description = permission === null ? 'Checking browser permission…' : permission === 'unsupported' ? 'Browser notifications are unavailable on this device.' : permission === 'granted' ? 'This browser allows notifications for this site.' : permission === 'denied' ? 'This browser blocks notifications for this site.' : 'This browser has not granted notification permission.';
  return (
    <section aria-labelledby="notification-settings-heading" className="rounded-xl border border-gray-800 bg-dark-100 p-6 sm:p-8">
      <div className="mb-3 flex items-center gap-3"><Bell className="h-6 w-6 text-primary" aria-hidden="true" /><h2 id="notification-settings-heading" className="text-xl font-semibold text-white">Browser Notifications</h2></div>
      <p className="mb-3 text-sm text-gray-300">Automatic website push alerts are not currently available. Browser permission alone does not enable account, support or event alerts.</p>
      <p role="status" className="text-sm text-gray-400">{description}</p>
      <div className="mt-4 flex flex-wrap gap-5 text-sm"><button type="button" onClick={checkPermission} className="text-primary underline">Check browser permission</button><Link to="/client/support" className="text-primary underline">View support replies</Link></div>
    </section>
  );
}
