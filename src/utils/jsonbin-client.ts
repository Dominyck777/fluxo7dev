import { type Demand } from '../components/DemandCard';

const BIN_ID = '690605e5ae596e708f3c7bc5';
const API_KEY = '$2a$10$/XmOGvx8./SZzV3qMzQ5i.6FjBjS4toNbeaEFzX2D8QPUddyM6VR2';
const BASE_URL = 'https://api.jsonbin.io/v3';

interface DB {
  devs: string[];
  projects: string[];
  priorities: string[];
  demands: Demand[];
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

export const jsonbinClient = {
  async getConfig() {
    const db = await readBin();
    return {
      devs: db.devs,
      projects: db.projects,
      priorities: db.priorities,
    };
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
};
