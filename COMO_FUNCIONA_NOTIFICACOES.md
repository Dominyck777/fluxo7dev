# 🔔 Como Funcionam as Notificações - Fluxo7 Dev

## 📋 Visão Geral

O sistema de notificações do Fluxo7 Dev permite que usuários recebam **notificações em tempo real** quando novas demandas são atribuídas a eles, **mesmo com a aplicação fechada**.

**Status atual:** o sistema utiliza **Web Push** com **Service Worker** no browser e **persistência de subscriptions no Supabase** via tabela `public.push_subscriptions`.

## 🏗️ Arquitetura do Sistema

### **Frontend (React + Vite)**
- Interface do usuário
- Service Worker para notificações
- Push Client para comunicação

### **Backend (Vercel Functions)**
- API serverless para gerenciar notificações
- Endpoints REST para subscription e envio
- Persistência de subscriptions no **Supabase** (`push_subscriptions`)

### **Banco (Supabase)**
- Tabela `public.push_subscriptions` armazena uma subscription por dispositivo (multi-device)
- `endpoint` é único (usado como chave de upsert)

### **Browser APIs**
- **Service Worker**: Roda em background
- **Push API**: Recebe notificações
- **Notification API**: Exibe notificações nativas

## 🔄 Fluxo Completo das Notificações

### **1. Usuário Faz Login**
```
1. Usuário faz login (ex: Kallew)
2. Sistema registra Service Worker
3. Solicita permissão para notificações
4. Cria subscription única para o usuário
5. Envia subscription para servidor via /api/subscribe
6. Servidor faz UPSERT no Supabase em public.push_subscriptions (multi-device)
```

### **2. Criação de Demanda**
```
1. Dominyck cria demanda para Kallew
2. Sistema chama notificationService.notifyNewDemand()
3. Envia POST para /api/notify-user
4. Servidor busca as subscriptions do usuário no Supabase (push_subscriptions)
5. Servidor processa e envia Push Notification para TODOS os dispositivos
5. Kallew recebe notificação (mesmo offline!)
```

### **3. Entrega da Notificação**
```
1. Push Server envia para browser do Kallew
2. Service Worker intercepta a mensagem
3. Exibe notificação nativa do sistema
4. Usuário clica → abre/foca aplicação
```

## 🗃️ Estrutura no Supabase (Persistência)

### **Tabela: public.push_subscriptions**

Campos principais:
- `user_id` (text): identificador do usuário (ex: `kallew`)
- `endpoint` (text, unique): endpoint do Push Service (chave única)
- `p256dh` / `auth` (text): chaves do `PushSubscription.keys`
- `device_info` (text): descrição do dispositivo (desktop/mobile, SO, browser)
- `updated_at` (timestamptz): atualizado no upsert

Notas:
- O endpoint `/api/subscribe` faz `upsert(..., { onConflict: 'endpoint' })`.
- O endpoint `/api/notify-user` remove subscriptions inválidas do Supabase quando o push retorna `410/404`.

## 📁 Estrutura de Arquivos

```
fluxo7dev/
├── api/                          # Vercel Functions
│   ├── health.js                 # Status do servidor
│   ├── vapid-public-key.js       # Chave pública VAPID
│   ├── subscribe.js              # Registrar usuário
│   └── notify-user.js            # Enviar notificação
├── public/
│   └── sw.js                     # Service Worker
├── src/
│   ├── utils/
│   │   ├── push-client.ts        # Cliente para API
│   │   ├── notification-service.ts # Gerenciador principal
│   │   └── web-push-service.ts   # Web Push local
│   └── components/
│       └── Dashboard.tsx         # Interface principal
```

## 🔧 Componentes Principais

### **1. Service Worker (`/public/sw.js`)**
```javascript
// Escuta notificações push
self.addEventListener('push', (event) => {
  // Exibe notificação nativa
  self.registration.showNotification(title, options);
});

// Gerencia cliques nas notificações
self.addEventListener('notificationclick', (event) => {
  // Abre/foca a aplicação
  clients.openWindow('/');
});
```

### **2. Push Client (`/src/utils/push-client.ts`)**
```typescript
class PushClient {
  // Registra usuário no servidor
  async subscribe(): Promise<boolean>
  
  // Envia notificação para usuário específico
  async notifyUser(userId, title, body): Promise<boolean>
  
  // Broadcast para todos
  async notifyAll(title, body): Promise<boolean>
}
```

### **3. Vercel Functions (`/api/*.js`)**
```javascript
// /api/subscribe.js - Registra subscription
export default function handler(req, res) {
  userSubscriptions[userId] = subscription;
  res.json({ success: true });
}

// /api/notify-user.js - Envia notificação
export default async function handler(req, res) {
  await webpush.sendNotification(subscription, payload);
  res.json({ success: true });
}
```

## 🌐 Endpoints da API

### **GET /api/health**
- **Função**: Status do servidor
- **Resposta**: `{"status": "OK", "message": "..."}`

### **GET /api/vapid-public-key**
- **Função**: Chave pública para VAPID
- **Resposta**: `{"publicKey": "BEl62iU..."}`

### **POST /api/subscribe**
- **Função**: Registrar subscription do usuário
- **Body**: `{"userId": "Kallew", "subscription": {...}}`
- **Resposta**: `{"success": true, "totalUsers": 3}`

### **POST /api/notify-user**
- **Função**: Enviar notificação para usuário específico
- **Body**: `{"userId": "Kallew", "title": "Nova Demanda", "body": "..."}`
- **Resposta**: `{"success": true, "message": "Enviado"}`

## 🎯 Cenários de Uso

