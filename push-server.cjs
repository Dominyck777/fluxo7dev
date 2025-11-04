const express = require('express');
const webpush = require('web-push');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3003;

// Configuração VAPID (chaves para autenticação)
const vapidKeys = {
  publicKey: 'BEl62iUYgUivxIkv69yViEuiBIa40HuWd94AzZJHkxaXvM_-QX7nNP6RBXq4FVXtdvQGDlO7BmS1wS1NQ3OfgRs',
  privateKey: 'UGSiUwNCS1Dfn2SR3dvX3_Hgllq5A_-dvAGBBzZkJ5s'
};

webpush.setVapidDetails(
  'mailto:admin@fluxo7dev.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

app.use(cors());
app.use(express.json());

// Armazena as subscriptions dos usuários (em produção, usar banco de dados)
let userSubscriptions = {};

// Endpoint para registrar subscription de um usuário
app.post('/subscribe', (req, res) => {
  const { userId, subscription } = req.body;
  
  if (!userId || !subscription) {
    return res.status(400).json({ error: 'userId e subscription são obrigatórios' });
  }
  
  userSubscriptions[userId] = subscription;
  console.log(`✅ Subscription registrada para usuário: ${userId}`);
  
  res.json({ success: true, message: `Subscription registrada para ${userId}` });
});

// Endpoint para enviar notificação para um usuário específico
app.post('/notify-user', async (req, res) => {
  const { userId, title, body, data } = req.body;
  
  if (!userId || !title || !body) {
    return res.status(400).json({ error: 'userId, title e body são obrigatórios' });
  }
  
  const subscription = userSubscriptions[userId];
  
  if (!subscription) {
    return res.status(404).json({ 
      error: `Usuário ${userId} não possui subscription ativa`,
      fallback: `Notificação para ${userId}: ${title} - ${body}`
    });
  }
  
  const payload = JSON.stringify({
    title,
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'fluxo7-notification',
    requireInteraction: true,
    data: data || {}
  });
  
  try {
    await webpush.sendNotification(subscription, payload);
    console.log(`🔔 Notificação enviada para ${userId}: ${title}`);
    res.json({ success: true, message: `Notificação enviada para ${userId}` });
  } catch (error) {
    console.error(`❌ Erro ao enviar notificação para ${userId}:`, error);
    
    // Remove subscription inválida
    if (error.statusCode === 410) {
      delete userSubscriptions[userId];
      console.log(`🗑️ Subscription inválida removida para ${userId}`);
    }
    
    res.status(500).json({ 
      error: 'Falha ao enviar notificação',
      details: error.message,
      fallback: `Notificação para ${userId}: ${title} - ${body}`
    });
  }
});

// Endpoint para broadcast (todos os usuários)
app.post('/notify-all', async (req, res) => {
  const { title, body, data } = req.body;
  
  if (!title || !body) {
    return res.status(400).json({ error: 'title e body são obrigatórios' });
  }
  
  const users = Object.keys(userSubscriptions);
  
  if (users.length === 0) {
    return res.json({ 
      success: true, 
      message: 'Nenhum usuário com subscription ativa',
      sent: 0 
    });
  }
  
  const payload = JSON.stringify({
    title,
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'fluxo7-broadcast',
    requireInteraction: true,
    data: data || {}
  });
  
  let sent = 0;
  let failed = 0;
  
  for (const userId of users) {
    try {
      await webpush.sendNotification(userSubscriptions[userId], payload);
      console.log(`✅ Broadcast enviado para ${userId}`);
      sent++;
    } catch (error) {
      console.error(`❌ Falha no broadcast para ${userId}:`, error);
      failed++;
      
      // Remove subscription inválida
      if (error.statusCode === 410) {
        delete userSubscriptions[userId];
      }
    }
  }
  
  res.json({ 
    success: true, 
    message: `Broadcast enviado para ${sent} usuários`,
    sent,
    failed
  });
});

// Endpoint para listar usuários ativos
app.get('/active-users', (req, res) => {
  const users = Object.keys(userSubscriptions);
  res.json({ 
    users,
    count: users.length,
    subscriptions: userSubscriptions
  });
});

// Endpoint para obter chave pública VAPID
app.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Push Server ativo',
    activeUsers: Object.keys(userSubscriptions).length
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Push Server rodando na porta ${PORT}`);
  console.log(`📝 Endpoints disponíveis:`);
  console.log(`   POST /subscribe - Registrar subscription`);
  console.log(`   POST /notify-user - Notificar usuário específico`);
  console.log(`   POST /notify-all - Broadcast para todos`);
  console.log(`   GET /active-users - Listar usuários ativos`);
  console.log(`   GET /vapid-public-key - Chave pública VAPID`);
  console.log(`   GET /health - Health check`);
  console.log(`🔑 VAPID Public Key: ${vapidKeys.publicKey}`);
});
