# Deploy na Vercel - Fluxo7 Dev

## Como funciona

- **Desenvolvimento local**: Usa localStorage do navegador
- **Produção (Vercel)**: Usa API serverless que salva no arquivo `api/db.json`

## Deploy

1. Instale a Vercel CLI (se não tiver):
```bash
npm i -g vercel
```

2. Faça login na Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

## Estrutura

- `api/db.json` - Banco de dados (devs, projects, priorities, demands)
- `api/demands.ts` - API para CRUD de demandas
- `api/config.ts` - API para buscar configurações (devs, projects, priorities)
- `src/utils/api-client.ts` - Cliente que detecta ambiente e usa localStorage (dev) ou API (prod)

## Observação

⚠️ **Limitação**: A Vercel não persiste arquivos entre deploys. Para persistência real, considere:
- Vercel KV (Redis)
- Vercel Postgres
- Supabase
- Firebase

Mas para testes e desenvolvimento, funciona perfeitamente!
