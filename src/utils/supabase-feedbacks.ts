import { supabase } from './supabase-client';
import type { FeedbackData } from '../components/SatisfactionSurvey';

interface IsisRow {
  idx?: number;
  id?: string | number;
  cod_cliente: string | null;
  nome_cliente: string | null;
  empresa: string | null;
  projeto: string | null;
  nota?: number | null;
  estrelas?: number | null;
  comentario: string | null;
  conversa: unknown | null;
  timestamp?: string;
  created_at?: string;
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
  const estrelas = (row.nota ?? row.estrelas) ?? 0;
  const timestamp = row.timestamp ?? row.created_at ?? new Date().toISOString();
  return {
    id: String(row.id ?? row.idx ?? Date.now()),
    timestamp,
    estrelas,
    nome_cliente: row.nome_cliente ?? 'Cliente',
    empresa: row.empresa ?? '',
    projeto: row.projeto ?? '',
    comentario: row.comentario ?? undefined,
    cod_cliente: row.cod_cliente ?? undefined,
    conversa: normalizeConversation(row.conversa),
  };
}

function shouldIncludeRow(row: IsisRow): boolean {
  const hasRating = (row.nota ?? row.estrelas) !== null && (row.nota ?? row.estrelas) !== undefined;
  if (hasRating) return true;

  // Inclui sessões sem nota ainda, mas que possuem histórico de conversa
  const conversa = normalizeConversation(row.conversa) ?? [];
  return conversa.length > 0;
}

export const supabaseFeedbacks = {
  async getFeedbacks(): Promise<FeedbackData[]> {
    const { data, error } = await supabase
      .from('isis')
      .select('*');

    if (error) {
      console.error('[supabase-feedbacks] Erro ao buscar feedbacks:', error);
      throw error;
    }

    const rows = (data as IsisRow[] | null) ?? [];
    return rows
      .filter(shouldIncludeRow)
      .map(mapRowToFeedback)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async clearAllFeedbacks(): Promise<void> {
    const attempt1 = await supabase
      .from('isis')
      .update({ nota: null, comentario: null })
      .not('id', 'is', null);

    if (!attempt1.error) return;

    const attempt2 = await supabase
      .from('isis')
      .update({ estrelas: null, comentario: null })
      .not('id', 'is', null);

    if (attempt2.error) {
      console.error('[supabase-feedbacks] Erro ao limpar todas as notas/comentários:', attempt2.error);
      throw attempt2.error;
    }
  },

  async clearSingleFeedback(id: string): Promise<void> {
    const attempt1 = await supabase
      .from('isis')
      .update({ nota: null, comentario: null })
      .eq('id', id);

    if (!attempt1.error) return;

    const attempt2 = await supabase
      .from('isis')
      .update({ estrelas: null, comentario: null })
      .eq('id', id);

    if (attempt2.error) {
      console.error('[supabase-feedbacks] Erro ao limpar nota/comentário do feedback:', attempt2.error);
      throw attempt2.error;
    }
  },
};
