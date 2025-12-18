import { supabase } from './supabase-client';
import type { Transaction } from '../components/FinancialView';

// Mapeia a tabela `financeiro` do Supabase para o tipo Transaction usado no front
interface TransactionRow {
  id: number;
  tipo: 'Entrada' | 'Saída';
  valor: number;
  descricao: string;
  projeto: string;
  data: string;
  is_mensal: boolean;
  is_pago: boolean;
}

function mapRowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.tipo,
    value: row.valor,
    description: row.descricao,
    project: row.projeto,
    date: row.data,
    isMonthly: row.is_mensal,
    isPaid: row.is_pago,
  };
}

export const supabaseTransactions = {
  async getTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('financeiro')
      .select('id, tipo, valor, descricao, projeto, data, is_mensal, is_pago')
      .order('data', { ascending: false });

    if (error) {
      console.error('[supabase-transactions] Erro ao buscar transações:', error);
      throw error;
    }

    return (data ?? []).map(mapRowToTransaction);
  },

  async createTransaction(data: Omit<Transaction, 'id'>): Promise<Transaction> {
    const id = Date.now();

    const row = {
      id,
      tipo: data.type,
      valor: data.value,
      descricao: data.description,
      projeto: data.project,
      data: data.date,
      is_mensal: data.isMonthly ?? false,
      is_pago: data.isPaid ?? false,
    };

    const { data: inserted, error } = await supabase
      .from('financeiro')
      .insert(row)
      .select('id, tipo, valor, descricao, projeto, data, is_mensal, is_pago')
      .single();

    if (error) {
      console.error('[supabase-transactions] Erro ao criar transação:', error);
      throw error;
    }

    return mapRowToTransaction(inserted as TransactionRow);
  },

  async updateTransaction(transaction: Transaction): Promise<Transaction> {
    const row = {
      tipo: transaction.type,
      valor: transaction.value,
      descricao: transaction.description,
      projeto: transaction.project,
      data: transaction.date,
      is_mensal: transaction.isMonthly ?? false,
      is_pago: transaction.isPaid ?? false,
    };

    const { data, error } = await supabase
      .from('financeiro')
      .update(row)
      .eq('id', transaction.id)
      .select('id, tipo, valor, descricao, projeto, data, is_mensal, is_pago')
      .single();

    if (error) {
      console.error('[supabase-transactions] Erro ao atualizar transação:', error);
      throw error;
    }

    return mapRowToTransaction(data as TransactionRow);
  },

  async deleteTransaction(id: string | number): Promise<void> {
    const { error } = await supabase
      .from('financeiro')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[supabase-transactions] Erro ao excluir transação:', error);
      throw error;
    }
  },
};
