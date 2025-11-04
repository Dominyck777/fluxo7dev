// Cliente para comunicação com o Push Server
class PushClient {
  private serverUrl = this.getServerUrl();
  private vapidPublicKey: string | null = null;
  private currentUserId: string | null = null;

  private getServerUrl(): string {
    // Em desenvolvimento, usa localhost se disponível
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Tenta servidor local primeiro, senão usa Vercel Functions
        return 'http://localhost:3003';
      }
      
      // Em produção, usa Vercel Functions (mesmo domínio)
      return window.location.origin;
    }
    
    // Fallback para Vercel
    return 'https://fluxo7dev.vercel.app';
  }

  async initialize(userId: string): Promise<boolean> {
    this.currentUserId = userId;
    
    try {
      // Obtém a chave pública VAPID do servidor
      const response = await fetch(`${this.serverUrl}/api/vapid-public-key`);
      const data = await response.json();
      this.vapidPublicKey = data.publicKey;
      
      console.log('✅ Push Client inicializado para:', userId);
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar Push Client:', error);
      return false;
    }
  }

  async subscribe(): Promise<boolean> {
    if (!this.vapidPublicKey || !this.currentUserId) {
      console.error('❌ Push Client não inicializado');
      return false;
    }

    try {
      // Registra Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Solicita permissão para notificações
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('❌ Permissão para notificações negada');
        return false;
      }

      // Cria subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource
      });

      // Detecta tipo de dispositivo
      const deviceInfo = this.getDeviceInfo();
      
      // Registra subscription no servidor
      const response = await fetch(`${this.serverUrl}/api/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.currentUserId,
          subscription: subscription.toJSON(),
          deviceInfo
        })
      });

      if (response.ok) {
        console.log(`✅ Subscription registrada para ${this.currentUserId}`);
        return true;
      } else {
        console.error('❌ Falha ao registrar subscription');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao criar subscription:', error);
      return false;
    }
  }

  async notifyUser(userId: string, title: string, body: string, data?: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/api/notify-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          title,
          body,
          data
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Notificação enviada para ${userId}:`, title);
        return true;
      } else {
        console.warn(`⚠️ Falha ao notificar ${userId}:`, result.error);
        if (result.fallback) {
          console.log('📝 Fallback:', result.fallback);
        }
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error);
      return false;
    }
  }

  async notifyAll(title: string, body: string, data?: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/api/notify-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body,
          data
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`📢 Broadcast enviado para ${result.sent} usuários`);
        return true;
      } else {
        console.error('❌ Falha no broadcast:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro no broadcast:', error);
      return false;
    }
  }

  async getActiveUsers(): Promise<string[]> {
    try {
      const response = await fetch(`${this.serverUrl}/api/active-users`);
      const data = await response.json();
      return data.users || [];
    } catch (error) {
      console.error('❌ Erro ao obter usuários ativos:', error);
      return [];
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/api/health`);
      const data = await response.json();
      console.log('🔗 Conexão com Push Server:', data.message);
      return response.ok;
    } catch (error) {
      console.error('❌ Push Server não disponível:', error);
      return false;
    }
  }

  // Converte chave VAPID para formato correto
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  isSupported(): boolean {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  // Detecta informações do dispositivo
  private getDeviceInfo(): string {
    if (typeof window === 'undefined') return 'Server';
    
    const userAgent = navigator.userAgent;
    
    // Detecta mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // Detecta sistema operacional
    let os = 'Unknown OS';
    if (/Windows/i.test(userAgent)) os = 'Windows';
    else if (/Mac/i.test(userAgent)) os = 'macOS';
    else if (/Linux/i.test(userAgent)) os = 'Linux';
    else if (/Android/i.test(userAgent)) os = 'Android';
    else if (/iPhone|iPad|iPod/i.test(userAgent)) os = 'iOS';
    
    // Detecta browser
    let browser = 'Unknown Browser';
    if (/Chrome/i.test(userAgent) && !/Edge/i.test(userAgent)) browser = 'Chrome';
    else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari';
    else if (/Edge/i.test(userAgent)) browser = 'Edge';
    
    // Monta descrição do dispositivo
    const deviceType = isMobile ? '📱 Mobile' : '💻 Desktop';
    return `${deviceType} - ${os} (${browser})`;
  }
}

export const pushClient = new PushClient();
