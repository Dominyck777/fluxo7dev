import { supabaseDemands } from './supabase-demands';
import { notificationService } from './notification-service';
import { type Demand } from '../components/DemandCard';

interface PollingConfig {
  enabled: boolean;
  interval: number; // em segundos
  lastCheck: string;
}

class PollingService {
  private config: PollingConfig;
  private intervalId: number | null = null;
  private currentUser: string = '';

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): PollingConfig {
    const saved = localStorage.getItem('fluxo7dev_polling');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Erro ao carregar config de polling:', error);
      }
    }
    
    return {
      enabled: true,
      interval: 30, // Verifica a cada 30 segundos
      lastCheck: new Date().toISOString()
    };
  }

  private saveConfig() {
    localStorage.setItem('fluxo7dev_polling', JSON.stringify(this.config));
  }

  setCurrentUser(userName: string) {
    this.currentUser = userName;
    console.log(`🔄 Polling configurado para usuário: ${userName}`);
  }

  start() {
    if (!this.config.enabled || this.intervalId) {
      return;
    }

    console.log(`🔄 Iniciando polling a cada ${this.config.interval} segundos`);
    
    this.intervalId = setInterval(async () => {
      await this.checkForNewDemands();
    }, this.config.interval * 1000);

    // Primeira verificação imediata
    setTimeout(() => this.checkForNewDemands(), 2000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ Polling interrompido');
    }
  }

  private async checkForNewDemands() {
    if (!this.currentUser) {
      return;
    }

    try {
      const demands = await supabaseDemands.getDemands();
      const lastCheck = new Date(this.config.lastCheck);
      
      // Filtra demandas novas atribuídas ao usuário atual
      const newDemands = demands.filter(demand => {
        if (!demand.dataCriacao) return false;
        const demandDate = new Date(demand.dataCriacao);
        return (
          demand.desenvolvedor === this.currentUser &&
          demandDate > lastCheck &&
          demand.status === 'Pendente'
        );
      });

      if (newDemands.length > 0) {
        console.log(`🔔 ${newDemands.length} nova(s) demanda(s) encontrada(s) para ${this.currentUser}`);
        
        for (const demand of newDemands) {
          await this.notifyNewDemand(demand);
          // Pequeno delay entre notificações
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Atualiza timestamp da última verificação
      this.config.lastCheck = new Date().toISOString();
      this.saveConfig();

    } catch (error) {
      console.error('❌ Erro ao verificar novas demandas:', error);
    }
  }

  private async notifyNewDemand(demand: Demand) {
    const message = `Nova demanda atribuída: "${demand.descricao}" no projeto ${demand.projeto}`;
    
    // Envia notificação Web Push
    await notificationService.sendWebPushNotification({
      title: `🚀 Nova Demanda Atribuída!`,
      body: message,
      tag: `demand-${demand.id}`,
      data: {
        demandId: demand.id,
        type: 'new_demand_polling'
      }
    });

    console.log(`✅ Notificação enviada para ${this.currentUser}:`, message);
  }

  // Força uma verificação manual
  async checkNow() {
    console.log('🔍 Verificação manual de novas demandas...');
    await this.checkForNewDemands();
  }

  // Configurações
  setInterval(seconds: number) {
    this.config.interval = seconds;
    this.saveConfig();
    
    // Reinicia com novo intervalo
    if (this.intervalId) {
      this.stop();
      this.start();
    }
  }

  setEnabled(enabled: boolean) {
    this.config.enabled = enabled;
    this.saveConfig();
    
    if (enabled) {
      this.start();
    } else {
      this.stop();
    }
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getInterval(): number {
    return this.config.interval;
  }

  // Simula uma nova demanda para teste
  async simulateNewDemand() {
    const testDemand: Demand = {
      id: Date.now(),
      desenvolvedor: this.currentUser,
      projeto: 'Teste Polling',
      descricao: 'Esta é uma demanda de teste para verificar o sistema de polling',
      status: 'Pendente',
      prioridade: 'Média',
      dataCriacao: new Date().toISOString()
    };

    await this.notifyNewDemand(testDemand);
  }
}

export const pollingService = new PollingService();
