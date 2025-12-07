import { type Demand } from '../components/DemandCard';
import { type Transaction } from '../components/FinancialView';

const BIN_ID = '690605e5ae596e708f3c7bc5';
const CLIENTS_BIN_ID = '6935855cd0ea881f4018b25d';
const API_KEY = '$2a$10$/XmOGvx8./SZzV3qMzQ5i.6FjBjS4toNbeaEFzX2D8QPUddyM6VR2';
const BASE_URL = 'https://api.jsonbin.io/v3';

export interface Developer {
  id: string;
  name: string;
  avatar?: string;
  password: string;
  role: 'admin' | 'developer';
  active: boolean;
}

interface DB {
  devs: Developer[];
  projects: string[];
  priorities: string[];
  demands: Demand[];
  transactions: Transaction[];
}

export interface ClientRecord {
  id: string | number;
  code: string;
  name: string;
  project: string;
  status: 'ativo' | 'pendente';
  activationDate: string;
  endDate: string;
}

interface ClientsDB {
  clientes: ClientRecord[];
}

async function readBin(): Promise<DB> {
  const response = await fetch(`${BASE_URL}/b/${BIN_ID}/latest`, {
    headers: {
      'X-Master-Key': API_KEY,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to read from JSONBin');
  }
  
  const data = await response.json();
  return data.record;
}

async function updateBin(db: DB): Promise<void> {
  const response = await fetch(`${BASE_URL}/b/${BIN_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': API_KEY,
    },
    body: JSON.stringify(db),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update JSONBin');
  }
}

async function readClientsBin(): Promise<ClientsDB> {
  const response = await fetch(`${BASE_URL}/b/${CLIENTS_BIN_ID}/latest`, {
    headers: {
      'X-Master-Key': API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to read clients from JSONBin');
  }

  const data = await response.json();
  const record = data.record as ClientsDB | undefined;
  return record ?? { clientes: [] };
}

async function updateClientsBin(db: ClientsDB): Promise<void> {
  const response = await fetch(`${BASE_URL}/b/${CLIENTS_BIN_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': API_KEY,
    },
    body: JSON.stringify(db),
  });

  if (!response.ok) {
    throw new Error('Failed to update clients JSONBin');
  }
}

export const jsonbinClient = {
  async getConfig() {
    const db = await readBin();
    return {
      devs: db.devs.filter(dev => dev.active).map(dev => dev.name),
      projects: db.projects,
      priorities: db.priorities,
    };
  },

  async authenticateUser(userId: string, password: string): Promise<Developer | null> {
    const db = await readBin();
    const user = db.devs.find(dev => 
      dev.id === userId && 
      dev.password === password && 
      dev.active
    );
    return user || null;
  },

  async getDemands(): Promise<Demand[]> {
    const db = await readBin();
    return db.demands || [];
  },

  async createDemand(data: Omit<Demand, 'id'>): Promise<Demand> {
    const db = await readBin();
    const newDemand: Demand = {
      ...data,
      id: Date.now(),
    };
    db.demands.push(newDemand);
    await updateBin(db);
    return newDemand;
  },

  async updateDemand(data: Demand): Promise<Demand> {
    const db = await readBin();
    const index = db.demands.findIndex((d) => d.id === data.id);
    if (index !== -1) {
      db.demands[index] = data;
      await updateBin(db);
    }
    return data;
  },

  async deleteDemand(id: string | number): Promise<void> {
    const db = await readBin();
    db.demands = db.demands.filter((d) => d.id !== id);
    await updateBin(db);
  },

  // Métodos para Transações Financeiras
  async getTransactions(): Promise<Transaction[]> {
    const db = await readBin();
    return db.transactions || [];
  },

  async createTransaction(data: Omit<Transaction, 'id'>): Promise<Transaction> {
    const db = await readBin();
    const newTransaction: Transaction = {
      ...data,
      id: Date.now(),
    };
    if (!db.transactions) {
      db.transactions = [];
    }
    db.transactions.push(newTransaction);
    await updateBin(db);
    return newTransaction;
  },

  async updateTransaction(data: Transaction): Promise<Transaction> {
    const db = await readBin();
    if (!db.transactions) {
      db.transactions = [];
    }
    const index = db.transactions.findIndex((t) => t.id === data.id);
    if (index !== -1) {
      db.transactions[index] = data;
      await updateBin(db);
    }
    return data;
  },

  async deleteTransaction(id: string | number): Promise<void> {
    const db = await readBin();
    if (db.transactions) {
      db.transactions = db.transactions.filter((t) => t.id !== id);
      await updateBin(db);
    }
  },

  async getClients(): Promise<ClientRecord[]> {
    const db = await readClientsBin();
    return db.clientes || [];
  },

  async saveClients(clients: ClientRecord[]): Promise<void> {
    const db: ClientsDB = { clientes: clients };
    await updateClientsBin(db);
  },
};
