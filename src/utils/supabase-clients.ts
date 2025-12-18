import { supabase } from './supabase-client';
import type { ClientRecord } from './jsonbin-client';

// Mapeia a tabela `clientes` do Supabase para o tipo ClientRecord usado no front
interface ClientRow {
  id: string;
  code: string;
  name: string;
  project: string;
  status: string;
  activation_date: string; // date -> string ISO
  end_date: string;        // date -> string ISO
}

function mapRowToClient(row: ClientRow): ClientRecord {
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

  async saveClients(clients: ClientRecord[]): Promise<void> {
    // Estratégia simples: substituir todos os registros atuais pelo array recebido
    // 1) apagar todos
    const { error: deleteError } = await supabase
      .from('clientes')
      .delete()
      .neq('id', '');

    if (deleteError) {
      console.error('[supabase-clients] Erro ao limpar clientes:', deleteError);
      throw deleteError;
    }

    if (clients.length === 0) return;

    // 2) inserir todos
    const rows: ClientRow[] = clients.map((c) => ({
      id: String(c.id),
      code: c.code,
      name: c.name,
      project: c.project,
      status: c.status,
      activation_date: c.activationDate,
      end_date: c.endDate,
    }));

    const { error: insertError } = await supabase
      .from('clientes')
      .insert(rows);

    if (insertError) {
      console.error('[supabase-clients] Erro ao salvar clientes:', insertError);
      throw insertError;
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
