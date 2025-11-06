import { useState, useEffect } from 'react';
import Modal from './Modal';
import { jsonbinClient } from '../utils/jsonbin-client';
import './FinancialView.css';

export interface Transaction {
  id: string | number;
  type: 'Entrada' | 'Saída';
  value: number;
  description: string;
  project: string;
  date: string;
  isRecurring?: boolean;
  recurringId?: string;
}

interface FinancialViewProps {
  onBack: () => void;
  currentUser: { name: string };
}

const FinancialView = ({ onBack, currentUser }: FinancialViewProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Função para gerar transações recorrentes
  const generateRecurringTransactions = (transactions: Transaction[]) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Buscar transações recorrentes únicas (templates)
    const recurringTemplates = transactions.filter(t => t.isRecurring && !t.recurringId);
    const newTransactions: Transaction[] = [];
    
    recurringTemplates.forEach(template => {
      const templateDate = new Date(template.date);
      const templateMonth = templateDate.getMonth();
      const templateYear = templateDate.getFullYear();
      
      // Só gerar se o template é de um mês anterior ao atual
      const isFromPreviousMonth = (templateYear < currentYear) || 
                                  (templateYear === currentYear && templateMonth < currentMonth);
      
      if (isFromPreviousMonth) {
        // Verificar se já existe uma transação para este mês
        const existsThisMonth = transactions.some(t => {
          if (!t.recurringId || t.recurringId !== template.id.toString()) return false;
          const tDate = new Date(t.date);
          return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        });
        
        if (!existsThisMonth) {
          // Criar nova transação para este mês
          const newTransaction: Transaction = {
            id: Date.now() + Math.random(),
            type: template.type,
            value: template.value,
            description: `${template.description} (Mensal)`,
            project: template.project,
            date: new Date(currentYear, currentMonth, 1).toISOString(),
            isRecurring: false,
            recurringId: template.id.toString()
          };
          newTransactions.push(newTransaction);
        }
      }
    });
    
    return newTransactions;
  };

  // Carregar transações dos dados pré-carregados ou API
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Tentar usar dados pré-carregados primeiro
        const preloadedTransactions = localStorage.getItem('preloaded_transactions');
        let loadedTransactions: Transaction[] = [];
        
        if (preloadedTransactions) {
          // Usar dados pré-carregados (carregamento instantâneo)
          loadedTransactions = JSON.parse(preloadedTransactions);
          
          // Limpar dados pré-carregados após uso
          localStorage.removeItem('preloaded_transactions');
        } else {
          // Fallback: carregar da API se não houver dados pré-carregados
          // Isso só acontece quando o usuário atualiza a página
          loadedTransactions = await jsonbinClient.getTransactions();
        }
        
        if (!mounted) return;
        
        // Gerar transações recorrentes para o mês atual
        const newRecurringTransactions = generateRecurringTransactions(loadedTransactions);
        
        if (newRecurringTransactions.length > 0) {
          // Salvar as novas transações recorrentes na API
          for (const transaction of newRecurringTransactions) {
            await jsonbinClient.createTransaction(transaction);
          }
          const updatedTransactions = [...loadedTransactions, ...newRecurringTransactions];
          setTransactions(updatedTransactions);
        } else {
          setTransactions(loadedTransactions);
        }
      } catch (error) {
        console.error('Erro ao carregar transações:', error);
        if (mounted) {
          setTransactions([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();
    
    return () => {
      mounted = false;
    };
  }, []);


  // Calcular totais do mês atual
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
  });

  const totalEntradas = currentMonthTransactions
    .filter(t => t.type === 'Entrada')
    .reduce((sum, t) => sum + t.value, 0);

  const totalSaidas = currentMonthTransactions
    .filter(t => t.type === 'Saída')
    .reduce((sum, t) => sum + t.value, 0);

  const lucroPercentual = totalEntradas > 0 ? ((totalEntradas - totalSaidas) / totalEntradas * 100) : 0;

  const handleCreateTransaction = async (newTransaction: Omit<Transaction, 'id'>) => {
    try {
      const transactionWithId = {
        ...newTransaction,
        id: Date.now().toString()
      };

      // Gerar transações recorrentes se necessário
      const allTransactions = [...transactions, transactionWithId];
      const updatedTransactions = generateRecurringTransactions(allTransactions);
      
      // Salvar no JSONBin
      for (const transaction of updatedTransactions) {
        if (!transactions.find(t => t.id === transaction.id)) {
          await jsonbinClient.createTransaction(transaction);
        }
      }
      
      setTransactions(updatedTransactions);
      setIsModalOpen(false);
      alert('Movimentação criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar movimentação:', error);
      alert('Erro ao criar movimentação. Tente novamente.');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };


  return (
    <div className="financial-view">
      <header className="financial-header">
        <button 
          onClick={onBack}
          className="back-button"
          aria-label="Voltar ao dashboard"
        >
          ← Voltar
        </button>
        <h1 className="financial-title">💰 Financeiro</h1>
        <div className="financial-user">
          <span>Olá, {currentUser.name}</span>
        </div>
      </header>

      <div className="financial-content">
        <div className="financial-summary">
          <div className="summary-card entradas-card">
            <div className="card-icon">💵</div>
            <div className="card-content">
              <h3>Total de Entradas</h3>
              <div className="card-number">{formatCurrency(totalEntradas)}</div>
            </div>
          </div>
          
          <div className="summary-card saidas-card">
            <div className="card-icon">💸</div>
            <div className="card-content">
              <h3>Total de Saídas</h3>
              <div className="card-number">{formatCurrency(totalSaidas)}</div>
            </div>
          </div>
          
          <div className="summary-card lucro-card">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <h3>Lucro %</h3>
              <div className="card-number">{lucroPercentual >= 0 ? '+' : ''}{lucroPercentual.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Botão Nova Movimentação */}
        <div className="new-transaction-section">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="new-transaction-button"
          >
            ➕💰 Nova Movimentação
          </button>
        </div>

        {/* Lista de Movimentações */}
        <div className="transactions-section">
          <h2 className="section-title">Movimentações do Mês</h2>
          {isLoading ? (
            // Skeleton loading para transações
            <div className="transactions-list">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="transaction-skeleton">
                  <div className="skeleton-icon"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-text skeleton-line"></div>
                    <div className="skeleton-text skeleton-line-short"></div>
                  </div>
                  <div className="skeleton-text skeleton-value"></div>
                </div>
              ))}
            </div>
          ) : currentMonthTransactions.length === 0 ? (
            <div className="empty-state">
              <p>Nenhuma movimentação encontrada para este mês.</p>
            </div>
          ) : (
            <div className="transactions-list">
              {currentMonthTransactions.map(transaction => (
                <div 
                  key={transaction.id} 
                  className={`transaction-item ${transaction.type.toLowerCase()}`}
                >
                  <div className="transaction-icon">
                    {transaction.type === 'Entrada' ? '💵' : '💸'}
                  </div>
                  <div className="transaction-details">
                    <div className="transaction-description">
                      {transaction.description}
                      {transaction.isRecurring && (
                        <span className="recurring-badge" title="Movimentação recorrente mensal">
                          📅
                        </span>
                      )}
                    </div>
                    <div className="transaction-project">
                      {transaction.project}
                    </div>
                  </div>
                  <div className="transaction-value">
                    {formatCurrency(transaction.value)}
                  </div>
                  <div className="transaction-date">
                    {formatDate(transaction.date)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Nova Movimentação */}
      {isModalOpen && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title="Nova Movimentação"
        >
          <NewTransactionForm 
            onSubmit={handleCreateTransaction}
            onCancel={() => setIsModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
};

// Componente do formulário de nova transação
interface NewTransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
}

const NewTransactionForm = ({ onSubmit, onCancel }: NewTransactionFormProps) => {
  const [type, setType] = useState<'Entrada' | 'Saída'>('Entrada');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [project, setProject] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!value || !description || !project) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const numericValue = parseFloat(value.replace(',', '.'));
    if (isNaN(numericValue) || numericValue <= 0) {
      alert('Por favor, insira um valor válido.');
      return;
    }

    onSubmit({
      type,
      value: numericValue,
      description,
      project,
      date: new Date().toISOString(),
      isRecurring,
      recurringId: undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="new-transaction-form">
      <div className="form-group">
        <label htmlFor="type">Tipo *</label>
        <select 
          id="type"
          value={type} 
          onChange={(e) => setType(e.target.value as 'Entrada' | 'Saída')}
          required
        >
          <option value="Entrada">💵 Entrada</option>
          <option value="Saída">💸 Saída</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="value">Valor *</label>
        <input
          type="number"
          id="value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0,00"
          step="0.01"
          min="0"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Descrição *</label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição da movimentação"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="project">Projeto *</label>
        <input
          type="text"
          id="project"
          value={project}
          onChange={(e) => setProject(e.target.value)}
          placeholder="Nome do projeto"
          required
        />
      </div>

      <div className="form-group recurring-group">
        <label className="recurring-label">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="recurring-checkbox"
          />
          <span className="recurring-text">
            Mensal
          </span>
        </label>
        <small className="recurring-help">
          {isRecurring 
            ? "Esta movimentação será repetida automaticamente todo mês" 
            : "Marque para repetir esta movimentação mensalmente"
          }
        </small>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="cancel-button">
          Cancelar
        </button>
        <button type="submit" className="submit-button">
          Salvar Movimentação
        </button>
      </div>
    </form>
  );
};

export default FinancialView;
