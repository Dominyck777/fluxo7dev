// Vercel Function - Active Users and Devices
let userSubscriptions = {}; // Compartilhado com outras functions

export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  const users = Object.keys(userSubscriptions);
  const deviceDetails = {};
  let totalDevices = 0;
  
  // Monta detalhes dos dispositivos por usuário
  users.forEach(userId => {
    const subscriptions = userSubscriptions[userId] || [];
    deviceDetails[userId] = subscriptions.map(sub => ({
      deviceInfo: sub.deviceInfo || 'Unknown Device',
      timestamp: sub.timestamp || 'Unknown',
      endpoint: sub.endpoint ? sub.endpoint.substring(0, 50) + '...' : 'No endpoint'
    }));
    totalDevices += subscriptions.length;
  });
  
  res.status(200).json({
    users,
    count: users.length,
    totalDevices,
    deviceDetails,
    timestamp: new Date().toISOString()
  });
}
