export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
};

const getVapidPublicKey = () => String(import.meta.env.VITE_VAPID_PUBLIC_KEY || '').trim();

export const subscribeUserToPush = async (): Promise<PushSubscription | null> => {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }

    const vapidPublicKey = getVapidPublicKey();

    // Browser notifications can still work without a VAPID key. A VAPID key is only
    // required for true server-sent push notifications.
    if (!vapidPublicKey) {
      console.warn('VITE_VAPID_PUBLIC_KEY is missing. Browser notifications are enabled, but server push is not configured.');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) return existingSubscription;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
};

export const sendNotification = async (title: string, options?: NotificationOptions) => {
  const permission = await requestNotificationPermission();

  if (permission === 'granted') {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;

        await registration.showNotification(title, {
          icon: '/android/icon-192.png',
          badge: '/android/icon-96.png',
          vibrate: [200, 100, 200],
          ...options
        });
        return;
      } catch (error) {
        console.warn('Service worker notification failed; falling back to browser notification:', error);
      }
    }

    new Notification(title, options);
  }
};

export const unsubscribeFromPush = async (): Promise<boolean> => {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return true;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
    }

    return true;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
};

export const checkNotificationSupport = (): boolean => {
  return 'Notification' in window;
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export const testNotification = async () => {
  await sendNotification('Welcome to Kristal Streams!', {
    body: 'Notifications are now enabled for your account updates and reminders.',
    icon: '/android/icon-192.png',
    badge: '/android/icon-96.png',
    tag: 'welcome',
    requireInteraction: false
  });
};
