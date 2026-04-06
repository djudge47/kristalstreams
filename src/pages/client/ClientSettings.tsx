import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Settings, Bell, Video, Globe, Save } from 'lucide-react';
import NotificationSettings from '../../components/NotificationSettings';

interface UserSettings {
  notifications_enabled: boolean;
  default_quality: '480p' | '720p' | '1080p' | '4k';
  language: string;
  autoplay_enabled: boolean;
}

const ClientSettings: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({
    notifications_enabled: true,
    default_quality: '1080p',
    language: 'en',
    autoplay_enabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const getSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) throw new Error('No user found');

        const { data, error } = await supabase
          .from('profiles')
          .select('notifications_enabled')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        if (data) {
          setSettings(prev => ({
            ...prev,
            notifications_enabled: data.notifications_enabled
          }));
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    getSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      if (settings.notifications_enabled) {
        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Register service worker for push notifications
          const registration = await navigator.serviceWorker.register('/sw.js');
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY'
          });

          // Send subscription to backend
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notifications`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              deviceToken: JSON.stringify(subscription)
            })
          });

          if (!response.ok) {
            throw new Error('Failed to register for notifications');
          }
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          notifications_enabled: settings.notifications_enabled
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setSuccess('Settings saved successfully');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-dark-200 rounded w-1/4 mb-8"></div>
        <div className="space-y-4">
          <div className="h-12 bg-dark-200 rounded"></div>
          <div className="h-12 bg-dark-200 rounded"></div>
          <div className="h-12 bg-dark-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-8">
        <Settings className="text-primary w-8 h-8 mr-4" />
        <h1 className="text-3xl font-bold text-white">Settings</h1>
      </div>

      <div className="space-y-6">
        <NotificationSettings />

        <div className="bg-dark-100 rounded-xl p-8 border border-gray-800">
          <div className="flex items-center mb-6">
            <Bell className="text-primary w-6 h-6 mr-3" />
            <h2 className="text-xl font-semibold text-white">Preferences</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications_enabled}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  notifications_enabled: e.target.checked
                }))}
                className="form-checkbox h-5 w-5 text-primary rounded border-gray-700 bg-dark-200 focus:ring-primary focus:ring-offset-dark-100"
              />
              <span className="ml-3 text-gray-300">Enable mobile notifications for support tickets</span>
            </label>
          </div>
        </div>

        {/* Playback Settings */}
        <div className="bg-dark-100 rounded-xl p-8 border border-gray-800">
          <div className="flex items-center mb-6">
            <Video className="text-primary w-6 h-6 mr-3" />
            <h2 className="text-xl font-semibold text-white">Playback</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Default Quality
              </label>
              <select
                value={settings.default_quality}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  default_quality: e.target.value as UserSettings['default_quality']
                }))}
                className="w-full bg-dark-200 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
              >
                <option value="480p">480p</option>
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="4k">4K</option>
              </select>
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.autoplay_enabled}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  autoplay_enabled: e.target.checked
                }))}
                className="form-checkbox h-5 w-5 text-primary rounded border-gray-700 bg-dark-200 focus:ring-primary focus:ring-offset-dark-100"
              />
              <span className="ml-3 text-gray-300">Enable autoplay</span>
            </label>
          </div>
        </div>

        {/* Language Settings */}
        <div className="bg-dark-100 rounded-xl p-8 border border-gray-800">
          <div className="flex items-center mb-6">
            <Globe className="text-primary w-6 h-6 mr-3" />
            <h2 className="text-xl font-semibold text-white">Language</h2>
          </div>
          
          <div>
            <select
              value={settings.language}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                language: e.target.value
              }))}
              className="w-full bg-dark-200 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-500">
            {success}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="bg-primary hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 disabled:bg-gray-700 flex items-center"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientSettings;