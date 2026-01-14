# ISIS → Supabase  
## Controle de Sessão com 1 Linha por Atendimento (UPSERT)

---

## Objetivo

Modificar a aplicação **ISIS (atendente virtual)** para que:

- Cada sessão gere **apenas uma linha** na tabela `isis`
- As mensagens sejam adicionadas na mesma linha
- Não sejam criadas múltiplas rows para a mesma conversa
- A sessão seja atualizada até o atendimento ser finalizado

> **Regra-chave:**  
> **1 sessão = 1 row**  
> **novas mensagens = UPDATE (UPSERT)**

---

## Tabela Existente

```sql
create table public.isis (
  id text not null,
  cod_cliente text null,
  nome_cliente text null,
  empresa text not null default 'Desconhecida',
  projeto text not null,
  nota integer null,
  comentario text null,
  conversa jsonb null,
  timestamp timestamp with time zone not null default now(),
  constraint isis_pkey primary key (id)
);
```

O campo `id` representa o **ID da sessão**.

---

## Comportamento Esperado

Fluxo correto:

```
Cliente → ISIS → Supabase (UPSERT) → Dashboard
```

- Primeira mensagem → cria a linha  
- Próximas mensagens → atualizam a mesma linha  
- Finalização → atualiza nota e comentário  

---

## Implementação na ISIS (Node.js)

### Inicialização do Supabase

```ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)
```

---

## Função Única de Controle de Sessão

```ts
async function salvarOuAtualizarSessao({
  sessionId,
  cod_cliente,
  nome_cliente,
  empresa,
  projeto,
  nota,
  comentario,
  mensagem
}) {
  const { data } = await supabase
    .from('isis')
    .select('conversa')
    .eq('id', sessionId)
    .single()

  const conversaAtual = data?.conversa || []

  const novaConversa = [
    ...conversaAtual,
    {
      ts: new Date().toISOString(),
      from: mensagem.from,
      text: mensagem.text
    }
  ]

  await supabase.from('isis').upsert({
    id: sessionId,
    cod_cliente,
    nome_cliente,
    empresa,
    projeto,
    nota,
    comentario,
    conversa: novaConversa,
    timestamp: new Date()
  })
}
```

---

## Exemplo de Uso Durante a Conversa

```ts
await salvarOuAtualizarSessao({
  sessionId: "1767577081363lgnhpybat",
  cod_cliente: "17",
  nome_cliente: "kallew felip",
  empresa: "Arena Palace",
  projeto: "fluxo7arena",
  mensagem: {
    from: "user",
    text: "Quero agendar uma quadra"
  }
})
```

---

## Exemplo ao Finalizar Atendimento

```ts
await salvarOuAtualizarSessao({
  sessionId: "1767577081363lgnhpybat",
  nota: 5,
  comentario: "muito bom",
  mensagem: {
    from: "assistant",
    text: "Agendamento confirmado com sucesso!"
  }
})
```

---

## Resultado Final no Banco

| id | nome_cliente | projeto | conversa | nota |
|----|-------------|---------|----------|------|
| 1767577081363lgnhpybat | kallew felip | fluxo7arena | histórico completo | 5 |

---

## (Opcional) Observações Técnicas

- O campo `conversa` deve ser salvo como **JSONB real**
- **Não usar** `JSON.stringify`
- Enviar o array diretamente para o Supabase
- O dashboard (Vercel) não precisa de alterações

---

## Checklist

- [ ] Parar de usar INSERT repetido  
- [ ] Implementar UPSERT por `id`  
- [ ] Atualizar a mesma linha da sessão  
- [ ] Acumular mensagens no campo `conversa`  
- [ ] Atualizar `timestamp` a cada interação  

---

Fim.