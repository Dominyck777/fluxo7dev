// Vercel Function - VAPID Public Key
export default function handler(req, res) {
  // Configura CORS
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

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    res.status(500).json({ error: 'VAPID_PUBLIC_KEY não configurada' });
    return;
  }

  res.status(200).json({
    publicKey,
    timestamp: new Date().toISOString(),
  });
}
