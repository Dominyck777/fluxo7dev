// Vercel Function - Notify User
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

// Simulação de banco de dados (em produção usar Redis/DB)
let userSubscriptions = {};

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
  
  // Por enquanto, simula sucesso (sem subscription real)
  console.log(`🔔 Notificação simulada para ${userId}: ${title}`);
  
  res.status(200).json({
    success: true,
    message: `Notificação enviada para ${userId}`,
    title,
    body,
    note: 'Simulado - implementação completa requer banco de dados'
  });
}
