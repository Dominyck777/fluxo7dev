import { useState, useEffect, useCallback } from 'react';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import './SatisfactionSurvey.css';
import { supabaseFeedbacks } from '../utils/supabase-feedbacks';

interface SatisfactionSurveyProps {
  onOpenSidebar?: () => void;
  onLogout: () => void;
}

interface ConversationMessage {
  ts: string;
  from: string;
  text: string;
}

export interface FeedbackData {
  id: string;
  timestamp: string;
  estrelas: number;
  nome_cliente: string;
  empresa: string;
  projeto: string;
  comentario?: string;
  cod_cliente?: string;
  conversa?: ConversationMessage[];
}

const SatisfactionSurvey = ({ onOpenSidebar, onLogout }: SatisfactionSurveyProps) => {
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    empresa: '',
    projeto: '',
    estrelas: '',
  });
  const [feedbackToDelete, setFeedbackToDelete] = useState<{ id: string; name: string } | null>(null);
  const [expandedConversations, setExpandedConversations] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    try {
      setIsLoading(true);
      setError('');
      const sessions = await supabaseFeedbacks.getFeedbacks();
      setFeedbacks(sessions);
    } catch (err) {
      console.error('Erro ao carregar feedbacks:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(`Erro ao carregar pesquisas de satisfação${message ? `: ${message}` : ''}`);
    } finally {
      setIsLoading(false);
    }
  };

  const empresas: string[] = Array.from(
    new Set(
      feedbacks
        .map((f) => f.empresa)
        .filter((empresa) => empresa && empresa.trim().length > 0)
    )
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const projetos: string[] = Array.from(
    new Set(
      feedbacks
        .map((f) => f.projeto)
        .filter((projeto) => projeto && projeto.trim().length > 0)
    )
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    if (filters.empresa && feedback.empresa !== filters.empresa) {
      return false;
    }
    if (filters.projeto && feedback.projeto !== filters.projeto) {
      return false;
    }
    if (filters.estrelas && feedback.estrelas !== parseInt(filters.estrelas)) {
      return false;
    }
    return true;
  });

  const getAverageRating = () => {
    if (filteredFeedbacks.length === 0) return 0;
    const sum = filteredFeedbacks.reduce((acc, feedback) => acc + feedback.estrelas, 0);
    return sum / filteredFeedbacks.length;
  };

  const getAverageRatingFormatted = () => {
    return getAverageRating().toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    filteredFeedbacks.forEach((feedback) => {
      if (feedback.estrelas >= 1 && feedback.estrelas <= 5) {
        distribution[feedback.estrelas]++;
      }
    });
    return distribution;
  };

  const getRecentFeedbacks = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return filteredFeedbacks.filter((feedback) => {
      const feedbackDate = new Date(feedback.timestamp);
      return feedbackDate >= oneWeekAgo;
    });
  };

  const recentFeedbacks = getRecentFeedbacks();
  const recentPercentage = filteredFeedbacks.length > 0
    ? ((recentFeedbacks.length / filteredFeedbacks.length) * 100).toFixed(0)
    : 0;

  const renderStars = (rating: number) => {
    return (
      <div className="stars-container" title={`${rating} de 5 estrelas`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''}`}
            aria-hidden="true"
          >
            {star <= rating ? '★' : '☆'}
          </span>
        ))}
        <span className="rating-text">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const toggleConversation = (id: string) => {
    setExpandedConversations((prev) => {
      const isCurrentlyExpanded = prev[id];

      // Se já está aberto, fecha todos
      if (isCurrentlyExpanded) {
        return {};
      }

      // Abre somente o card clicado e garante que os demais fiquem fechados
      return {
        [id]: true,
      };
    });
  };

  const handleDeleteClick = useCallback((feedbackId: string, feedbackName: string) => {
    setFeedbackToDelete({ id: feedbackId, name: feedbackName });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!feedbackToDelete) return;

    try {
      setError('');
      await supabaseFeedbacks.clearSingleFeedback(feedbackToDelete.id);
      setFeedbacks((prev) => prev.filter((f) => f.id !== feedbackToDelete.id));

      // Fecha a conversa se estiver aberta
      setExpandedConversations((prev) => {
        const newState = { ...prev };
        delete newState[feedbackToDelete.id];
        return newState;
      });
    } catch (err) {
      console.error('Erro ao deletar feedback:', err);
      setError('Erro ao excluir o feedback. Tente novamente.');
    } finally {
      setFeedbackToDelete(null);
    }
  }, [feedbackToDelete]);

  const handleCancelDelete = useCallback(() => {
    setFeedbackToDelete(null);
  }, []);

  // Função para lidar com a exclusão de todos os feedbacks
  const handleDeleteAllFeedbacks = async () => {
    if (window.confirm('Tem certeza que deseja excluir TODOS os feedbacks? Esta ação não pode ser desfeita.')) {
      try {
        await supabaseFeedbacks.clearAllFeedbacks();
        setFeedbacks([]);
      } catch (err) {
        console.error('Erro ao deletar todos os feedbacks:', err);
        setError('Erro ao excluir todas as pesquisas de satisfação');
      }
    }
  };

  if (error) {
    return (
      <div className="satisfaction-error">
        <div className="error-icon">
          <img className="delete-icon-img" src="/delete-icon.png" alt="Erro" />
        </div>
        <p>{error}</p>
        <button onClick={loadFeedbacks} className="retry-btn">
          🔄 Tentar novamente
        </button>
      </div>
    );
  }

  const distribution = getRatingDistribution();

  return (
    <div className="satisfaction-survey">
      <header className="satisfaction-header">
        <div className="header-content">
          <span
            className={`header-icon ${onOpenSidebar ? 'clickable' : ''}`}
            onClick={onOpenSidebar}
            title={onOpenSidebar ? 'Abrir menu' : ''}
            style={{ cursor: onOpenSidebar ? 'pointer' : 'default' }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="#f05902" strokeWidth="2" />
              <path d="M8 8L10 10L8 12" stroke="#ffaa33" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 12H16" stroke="#91b0b0" strokeWidth="2" strokeLinecap="round" />
              <circle cx="18" cy="18" r="4" fill="#1a1a1a" stroke="#f05902" strokeWidth="1.5" />
              <path d="M18 16V20M16 18H20" stroke="#ffaa33" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <h1 className="satisfaction-title">Feedbacks</h1>
          <div className="header-user-section">
            <button
              className="logout-button"
              onClick={onLogout}
              title="Sair do sistema"
            >
              🚪 Sair
            </button>
          </div>
        </div>
      </header>

      <main className="satisfaction-main">
        <div className="satisfaction-content">
          {/* Visão geral */}
          <h2 className="feedbacks-section-title">Visão geral</h2>
          <div className="survey-stats">
            {isLoading ? (
              <>
                <div className="stat-card">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-content">
                    <h3>Carregando total</h3>
                    <span className="stat-number">...</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-content">
                    <h3>Carregando média</h3>
                    <span className="stat-number">...</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="stat-card stat-card-total">
                  <div className="stat-icon">📈</div>
                  <div className="stat-content">
                    <h3>Total de Feedbacks</h3>
                    <span className="stat-number">{filteredFeedbacks.length}</span>
                    <div className="stat-details">
                      <div className="stat-detail-item">
                        <span className="stat-detail-label">Recentes (7 dias)</span>
                        <span className="stat-detail-value">{recentFeedbacks.length}</span>
                      </div>
                      <div className="stat-detail-item">
                        <span className="stat-detail-label">% Recentes</span>
                        <span className="stat-detail-value">{recentPercentage}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-content">
                    <h3>Média Geral</h3>
                    <div className="average-rating">
                      <span className="stat-number">{getAverageRatingFormatted()}</span>
                      <div className="average-stars">
                        {renderStars(Math.round(getAverageRating()))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="stat-card rating-distribution">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <h3>Distribuição</h3>
                    <div className="distribution-bars">
                      {Object.entries(distribution).reverse().map(([stars, count]) => (
                        <div key={String(stars)} className="distribution-row">
                          <span className="stars-label">{stars}⭐</span>
                          <div className="distribution-bar">
                            <div
                              className="bar-fill"
                              style={{
                                width:
                                  filteredFeedbacks.length > 0
                                    ? `${(count / filteredFeedbacks.length) * 100}%`
                                    : '0%',
                              }}
                            />
                          </div>
                          <span className="count-label">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Filtros */}
          <h2 className="feedbacks-section-title">Filtros</h2>
          <div className="filters-container">
            <div className="filters">
              <div className="filter-group">
                <label htmlFor="empresa">Empresa:</label>
                <select
                  id="empresa"
                  value={filters.empresa}
                  onChange={(e) => setFilters({ ...filters, empresa: e.target.value })}
                >
                  <option value="">Todas</option>
                  {empresas.map((empresa) => (
                    <option key={empresa} value={empresa}>
                      {empresa}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="projeto">Projeto:</label>
                <select
                  id="projeto"
                  value={filters.projeto}
                  onChange={(e) => setFilters({ ...filters, projeto: e.target.value })}
                >
                  <option value="">Todos</option>
                  {projetos.map((projeto) => (
                    <option key={projeto} value={projeto}>
                      {projeto}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="estrelas">Avaliação:</label>
                <select
                  id="estrelas"
                  value={filters.estrelas}
                  onChange={(e) =>
                    setFilters({ ...filters, estrelas: e.target.value })
                  }
                >
                  <option value="">Todas</option>
                  <option value="5">5 estrelas</option>
                  <option value="4">4 estrelas</option>
                  <option value="3">3 estrelas</option>
                  <option value="2">2 estrelas</option>
                  <option value="1">1 estrela</option>
                </select>
              </div>
            </div>
          </div>

          <button onClick={loadFeedbacks} className="refresh-btn">
            🔄 Atualizar
          </button>

          <div className="actions">
            <button
              className="delete-all-btn"
              onClick={handleDeleteAllFeedbacks}
              disabled={isLoading}
            >
              Excluir todos os feedbacks
            </button>
          </div>

          {/* Lista de feedbacks */}
          <h2 className="feedbacks-section-title">Feedbacks</h2>
          <DeleteConfirmationModal
            isOpen={!!feedbackToDelete}
            onClose={handleCancelDelete}
            onConfirm={handleConfirmDelete}
            itemName={feedbackToDelete?.name || ''}
          />

          <div className="feedbacks-list">
            {isLoading ? (
              <div className="no-feedbacks">
                <div className="no-data-icon">⏳</div>
                <p>Carregando pesquisas de satisfação...</p>
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="no-feedbacks">
                <div className="no-data-icon">📝</div>
                <p>Nenhuma pesquisa de satisfação encontrada</p>
              </div>
            ) : (
              filteredFeedbacks.map((feedback) => (
                <div key={feedback.id} className="feedback-card">
                  <div className="feedback-header">
                    <div className="feedback-info">
                      <h3>{feedback.nome_cliente}</h3>
                      <div className="feedback-meta">
                        <span className="empresa">{feedback.empresa}</span>
                        <span className="projeto">{feedback.projeto}</span>
                        <span className="date">{formatDate(feedback.timestamp)}</span>
                      </div>
                    </div>
                    <div className="feedback-actions">
                      <div className="feedback-rating">
                        {renderStars(feedback.estrelas)}
                      </div>
                      <button
                        className="delete-feedback-btn"
                        onClick={() => handleDeleteClick(feedback.id, feedback.nome_cliente || 'este feedback')}
                        disabled={!!feedbackToDelete}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>

                  {feedback.comentario && (
                    <div className="feedback-comment">
                      <p>"{feedback.comentario}"</p>
                    </div>
                  )}

                  <div
                    className={`feedback-conversation ${
                      expandedConversations[feedback.id] ? 'expanded' : ''
                    }`}
                  >
                    <button
                      type="button"
                      className="conversation-toggle-btn"
                      onClick={() => toggleConversation(feedback.id)}
                    >
                      {expandedConversations[feedback.id]
                        ? '📖 Esconder conversa completa'
                        : '📋 Abrir conversa completa'}
                    </button>
                    <div className="conversation-body">
                      {feedback.conversa && feedback.conversa.length > 0 ? (
                        feedback.conversa.map((message) => (
                          <div
                            key={message.ts}
                            className={`conversation-message ${
                              message.from === 'user' ? 'from-user' : 'from-assistant'
                            }`}
                          >
                            <div className="conversation-meta">
                              <span className="conversation-from">
                                {message.from === 'user' ? 'Cliente' : 'Assistente'}
                              </span>
                              <span className="conversation-time">
                                {new Date(message.ts).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="conversation-text">{message.text}</p>
                          </div>
                        ))
                      ) : (
                        <p className="conversation-empty">
                          Nenhum histórico de conversa salvo para este feedback.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SatisfactionSurvey;
