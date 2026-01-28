// Vercel Function - Notify User (Multi-Device)
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Configuração inicial
console.log('[/api/notify-user] Inicializando função de notificação...');

// Verificação de variáveis de ambiente
const ENV_VARS = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '***' : 'NÃO CONFIGURADO',
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY ? '***' : 'NÃO CONFIGURADO',
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY ? '***' : 'NÃO CONFIGURADO',
  VAPID_SUBJECT: process.env.VAPID_SUBJECT || 'mailto:admin@fluxo7dev.com',
  NOTIFICATIONS_API_KEY: process.env.NOTIFICATIONS_API_KEY ? '***' : 'NÃO CONFIGURADO'
};

console.log('[/api/notify-user] Variáveis de ambiente:', JSON.stringify(ENV_VARS, null, 2));

function getSupabaseAdmin() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const error = new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados');
    console.error('[/api/notify-user] Erro de configuração:', error.message);
    throw error;
  }
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    console.log('[/api/notify-user] Cliente Supabase inicializado com sucesso');
    return supabase;
  } catch (error) {
    console.error('[/api/notify-user] Erro ao criar cliente Supabase:', error);
    throw new Error('Falha ao conectar ao banco de dados');
  }
}

function getVapid() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@fluxo7dev.com';

  if (!publicKey || !privateKey) {
    const error = new Error('VAPID_PUBLIC_KEY ou VAPID_PRIVATE_KEY não configuradas');
    console.error('[/api/notify-user] Erro de configuração VAPID:', error.message);
    throw error;
  }

  console.log('[/api/notify-user] Configuração VAPID carregada com sucesso');
  return { publicKey, privateKey, subject };
}

