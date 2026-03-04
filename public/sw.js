// Align Service Worker - Push Notification Handler
self.addEventListener('push', (event) => {
  let data = { title: 'Align', body: 'You have a new notification', url: '/' };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {
    console.error('Push parse error:', e);
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-192x192.svg',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' },
      actions: [{ action: 'open', title: 'Open' }],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
