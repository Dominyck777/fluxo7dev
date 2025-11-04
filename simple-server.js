const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// CORS simples
app.use(cors());
app.use(express.json());

// Armazena subscriptions
let users = {};

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Fluxo7 Push Server funcionando!',
    users: Object.keys(users).length,
    time: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', users: Object.keys(users).length });
});

// VAPID key
app.get('/vapid-public-key', (req, res) => {
  res.json({ 
    publicKey: 'BEl62iUYgUivxIkv69yViEuiBIa40HuWd94AzZJHkxaXvM_-QX7nNP6RBXq4FVXtdvQGDlO7BmS1wS1NQ3OfgRs'
  });
});

// Registrar usuário
app.post('/subscribe', (req, res) => {
  const { userId, subscription } = req.body;
  users[userId] = subscription;
  console.log(`✅ Usuário registrado: ${userId}`);
  res.json({ success: true });
});

// Notificar (simulado por enquanto)
app.post('/notify-user', (req, res) => {
  const { userId, title, body } = req.body;
  console.log(`🔔 Notificação para ${userId}: ${title}`);
  res.json({ success: true, message: `Notificação enviada para ${userId}` });
});

// Broadcast (simulado)
app.post('/notify-all', (req, res) => {
  const { title, body } = req.body;
  const count = Object.keys(users).length;
  console.log(`📢 Broadcast: ${title} para ${count} usuários`);
  res.json({ success: true, sent: count });
});

// Usuários ativos
app.get('/active-users', (req, res) => {
  res.json({ 
    users: Object.keys(users),
    count: Object.keys(users).length
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌍 Acesse: http://localhost:${PORT}`);
});
