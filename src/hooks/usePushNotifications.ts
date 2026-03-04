import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Cache the VAPID key so we don't fetch it repeatedly
let cachedVapidKey: string | null = null;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported] = useState(
    typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
  );

  // Check existing subscription
  useEffect(() => {
    if (!supported || !user) return;

    navigator.serviceWorker.ready.then(async (registration: any) => {
      const subscription = await registration.pushManager?.getSubscription();
      setIsSubscribed(!!subscription);
    });
  }, [supported, user]);

  const subscribe = useCallback(async () => {
    if (!supported || !user) return false;

    // Fetch VAPID key if not cached
    if (!cachedVapidKey) {
      try {
        const { data, error } = await supabase.functions.invoke('get-vapid-key');
        if (error || !data?.publicKey) {
          console.error('Failed to fetch VAPID key:', error);
          return false;
        }
        cachedVapidKey = data.publicKey;
      } catch (err) {
        console.error('VAPID key fetch error:', err);
        return false;
      }
    }

    setLoading(true);
    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setLoading(false);
        return false;
      }

      // Register service worker if not ready
      let registration: any = await navigator.serviceWorker.getRegistration('/sw.js');
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        await navigator.serviceWorker.ready;
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(cachedVapidKey!),
      });

      const subJson = subscription.toJSON();

      // Save to database
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: user.id,
          endpoint: subJson.endpoint!,
          p256dh: subJson.keys!.p256dh!,
          auth: subJson.keys!.auth!,
          user_agent: navigator.userAgent,
          is_active: true,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      );

      if (error) throw error;

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('Push subscription error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supported, user]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;

    setLoading(true);
    try {
      const registration: any = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager?.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        // Mark as inactive in DB
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('endpoint', endpoint);
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error('Push unsubscribe error:', err);
    } finally {
      setLoading(false);
    }
  }, [supported]);

  return {
    supported,
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
  };
}
