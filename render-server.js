const express = require('express');
const webpush = require('web-push');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

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

// CORS para produção
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://fluxo7dev.vercel.app',
    /\.vercel\.app$/,
    /\.onrender\.com$/
  ],
  credentials: true
}));

app.use(express.json());

// Armazena subscriptions
let userSubscriptions = {};

// Health check principal
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Fluxo7 Dev Push Server - Render Deploy',
    activeUsers: Object.keys(userSubscriptions).length,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'push-server',
    activeUsers: Object.keys(userSubscriptions).length,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// VAPID public key
app.get('/vapid-public-key', (req, res) => {
  res.json({ 
    publicKey: vapidKeys.publicKey,
    timestamp: new Date().toISOString()
  });
});

// Registrar subscription
app.post('/subscribe', (req, res) => {
  const { userId, subscription } = req.body;
  
  if (!userId || !subscription) {
    return res.status(400).json({ 
      error: 'userId e subscription são obrigatórios' 
    });
  }
  
  userSubscriptions[userId] = subscription;
  console.log(`✅ Subscription registrada para: ${userId}`);
  
  res.json({ 
    success: true, 
    message: `Subscription registrada para ${userId}`,
    totalUsers: Object.keys(userSubscriptions).length
  });
});

// Notificar usuário específico
app.post('/notify-user', async (req, res) => {
  const { userId, title, body, data } = req.body;
  
  if (!userId || !title || !body) {
    return res.status(400).json({ 
      error: 'userId, title e body são obrigatórios' 
    });
  }
  
  const subscription = userSubscriptions[userId];
  
  if (!subscription) {
    console.log(`⚠️ Usuário ${userId} não possui subscription ativa`);
    return res.status(404).json({ 
      error: `Usuário ${userId} não encontrado`,
      availableUsers: Object.keys(userSubscriptions)
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
  
  try {
    await webpush.sendNotification(subscription, payload);
    console.log(`🔔 Notificação enviada para ${userId}: ${title}`);
    
    res.json({ 
      success: true, 
      message: `Notificação enviada para ${userId}`,
      title,
      body
    });
  } catch (error) {
    console.error(`❌ Erro ao enviar para ${userId}:`, error.message);
    
    // Remove subscription inválida
    if (error.statusCode === 410 || error.statusCode === 404) {
      delete userSubscriptions[userId];
      console.log(`🗑️ Subscription removida para ${userId}`);
    }
    
    res.status(500).json({ 
      error: 'Falha ao enviar notificação',
      details: error.message,
      userId
    });
  }
});

// Broadcast para todos
app.post('/notify-all', async (req, res) => {
  const { title, body, data } = req.body;
  
  if (!title || !body) {
    return res.status(400).json({ 
      error: 'title e body são obrigatórios' 
    });
  }
  
  const users = Object.keys(userSubscriptions);
  
  if (users.length === 0) {
    return res.json({ 
      success: true, 
      message: 'Nenhum usuário ativo',
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
    data: data || {},
    timestamp: Date.now()
  });
  
  let sent = 0;
  let failed = 0;
  
  for (const userId of users) {
    try {
      await webpush.sendNotification(userSubscriptions[userId], payload);
      console.log(`✅ Broadcast enviado para ${userId}`);
      sent++;
      
      // Delay para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Falha no broadcast para ${userId}:`, error.message);
      failed++;
      
      if (error.statusCode === 410 || error.statusCode === 404) {
        delete userSubscriptions[userId];
      }
    }
  }
  
  res.json({ 
    success: true, 
    message: `Broadcast concluído`,
    sent,
    failed,
    total: users.length
  });
});

// Listar usuários ativos
app.get('/active-users', (req, res) => {
  const users = Object.keys(userSubscriptions);
  res.json({ 
    users,
    count: users.length,
    timestamp: new Date().toISOString()
  });
});

// Middleware de erro
app.use((error, req, res, next) => {
  console.error('❌ Erro no servidor:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /vapid-public-key',
      'POST /subscribe',
      'POST /notify-user',
      'POST /notify-all',
      'GET /active-users'
    ]
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Fluxo7 Push Server rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'production'}`);
  console.log(`📡 VAPID configurado`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
