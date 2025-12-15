import { supabase } from './supabase-client';
import type { Demand } from '../components/DemandCard';

interface DemandRow {
  idx: number | null;
  id: number;
  desenvolvedor: string;
  projeto: string;
  descricao: string;
  status: string;
  prioridade: string;
  data_criacao: string | null;
}

function mapRowToDemand(row: DemandRow): Demand {
  return {
    id: row.id,
    desenvolvedor: row.desenvolvedor,
    projeto: row.projeto,
    descricao: row.descricao,
    status: row.status as Demand['status'],
    prioridade: row.prioridade as Demand['prioridade'],
    dataCriacao: row.data_criacao ?? undefined,
  };
}

export const supabaseDemands = {
  async getDemands(): Promise<Demand[]> {
    const { data, error } = await supabase
      .from('demandas')
      .select('idx, id, desenvolvedor, projeto, descricao, status, prioridade, data_criacao')
      .order('data_criacao', { ascending: false });

    if (error) {
      console.error('[supabase-demands] Erro ao buscar demandas:', error);
      throw error;
    }

    return (data ?? []).map(mapRowToDemand);
  },

  async createDemand(data: Omit<Demand, 'id'>): Promise<Demand> {
    const nowIso = new Date().toISOString();
    const id = Date.now();

    const row = {
      id,
      desenvolvedor: data.desenvolvedor,
      projeto: data.projeto,
      descricao: data.descricao,
      status: data.status,
      prioridade: data.prioridade,
      data_criacao: data.dataCriacao ?? nowIso,
    };

    const { data: inserted, error } = await supabase
      .from('demandas')
      .insert(row)
      .select('idx, id, desenvolvedor, projeto, descricao, status, prioridade, data_criacao')
      .single();

    if (error) {
      console.error('[supabase-demands] Erro ao criar demanda:', error);
      throw error;
    }

    return mapRowToDemand(inserted as DemandRow);
  },

  async updateDemand(demand: Demand): Promise<Demand> {
    const row = {
      desenvolvedor: demand.desenvolvedor,
      projeto: demand.projeto,
      descricao: demand.descricao,
      status: demand.status,
      prioridade: demand.prioridade,
      data_criacao: demand.dataCriacao ?? null,
    };

    const { data, error } = await supabase
      .from('demandas')
      .update(row)
      .eq('id', demand.id)
      .select('idx, id, desenvolvedor, projeto, descricao, status, prioridade, data_criacao')
      .single();

    if (error) {
      console.error('[supabase-demands] Erro ao atualizar demanda:', error);
      throw error;
    }

    return mapRowToDemand(data as DemandRow);
  },

  async deleteDemand(id: string | number): Promise<void> {
    const { error } = await supabase
      .from('demandas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[supabase-demands] Erro ao excluir demanda:', error);
      throw error;
    }
  },
};
