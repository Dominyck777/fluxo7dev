const express = require('express');
const webpush = require('web-push');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

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

// CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://fluxo7dev.vercel.app',
    /\.vercel\.app$/,
    /\.railway\.app$/
  ],
  credentials: true
}));

app.use(express.json());

// Armazena subscriptions
let userSubscriptions = {};

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Fluxo7 Dev Push Server ativo!',
    activeUsers: Object.keys(userSubscriptions).length
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Push Server funcionando',
    activeUsers: Object.keys(userSubscriptions).length,
    uptime: process.uptime()
  });
});

// Registrar subscription
app.post('/subscribe', (req, res) => {
  const { userId, subscription } = req.body;
  
  if (!userId || !subscription) {
    return res.status(400).json({ error: 'userId e subscription obrigatórios' });
  }
  
  userSubscriptions[userId] = subscription;
  console.log(`✅ Subscription registrada: ${userId}`);
  
  res.json({ success: true, message: `Registrado: ${userId}` });
});

// Notificar usuário
app.post('/notify-user', async (req, res) => {
  const { userId, title, body, data } = req.body;
  
  if (!userId || !title || !body) {
    return res.status(400).json({ error: 'Parâmetros obrigatórios' });
  }
  
  const subscription = userSubscriptions[userId];
  
  if (!subscription) {
    return res.status(404).json({ 
      error: `Usuário ${userId} não encontrado`
    });
  }
  
  const payload = JSON.stringify({
    title,
    body,
    icon: '/favicon.svg',
    tag: 'fluxo7-notification',
    data: data || {}
  });
  
  try {
    await webpush.sendNotification(subscription, payload);
    console.log(`🔔 Notificação enviada: ${userId}`);
    res.json({ success: true });
  } catch (error) {
    console.error(`❌ Erro: ${error}`);
    
    if (error.statusCode === 410) {
      delete userSubscriptions[userId];
    }
    
    res.status(500).json({ error: 'Falha ao enviar' });
  }
});

// Broadcast
app.post('/notify-all', async (req, res) => {
  const { title, body, data } = req.body;
  
  const users = Object.keys(userSubscriptions);
  let sent = 0;
  
  for (const userId of users) {
    try {
      const payload = JSON.stringify({ title, body, data: data || {} });
      await webpush.sendNotification(userSubscriptions[userId], payload);
      sent++;
    } catch (error) {
      if (error.statusCode === 410) {
        delete userSubscriptions[userId];
      }
    }
  }
  
  res.json({ success: true, sent });
});

// VAPID key
app.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// Usuários ativos
app.get('/active-users', (req, res) => {
  res.json({ 
    users: Object.keys(userSubscriptions),
    count: Object.keys(userSubscriptions).length
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Push Server rodando na porta ${PORT}`);
});