### **Cenário 1: Notificação de Nova Demanda**
```
1. Dominyck cria demanda para Kallew
2. handleCreateDemand() é chamado
3. notificationService.notifyNewDemand() executa
4. POST /api/notify-user com dados da demanda
5. Kallew recebe: "🚀 Nova Demanda - Implementar login"
```

### **Cenário 2: Teste de Notificação**
```
1. Usuário clica "🔔 Teste"
2. handleTestNotification() executa
3. notificationService.testPushServer() chama
4. Usuário recebe: "🔔 Teste Push Server"
```

### **Cenário 3: Broadcast**
```
1. Admin envia comunicado
2. notificationService.notifyAllUsers() executa
3. POST /api/notify-all
4. Todos usuários ativos recebem notificação
```

## 🔄 Estados do Sistema

### **Desenvolvimento (localhost:5173)**
- **Push Server**: `http://localhost:3003` (se disponível)
- **Fallback**: Vercel Functions locais
- **Service Worker**: Registrado localmente

### **Produção (vercel.app)**
- **Push Server**: `/api/*` (Vercel Functions)
- **Service Worker**: Registrado automaticamente
- **CORS**: Configurado para domínio

## 🛡️ Segurança e Permissões

### **VAPID (Voluntary Application Server Identification)**
- **Chave Pública**: Identifica aplicação
- **Chave Privada**: Assina mensagens (servidor)
- **Email**: Contato do desenvolvedor

### **Permissões do Browser**
```javascript
// Solicita permissão
const permission = await Notification.requestPermission();

// Estados possíveis:
// "granted" - Permitido ✅
// "denied"  - Negado ❌  
// "default" - Não decidido ⏳
```

### **CORS (Cross-Origin Resource Sharing)**
```javascript
// Configurado para aceitar:
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
```

## 📊 Monitoramento e Logs

### **Console Logs**
```javascript
// Sucesso
console.log('✅ Subscription registrada: Kallew');
console.log('🔔 Notificação enviada para Kallew: Nova Demanda');

// Erros
console.error('❌ Erro ao enviar notificação:', error);
console.warn('⚠️ Usuário não encontrado: Kallew');
```

### **Endpoints de Monitoramento**
- **GET /api/health**: Status geral
- **GET /api/active-users**: Usuários conectados

## 🚀 Deploy e Configuração

### **1. Deploy Automático**
```bash
# Build da aplicação
npm run build

# Deploy no Vercel (automático via Git)
git push origin main
```

### **2. Estrutura no Vercel**
```
https://fluxo7dev.vercel.app/          # Frontend
https://fluxo7dev.vercel.app/api/health # Backend Functions
```

### **3. Configuração Zero**
Este módulo **não é configuração zero**: para push funcionar em produção, você precisa configurar **VAPID** e **credenciais do Supabase** no ambiente do backend.

### **Variáveis de ambiente (Produção - Vercel Functions)**

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (opcional, ex: `mailto:admin@fluxo7dev.com`)

## 🔧 Troubleshooting

### **Notificações não chegam**
1. **Verificar permissão**: `Notification.permission === 'granted'`
2. **Testar API**: `GET /api/health`
3. **Console logs**: Verificar erros no DevTools
4. **Service Worker**: Verificar se está registrado

### **Erro de CORS**
1. **Verificar domínio**: Deve ser mesmo domínio
2. **Headers**: Verificar se CORS está configurado
3. **Método**: Usar POST para envios

### **Subscription falha**
1. **HTTPS**: Necessário para Push API
2. **Service Worker**: Deve estar registrado
3. **VAPID**: Chave pública correta

## 💡 Limitações Atuais

### **Persistência de Subscription**
- As subscriptions **são persistidas no Supabase**, então não dependem de memória do servidor.
- Se o dispositivo revogar permissão/desinstalar, o envio pode falhar e o backend remove a subscription inválida.

### **Escalabilidade**
- **Vercel Functions**: stateless por natureza (OK), mas o envio depende de consultas ao Supabase.
- Para alto volume, considerar:
  - paginação/lotes
  - fila (ex.: worker)
  - rate-limit por usuário

### **Offline Real**
- **Atual**: Web Push depende do Push Service do browser (Chrome/Firefox/etc.) e funciona mesmo com a aba fechada.
- **Observação**: em iOS/Safari existem restrições e requisitos adicionais.

## 🎯 Próximos Passos

### **Melhorias Futuras**
1. **Segurança**: proteger `/api/subscribe` e `/api/notify-user` (evitar alguém registrar subscription para outro user)
2. **Broadcast real**: revisar `/api/notify-all` para usar Supabase (hoje ele não está integrado)
3. **Remover secrets hardcoded**: evitar VAPID keys no código (usar somente env vars)
4. **Notificações ricas**: ações, deep links e tela/rota específica ao clicar
5. **Analytics**: métricas de entrega, falhas e cliques

### **Implementação Completa**
```javascript
// Futuro: Subscription persistente
await redis.set(`user:${userId}`, JSON.stringify(subscription));

// Futuro: Notificações ricas
const notification = {
  title: "Nova Demanda",
  body: "Implementar sistema de login",
  icon: "/icons/demand.png",
  actions: [
    { action: "view", title: "Ver Demanda" },
    { action: "dismiss", title: "Dispensar" }
  ]
};
```

---

## 🎉 Resumo

O sistema atual oferece **notificações funcionais e gratuitas** usando Vercel Functions, com capacidade de **expansão futura** para soluções mais robustas conforme a necessidade.

**Status**: ✅ **Funcional e pronto para produção**
