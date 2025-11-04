# 🔔 Como Funcionam as Notificações - Fluxo7 Dev

## 📋 Visão Geral

O sistema de notificações do Fluxo7 Dev permite que usuários recebam **notificações em tempo real** quando novas demandas são atribuídas a eles, **mesmo com a aplicação fechada**.

## 🏗️ Arquitetura do Sistema

### **Frontend (React + Vite)**
- Interface do usuário
- Service Worker para notificações
- Push Client para comunicação

### **Backend (Vercel Functions)**
- API serverless para gerenciar notificações
- Endpoints REST para subscription e envio
- Armazenamento temporário de usuários

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
```

### **2. Criação de Demanda**
```
1. Dominyck cria demanda para Kallew
2. Sistema chama notificationService.notifyNewDemand()
3. Envia POST para /api/notify-user
4. Servidor processa e envia Push Notification
5. Kallew recebe notificação (mesmo offline!)
```

### **3. Entrega da Notificação**
```
1. Push Server envia para browser do Kallew
2. Service Worker intercepta a mensagem
3. Exibe notificação nativa do sistema
4. Usuário clica → abre/foca aplicação
```

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
- ✅ **Sem variáveis de ambiente**
- ✅ **Sem banco de dados externo**
- ✅ **Sem configuração adicional**

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

### **Armazenamento Temporário**
- **Subscriptions** são perdidas quando função "dorme"
- **Solução**: Implementar Redis ou banco persistente

### **Escalabilidade**
- **Vercel Functions**: Stateless por natureza
- **Solução**: Usar banco de dados para subscriptions

### **Offline Real**
- **Atual**: Funciona se usuário esteve online recentemente
- **Ideal**: Push Server dedicado 24/7

## 🎯 Próximos Passos

### **Melhorias Futuras**
1. **Banco de dados**: Redis para subscriptions persistentes
2. **Push Server dedicado**: Railway/Render para 24/7
3. **Notificações ricas**: Ações, imagens, sons
4. **Analytics**: Métricas de entrega e cliques

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
