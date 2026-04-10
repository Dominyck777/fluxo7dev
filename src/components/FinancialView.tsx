import { useState, useEffect } from 'react';
import Modal from './Modal';
import { jsonbinClient } from '../utils/jsonbin-client';
import { supabaseTransactions } from '../utils/supabase-transactions';
import './FinancialView.css';

export interface Transaction {
  id: string | number;
  type: 'Entrada' | 'Saída';
  value: number;
  description: string;
  project: string;
  date: string;
  isMonthly?: boolean;
  isPaid?: boolean;
}

interface FinancialViewProps {
  onOpenSidebar?: () => void;
  onLogout: () => void;
}

const FinancialView = ({ onOpenSidebar, onLogout }: FinancialViewProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Carregar transações e projetos dos dados pré-carregados ou API
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Tentar usar dados pré-carregados primeiro
        const preloadedTransactions = localStorage.getItem('preloaded_transactions');
        const preloadedConfig = localStorage.getItem('preloaded_config');
        let loadedTransactions: Transaction[] = [];
        let loadedProjects: string[] = [];
        
        if (preloadedTransactions && preloadedConfig) {
          // Usar dados pré-carregados (carregamento instantâneo)
          loadedTransactions = JSON.parse(preloadedTransactions);
          const config = JSON.parse(preloadedConfig);
          loadedProjects = config.projects || [];
          
          // Limpar dados pré-carregados após uso
          localStorage.removeItem('preloaded_transactions');
        } else {
          // Fallback: carregar da API se não houver dados pré-carregados
          // Isso só acontece quando o usuário atualiza a página
          // Transações agora vêm do Supabase; projetos ainda vêm do JSONBin (config)
          loadedTransactions = await supabaseTransactions.getTransactions();
          const config = await jsonbinClient.getConfig();
          loadedProjects = config.projects;
        }
        
        if (!mounted) return;
        setTransactions(loadedTransactions);
        setProjects(loadedProjects);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        if (mounted) {
          setTransactions([]);
          setProjects([]);
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


  // Calcular totais considerando as movimentações até o "mesversário"
  // Exemplo: movimentação em 10/03 fica como recente até 10/04 (inclusive)
  const now = new Date();

  const isWithinAnniversaryWindow = (transaction: Transaction) => {
    const transactionDate = new Date(transaction.date);
    if (isNaN(transactionDate.getTime())) return false;

    const anniversary = new Date(transactionDate);
    anniversary.setMonth(anniversary.getMonth() + 1);

    return now >= transactionDate && now < anniversary;
  };

  const recentTransactions = transactions.filter(isWithinAnniversaryWindow);

  const historicalTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    if (isNaN(transactionDate.getTime())) return false;

    const anniversary = new Date(transactionDate);
    anniversary.setMonth(anniversary.getMonth() + 1);

    return now >= anniversary;
  });

  const totalEntradas = recentTransactions
    .filter(t => t.type === 'Entrada')
    .reduce((sum, t) => sum + t.value, 0);

  const totalSaidas = recentTransactions
    .filter(t => t.type === 'Saída')
    .reduce((sum, t) => sum + t.value, 0);

  // Margem de Lucro = (Lucro / Receita) * 100
  // Lucro = Entradas - Saídas
  // Receita = Entradas (total recebido)
  const lucroAbsoluto = totalEntradas - totalSaidas;
  const lucroPercentual = totalEntradas > 0 ? (lucroAbsoluto / totalEntradas * 100) : 0;

  // Função para formatar data atual para o título do modal
  const getCurrentDateForTitle = () => {
    const today = new Date();
    return today.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCreateTransaction = async (newTransaction: Omit<Transaction, 'id'>) => {
    setIsCreating(true);
    try {
      // Criar a transação no Supabase
      const createdTransaction = await supabaseTransactions.createTransaction(newTransaction);
      
      // Atualizar o estado local
      const updatedTransactions = [...transactions, createdTransaction];
      setTransactions(updatedTransactions);
      
      setIsModalOpen(false);
      // Recarregar as transações para garantir sincronização
      const allTransactions = await supabaseTransactions.getTransactions();
      setTransactions(allTransactions);
      
    } catch (error) {
      console.error('Erro ao criar movimentação:', error);
      alert('Erro ao criar movimentação. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleUpdateTransaction = async (updatedTransaction: Transaction) => {
    setIsEditing(true);
    try {
      await supabaseTransactions.updateTransaction(updatedTransaction);
      
      // Atualizar estado local
      const updatedTransactions = transactions.map(t => 
        t.id === updatedTransaction.id ? updatedTransaction : t
      );
      setTransactions(updatedTransactions);
      
      setIsEditModalOpen(false);
      setEditingTransaction(null);
      // Recarregar para sincronizar
      const allTransactions = await supabaseTransactions.getTransactions();
      setTransactions(allTransactions);
      
    } catch (error) {
      console.error('Erro ao atualizar movimentação:', error);
      alert('Erro ao atualizar movimentação. Tente novamente.');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteTransaction = (id: string | number) => {
    setConfirmDelete(id);
  };

  const confirmDeleteTransaction = async () => {
    if (!confirmDelete) return;
    
    setIsDeleting(true);
    try {
      await supabaseTransactions.deleteTransaction(confirmDelete);
      
      // Atualizar estado local
      const updatedTransactions = transactions.filter(t => t.id !== confirmDelete);
      setTransactions(updatedTransactions);
      setConfirmDelete(null);
      
      // Recarregar para sincronizar
      const allTransactions = await supabaseTransactions.getTransactions();
      setTransactions(allTransactions);
      
    } catch (error) {
      console.error('Erro ao excluir movimentação:', error);
      alert('Erro ao excluir movimentação. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const refreshTransactions = async () => {
    setIsLoading(true);
    try {
      const allTransactions = await supabaseTransactions.getTransactions();
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Erro ao atualizar movimentações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePaid = async (transaction: Transaction) => {
    const updated: Transaction = { ...transaction, isPaid: !transaction.isPaid };

    // Atualiza otimistamente no estado local
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));

    try {
      await supabaseTransactions.updateTransaction(updated);
    } catch (error) {
      console.error('Erro ao atualizar status de pagamento:', error);
      alert('Erro ao atualizar status de pagamento. Tente novamente.');
      // Opcional: poderia reverter o estado aqui se necessário
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
        <div className="header-content">
          <span
            className={`header-icon ${onOpenSidebar ? 'clickable' : ''}`}
            onClick={onOpenSidebar}
            title={onOpenSidebar ? 'Abrir menu' : ''}
            style={{ cursor: onOpenSidebar ? 'pointer' : 'default' }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="var(--color-logo-fluxo)" strokeWidth="2"/>
              <path d="M8 8L10 10L8 12" stroke="var(--color-logo-7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12H16" stroke="#91b0b0" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="18" cy="18" r="4" fill="#1a1a1a" stroke="var(--color-logo-fluxo)" strokeWidth="1.5"/>
              <path d="M18 16V20M16 18H20" stroke="var(--color-logo-7)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </span>
          <div className="header-logo-container"></div>
          <div className="header-user-section">
            <button 
              onClick={onLogout}
              className="logout-button"
              aria-label="Sair do sistema"
              title="Sair do sistema"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="financial-content">
        <div className="financial-summary">
          <div className="summary-card entradas-card">
            <div className="card-content">
              <h3> Total Entrada</h3>
              <div className="card-number">{formatCurrency(totalEntradas)}</div>
            </div>
          </div>
          
          <div className="summary-card saidas-card">
            <div className="card-content">
              <h3>Total de Saídas</h3>
              <div className="card-number">{formatCurrency(totalSaidas)}</div>
            </div>
          </div>
          
          <div className="summary-card lucro-card">
            <div className="card-content">
              <h3>Lucro %</h3>
              <div className="card-number">{lucroPercentual >= 0 ? '+' : ''}{lucroPercentual.toFixed(1)}%</div>
            </div>
          </div>
          
          <div className="summary-card saldo-card">
            <div className="card-content">
              <h3>Saldo Atual</h3>
              <div className="card-number">{formatCurrency(totalEntradas - totalSaidas)}</div>
            </div>
          </div>
        </div>

        {/* Botão Nova Movimentação */}
        <div className="new-transaction-section">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="new-transaction-button"
          >
            + Nova Movimentação
          </button>
        </div>

        {/* Lista de Movimentações (até o mesversário) */}
        <div className="transactions-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Movimentações Recentes (até 1 mês)</h2>
              <p className="section-subtitle">Considera movimentações desde a data de lançamento até o mesmo dia do mês seguinte. Entradas, saídas, lucro e gráficos usam este período.</p>
            </div>
            <button 
              onClick={refreshTransactions}
              className="refresh-transactions-button"
              title="Atualizar movimentações"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 4v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
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
          ) : recentTransactions.length === 0 ? (
            <div className="empty-state">
              <p>Nenhuma movimentação encontrada nos últimos 30 dias.</p>
            </div>
          ) : (
            <div className="transactions-list">
              {recentTransactions.map(transaction => (
                <div 
                  key={transaction.id} 
                  className={`transaction-item ${transaction.type.toLowerCase()}`}
                  onClick={() => handleEditTransaction(transaction)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="transaction-actions">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEditTransaction(transaction); }}
                      className="transaction-action-btn edit-btn"
                      title="Editar movimentação"
                    >
                      <img className="edit-icon-img" src="/edit-icon.png" alt="Editar" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(transaction.id); }}
                      className="transaction-action-btn delete-btn"
                      title="Excluir movimentação"
                    >
                      <img className="delete-icon-img" src="/delete-icon.png" alt="Excluir" />
                    </button>
                  </div>
                  
                  <div className="transaction-icon">
                    {transaction.type === 'Entrada' ? '💵' : '💸'}
                  </div>
                  <div className="transaction-details">
                    <div className="transaction-description">
                      {transaction.description}
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
                  {transaction.type === 'Saída' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleTogglePaid(transaction); }}
                      className={`transaction-pay-button ${transaction.isPaid ? 'paid' : ''}`}
                      title={transaction.isPaid ? 'Marcar como em aberto' : 'Marcar como paga'}
                    >
                      {transaction.isPaid ? 'Pago' : 'Pagar'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gráficos */}
        <div className="charts-section">
          <h2 className="charts-title"><span className="emoji-only">📊</span> Visão Geral</h2>
          <div className="charts-grid">
            <div className="chart-card">
              <h3>Distribuição de Movimentações</h3>
              <div className="pie-chart">
                <div className="pie-chart-container">
                  {totalEntradas + totalSaidas === 0 ? (
                    <div className="pie-empty">Nenhuma movimentação recente</div>
                  ) : (
                    <svg viewBox="0 0 36 36" className="pie-svg">
                      {/* Anel de fundo discreto */}
                      <circle
                        className="pie-bg"
                        cx="18"
                        cy="18"
                        r="15.9155"
                      />

                      {(() => {
                        const total = totalEntradas + totalSaidas;
                        const pctEntrada = (totalEntradas / total) * 100;
                        const pctSaida = 100 - pctEntrada;

                        return (
                          <>
                            {/* Arco de Entradas */}
                            <circle
                              className="pie-segment pie-entrada"
                              cx="18"
                              cy="18"
                              r="15.9155"
                              strokeDasharray={`${pctEntrada} ${100 - pctEntrada}`}
                              strokeDashoffset="25"
                            />

                            {/* Arco de Saídas, iniciando onde termina Entradas */}
                            <circle
                              className="pie-segment pie-saida"
                              cx="18"
                              cy="18"
                              r="15.9155"
                              strokeDasharray={`${pctSaida} ${100 - pctSaida}`}
                              strokeDashoffset={`${25 - pctEntrada}`}
                            />
                          </>
                        );
                      })()}
                    </svg>
                  )}
                  <div className="pie-center">
                    <span className="pie-total">{formatCurrency(totalEntradas + totalSaidas)}</span>
                    <span className="pie-label">Total</span>
                  </div>
                </div>
                <div className="pie-legend">
                  <div className="legend-item">
                    <div className="legend-color entrada-color"></div>
                    <span>Entradas: {formatCurrency(totalEntradas)}</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color saida-color"></div>
                    <span>Saídas: {formatCurrency(totalSaidas)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="chart-card">
              <h3>Balanço Mensal</h3>
              <div className="bar-chart">
                <div className="bar-container excel">
                  {(() => {
                    const maxValue = Math.max(totalEntradas, totalSaidas, 1);
                    const getHeightPct = (value: number) => {
                      if (value <= 0) return 0;
                      return (value / maxValue) * 100;
                    };

                    const ticks = [1, 0.75, 0.5, 0.25, 0];

                    return (
                      <>
                        <div className="excel-y-axis">
                          {ticks.map((t) => (
                            <div className="excel-y-tick" key={t}>
                              {Math.round(maxValue * t)}
                            </div>
                          ))}
                        </div>

                        <div className="excel-plot">
                          <div className="excel-grid">
                            {ticks.map((t) => (
                              <div
                                key={t}
                                className="excel-gridline"
                                style={{ bottom: `${t * 100}%` }}
                              />
                            ))}

                            <div className="excel-bars">
                              <div className="excel-bar-item">
                                <div
                                  className="excel-bar-rect excel-bar-entrada"
                                  style={{ height: `${getHeightPct(totalEntradas)}%` }}
                                />
                              </div>

                              <div className="excel-bar-item">
                                <div
                                  className="excel-bar-rect excel-bar-saida"
                                  style={{ height: `${getHeightPct(totalSaidas)}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="excel-x-axis">
                            <div className="excel-x-item">
                              <div className="excel-x-label">Entradas</div>
                              <div className="excel-x-value">{Math.round(totalEntradas)}</div>
                            </div>
                            <div className="excel-x-item">
                              <div className="excel-x-label">Saídas</div>
                              <div className="excel-x-value">{Math.round(totalSaidas)}</div>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="pie-legend" style={{ marginTop: '1rem' }}>
                  <div className="legend-item">
                    <div className="legend-color entrada-color"></div>
                    <span>Entradas do mês atual</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color saida-color"></div>
                    <span>Saídas do mês atual</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Histórico de Movimentações (anteriores a 30 dias) */}
        {historicalTransactions.length > 0 && (
          <div className="transactions-section history-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Histórico de Movimentações</h2>
                <p className="section-subtitle">Movimentações com mais de 30 dias. Não entram nos totais nem nos gráficos atuais.</p>
              </div>
            </div>
            <div className="transactions-list">
              {historicalTransactions.map(transaction => (
                <div 
                  key={transaction.id} 
                  className={`transaction-item ${transaction.type.toLowerCase()}`}
                  onClick={() => handleEditTransaction(transaction)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="transaction-actions">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEditTransaction(transaction); }}
                      className="transaction-action-btn edit-btn"
                      title="Editar movimentação"
                    >
                      <img className="edit-icon-img" src="/edit-icon.png" alt="Editar" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(transaction.id); }}
                      className="transaction-action-btn delete-btn"
                      title="Excluir movimentação"
                    >
                      <img className="delete-icon-img" src="/delete-icon.png" alt="Excluir" />
                    </button>
                  </div>
                  <div className="transaction-icon">
                    {transaction.type === 'Entrada' ? '💵' : '💸'}
                  </div>
                  <div className="transaction-details">
                    <div className="transaction-description">
                      {transaction.description}
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
                  {transaction.type === 'Saída' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleTogglePaid(transaction); }}
                      className={`transaction-pay-button ${transaction.isPaid ? 'paid' : ''}`}
                      title={transaction.isPaid ? 'Marcar como em aberto' : 'Marcar como paga'}
                    >
                      {transaction.isPaid ? 'Pago' : 'Pagar'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Nova Movimentação */}
      {isModalOpen && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title={`Nova Movimentação - ${getCurrentDateForTitle()}`}
        >
          <NewTransactionForm 
            onSubmit={handleCreateTransaction}
            onCancel={() => setIsModalOpen(false)}
            isLoading={isCreating}
            projects={projects}
          />
        </Modal>
      )}

      {/* Modal Editar Movimentação */}
      {isEditModalOpen && editingTransaction && (
        <Modal 
          isOpen={isEditModalOpen} 
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTransaction(null);
          }}
          title="Editar Movimentação"
        >
          <EditTransactionForm 
            transaction={editingTransaction}
            onSubmit={handleUpdateTransaction}
            onCancel={() => {
              setIsEditModalOpen(false);
              setEditingTransaction(null);
            }}
            isLoading={isEditing}
            projects={projects}
          />
        </Modal>
      )}

      {/* Modal Confirmar Exclusão */}
      {confirmDelete && (
        <Modal 
          isOpen={!!confirmDelete} 
          onClose={() => setConfirmDelete(null)}
          title="Confirmar Exclusão"
        >
          <div className="confirm-delete-modal" style={{ position: 'relative' }}>
            <div style={{ 
              opacity: isDeleting ? 0.3 : 1, 
              pointerEvents: isDeleting ? 'none' : 'auto', 
              transition: 'opacity 0.3s', 
              filter: isDeleting ? 'blur(2px)' : 'none' 
            }}>
              <p>Tem certeza que deseja excluir esta movimentação?</p>
              <div className="confirm-actions">
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="cancel-button"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDeleteTransaction}
                  className="delete-confirm-button"
                >
                  Excluir
                </button>
              </div>
            </div>
            {isDeleting && (
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                fontSize: '1.2rem',
                fontWeight: 700,
                color: '#dc2626',
                textAlign: 'center',
                background: 'rgba(0, 0, 0, 0.9)',
                padding: '1.5rem 2.5rem',
                borderRadius: '8px',
                border: '2px solid #dc2626',
                boxShadow: '0 8px 32px rgba(220, 38, 38, 0.4)',
                zIndex: 10
              }}>
                ⏳ Excluindo...
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

// Componente do formulário de nova transação
interface NewTransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
  projects: string[];
}

// Componente do formulário de edição de transação
interface EditTransactionFormProps {
  transaction: Transaction;
  onSubmit: (transaction: Transaction) => void;
  onCancel: () => void;
  isLoading?: boolean;
  projects: string[];
}

const NewTransactionForm = ({ onSubmit, onCancel, isLoading = false, projects }: NewTransactionFormProps) => {
  const [type, setType] = useState<'Entrada' | 'Saída'>('Entrada');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [project, setProject] = useState('');
  const [isMonthly, setIsMonthly] = useState(false);

  // Função para formatar valor como moeda
  const formatCurrencyInput = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Se não há números, retorna vazio
    if (!numbers) return '';
    
    // Converte para número e divide por 100 para ter centavos
    const amount = parseInt(numbers) / 100;
    
    // Formata como moeda brasileira
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Função para converter valor formatado para número
  const parseCurrencyInput = (formattedValue: string) => {
    const numbers = formattedValue.replace(/\D/g, '');
    return numbers ? parseInt(numbers) / 100 : 0;
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatCurrencyInput(inputValue);
    setValue(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!value || !description || !project) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const numericValue = parseCurrencyInput(value);
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
      isMonthly
    });
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ 
        opacity: isLoading ? 0.3 : 1, 
        pointerEvents: isLoading ? 'none' : 'auto', 
        transition: 'opacity 0.3s', 
        filter: isLoading ? 'blur(2px)' : 'none' 
      }}>
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
          type="text"
          id="value"
          value={value}
          onChange={handleValueChange}
          placeholder="R$ 0,00"
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
        <select
          id="project"
          value={project}
          onChange={(e) => setProject(e.target.value)}
          required
        >
          <option value="">Selecione um projeto</option>
          {projects.map((proj) => (
            <option key={proj} value={proj}>
              {proj}
            </option>
          ))}
        </select>
      </div>

      <div className="recurring-group">
        <label className="recurring-label">
          <input
            type="checkbox"
            className="recurring-checkbox"
            checked={isMonthly}
            onChange={(e) => setIsMonthly(e.target.checked)}
          />
          <span className="recurring-text">📅 Movimentação mensal (paga uma vez por mês)</span>
        </label>
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
      </div>
      {isLoading && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--color-primary)',
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.9)',
          padding: '2rem 3rem',
          borderRadius: '12px',
          border: '2px solid var(--color-primary)',
          boxShadow: '0 8px 32px rgba(var(--color-primary-rgb), 0.4)',
          zIndex: 10
        }}>
          ⏳ Criando movimentação...
        </div>
      )}
    </div>
  );
};

const EditTransactionForm = ({ transaction, onSubmit, onCancel, isLoading = false, projects }: EditTransactionFormProps) => {
  const [type, setType] = useState<'Entrada' | 'Saída'>(transaction.type);
  const [value, setValue] = useState(() => {
    // Formatar valor inicial como moeda
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(transaction.value);
  });
  const [description, setDescription] = useState(transaction.description);
  const [project, setProject] = useState(transaction.project);
  const [isMonthly, setIsMonthly] = useState(!!transaction.isMonthly);

  // Função para formatar valor como moeda
  const formatCurrencyInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    const amount = parseInt(numbers) / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Função para converter valor formatado para número
  const parseCurrencyInput = (formattedValue: string) => {
    const numbers = formattedValue.replace(/\D/g, '');
    return numbers ? parseInt(numbers) / 100 : 0;
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatCurrencyInput(inputValue);
    setValue(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!value || !description || !project) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const numericValue = parseCurrencyInput(value);
    if (isNaN(numericValue) || numericValue <= 0) {
      alert('Por favor, insira um valor válido.');
      return;
    }

    onSubmit({
      ...transaction,
      type,
      value: numericValue,
      description,
      project,
      isMonthly
    });
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ 
        opacity: isLoading ? 0.3 : 1, 
        pointerEvents: isLoading ? 'none' : 'auto', 
        transition: 'opacity 0.3s', 
        filter: isLoading ? 'blur(2px)' : 'none' 
      }}>
        <form onSubmit={handleSubmit} className="new-transaction-form">
      <div className="form-group">
        <label htmlFor="edit-type">Tipo *</label>
        <select 
          id="edit-type"
          value={type} 
          onChange={(e) => setType(e.target.value as 'Entrada' | 'Saída')}
          required
        >
          <option value="Entrada">💵 Entrada</option>
          <option value="Saída">💸 Saída</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="edit-value">Valor *</label>
        <input
          type="text"
          id="edit-value"
          value={value}
          onChange={handleValueChange}
          placeholder="R$ 0,00"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="edit-description">Descrição *</label>
        <input
          type="text"
          id="edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição da movimentação"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="edit-project">Projeto *</label>
        <select
          id="edit-project"
          value={project}
          onChange={(e) => setProject(e.target.value)}
          required
        >
          <option value="">Selecione um projeto</option>
          {projects.map((proj) => (
            <option key={proj} value={proj}>
              {proj}
            </option>
          ))}
        </select>
      </div>

      <div className="recurring-group">
        <label className="recurring-label">
          <input
            type="checkbox"
            className="recurring-checkbox"
            checked={isMonthly}
            onChange={(e) => setIsMonthly(e.target.checked)}
          />
          <span className="recurring-text">📅 Movimentação mensal (paga uma vez por mês)</span>
        </label>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="cancel-button">
          Cancelar
        </button>
        <button type="submit" className="submit-button">
          Atualizar Movimentação
        </button>
      </div>
        </form>
      </div>
      {isLoading && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--color-primary)',
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.9)',
          padding: '2rem 3rem',
          borderRadius: '12px',
          border: '2px solid var(--color-primary)',
          boxShadow: '0 8px 32px rgba(var(--color-primary-rgb), 0.4)',
          zIndex: 10
        }}>
          ⏳ Salvando alterações...
        </div>
      )}
    </div>
  );
};

export default FinancialView;
