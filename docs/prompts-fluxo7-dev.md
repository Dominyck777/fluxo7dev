# Prompts para Construção do Fluxo7 Dev no Hostinger Horizons

## 📋 Informações Importantes

- **Limite**: 5 prompts disponíveis
- **Estratégia**: Cada prompt deve ser completo e independente
- **Ordem**: Seguir a sequência numerada
- **Objetivo**: Sistema de controle de demandas de desenvolvedores

---

## PROMPT 1: Estrutura Base e Autenticação

```
Crie um aplicativo web chamado "Fluxo7 Dev" com as seguintes especificações:

DESIGN:
- Paleta de cores: Preto (#000000) e laranja (#FF6B00)
- Estilo moderno e minimalista
- Responsivo para desktop e mobile

FUNCIONALIDADE:
- Tela de login com campo de senha única
- Senha de acesso: f740028922
- Após login bem-sucedido, redirecionar para dashboard
- Armazenar autenticação no localStorage
- Botão de logout no header

ESTRUTURA HTML:
- Header com logo "Fluxo7 Dev" e botão de logout
- Container principal para conteúdo
- Footer simples

ESTILO:
- Background preto
- Elementos em laranja (#FF6B00)
- Inputs e botões com bordas arredondadas
- Hover effects suaves
- Fonte moderna (Inter ou similar)
```

---

## PROMPT 2: Dashboard e Listagem de Demandas

```
Adicione ao aplicativo "Fluxo7 Dev" a funcionalidade de dashboard com listagem de demandas:

LAYOUT DO DASHBOARD:
- Título "Demandas" no topo
- Filtro dropdown para selecionar desenvolvedor (opções: Todos, Dev 1, Dev 2, Dev 3, Dev 4, Dev 5)
- Botão "Nova Demanda" em destaque (laranja)
- Grid/lista de cards de demandas

CARD DE DEMANDA:
Cada card deve exibir:
- Nome do desenvolvedor (badge laranja no topo)
- Nome do projeto (título em destaque)
- Descrição (texto resumido)
- Status (badge colorido: Pendente=vermelho, Em Andamento=amarelo, Concluído=verde)

ESTILO DOS CARDS:
- Background cinza escuro (#1a1a1a)
- Borda sutil
- Padding adequado
- Sombra suave
- Hover effect (elevação)

FUNCIONALIDADE:
- Filtrar demandas por desenvolvedor selecionado
- Exibir todas as demandas quando "Todos" estiver selecionado
- Cards organizados em grid responsivo (3 colunas desktop, 1 coluna mobile)
```

---

## PROMPT 3: Formulário de Nova Demanda

```
Adicione ao "Fluxo7 Dev" um modal/formulário para criar nova demanda:

MODAL DE NOVA DEMANDA:
- Abrir ao clicar no botão "Nova Demanda"
- Overlay escuro semi-transparente
- Modal centralizado com fundo cinza escuro (#1a1a1a)
- Botão X para fechar no canto superior direito

CAMPOS DO FORMULÁRIO:
1. Desenvolvedor (select dropdown):
   - Opções: Dev 1, Dev 2, Dev 3, Dev 4, Dev 5
2. Projeto (input text):
   - Placeholder: "Nome do projeto"
3. Descrição (textarea):
   - Placeholder: "Descreva a demanda..."
   - Altura: 120px
4. Status (select dropdown):
   - Opções: Pendente, Em Andamento, Concluído

BOTÕES:
- "Cancelar" (cinza, fecha o modal)
- "Criar Demanda" (laranja, salva e fecha)

ESTILO:
- Labels em laranja
- Inputs com background preto e borda laranja
- Validação: todos os campos obrigatórios
- Mensagem de sucesso após criar
```

---

## PROMPT 4: Sistema de Armazenamento e Gerenciamento

