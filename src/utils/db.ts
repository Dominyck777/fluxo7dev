import { type Demand } from '../components/DemandCard';

const STORAGE_KEY = 'fluxo7dev_db';

interface DB {
  devs: string[];
  projects: string[];
  priorities: string[];
  demands: Demand[];
}

// Carrega DB do localStorage ou inicializa vazio
function loadDB(): DB {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as DB;
    }
  } catch (e) {
    console.error('Erro ao carregar DB do localStorage:', e);
  }
  return { devs: [], projects: [], priorities: [], demands: [] };
}

// Salva DB no localStorage
function saveDB(db: DB): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Erro ao salvar DB no localStorage:', e);
  }
}

// Inicializa DB a partir do arquivo /data/db.json se localStorage vazio ou incompleto
export async function initDB(): Promise<DB> {
  let db = loadDB();
  
  // Se falta alguma lista (devs, projects ou priorities), recarrega do arquivo
  const needsReload = !db.devs || !db.projects || !db.priorities || 
                       db.devs.length === 0 || db.projects.length === 0 || db.priorities.length === 0;
  
  if (needsReload) {
    // Carrega do arquivo público
    try {
      const res = await fetch('/data/db.json', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        // Mantém as demands existentes, mas atualiza as listas
        db = {
          devs: Array.isArray(json.devs) ? json.devs : (db.devs || []),
          projects: Array.isArray(json.projects) ? json.projects : (db.projects || []),
          priorities: Array.isArray(json.priorities) ? json.priorities : (db.priorities || []),
          demands: db.demands || [], // Mantém as demands existentes
        };
        saveDB(db);
      }
    } catch (e) {
      console.error('Erro ao carregar /data/db.json:', e);
    }
  }
  
  return db;
}

// CRUD de Demands
export function getDemands(): Demand[] {
  return loadDB().demands;
}

export function createDemand(data: Omit<Demand, 'id'>): Demand {
  const db = loadDB();
  const newDemand: Demand = {
    ...data,
    id: Date.now(),
  };
  db.demands.push(newDemand);
  saveDB(db);
  return newDemand;
}

export function updateDemand(updated: Demand): Demand {
  const db = loadDB();
  const index = db.demands.findIndex(d => d.id === updated.id);
  if (index !== -1) {
    db.demands[index] = updated;
    saveDB(db);
  }
  return updated;
}

export function deleteDemand(id: string | number): void {
  const db = loadDB();
  db.demands = db.demands.filter(d => d.id !== id);
  saveDB(db);
}

// Listas
export function getDevs(): string[] {
  return loadDB().devs;
}

export function getProjects(): string[] {
  return loadDB().projects;
}

export function getPriorities(): string[] {
  return loadDB().priorities;
}
