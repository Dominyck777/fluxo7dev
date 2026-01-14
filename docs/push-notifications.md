# Push Notifications (Web Push) - Fluxo7 Dev

## Objetivo

Habilitar **notificações push no Web/WebApp (PWA)** quando eventos relevantes ocorrerem (ex.: **nova demanda atribuída**), mesmo com a aplicação fechada.

O sistema usa:

- **Service Worker** (`public/sw.js`) para receber e exibir notificações.
- **Vercel Functions** (`/api/*`) para registrar subscriptions e enviar pushes.
- **Supabase** para persistir subscriptions por dispositivo na tabela `public.push_subscriptions`.

---

## Visão de arquitetura

### Fluxo de inscrição (subscribe)

1. Browser registra o Service Worker (`/sw.js`).
2. Usuário concede permissão de notificação (`Notification.requestPermission()`).
3. Front cria a subscription via `registration.pushManager.subscribe(...)`.
4. Front envia para o backend: `POST /api/subscribe`.
5. Backend faz `UPSERT` no Supabase em `public.push_subscriptions` usando `endpoint` como chave única.

### Fluxo de envio (notify)

1. O app detecta evento (ex.: criação/atribuição de demanda).
2. App chama `POST /api/notify-user` com `{ userId, title, body, data }`.
3. Backend busca todas subscriptions do usuário no Supabase.
4. Backend envia para **todos dispositivos** do usuário via `web-push`.
5. Se o push retornar `410/404`, a subscription é removida do Supabase.

---

## Arquivos envolvidos

### Frontend

- `public/sw.js`
  - Escuta evento `push` e exibe a notificação.
  - Escuta `notificationclick` e foca/abre a aplicação.

- `src/main.tsx`
  - Registra o Service Worker em produção.

- `src/utils/push-client.ts`
  - Obtém a VAPID public key (`GET /api/vapid-public-key`).
  - Cria subscription e envia ao backend (`POST /api/subscribe`).

- `src/utils/notification-service.ts`
  - Orquestra quando enviar push (`notifyNewDemand` etc.).

### Backend (Vercel Functions)

- `api/vapid-public-key.js`
  - Retorna a VAPID public key via `process.env.VAPID_PUBLIC_KEY`.

- `api/subscribe.js`
  - Recebe subscription e salva no Supabase (service role).

- `api/notify-user.js`
  - Busca subscriptions do usuário no Supabase e envia via `web-push`.

> Observação: o arquivo `api/notify-all.js` **precisa ser revisado** (há versões que não usam Supabase e podem conter chaves hardcoded).

---

## Supabase (schema)

Tabela usada para armazenar subscriptions por dispositivo:

```sql
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  endpoint text not null unique,
  p256dh text,
  auth text,
  device_info text,
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

create index if not exists push_subscriptions_updated_at_idx
  on public.push_subscriptions (updated_at desc);
```

### Como o backend salva

O backend normaliza a subscription do browser:

- `endpoint` ← `subscription.endpoint`
- `p256dh` / `auth` ← `subscription.keys.p256dh` e `subscription.keys.auth`
- `device_info` ← string detectada no client

---

## Variáveis de ambiente

### Frontend (Vite)

Configuração do Supabase client:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Backend (Vercel Functions)

Atenção: **essas variáveis são do ambiente server-side** (não ficam no bundle do client).

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (opcional, ex.: `mailto:admin@fluxo7dev.com`)

---

## Segurança (importante)

Estado atual (a ser reforçado):

- Os endpoints `/api/subscribe` e `/api/notify-user` recebem `userId` no body.
- Se ficarem públicos sem validação, **qualquer pessoa pode registrar subscription para outro userId**.

Recomendações:

- **Proteger endpoints** com um segredo simples (ex.: header `X-API-KEY`) ou
- Migrar envio para **Supabase Edge Function** com validação de JWT (se houver Supabase Auth).

---

## Como testar

### 1) Checar permissão e SW

- Abra o app em HTTPS (Vercel) ou `localhost`.
- DevTools -> Application -> Service Workers: validar que `/sw.js` está ativo.
- Verificar `Notification.permission`.

### 2) Registrar subscription

- Login no app.
- Verificar no console logs de subscription.
- Conferir no Supabase:
  - `select * from public.push_subscriptions where user_id = '<user>';`

### 3) Enviar notificação

- `POST /api/notify-user` com payload de teste.

---

## Troubleshooting

- **Notificação não chega**
  - Permissão: `Notification.permission` deve ser `granted`.
  - SW registrado/ativo.
  - VAPID public key retornando no endpoint.
  - Ver logs do endpoint `/api/notify-user`.

- **Retorno 404/410 ao enviar**
  - Subscription expirou/revogada. O backend remove do Supabase.
  - Refaça o subscribe.

- **Erro de CORS**
  - Checar headers e domínio de origem.

---

## Pendências planejadas

- Revisar `api/notify-all.js` para:
  - usar Supabase (igual ao `notify-user.js`)
  - remover qualquer chave hardcoded
- Adicionar proteção/validação nos endpoints
- (Opcional) Trigger no Supabase para manter `updated_at` sempre atualizado
