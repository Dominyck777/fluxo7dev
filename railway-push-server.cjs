const express = require('express');
const webpush = require('web-push');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3003;

// Configuração VAPID (chaves para autenticação)
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HuWd94AzZJHkxaXvM_-QX7nNP6RBXq4FVXtdvQGDlO7BmS1wS1NQ3OfgRs',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'UGSiUwNCS1Dfn2SR3dvX3_Hgllq5A_-dvAGBBzZkJ5s'
};

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@fluxo7dev.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// CORS configurado para produção
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://fluxo7dev.vercel.app',
    /\.vercel\.app$/,
    /\.railway\.app$/
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Armazena as subscriptions dos usuários (em produção, usar banco de dados)
let userSubscriptions = {};

// Health check para Railway
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Fluxo7 Dev Push Server ativo!',
    activeUsers: Object.keys(userSubscriptions).length,
    timestamp: new Date().toISOString()
  });
});

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
    console.log(`⚠️ Usuário ${userId} não possui subscription ativa`);
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
    data: data || {},
    timestamp: Date.now()
  });
  
  try {
    await webpush.sendNotification(subscription, payload);
    console.log(`🔔 Notificação enviada para ${userId}: ${title}`);
    res.json({ success: true, message: `Notificação enviada para ${userId}` });
  } catch (error) {
    console.error(`❌ Erro ao enviar notificação para ${userId}:`, error);
    
    // Remove subscription inválida
    if (error.statusCode === 410 || error.statusCode === 404) {
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
      // Pequeno delay para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Falha no broadcast para ${userId}:`, error);
      failed++;
      
      // Remove subscription inválida
      if (error.statusCode === 410 || error.statusCode === 404) {
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
    timestamp: new Date().toISOString()
  });
});

// Endpoint para obter chave pública VAPID
app.get('/vapid-public-key', (req, res) => {
  res.json({ 
    publicKey: vapidKeys.publicKey,
    timestamp: new Date().toISOString()
  });
});

// Health check detalhado
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Push Server ativo',
    activeUsers: Object.keys(userSubscriptions).length,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Middleware de erro global
app.use((error, req, res, next) => {
  console.error('❌ Erro no servidor:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: error.message
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    availableEndpoints: [
      'GET /',
      'POST /subscribe',
      'POST /notify-user',
      'POST /notify-all',
      'GET /active-users',
      'GET /vapid-public-key',
      'GET /health'
    ]
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Push Server rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📝 Endpoints disponíveis:`);
  console.log(`   GET / - Status do servidor`);
  console.log(`   POST /subscribe - Registrar subscription`);
  console.log(`   POST /notify-user - Notificar usuário específico`);
  console.log(`   POST /notify-all - Broadcast para todos`);
  console.log(`   GET /active-users - Listar usuários ativos`);
  console.log(`   GET /vapid-public-key - Chave pública VAPID`);
  console.log(`   GET /health - Health check detalhado`);
  console.log(`🔑 VAPID Public Key: ${vapidKeys.publicKey}`);
});
