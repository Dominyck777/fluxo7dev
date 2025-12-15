import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

// Usa variáveis de ambiente, que você vai preencher no painel da Vercel ou em .env
// Exemplo: POSTGRES_CONNECTION_STRING=postgresql://postgres.guildthlqkfubbqoybys:[SENHA]@aws-0-us-west-2.pooler.supabase.com:6543/postgres

const connectionString = process.env.POSTGRES_CONNECTION_STRING;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!connectionString) {
    return res.status(500).json({ error: 'POSTGRES_CONNECTION_STRING não configurada' });
  }

  const { userId, password } = req.body as { userId?: string; password?: string };

  if (!userId || !password) {
    return res.status(400).json({ error: 'userId e password são obrigatórios' });
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();

    const query = `
      SELECT id, name, avatar, role, active
      FROM public.usuarios
      WHERE id = $1 AND password = $2 AND active = true
      LIMIT 1
    `;

    const result = await client.query(query, [userId.toLowerCase(), password]);

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const row = result.rows[0];

    return res.status(200).json({
      id: row.id,
      name: row.name,
      avatar: row.avatar,
      role: row.role,
      active: row.active,
    });
  } catch (error) {
    console.error('[api/login] Erro ao autenticar usuário:', error);
    return res.status(500).json({ error: 'Erro interno ao autenticar' });
  } finally {
    await client.end().catch(() => {});
  }
}
