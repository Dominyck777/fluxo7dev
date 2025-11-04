# 🚀 Deploy Fluxo7 Dev - Railway + Vercel

## 📋 Visão Geral

- **Frontend**: Vercel (React App)
- **Push Server**: Railway (Notificações offline)
- **Custo**: 100% Gratuito

## 🔧 Passo a Passo

### 1. Deploy do Push Server (Railway)

#### 1.1 Criar conta no Railway
1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Clique em "New Project"

#### 1.2 Deploy do Push Server
1. Selecione "Deploy from GitHub repo"
2. Conecte este repositório
3. Selecione a pasta raiz do projeto
4. Railway detectará automaticamente o Node.js

#### 1.3 Configurar arquivos para Railway
Certifique-se que estes arquivos estão na raiz:
- `railway-push-server.cjs` (servidor principal)
- `railway-package.json` (dependências)
- `railway.json` (configuração Railway)

#### 1.4 Configurar variáveis de ambiente (Opcional)
No painel do Railway, adicione:
```
VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa40HuWd94AzZJHkxaXvM_-QX7nNP6RBXq4FVXtdvQGDlO7BmS1wS1NQ3OfgRs
VAPID_PRIVATE_KEY=UGSiUwNCS1Dfn2SR3dvX3_Hgllq5A_-dvAGBBzZkJ5s
VAPID_EMAIL=admin@fluxo7dev.com
NODE_ENV=production
```

#### 1.5 Obter URL do Railway
Após deploy, copie a URL gerada (ex: `https://seu-app.up.railway.app`)

### 2. Atualizar Frontend

#### 2.1 Atualizar URL do Push Server
No arquivo `src/utils/push-client.ts`, linha 17:
```typescript
return 'https://SUA-URL-RAILWAY.up.railway.app';
```

### 3. Deploy do Frontend (Vercel)

#### 3.1 Deploy normal no Vercel
```bash
npm run build
# Deploy via Git ou Vercel CLI
```

#### 3.2 Configurar domínio (Opcional)
No painel do Vercel, configure seu domínio personalizado

## ✅ Verificação

### 1. Teste o Push Server
Acesse: `https://sua-url-railway.up.railway.app/health`
Deve retornar: `{"status": "OK", ...}`

### 2. Teste a aplicação
1. Acesse sua aplicação no Vercel
2. Faça login
3. Permita notificações
4. Clique "🔔 Teste"
5. Deve receber notificação!

### 3. Teste offline
1. Abra 2 abas
2. Login diferentes em cada
3. Feche uma aba
4. Crie demanda na outra
5. Usuário da aba fechada deve receber notificação!

## 🔍 Troubleshooting

### Push Server não responde
- Verifique logs no Railway
- Confirme se `railway-push-server.cjs` está na raiz
- Verifique se `railway-package.json` tem as dependências corretas

### Notificações não chegam
- Verifique se usuário permitiu notificações
- Confirme URL do Railway no `push-client.ts`
- Verifique console do browser para erros

### CORS Error
- Confirme se domínio do Vercel está no `corsOptions`
- Adicione seu domínio personalizado se necessário

## 📊 Monitoramento

### Railway Dashboard
- Logs em tempo real
- Métricas de uso
- Status do servidor

### Endpoints úteis
- `GET /health` - Status detalhado
- `GET /active-users` - Usuários conectados
- `GET /` - Status básico

## 💰 Custos

- **Railway**: Gratuito (500h/mês)
- **Vercel**: Gratuito (100GB bandwidth)
- **Total**: R$ 0,00/mês

## 🎯 Resultado Final

✅ Aplicação funcionando 100% online
✅ Notificações offline funcionando
✅ Escalável para múltiplos usuários
✅ Monitoramento completo
✅ Custo zero

---

**Pronto! Seu sistema está 100% funcional na nuvem! 🚀**