export default async function handler(req, res) {
  console.log(`[${new Date().toISOString()}] [/api/notify-user] Nova requisição recebida`);
  
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-KEY');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  // Tratamento de requisições OPTIONS (pré-voo CORS)
  if (req.method === 'OPTIONS') {
    console.log('[/api/notify-user] Resposta para requisição OPTIONS');
    return res.status(200).end();
  }
  
  // Apenas aceita requisições POST
  if (req.method !== 'POST') {
    const errorMsg = `Método não permitido: ${req.method}`;
    console.error(`[/api/notify-user] ${errorMsg}`);
    return res.status(405).json({ 
      error: 'Método não permitido',
      allowedMethods: ['POST', 'OPTIONS'],
      timestamp: new Date().toISOString()
    });
  }
  
  // Autenticação via header X-API-KEY
  const serverApiKey = process.env.NOTIFICATIONS_API_KEY;
  const clientApiKey = req.headers['x-api-key'];
  
  if (!serverApiKey) {
    const errorMsg = 'NOTIFICATIONS_API_KEY não configurada no servidor';
    console.error(`[/api/notify-user] ${errorMsg}`);
    return res.status(500).json({ 
      error: 'Erro de configuração do servidor',
      details: errorMsg,
      timestamp: new Date().toISOString()
    });
  }
  
  if (clientApiKey !== serverApiKey) {
    console.error('[/api/notify-user] Tentativa de acesso não autorizada');
    return res.status(401).json({ 
      error: 'Não autorizado',
      timestamp: new Date().toISOString()
    });
  }
  
  // Validação do corpo da requisição
  const { userId, title, body, data } = req.body;
  
  console.log('[/api/notify-user] Dados da requisição recebidos:', { 
    userId,
    title: title ? (title.substring(0, 50) + (title.length > 50 ? '...' : '')) : 'undefined',
    body: body ? (body.substring(0, 100) + (body.length > 100 ? '...' : '')) : 'undefined',
    hasData: !!data
  });
  
  if (!userId || !title || !body) {
    const errorMsg = 'Campos obrigatórios não fornecidos';
    console.error(`[/api/notify-user] ${errorMsg}:`, { userId: !!userId, title: !!title, body: !!body });
    return res.status(400).json({ 
      error: errorMsg,
      required: ['userId', 'title', 'body'],
      received: { userId: !!userId, title: !!title, body: !!body },
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    // Configuração VAPID
    console.log('[/api/notify-user] Configurando VAPID...');
    const vapid = getVapid();
    webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
    console.log('[/api/notify-user] VAPID configurado com sucesso');

    // Conexão com o Supabase
    console.log('[/api/notify-user] Conectando ao Supabase...');
    const supabase = getSupabaseAdmin();

    // Buscar assinaturas do usuário
    console.log(`[/api/notify-user] Buscando assinaturas para o usuário: ${userId}`);
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth, device_info')
      .eq('user_id', userId);

    // Tratamento de erros na busca de assinaturas
    if (fetchError) {
      console.error('[/api/notify-user] Erro ao buscar assinaturas:', fetchError);
      throw new Error(`Falha ao buscar assinaturas: ${fetchError.message}`);
    }

    // Verificar se existem assinaturas
    if (!subscriptions || subscriptions.length === 0) {
      const msg = `Nenhuma assinatura encontrada para o usuário: ${userId}`;
      console.warn(`[/api/notify-user] ${msg}`);
      return res.status(404).json({
        error: 'Nenhum dispositivo registrado',
        message: msg,
        userId,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`[/api/notify-user] ${subscriptions.length} assinatura(s) encontrada(s) para o usuário ${userId}`);

    // Preparar notificações
    const notifications = subscriptions
      .filter(sub => sub.endpoint && sub.p256dh && sub.auth)
      .map(sub => ({
        id: sub.id,
        deviceInfo: sub.device_info || 'Dispositivo desconhecido',
        subscription: {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }
      }));

    if (notifications.length === 0) {
      const msg = 'Nenhuma assinatura válida encontrada';
      console.warn(`[/api/notify-user] ${msg}`);
      return res.status(400).json({
        error: 'Nenhum dispositivo válido',
        message: msg,
        userId,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`[/api/notify-user] Preparando para enviar ${notifications.length} notificação(ões)`);

    // Enviar notificações
    const results = await Promise.allSettled(
      notifications.map(async ({ id, deviceInfo, subscription }) => {
        try {
          const payload = JSON.stringify({
            title,
            body,
            icon: '/favicon.svg',
            ...(data || {})
          });

          console.log(`[/api/notify-user] Enviando notificação para dispositivo ${id} (${deviceInfo})`);
          await webpush.sendNotification(subscription, payload);
          console.log(`[/api/notify-user] Notificação enviada com sucesso para ${id}`);
          
          return {
            id,
            deviceInfo,
            status: 'success',
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          console.error(`[/api/notify-user] Erro ao enviar notificação para ${id}:`, error);
          
          // Se a assinatura for inválida, remover do banco de dados
          if (error.statusCode === 410) {
            console.log(`[/api/notify-user] Removendo assinatura inválida: ${id}`);
            try {
              const { error: deleteError } = await supabase
                .from('push_subscriptions')
                .delete()
                .eq('id', id);
              
              if (deleteError) {
                console.error(`[/api/notify-user] Erro ao remover assinatura inválida ${id}:`, deleteError);
              }
            } catch (deleteError) {
              console.error(`[/api/notify-user] Erro ao tentar remover assinatura inválida ${id}:`, deleteError);
            }
          }
          
          return {
            id,
            deviceInfo,
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
          };
        }
      })
    );

    // Processar resultados
    const success = results.filter(r => r.status === 'fulfilled' && r.value.status === 'success').length;
    const failed = results.length - success;

    console.log(`[/api/notify-user] Notificações enviadas: ${success} sucesso, ${failed} falhas`);

    // Retornar resposta
    return res.status(200).json({
      success: true,
      message: 'Notificações processadas',
      sent: success,
      failed,
      total: results.length,
      results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[/api/notify-user] Erro ao processar notificação:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}