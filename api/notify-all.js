// Vercel Function - Notify All Users (Multi-Device) via Supabase
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

function getVapid() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  let subject = process.env.VAPID_SUBJECT || 'mailto:admin@fluxo7dev.com';

  // Normaliza subject: se for e-mail puro, prefixa com mailto:
  try {
    const looksLikeEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(subject);
    const hasMailto = /^mailto:/i.test(subject);
    const hasHttp = /^https?:\/\//i.test(subject);
    if (looksLikeEmail && !hasMailto && !hasHttp) {
      subject = `mailto:${subject}`;
    }
  } catch (_) {}

  if (!publicKey || !privateKey) {
    throw new Error('VAPID_PUBLIC_KEY ou VAPID_PRIVATE_KEY não configuradas');
  }
  return { publicKey, privateKey, subject };
}

export default async function handler(req, res) {
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
  
  const { title, body, data } = req.body;
  
  if (!title || !body) {
    res.status(400).json({ error: 'title e body obrigatórios' });
    return;
  }

  try {
    const vapid = getVapid();
    webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

    const supabase = getSupabaseAdmin();
    const { data: rows, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth, device_info');

    if (fetchError) {
      console.error('[api/notify-all] Erro ao buscar subscriptions:', fetchError);
      return res.status(500).json({ error: 'Falha ao buscar subscriptions' });
    }

    const subscriptions = (rows || [])
      .filter(r => r.endpoint && r.p256dh && r.auth)
      .map(r => ({
        id: r.id,
        userId: r.user_id,
        deviceInfo: r.device_info,
        subscription: {
          endpoint: r.endpoint,
          keys: { p256dh: r.p256dh, auth: r.auth }
        }
      }));

    if (subscriptions.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Nenhum dispositivo ativo para broadcast',
        sent: 0,
        failed: 0,
        total: 0
      });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'fluxo7-broadcast',
      requireInteraction: true,
      data: data || {},
      timestamp: Date.now()
    });

    let sent = 0;
    let failed = 0;
    const results = [];

    for (let i = 0; i < subscriptions.length; i++) {
      const row = subscriptions[i];
      const subscription = row.subscription;
      const userId = row.userId;
      const deviceInfo = row.deviceInfo || `Dispositivo ${i + 1}`;
      try {
        await webpush.sendNotification(subscription, payload);
        console.log(`✅ Broadcast enviado para ${userId} (${deviceInfo}): ${title}`);
        results.push({ user: userId, device: deviceInfo, status: 'success' });
        sent++;
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Falha no broadcast para ${userId} (${deviceInfo}):`, error.message);
        results.push({ user: userId, device: deviceInfo, status: 'failed', error: error.message });
        failed++;
        if (error.statusCode === 410 || error.statusCode === 404) {
          try {
            await supabase.from('push_subscriptions').delete().eq('id', row.id);
            console.log(`🗑️ Subscription removida do Supabase: ${userId} (${deviceInfo})`);
          } catch (deleteErr) {
            console.error('[api/notify-all] Falha ao remover subscription inválida:', deleteErr);
          }
        }
      }
    }

    res.status(200).json({
      success: sent > 0,
      message: `Broadcast processado`,
      title,
      body,
      devices: { sent, failed, total: sent + failed },
      users: new Set(subscriptions.map(s => s.userId)).size,
      results
    });
  } catch (err) {
    console.error('[api/notify-all] Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno no broadcast' });
  }
}
