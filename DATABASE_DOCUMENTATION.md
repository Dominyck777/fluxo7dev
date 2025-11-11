# 📊 Documentação da Base de Dados - Fluxo7 Dev

## 🔗 Informações de Conexão

- **Provedor**: JSONBin.io
- **Bin ID**: `690605e5ae596e708f3c7bc5`
- **API Key**: `$2a$10$/XmOGvx8./SZzV3qMzQ5i.6FjBjS4toNbeaEFzX2D8QPUddyM6VR2`
- **Base URL**: `https://api.jsonbin.io/v3`

## 📋 Estrutura da Base de Dados

### 👥 Desenvolvedores (`devs`)

```typescript
interface Developer {
  id: string;           // ID único do desenvolvedor
  name: string;         // Nome completo
  password: string;     // Senha de acesso
  role: 'admin' | 'developer';  // Papel no sistema
  active: boolean;      // Status ativo/inativo
}
```

**Dados Atuais:**
- **Administrador**: `admin` / `admin123` (admin)
- **Dominyck**: `dominyck` / `dev123` (developer)
- **João Silva**: `joao` / `joao123` (developer)
- **Maria Santos**: `maria` / `maria123` (developer)

### 📁 Projetos (`projects`)

Array de strings com os projetos disponíveis:
- Fluxo7 Dev
- Website Corporativo
- E-commerce Platform
- Sistema de Gestão
- App Mobile
- API Backend
- Dashboard Analytics
- Sistema de Pagamentos
- Plataforma de Cursos
- Sistema de CRM
- Outros

### 🎯 Prioridades (`priorities`)

Array de strings com as prioridades disponíveis:
- Baixa
- Média
- Alta
- Urgente

### 📋 Demandas (`demands`)

```typescript
interface Demand {
  id: string | number;                    // ID único da demanda
  desenvolvedor: string;                  // Nome do desenvolvedor responsável
  projeto: string;                        // Nome do projeto
  descricao: string;                      // Descrição (suporta checklist markdown)
  status: 'Pendente' | 'Concluído';     // Status da demanda
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Urgente';  // Prioridade
  dataCriacao?: string;                   // Data de criação (ISO string)
}
```

**Funcionalidades Especiais:**
- **Checklist Interativo**: Descrições suportam formato `- [ ]` e `- [x]` para checklists
- **Ordenação**: Pendentes primeiro (por prioridade), depois concluídas
- **Filtros**: Por desenvolvedor, projeto, status, prioridade e descrição

### 💰 Transações Financeiras (`transactions`)

```typescript
interface Transaction {
  id: string | number;     // ID único da transação
  type: 'Entrada' | 'Saída';  // Tipo de movimentação
  value: number;           // Valor em reais
  description: string;     // Descrição da movimentação
  project: string;         // Projeto relacionado
  date: string;           // Data da transação (ISO string)
}
```

**Cálculos Automáticos:**
- **Total Entradas**: Soma de todas as entradas do mês
- **Total Saídas**: Soma de todas as saídas do mês
- **Lucro Absoluto**: Entradas - Saídas
- **Margem de Lucro**: (Lucro / Entradas) × 100
- **Saldo Atual**: Entradas - Saídas

### ⭐ Pesquisa de Satisfação (`feedback-isis`)

```typescript
interface FeedbackData {
  id: string;              // ID único do feedback
  timestamp: string;       // Data/hora do feedback (ISO string)
  estrelas: number;        // Avaliação de 1 a 5 estrelas
  nome_cliente: string;    // Nome do cliente
  empresa: string;         // Nome da empresa
  projeto: string;         // Projeto avaliado (geralmente "fluxo7arena")
  comentario?: string;     // Comentário opcional
}
```

**Funcionalidades:**
- **Estatísticas**: Média geral, distribuição por estrelas
- **Filtros**: Por empresa, projeto, número de estrelas
- **Gestão**: Excluir feedbacks individuais ou todos

## 🔧 Operações CRUD

### Autenticação
```javascript
jsonbinClient.authenticateUser(userId, password)
```

### Configuração
```javascript
jsonbinClient.getConfig()  // Retorna devs, projects, priorities
```

### Demandas
```javascript
jsonbinClient.getDemands()
jsonbinClient.createDemand(data)
jsonbinClient.updateDemand(data)
jsonbinClient.deleteDemand(id)
```

### Transações
```javascript
jsonbinClient.getTransactions()
jsonbinClient.createTransaction(data)
jsonbinClient.updateTransaction(data)
jsonbinClient.deleteTransaction(id)
```

### Feedbacks (API Direta)
```javascript
// GET: https://api.jsonbin.io/v3/b/690605e5ae596e708f3c7bc5
// PUT: https://api.jsonbin.io/v3/b/690605e5ae596e708f3c7bc5
```

## 🚀 Funcionalidades Avançadas

### 1. **Pré-carregamento de Dados**
- Durante o login, dados são carregados em paralelo
- Armazenados temporariamente no localStorage
- Navegação instantânea entre abas

### 2. **Sistema de Checklist**
- Suporte a markdown nas descrições das demandas
- Checkboxes interativos: `- [ ]` e `- [x]`
- Barra de progresso automática
- Salvamento automático ao marcar/desmarcar

### 3. **Notificações Push**
- Polling automático para novas demandas
- Notificações web push quando demandas são atribuídas
- Configurável por usuário

### 4. **Estados de Loading**
- Indicadores visuais para todas as operações CRUD
- Prevenção de ações duplas
- Feedback específico por tipo de operação

### 5. **Responsividade Completa**
- Layout adaptativo para desktop, tablet e mobile
- Swipe gestures para navegação mobile
- Interface otimizada para touch

## 📊 Dados de Exemplo

A base foi populada com dados de exemplo realistas:
- **3 demandas** com diferentes status e prioridades
- **5 transações** financeiras do mês atual
- **5 feedbacks** de satisfação com diferentes avaliações
- **4 usuários** com diferentes papéis

## 🔄 Backup e Restauração

O script `setup-database.js` automaticamente:
1. Faz backup dos dados existentes
2. Atualiza a estrutura completa
3. Verifica a integridade dos dados salvos

**Para restaurar um backup:**
```bash
node setup-database.js
# O backup é salvo como backup-[timestamp].json
```

## 🛡️ Segurança

- **Autenticação**: Usuário/senha obrigatórios
- **Roles**: Admin e Developer com diferentes permissões
- **API Key**: Protegida e configurada no cliente
- **Validação**: Dados validados antes de salvar

## 📈 Monitoramento

- **Logs**: Console logs para todas as operações
- **Erros**: Tratamento de erros com mensagens amigáveis
- **Performance**: Carregamento otimizado com cache local
- **Sincronização**: Recarregamento automático após operações

---

**Última atualização**: 11/11/2024
**Versão da base**: 1.0.0
**Status**: ✅ Operacional
