// migrate-jsonbin-to-supabase.js
// Script de migração de dados do dbbin.json para o Supabase (PostgreSQL)
// Compatível com Node em modo ES Module (package.json com "type": "module")
// - Lê o arquivo dbbin.json na raiz do projeto
// - Pede a senha do banco via terminal
// - Conecta usando a connection string do Supabase
// - Faz UPSERT (insert ou update) nas tabelas: demandas, financeiro, isis, clientes

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { Client } from 'pg';
import { fileURLToPath } from 'url';

// Em ESM não existe __dirname nativo, então calculamos assim:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL base do Supabase (sem a senha)
// Usando o pooler de conexão fornecido pelo Supabase
// Exemplo: postgresql://postgres.guildthlqkfubbqoybys:[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres
const BASE_CONNECTION_STRING = 'postgresql://postgres.guildthlqkfubbqoybys:[YOUR_PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres';

function askPassword() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (q) => new Promise((resolve) => rl.question(q, resolve));

  return question('Digite a senha do banco (postgres): ').then((pwd) => {
    rl.close();
    return pwd.trim();
  });
}

function loadJson() {
  const filePath = path.resolve(__dirname, 'dbbin.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

async function migrate() {
  const password = await askPassword();
  if (!password) {
    console.error('Senha vazia. Abortando.');
    process.exit(1);
  }

  const connectionString = BASE_CONNECTION_STRING.replace(
    '[YOUR_PASSWORD]',
    encodeURIComponent(password)
  );

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco');

    const data = loadJson();

    const demands = data.demands || data.demandas || [];
    const transactions = data.transactions || [];
    const feedbackIsis = data['feedback-isis'] || [];
    const clients = data.clientes || data.clients || [];

    await client.query('BEGIN');
    console.log('🔄 Iniciando transação de migração...');

    // ---------------- DEMANDAS ----------------
    if (demands.length > 0) {
      console.log(`→ Migrando ${demands.length} demandas...`);

      const text = `
        INSERT INTO public.demandas (
          id, desenvolvedor, projeto, descricao, status, prioridade, data_criacao
        )
        VALUES
          ${demands
            .map(
              (_, i) =>
                `($${7 * i + 1}, $${7 * i + 2}, $${7 * i + 3}, $${7 * i + 4}, $${7 * i + 5}, $${7 * i + 6}, $${7 * i + 7})`
            )
            .join(',\n          ')}
        ON CONFLICT (id) DO UPDATE SET
          desenvolvedor = EXCLUDED.desenvolvedor,
          projeto       = EXCLUDED.projeto,
          descricao     = EXCLUDED.descricao,
          status        = EXCLUDED.status,
          prioridade    = EXCLUDED.prioridade,
          data_criacao  = EXCLUDED.data_criacao;
      `;

      const values = [];
      for (const d of demands) {
        values.push(
          d.id,
          d.desenvolvedor,
          d.projeto,
          d.descricao,
          d.status,
          d.prioridade,
          d.dataCriacao
        );
      }

      await client.query(text, values);
      console.log('✅ Demandas migradas');
    } else {
      console.log('→ Nenhuma demanda encontrada no JSON');
    }

    // ---------------- FINANCEIRO ----------------
    if (transactions.length > 0) {
      console.log(`→ Migrando ${transactions.length} movimentações financeiras...`);

      const text = `
        INSERT INTO public.financeiro (
          id, tipo, valor, descricao, projeto, data, is_mensal, is_pago
        )
        VALUES
          ${transactions
            .map(
              (_, i) =>
                `($${8 * i + 1}, $${8 * i + 2}, $${8 * i + 3}, $${8 * i + 4}, $${8 * i + 5}, $${8 * i + 6}, $${8 * i + 7}, $${8 * i + 8})`
            )
            .join(',\n          ')}
        ON CONFLICT (id) DO UPDATE SET
          tipo      = EXCLUDED.tipo,
          valor     = EXCLUDED.valor,
          descricao = EXCLUDED.descricao,
          projeto   = EXCLUDED.projeto,
          data      = EXCLUDED.data,
          is_mensal = EXCLUDED.is_mensal,
          is_pago   = EXCLUDED.is_pago;
      `;

      const values = [];
      for (const t of transactions) {
        values.push(
          t.id,
          t.type,
          t.value,
          t.description,
          t.project,
          t.date,
          t.isMonthly ?? false,
          t.isPaid ?? false
        );
      }

      await client.query(text, values);
      console.log('✅ Movimentações financeiras migradas');
    } else {
      console.log('→ Nenhuma movimentação financeira encontrada no JSON');
    }

    // ---------------- ISIS (feedback-isis) ----------------
    if (feedbackIsis.length > 0) {
      console.log(`→ Migrando ${feedbackIsis.length} registros de Ísis...`);

      const text = `
        INSERT INTO public.isis (
          id, cod_cliente, nome_cliente, empresa, projeto, nota, comentario, conversa, timestamp
        )
        VALUES
          ${feedbackIsis
            .map(
              (_, i) =>
                `($${9 * i + 1}, $${9 * i + 2}, $${9 * i + 3}, $${9 * i + 4}, $${9 * i + 5}, $${9 * i + 6}, $${9 * i + 7}, $${9 * i + 8}, $${9 * i + 9})`
            )
            .join(',\n          ')}
        ON CONFLICT (id) DO UPDATE SET
          cod_cliente  = EXCLUDED.cod_cliente,
          nome_cliente = EXCLUDED.nome_cliente,
          empresa      = EXCLUDED.empresa,
          projeto      = EXCLUDED.projeto,
          nota         = EXCLUDED.nota,
          comentario   = EXCLUDED.comentario,
          conversa     = EXCLUDED.conversa,
          timestamp    = EXCLUDED.timestamp;
      `;

      const values = [];
      for (const f of feedbackIsis) {
        values.push(
          f.id,
          null, // cod_cliente não vem do dbbin.json principal
          f.nome_cliente,
          f.empresa,
          f.projeto,
          f.estrelas,
          f.comentario ?? null,
          null, // conversa ainda não estamos trazendo
          f.timestamp
        );
      }

      await client.query(text, values);
      console.log('✅ Registros de Ísis migrados');
    } else {
      console.log('→ Nenhum registro de Ísis encontrado no JSON');
    }

    // ---------------- CLIENTES ----------------
    if (clients.length > 0) {
      console.log(`→ Migrando ${clients.length} clientes...`);

      const text = `
        INSERT INTO public.clientes (
          id, code, name, project, status, activation_date, end_date
        )
        VALUES
          ${clients
            .map(
              (_, i) =>
                `($${7 * i + 1}, $${7 * i + 2}, $${7 * i + 3}, $${7 * i + 4}, $${7 * i + 5}, $${7 * i + 6}, $${7 * i + 7})`
            )
            .join(',\n          ')}
        ON CONFLICT (id) DO UPDATE SET
          code            = EXCLUDED.code,
          name            = EXCLUDED.name,
          project         = EXCLUDED.project,
          status          = EXCLUDED.status,
          activation_date = EXCLUDED.activation_date,
          end_date        = EXCLUDED.end_date;
      `;

      const values = [];
      for (const c of clients) {
        values.push(
          c.id,
          c.code,
          c.name,
          c.project,
          c.status,
          c.activationDate,
          c.endDate
        );
      }

      await client.query(text, values);
      console.log('✅ Clientes migrados');
    } else {
      console.log('→ Nenhum cliente encontrado no JSON');
    }

    await client.query('COMMIT');
    console.log('🎉 Migração concluída com sucesso (transação commitada)');
  } catch (err) {
    console.error('❌ Erro na migração, efetuando ROLLBACK...', err);
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Erro ao fazer rollback:', rollbackErr);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
