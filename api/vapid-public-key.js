// Vercel Function - VAPID Public Key
export default function handler(req, res) {
  console.log('[/api/vapid-public-key] Nova requisição recebida');
  
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-KEY');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  // Resposta para requisições OPTIONS (pré-voo)
  if (req.method === 'OPTIONS') {
    console.log('[/api/vapid-public-key] Resposta para OPTIONS');
    return res.status(200).end();
  }
  
  // Apenas aceita requisições GET
  if (req.method !== 'GET') {
    console.log(`[/api/vapid-public-key] Método não permitido: ${req.method}`);
    return res.status(405).json({ 
      error: 'Método não permitido',
      allowedMethods: ['GET', 'OPTIONS']
    });
  }

  try {
    console.log('[/api/vapid-public-key] Obtendo chave VAPID...');
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    
    if (!publicKey) {
      const errorMsg = 'VAPID_PUBLIC_KEY não configurada no ambiente';
      console.error(`[/api/vapid-public-key] ${errorMsg}`);
      return res.status(500).json({ 
        error: 'Configuração do servidor incompleta',
        details: errorMsg,
        timestamp: new Date().toISOString()
      });
    }

    console.log('[/api/vapid-public-key] Chave VAPID encontrada');
    return res.status(200).json({
      publicKey,
      timestamp: new Date().toISOString(),
      status: 'success'
    });

  } catch (error) {
    console.error('[/api/vapid-public-key] Erro inesperado:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
}
