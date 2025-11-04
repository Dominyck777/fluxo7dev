// Vercel Function - Notify User (Multi-Device)
import webpush from 'web-push';

// Configuração VAPID
const vapidKeys = {
  publicKey: 'BEl62iUYgUivxIkv69yViEuiBIa40HuWd94AzZJHkxaXvM_-QX7nNP6RBXq4FVXtdvQGDlO7BmS1wS1NQ3OfgRs',
  privateKey: 'UGSiUwNCS1Dfn2SR3dvX3_Hgllq5A_-dvAGBBzZkJ5s'
};

webpush.setVapidDetails(
  'mailto:admin@fluxo7dev.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Banco de dados simulado (compartilhado com subscribe.js)
let userSubscriptions = {}; // { userId: [subscription1, subscription2, ...] }

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  const { userId, title, body, data } = req.body;
  
  if (!userId || !title || !body) {
    res.status(400).json({ error: 'userId, title e body obrigatórios' });
    return;
  }
  
  // Verifica se usuário tem subscriptions
  const subscriptions = userSubscriptions[userId];
  
  if (!subscriptions || subscriptions.length === 0) {
    console.log(`⚠️ Usuário ${userId} não possui dispositivos ativos`);
    return res.status(404).json({
      error: `Usuário ${userId} não possui dispositivos conectados`,
      suggestion: 'Usuário precisa fazer login e permitir notificações'
    });
  }
  
  const payload = JSON.stringify({
    title,
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'fluxo7-notification',
    requireInteraction: true,
    data: data || {},
    timestamp: Date.now()
  });
  
  let sent = 0;
  let failed = 0;
  const results = [];
  
  // Envia para TODOS os dispositivos do usuário
  for (let i = 0; i < subscriptions.length; i++) {
    const subscription = subscriptions[i];
    const deviceInfo = subscription.deviceInfo || `Dispositivo ${i + 1}`;
    
    try {
      await webpush.sendNotification(subscription, payload);
      console.log(`✅ Notificação enviada para ${userId} (${deviceInfo}): ${title}`);
      results.push({ device: deviceInfo, status: 'success' });
      sent++;
      
      // Pequeno delay entre envios
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Falha para ${userId} (${deviceInfo}):`, error.message);
      results.push({ device: deviceInfo, status: 'failed', error: error.message });
      failed++;
      
      // Remove subscription inválida
      if (error.statusCode === 410 || error.statusCode === 404) {
        subscriptions.splice(i, 1);
        i--; // Ajusta índice após remoção
        console.log(`🗑️ Subscription removida: ${userId} (${deviceInfo})`);
      }
    }
  }
  
  // Atualiza subscriptions (remove as inválidas)
  if (subscriptions.length === 0) {
    delete userSubscriptions[userId];
  }
  
  res.status(200).json({
    success: sent > 0,
    message: `Notificação processada para ${userId}`,
    title,
    body,
    devices: {
      sent,
      failed,
      total: sent + failed
    },
    results
  });
}
