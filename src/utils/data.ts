export interface DBData {
  devs: string[];
  projects: string[];
  demands?: Array<{
    id: string;
    desenvolvedor: string;
    projeto: string;
    descricao: string;
    status: 'Pendente' | 'Em Andamento' | 'Concluído';
    dataCriacao?: string;
  }>;
}

export async function fetchDB(): Promise<DBData> {
  try {
    const res = await fetch('/data/db.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Falha ao carregar db.json');
    const data = (await res.json()) as DBData;
    return {
      devs: data.devs ?? [],
      projects: data.projects ?? [],
      demands: data.demands ?? [],
    };
  } catch (e) {
    console.error('Erro ao carregar DB:', e);
    return { devs: [], projects: [], demands: [] };
  }
}
