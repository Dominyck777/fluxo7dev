interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: any;
}

class WebPushService {
  private registration: ServiceWorkerRegistration | null = null;
  private permission: NotificationPermission = 'default';

  async initialize(): Promise<boolean> {
    // Verifica se o browser suporta notificações
    if (!('Notification' in window)) {
      console.warn('❌ Este browser não suporta notificações');
      return false;
    }

    // Verifica se suporta Service Workers
    if (!('serviceWorker' in navigator)) {
      console.warn('❌ Este browser não suporta Service Workers');
      return false;
    }

    try {
      // Registra o Service Worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('✅ Service Worker registrado:', this.registration);

      // Aguarda o SW estar ativo
      if (this.registration.installing) {
        await new Promise((resolve) => {
          this.registration!.installing!.addEventListener('statechange', (e) => {
            if ((e.target as ServiceWorker).state === 'activated') {
              resolve(void 0);
            }
          });
        });
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao registrar Service Worker:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    // Se já tem permissão, retorna true
    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return true;
    }

    // Se foi negada, retorna false
    if (Notification.permission === 'denied') {
      this.permission = 'denied';
      console.warn('❌ Permissão para notificações foi negada');
      return false;
    }

    // Solicita permissão
    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        console.log('✅ Permissão para notificações concedida');
        return true;
      } else {
        console.warn('❌ Permissão para notificações negada pelo usuário');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão:', error);
      return false;
    }
  }

  async showNotification(payload: NotificationPayload): Promise<boolean> {
    // Verifica se está inicializado
    if (!this.registration) {
      console.warn('⚠️ Service Worker não registrado. Tentando inicializar...');
      const initialized = await this.initialize();
      if (!initialized) {
        return this.showFallbackNotification(payload);
      }
    }

    // Verifica permissão
    if (this.permission !== 'granted') {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return this.showFallbackNotification(payload);
      }
    }

    try {
      // Envia notificação via Service Worker
      await this.registration!.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/favicon.svg',
        badge: payload.badge || '/favicon.svg',
        tag: payload.tag || 'fluxo7-notification',
        requireInteraction: payload.requireInteraction || true,
        data: payload.data || {},
        // Configurações adicionais para melhor UX
        silent: false,
        vibrate: [200, 100, 200], // Vibração no mobile
        timestamp: Date.now()
      } as any); // Usar 'as any' para permitir propriedades estendidas do Service Worker

      console.log('✅ Notificação web enviada:', payload.title);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar notificação web:', error);
      return this.showFallbackNotification(payload);
    }
  }

  private showFallbackNotification(payload: NotificationPayload): boolean {
    // Fallback: notificação simples do browser (sem Service Worker)
    try {
      if (Notification.permission === 'granted') {
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/favicon.svg'
        });
        console.log('✅ Notificação fallback enviada:', payload.title);
        return true;
      }
    } catch (error) {
      console.error('❌ Erro no fallback:', error);
    }

    // Último fallback: console
    console.log(`🔔 NOTIFICAÇÃO: ${payload.title} - ${payload.body}`);
    return false;
  }

  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  // Método para testar notificação
  async testNotification(): Promise<void> {
    await this.showNotification({
      title: '🔔 Teste Fluxo7 Dev',
      body: 'Sistema de notificações funcionando perfeitamente!',
      tag: 'test-notification',
      data: { type: 'test' }
    });
  }
}

export const webPushService = new WebPushService();
