import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import {
  requestNotificationPermission,
  subscribeUserToPush,
  unsubscribeFromPush,
  checkNotificationSupport,
  testNotification
} from '../lib/notifications';

const NotificationSettings: React.FC = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    }
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);

    try {
      const perm = await requestNotificationPermission();
      setPermission(perm);

      if (perm === 'granted') {
        const subscription = await subscribeUserToPush();
        setIsSubscribed(!!subscription);

        if (subscription) {
          setShowSuccess(true);
          await testNotification();

          setTimeout(() => setShowSuccess(false), 3000);
        }
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);

    try {
      const success = await unsubscribeFromPush();
      if (success) {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
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
          Your browser does not support push notifications. Please use a modern browser like Chrome, Firefox, or Safari.
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
              {isSubscribed ? 'Enabled' : 'Get updates about new content and events'}
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
            You have blocked notifications for this site. To enable them, please update your browser settings.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
          <div>
            <p className="text-white font-medium">New Content Alerts</p>
            <p className="text-sm text-gray-400">Get notified when new channels or events are added</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
          <div>
            <p className="text-white font-medium">Live Event Reminders</p>
            <p className="text-sm text-gray-400">Never miss important live sports or shows</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
          <div>
            <p className="text-white font-medium">Account Updates</p>
            <p className="text-sm text-gray-400">Subscription renewals and important messages</p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-800">
        {isSubscribed ? (
          <button
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
