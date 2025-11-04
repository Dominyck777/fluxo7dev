// Vercel Function - Health Check
export default function handler(req, res) {
  res.status(200).json({
    status: 'OK',
    message: 'Fluxo7 Push Server - Vercel Functions',
    timestamp: new Date().toISOString(),
    method: req.method
  });
}
