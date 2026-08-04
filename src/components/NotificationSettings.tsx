import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  requestNotificationPermission,
  subscribeUserToPush,
  unsubscribeFromPush,
  checkNotificationSupport,
  testNotification
} from '../lib/notifications';

const LOCAL_STORAGE_KEY = 'ks_notifications_enabled';

const NotificationSettings: React.FC = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadNotificationState = async () => {
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }

      const localEnabled = localStorage.getItem(LOCAL_STORAGE_KEY) === 'true';
      setIsSubscribed(localEnabled && Notification.permission === 'granted');

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('notifications_enabled')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && typeof data?.notifications_enabled === 'boolean') {
          setIsSubscribed(data.notifications_enabled && Notification.permission === 'granted');
          localStorage.setItem(LOCAL_STORAGE_KEY, String(data.notifications_enabled));
        }
      } catch (error) {
        console.warn('Notification profile preference could not be loaded:', error);
      }

      await checkSubscription();
    };

    loadNotificationState();
  }, []);

  const checkSubscription = async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          setIsSubscribed(true);
          localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
        }
      }
    } catch (error) {
      console.warn('Push subscription check failed:', error);
    }
  };

  const saveNotificationPreference = async (enabled: boolean) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, String(enabled));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ notifications_enabled: enabled })
        .eq('id', user.id);

      if (error) {
        console.warn('Could not save notification preference to profile:', error.message);
      }
    } catch (error) {
      console.warn('Notification preference saved locally only:', error);
    }
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const perm = await requestNotificationPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        setIsSubscribed(false);
        await saveNotificationPreference(false);
        setErrorMessage('Notifications were not enabled. Your browser did not grant permission.');
        return;
      }

      await subscribeUserToPush();
      setIsSubscribed(true);
      await saveNotificationPreference(true);
      setShowSuccess(true);
      setMessage('Notifications are enabled for this device.');
      await testNotification();

      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error enabling notifications:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Notifications could not be enabled.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const success = await unsubscribeFromPush();
      if (!success) {
        throw new Error('Unable to remove the push subscription from this browser.');
      }

      setIsSubscribed(false);
      await saveNotificationPreference(false);
      setMessage('Notifications are disabled for this device.');
    } catch (error) {
      console.error('Error disabling notifications:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Notifications could not be disabled.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!checkNotificationSupport()) {
    return (
      <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <BellOff className="text-gray-400" size={24} />
          <h3 className="text-xl font-semibold text-white">Notifications Not Supported</h3>
        </div>
        <p className="text-gray-400">
          This browser does not support notifications. Try Chrome, Edge, Firefox, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${isSubscribed ? 'bg-primary/20' : 'bg-gray-800'}`}>
            {isSubscribed ? (
              <Bell className="text-primary" size={24} />
            ) : (
              <BellOff className="text-gray-400" size={24} />
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Push Notifications</h3>
            <p className="text-sm text-gray-400">
              {isSubscribed ? 'Enabled on this device' : 'Get account, support, and live-event updates'}
            </p>
          </div>
        </div>

        {showSuccess && (
          <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-lg">
            <Check size={18} />
            <span className="text-sm font-medium">Enabled!</span>
          </div>
        )}
      </div>

      {permission === 'denied' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
          <p className="text-red-400 text-sm">
            Notifications are blocked for this site. Open your browser site settings and allow notifications for Kristal Streams.
          </p>
        </div>
      )}

      {message && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4 text-green-400 text-sm">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4 text-red-400 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
          <div>
            <p className="text-white font-medium">Account Updates</p>
            <p className="text-sm text-gray-400">Subscription and important account messages</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
          <div>
            <p className="text-white font-medium">Support Ticket Alerts</p>
            <p className="text-sm text-gray-400">Get notified when support responds</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
          <div>
            <p className="text-white font-medium">Live Event Reminders</p>
            <p className="text-sm text-gray-400">Never miss important live sports or shows</p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-800">
        {isSubscribed ? (
          <button
            type="button"
            onClick={handleDisableNotifications}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-dark-200 hover:bg-dark-300 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <BellOff size={18} />
                Disable Notifications
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleEnableNotifications}
            disabled={isLoading || permission === 'denied'}
            className="w-full px-4 py-3 bg-primary hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <Bell size={18} />
                Enable Notifications
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;
