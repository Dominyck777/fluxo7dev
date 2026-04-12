import { supabase } from './supabase-client';
import type { ClientRecord } from './jsonbin-client';

// Mapeia a tabela `clientes` do Supabase para o tipo ClientRecord usado no front
export interface ClientRow {
  id: string;
  code: string;
  name: string;
  project: string;
  status: string;
  activation_date: string; // date -> string ISO
  end_date: string;        // date -> string ISO
}

export function mapRowToClient(row: ClientRow): ClientRecord {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    project: row.project,
    status: row.status as ClientRecord['status'],
    activationDate: row.activation_date,
    endDate: row.end_date,
  };
}

export const supabaseClients = {
  async getClients(): Promise<ClientRecord[]> {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, code, name, project, status, activation_date, end_date')
      .order('activation_date', { ascending: false });

    if (error) {
      console.error('[supabase-clients] Erro ao buscar clientes:', error);
      throw error;
    }

    return (data ?? []).map(mapRowToClient);
  },

  // Insere um único cliente (seguro para multi-software)
  async createClient(client: ClientRecord): Promise<void> {
    const row: ClientRow = {
      id: String(client.id),
      code: client.code,
      name: client.name,
      project: client.project,
      status: client.status,
      activation_date: client.activationDate,
      end_date: client.endDate,
    };

    const { error } = await supabase
      .from('clientes')
      .insert(row);

    if (error) {
      console.error('[supabase-clients] Erro ao criar cliente:', error);
      throw error;
    }
  },

  // Atualiza ou insere (seguro para sincronização)
  async upsertClient(client: ClientRecord): Promise<void> {
    const row: ClientRow = {
      id: String(client.id),
      code: client.code,
      name: client.name,
      project: client.project,
      status: client.status,
      activation_date: client.activationDate,
      end_date: client.endDate,
    };

    const { error } = await supabase
      .from('clientes')
      .upsert(row);

    if (error) {
      console.error('[supabase-clients] Erro ao dar upsert no cliente:', error);
      throw error;
    }
  },

  // Atualiza apenas o status de um cliente específico (PUT sem recriar todos)
  async updateClientStatus(id: string, status: ClientRecord['status']): Promise<void> {
    const { error } = await supabase
      .from('clientes')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('[supabase-clients] Erro ao atualizar status do cliente:', error);
      throw error;
    }
  },
};
