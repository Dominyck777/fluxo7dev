import { type Demand } from '../components/DemandCard';

const base = '/api';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${path} failed: ${res.status}`);
  // Some responses (e.g., DELETE) may return empty body
  try {
    return (await res.json()) as T;
  } catch {
    return undefined as unknown as T;
  }
}

export const api = {
  // Lists
  getDevs: () => http<string[]>('/devs'),
  getProjects: () => http<string[]>('/projects'),
  // Demands CRUD
  getDemands: () => http<Demand[]>('/demands'),
  createDemand: (data: Omit<Demand, 'id'>) => http<Demand>('/demands', { method: 'POST', body: JSON.stringify(data) }),
  updateDemand: (data: Demand) => http<Demand>(`/demands/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDemand: (id: string | number) => http<unknown>(`/demands/${id}`, { method: 'DELETE' }),
};
