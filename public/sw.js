// Service Worker para Web Push Notifications
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker ativado');
  event.waitUntil(self.clients.claim());
});

// Escuta as notificações push
self.addEventListener('push', (event) => {
  console.log('📱 Notificação push recebida:', event);
  
  let notificationData = {
    title: 'Fluxo7 Dev',
    body: 'Nova notificação',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'fluxo7-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'Ver Demanda',
        icon: '/favicon.svg'
      },
      {
        action: 'dismiss',
        title: 'Dispensar'
      }
    ]
  };

  // Se há dados na notificação, usa eles
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('Erro ao parsear dados da notificação:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
      data: notificationData.data || {}
    })
  );
});

// Escuta cliques nas notificações
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Clique na notificação:', event);
  
  event.notification.close();
  const route = event.notification?.data?.route || '/#/demandas';

  // Abre ou foca na aplicação
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Se já há uma janela aberta, foca nela e navega
        for (const client of clients) {
          if ('focus' in client) {
            client.navigate ? client.navigate(route) : null;
            return client.focus();
          }
        }
        // Senão, abre uma nova janela na rota
        if (self.clients.openWindow) {
          return self.clients.openWindow(route);
        }
      })
  );
  // Action 'dismiss' apenas fecha a notificação (já feito acima)
});
