// Vercel Function - Notify All Users (Multi-Device)
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

// Banco de dados simulado
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
  
  const { title, body, data } = req.body;
  
  if (!title || !body) {
    res.status(400).json({ error: 'title e body obrigatórios' });
    return;
  }
  
  const users = Object.keys(userSubscriptions);
  
  if (users.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'Nenhum usuário ativo para broadcast',
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
  
  // Envia para TODOS os dispositivos de TODOS os usuários
  for (const userId of users) {
    const subscriptions = userSubscriptions[userId] || [];
    
    for (let i = 0; i < subscriptions.length; i++) {
      const subscription = subscriptions[i];
      const deviceInfo = subscription.deviceInfo || `Dispositivo ${i + 1}`;
      
      try {
        await webpush.sendNotification(subscription, payload);
        console.log(`✅ Broadcast enviado para ${userId} (${deviceInfo}): ${title}`);
        results.push({ user: userId, device: deviceInfo, status: 'success' });
        sent++;
        
        // Delay entre envios
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Falha no broadcast para ${userId} (${deviceInfo}):`, error.message);
        results.push({ user: userId, device: deviceInfo, status: 'failed', error: error.message });
        failed++;
        
        // Remove subscription inválida
        if (error.statusCode === 410 || error.statusCode === 404) {
          subscriptions.splice(i, 1);
          i--; // Ajusta índice
          console.log(`🗑️ Subscription removida: ${userId} (${deviceInfo})`);
        }
      }
    }
    
    // Remove usuário se não tem mais dispositivos
    if (subscriptions.length === 0) {
      delete userSubscriptions[userId];
    }
  }
  
  res.status(200).json({
    success: sent > 0,
    message: `Broadcast processado`,
    title,
    body,
    devices: {
      sent,
      failed,
      total: sent + failed
    },
    users: users.length,
    results
  });
}
