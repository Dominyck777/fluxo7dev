import { type Demand } from '../components/DemandCard';

const API_BASE = '/api';

// Detecta se está em produção (Vercel) ou desenvolvimento
const isProduction = import.meta.env.PROD;

export const apiClient = {
  async getConfig() {
    if (!isProduction) {
      // Em dev, carrega do arquivo público
      const res = await fetch('/data/db.json');
      return res.json();
    }
    // Em prod, usa a API serverless
    const res = await fetch(`${API_BASE}/config`);
    return res.json();
  },

  async getDemands(): Promise<Demand[]> {
    if (!isProduction) {
      // Em dev, usa localStorage
      const stored = localStorage.getItem('fluxo7dev_db');
      if (stored) {
        const db = JSON.parse(stored);
        return db.demands || [];
      }
      return [];
    }
    // Em prod, usa a API serverless
    const res = await fetch(`${API_BASE}/demands`);
    return res.json();
  },

  async createDemand(data: Omit<Demand, 'id'>): Promise<Demand> {
    if (!isProduction) {
      // Em dev, salva no localStorage
      const stored = localStorage.getItem('fluxo7dev_db');
      const db = stored ? JSON.parse(stored) : { devs: [], projects: [], priorities: [], demands: [] };
      const newDemand: Demand = { ...data, id: Date.now() };
      db.demands.push(newDemand);
      localStorage.setItem('fluxo7dev_db', JSON.stringify(db));
      return newDemand;
    }
    // Em prod, usa a API serverless
    const res = await fetch(`${API_BASE}/demands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateDemand(data: Demand): Promise<Demand> {
    if (!isProduction) {
      // Em dev, atualiza no localStorage
      const stored = localStorage.getItem('fluxo7dev_db');
      if (stored) {
        const db = JSON.parse(stored);
        const index = db.demands.findIndex((d: Demand) => d.id === data.id);
        if (index !== -1) {
          db.demands[index] = data;
          localStorage.setItem('fluxo7dev_db', JSON.stringify(db));
        }
      }
      return data;
    }
    // Em prod, usa a API serverless
    const res = await fetch(`${API_BASE}/demands?id=${data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteDemand(id: string | number): Promise<void> {
    if (!isProduction) {
      // Em dev, remove do localStorage
      const stored = localStorage.getItem('fluxo7dev_db');
      if (stored) {
        const db = JSON.parse(stored);
        db.demands = db.demands.filter((d: Demand) => d.id !== id);
        localStorage.setItem('fluxo7dev_db', JSON.stringify(db));
      }
      return;
    }
    // Em prod, usa a API serverless
    await fetch(`${API_BASE}/demands?id=${id}`, {
      method: 'DELETE',
    });
  },
};
