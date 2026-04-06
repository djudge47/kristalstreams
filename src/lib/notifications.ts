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

export const subscribeUserToPush = async (): Promise<PushSubscription | null> => {
  try {
    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
      )
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
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.ready;

      await registration.showNotification(title, {
        icon: '/android/icon-192.png',
        badge: '/android/icon-96.png',
        vibrate: [200, 100, 200],
        ...options
      });
    } else {
      new Notification(title, options);
    }
  }
};

export const unsubscribeFromPush = async (): Promise<boolean> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
};

export const checkNotificationSupport = (): boolean => {
  return 'Notification' in window &&
         'serviceWorker' in navigator &&
         'PushManager' in window;
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
    body: 'You can now receive updates about new channels, live events, and more.',
    icon: '/android/icon-192.png',
    badge: '/android/icon-96.png',
    tag: 'welcome',
    requireInteraction: false,
    actions: [
      {
        action: 'explore',
        title: 'Browse Channels'
      }
    ]
  });
};
