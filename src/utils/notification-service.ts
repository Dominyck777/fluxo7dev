import { type Demand } from '../components/DemandCard';
import { webPushService } from './web-push-service';
import { pushClient } from './push-client';

interface NotificationConfig {
  enabled: boolean;
  lastCheck: string;
  method: 'powershell' | 'webpush' | 'pushserver' | 'none';
}

class NotificationService {
  private config: NotificationConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): NotificationConfig {
    const saved = localStorage.getItem('fluxo7dev_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Erro ao carregar config de notificações:', error);
      }
    }
    
    return {
      enabled: true,
      lastCheck: new Date().toISOString(),
      method: 'pushserver'
    };
  }

  private saveConfig() {
    localStorage.setItem('fluxo7dev_notifications', JSON.stringify(this.config));
  }


  updateLastCheck() {
    this.config.lastCheck = new Date().toISOString();
    this.saveConfig();
  }

  async sendPowerShellNotification(message: string, user: string) {
    try {
      // Executa o PowerShell script
      const command = `powershell.exe -ExecutionPolicy Bypass -File "./notify.ps1" -Message "${message}" -User "${user}"`;
      
      // Para desenvolvimento, vamos usar um endpoint local que executará o PS1
      const response = await fetch('http://localhost:3002/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          user,
          command
        })
      }).catch(() => {
        // Fallback: log no console se não conseguir executar PS1
        console.log(`🔔 NOTIFICAÇÃO PARA ${user}: ${message}`);
        return null;
      });

      if (response?.ok) {
        console.log(`✅ Notificação PowerShell enviada para ${user}`);
      } else {
        console.log(`📱 Simulação de notificação para ${user}: ${message}`);
      }
    } catch (error) {
      console.error('Erro ao enviar notificação PowerShell:', error);
      // Fallback para console
      console.log(`🔔 NOTIFICAÇÃO PARA ${user}: ${message}`);
    }
  }

  async notifyNewDemand(demand: Demand, assignedUser: string) {
    if (!this.config.enabled) return;

    const message = `Nova demanda atribuída: "${demand.descricao}" no projeto ${demand.projeto}`;
    const title = `🚀 Nova Demanda - ${assignedUser}`;
    
    switch (this.config.method) {
      case 'powershell':
        await this.sendPowerShellNotification(message, assignedUser);
        break;
      case 'webpush':
        await this.sendWebPushNotification({
          title,
          body: message,
          tag: `demand-${demand.id}`,
          data: {
            demandId: demand.id,
            assignedUser,
            type: 'new_demand'
          }
        });
        break;
      case 'pushserver':
        await this.sendPushServerNotification(assignedUser, title, message, {
          demandId: demand.id,
          assignedUser,
          type: 'new_demand'
        });
        break;
      default:
        console.log(`Notificação para ${assignedUser}: ${message}`);
    }
  }

  async notifyAllUsers(message: string, users: string[]) {
    if (!this.config.enabled) return;

    console.log(`📢 Enviando notificação para todos os usuários: ${message}`);
    const title = '📢 Fluxo7 Dev - Comunicado';
    
    switch (this.config.method) {
      case 'powershell':
        for (const user of users) {
          await this.sendPowerShellNotification(message, user);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        break;
      case 'webpush':
        await this.sendWebPushNotification({
          title,
          body: message,
          tag: 'broadcast-notification',
          data: {
            type: 'broadcast',
            users
          }
        });
        break;
      case 'pushserver':
        await this.sendPushServerBroadcast(title, message, {
          type: 'broadcast',
          users
        });
        break;
      default:
        console.log(`Notificação broadcast: ${message}`);
    }
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  setEnabled(enabled: boolean) {
    this.config.enabled = enabled;
    this.saveConfig();
  }

  getMethod(): string {
    return this.config.method;
  }

  setMethod(method: 'powershell' | 'webpush' | 'pushserver' | 'none') {
    this.config.method = method;
    this.saveConfig();
  }

  async sendWebPushNotification(payload: {
    title: string;
    body: string;
    tag?: string;
    data?: any;
  }) {
    try {
      const success = await webPushService.showNotification({
        title: payload.title,
        body: payload.body,
        icon: '/logo-full.png',
        badge: '/logo-full.png',
        tag: payload.tag || 'fluxo7-notification',
        requireInteraction: true,
        data: payload.data
      });
      
      if (success) {
        console.log('✅ Notificação web enviada:', payload.title);
      } else {
        console.log('⚠️ Falha ao enviar notificação web, usando fallback');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar notificação web:', error);
    }
  }

  async initializeWebPush(): Promise<boolean> {
    try {
      const initialized = await webPushService.initialize();
      if (initialized) {
        const hasPermission = await webPushService.requestPermission();
        if (hasPermission) {
          console.log('✅ Web Push inicializado com sucesso');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('❌ Erro ao inicializar Web Push:', error);
      return false;
    }
  }

  async testWebPush(): Promise<void> {
    await webPushService.testNotification();
  }

  isWebPushSupported(): boolean {
    return webPushService.isSupported();
  }

  getWebPushPermission(): NotificationPermission {
    return webPushService.getPermissionStatus();
  }

  // Métodos do Push Server
  async initializePushServer(userId: string): Promise<boolean> {
    try {
      const initialized = await pushClient.initialize(userId);
      if (initialized) {
        const subscribed = await pushClient.subscribe();
        if (subscribed) {
          console.log('✅ Push Server inicializado e subscription criada para:', userId);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('❌ Erro ao inicializar Push Server:', error);
      return false;
    }
  }

  async sendPushServerNotification(userId: string, title: string, body: string, data?: any): Promise<boolean> {
    try {
      const success = await pushClient.notifyUser(userId, title, body, data);
      if (success) {
        console.log(`✅ Notificação Push Server enviada para ${userId}:`, title);
      } else {
        console.log(`⚠️ Falha na notificação Push Server para ${userId}`);
      }
      return success;
    } catch (error) {
      console.error('❌ Erro ao enviar notificação Push Server:', error);
      return false;
    }
  }

  async sendPushServerBroadcast(title: string, body: string, data?: any): Promise<boolean> {
    try {
      const success = await pushClient.notifyAll(title, body, data);
      if (success) {
        console.log('✅ Broadcast Push Server enviado:', title);
      } else {
        console.log('⚠️ Falha no broadcast Push Server');
      }
      return success;
    } catch (error) {
      console.error('❌ Erro no broadcast Push Server:', error);
      return false;
    }
  }

  async testPushServer(): Promise<void> {
    const userId = pushClient.getCurrentUserId();
    if (userId) {
      await this.sendPushServerNotification(
        userId,
        '🔔 Teste Push Server',
        'Sistema de notificações offline funcionando perfeitamente!',
        { type: 'test' }
      );
    }
  }

  async getPushServerActiveUsers(): Promise<string[]> {
    try {
      return await pushClient.getActiveUsers();
    } catch (error) {
      console.error('❌ Erro ao obter usuários ativos:', error);
      return [];
    }
  }

  isPushServerSupported(): boolean {
    return pushClient.isSupported();
  }

  async testPushServerConnection(): Promise<boolean> {
    return await pushClient.testConnection();
  }
}

export const notificationService = new NotificationService();
export { pushClient };

// Inicializa sistema de notificações automaticamente
if (typeof window !== 'undefined') {
  // Tenta Push Server primeiro, depois Web Push como fallback
  pushClient.testConnection().then((serverAvailable) => {
    if (serverAvailable) {
      console.log('🚀 Push Server disponível - notificações offline ativas!');
    } else {
      console.log('⚠️ Push Server indisponível, usando Web Push local');
      notificationService.initializeWebPush().then((success) => {
        if (success) {
          console.log('🔔 Sistema de notificações Web Push ativo!');
        } else {
          console.log('⚠️ Web Push não disponível, usando fallbacks');
        }
      });
    }
  });
}
