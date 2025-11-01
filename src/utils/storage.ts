import { type Demand } from '../components/DemandCard';

const STORAGE_KEY = 'fluxo7dev_demands';

export const loadDemands = (): Demand[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading demands:', error);
  }
  return [];
};

export const saveDemands = (demands: Demand[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demands));
  } catch (error) {
    console.error('Error saving demands:', error);
  }
};

export const getInitialDemands = (): Demand[] => {
  const now = new Date();
  return [
    {
      id: '1730419200000',
      desenvolvedor: 'Dev 1',
      projeto: 'Sistema de Login',
      descricao: 'Implementar autenticação com JWT e refresh tokens para maior segurança',
      status: 'Em Andamento',
      prioridade: 'Alta',
      dataCriacao: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '1730419200001',
      desenvolvedor: 'Dev 2',
      projeto: 'API de Pagamentos',
      descricao: 'Integração com gateway de pagamento e webhooks',
      status: 'Pendente',
      prioridade: 'Urgente',
      dataCriacao: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '1730419200002',
      desenvolvedor: 'Dev 3',
      projeto: 'Dashboard Analytics',
      descricao: 'Criar dashboard com gráficos e métricas em tempo real',
      status: 'Concluído',
      prioridade: 'Média',
      dataCriacao: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '1730419200003',
      desenvolvedor: 'Dev 1',
      projeto: 'Módulo de Relatórios',
      descricao: 'Desenvolver sistema de geração de relatórios em PDF',
      status: 'Pendente',
      prioridade: 'Baixa',
      dataCriacao: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '1730419200004',
      desenvolvedor: 'Dev 4',
      projeto: 'App Mobile',
      descricao: 'Desenvolver aplicativo mobile em React Native',
      status: 'Em Andamento',
      prioridade: 'Alta',
      dataCriacao: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
};
