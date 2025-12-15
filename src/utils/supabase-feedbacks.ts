import { supabase } from './supabase-client';
import type { FeedbackData } from '../components/SatisfactionSurvey';

interface IsisRow {
  idx?: number;
  id: string | number;
  cod_cliente: string | null;
  nome_cliente: string | null;
  empresa: string | null;
  projeto: string | null;
  nota: number | null;
  comentario: string | null;
  conversa: unknown | null;
  timestamp: string;
}

function normalizeConversation(raw: unknown): FeedbackData['conversa'] {
  if (!raw) {
    return [];
  }

  // Se já veio como array, apenas confiamos no tipo em runtime
  if (Array.isArray(raw)) {
    return raw as FeedbackData['conversa'];
  }

  // Se veio como string JSON, tenta fazer o parse
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as FeedbackData['conversa']) : [];
    } catch {
      return [];
    }
  }

  // Qualquer outro formato: ignora e retorna array vazio
  return [];
}

function mapRowToFeedback(row: IsisRow): FeedbackData {
  return {
    id: String(row.id),
    timestamp: row.timestamp,
    estrelas: row.nota ?? 0,
    nome_cliente: row.nome_cliente ?? 'Cliente',
    empresa: row.empresa ?? '',
    projeto: row.projeto ?? '',
    comentario: row.comentario ?? undefined,
    cod_cliente: row.cod_cliente ?? undefined,
    conversa: normalizeConversation(row.conversa),
  };
}

export const supabaseFeedbacks = {
  async getFeedbacks(): Promise<FeedbackData[]> {
    const { data, error } = await supabase
      .from('isis')
      .select('id, cod_cliente, nome_cliente, empresa, projeto, nota, comentario, conversa, timestamp')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('[supabase-feedbacks] Erro ao buscar feedbacks:', error);
      throw error;
    }

    const rows = (data as IsisRow[] | null) ?? [];
    // Considera apenas registros que já têm nota preenchida
    return rows
      .filter((row) => row.nota !== null)
      .map(mapRowToFeedback);
  },

  async clearAllFeedbacks(): Promise<void> {
    const { error } = await supabase
      .from('isis')
      .update({ nota: null, comentario: null })
      .not('id', 'is', null);

    if (error) {
      console.error('[supabase-feedbacks] Erro ao limpar todas as notas/comentários:', error);
      throw error;
    }
  },

  async clearSingleFeedback(id: string): Promise<void> {
    const { error } = await supabase
      .from('isis')
      .update({ nota: null, comentario: null })
      .eq('id', id);

    if (error) {
      console.error('[supabase-feedbacks] Erro ao limpar nota/comentário do feedback:', error);
      throw error;
    }
  },
};
