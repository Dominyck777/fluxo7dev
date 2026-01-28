// Vercel Function - Active Users and Devices (Supabase-backed)
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: rows, error } = await supabase
      .from('push_subscriptions')
      .select('user_id, device_info, updated_at, endpoint');

    if (error) {
      console.error('[api/active-users] Erro ao buscar subscriptions:', error);
      return res.status(500).json({ error: 'Falha ao buscar subscriptions' });
    }

    const usersSet = new Set();
    const deviceDetails = {};
    let totalDevices = 0;

    (rows || []).forEach((r) => {
      const userId = r.user_id || 'unknown';
      usersSet.add(userId);
      deviceDetails[userId] = deviceDetails[userId] || [];
      deviceDetails[userId].push({
        deviceInfo: r.device_info || 'Unknown Device',
        updatedAt: r.updated_at,
        endpoint: r.endpoint ? r.endpoint.substring(0, 50) + '...' : 'No endpoint'
      });
      totalDevices += 1;
    });

    const users = Array.from(usersSet);

    res.status(200).json({
      users,
      count: users.length,
      totalDevices,
      deviceDetails,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('[api/active-users] Erro inesperado:', e);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
