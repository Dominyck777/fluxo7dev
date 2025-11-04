// Vercel Function - Subscribe User (Multi-Device)
let userSubscriptions = {}; // { userId: [subscription1, subscription2, ...] }

export default function handler(req, res) {
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
  
  const { userId, subscription, deviceInfo } = req.body;
  
  if (!userId || !subscription) {
    res.status(400).json({ error: 'userId e subscription obrigatórios' });
    return;
  }
  
  // Inicializa array se não existir
  if (!userSubscriptions[userId]) {
    userSubscriptions[userId] = [];
  }
  
  // Adiciona info do dispositivo
  const subscriptionWithDevice = {
    ...subscription,
    deviceInfo: deviceInfo || 'Unknown Device',
    timestamp: new Date().toISOString(),
    endpoint: subscription.endpoint // Para identificar duplicatas
  };
  
  // Remove subscription duplicada (mesmo endpoint)
  userSubscriptions[userId] = userSubscriptions[userId].filter(
    sub => sub.endpoint !== subscription.endpoint
  );
  
  // Adiciona nova subscription
  userSubscriptions[userId].push(subscriptionWithDevice);
  
  console.log(`✅ Subscription registrada: ${userId} (${deviceInfo || 'Unknown'})`);
  console.log(`📱 Total dispositivos para ${userId}: ${userSubscriptions[userId].length}`);
  
  res.status(200).json({
    success: true,
    message: `Subscription registrada para ${userId}`,
    deviceInfo: deviceInfo || 'Unknown Device',
    totalDevices: userSubscriptions[userId].length,
    totalUsers: Object.keys(userSubscriptions).length
  });
}