```
Implemente no "Fluxo7 Dev" o sistema completo de armazenamento e gerenciamento de demandas:

ARMAZENAMENTO:
- Use localStorage para persistir as demandas
- Estrutura de dados: array de objetos com id, desenvolvedor, projeto, descrição, status, datacriacao
- Gerar ID único para cada demanda (timestamp + random)

FUNCIONALIDADES:
1. Criar demanda:
   - Adicionar ao localStorage
   - Atualizar lista automaticamente
   - Mostrar notificação de sucesso

2. Editar demanda:
   - Adicionar ícone de edição em cada card
   - Abrir modal preenchido com dados atuais
   - Atualizar no localStorage

3. Excluir demanda:
   - Adicionar ícone de lixeira em cada card
   - Confirmação antes de excluir
   - Remover do localStorage

4. Dados iniciais:
   - Se localStorage vazio, criar 5 demandas de exemplo
   - Distribuir entre diferentes devs e status

ÍCONES NOS CARDS:
- Ícone de editar (lápis) - canto superior direito
- Ícone de excluir (lixeira) - canto superior direito
- Ambos em laranja, hover mais claro
```

---

## PROMPT 5: Refinamentos Finais e Polimento

```
Finalize o "Fluxo7 Dev" com os seguintes refinamentos:

MELHORIAS VISUAIS:
- Animações suaves (fade in/out para modais)
- Transições nos cards (0.3s ease)
- Loading state ao filtrar
- Empty state quando não há demandas ("Nenhuma demanda encontrada")

MELHORIAS DE UX:
- Ordenar demandas por data (mais recentes primeiro)
- Contador de demandas por status no topo
- Badges de status com ícones (✓ para concluído, ⏱ para em andamento, ⏸ para pendente)
- Responsividade completa (mobile-first)

VALIDAÇÕES:
- Não permitir campos vazios
- Mensagens de erro em vermelho
- Feedback visual em todos os botões

ACESSIBILIDADE:
- Labels adequados
- Contraste de cores
- Navegação por teclado
- ARIA labels

PERFORMANCE:
- Otimizar renderização da lista
- Debounce no filtro se necessário
- Código limpo e organizado

TOQUES FINAIS:
- Logo "Fluxo7 Dev" estilizado no header
- Versão do sistema no footer (v1.0)
- Favicon personalizado
- Meta tags para SEO
```

---

## 📝 Notas de Implementação

### Ordem de Execução
1. Execute os prompts na ordem numerada (1 → 5)
2. Aguarde a conclusão de cada prompt antes de passar para o próximo
3. Teste cada funcionalidade após implementação

### Ajustes Possíveis
- Se algum prompt exceder o limite, divida em partes menores
- Priorize funcionalidades core sobre estética se necessário
- Mantenha a consistência visual em todos os prompts

### Paleta de Cores Completa
- **Preto principal**: #000000
- **Cinza escuro**: #1a1a1a
- **Laranja principal**: #FF6B00
- **Laranja hover**: #FF8533
- **Verde (concluído)**: #00C853
- **Amarelo (em andamento)**: #FFD600
- **Vermelho (pendente)**: #FF1744

### Estrutura de Dados Sugerida
```javascript
{
  id: "1698765432123",
  desenvolvedor: "Dev 1",
  projeto: "Sistema de Login",
  descricao: "Implementar autenticação com JWT",
  status: "Em Andamento",
  dataCriacao: "2025-10-31T23:30:00"
}
```

---

## ✅ Checklist Final

Após executar todos os prompts, verificar:
- [ ] Login funciona com senha f740028922
- [ ] Dashboard exibe demandas
- [ ] Filtro por desenvolvedor funciona
- [ ] Criar nova demanda funciona
- [ ] Editar demanda funciona
- [ ] Excluir demanda funciona
- [ ] Dados persistem no localStorage
- [ ] Design preto e laranja aplicado
- [ ] Responsivo em mobile
- [ ] Sem erros no console

---

**Boa sorte com a implementação! 🚀**
