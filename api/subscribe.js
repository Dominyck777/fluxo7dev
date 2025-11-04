// Vercel Function - Subscribe User
let userSubscriptions = {};

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
  
  const { userId, subscription } = req.body;
  
  if (!userId || !subscription) {
    res.status(400).json({ error: 'userId e subscription obrigatórios' });
    return;
  }
  
  userSubscriptions[userId] = subscription;
  console.log(`✅ Subscription registrada: ${userId}`);
  
  res.status(200).json({
    success: true,
    message: `Subscription registrada para ${userId}`,
    totalUsers: Object.keys(userSubscriptions).length
  });
}
