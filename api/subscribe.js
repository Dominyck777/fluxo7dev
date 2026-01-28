// Vercel Function - Subscribe User (Multi-Device)
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-KEY');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Auth simples via header
  const serverApiKey = process.env.NOTIFICATIONS_API_KEY;
  const clientApiKey = req.headers['x-api-key'];
  if (!serverApiKey || clientApiKey !== serverApiKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  const { userId, subscription, deviceInfo } = req.body;
  
  if (!userId || !subscription) {
    res.status(400).json({ error: 'userId e subscription obrigatórios' });
    return;
  }
  
  (async () => {
    try {
      const supabase = getSupabaseAdmin();

      const keys = subscription.keys || {};
      const endpoint = subscription.endpoint;

      const row = {
        user_id: userId,
        endpoint,
        p256dh: keys.p256dh || null,
        auth: keys.auth || null,
        device_info: deviceInfo || 'Unknown Device',
        updated_at: new Date().toISOString(),
      };

      const { data: upserted, error } = await supabase
        .from('push_subscriptions')
        .upsert(row, { onConflict: 'endpoint' })
        .select('id, user_id, endpoint, updated_at')
        .limit(1);

      if (error) {
        console.error('[api/subscribe] Erro ao salvar subscription:', error);
        res.status(500).json({ error: 'Falha ao salvar subscription' });
        return;
      }

      console.log('[api/subscribe] Subscription salva para', userId, 'endpoint prefix:', endpoint?.slice(0, 50));
      res.status(200).json({
        success: true,
        message: `Subscription registrada para ${userId}`,
        deviceInfo: deviceInfo || 'Unknown Device',
        saved: upserted && upserted[0] ? upserted[0] : null
      });
    } catch (err) {
      console.error('[api/subscribe] Erro inesperado:', err);
      res.status(500).json({ error: 'Erro interno' });
    }
  })();
}
