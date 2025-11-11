import { useState, useEffect } from 'react';
import './SatisfactionSurvey.css';

interface SatisfactionSurveyProps {
  onBack: () => void;
  onLogout: () => void;
}

interface FeedbackData {
  id: string;
  timestamp: string;
  estrelas: number;
  nome_cliente: string;
  empresa: string;
  projeto: string;
  comentario?: string;
}

interface FeedbackResponse {
  'feedback-isis': FeedbackData[];
}

const SatisfactionSurvey = ({ onBack, onLogout }: SatisfactionSurveyProps) => {
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({
    empresa: '',
    projeto: '',
    estrelas: 0
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingFeedbackId, setDeletingFeedbackId] = useState<string | null>(null);

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Buscar dados do feedback-isis no JSONBin
      const response = await fetch('https://api.jsonbin.io/v3/b/690605e5ae596e708f3c7bc5', {
        headers: {
          'X-Master-Key': '$2a$10$/XmOGvx8./SZzV3qMzQ5i.6FjBjS4toNbeaEFzX2D8QPUddyM6VR2'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar feedbacks');
      }

      const data = await response.json();
      const feedbackData: FeedbackResponse = data.record;
      
      if (feedbackData['feedback-isis']) {
        setFeedbacks(feedbackData['feedback-isis']);
      } else {
        setFeedbacks([]);
      }
    } catch (err) {
      console.error('Erro ao carregar feedbacks:', err);
      setError('Erro ao carregar pesquisas de satisfação');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    if (filter.empresa && !feedback.empresa.toLowerCase().includes(filter.empresa.toLowerCase())) {
      return false;
    }
    if (filter.projeto && !feedback.projeto.toLowerCase().includes(filter.projeto.toLowerCase())) {
      return false;
    }
    if (filter.estrelas > 0 && feedback.estrelas !== filter.estrelas) {
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
    filteredFeedbacks.forEach(feedback => {
      if (feedback.estrelas >= 1 && feedback.estrelas <= 5) {
        distribution[feedback.estrelas]++;
      }
    });
    return distribution;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          style={{
            color: i <= rating ? '#ffd700' : 'rgba(255, 255, 255, 0.3)',
            fontSize: '1rem'
          }}
        >
          ⭐
        </span>
      );
    }
    return stars;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const handleDeleteAllFeedbacks = async () => {
    try {
      setIsDeleting(true);
      setError('');
      
      // Limpar todos os feedbacks do JSONBin
      const emptyData = { 'feedback-isis': [] };
      
      const response = await fetch('https://api.jsonbin.io/v3/b/690605e5ae596e708f3c7bc5', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': '$2a$10$/XmOGvx8./SZzV3qMzQ5i.6FjBjS4toNbeaEFzX2D8QPUddyM6VR2'
        },
        body: JSON.stringify(emptyData)
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar feedbacks');
      }

      setFeedbacks([]);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Erro ao deletar feedbacks:', err);
      setError('Erro ao deletar pesquisas de satisfação');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSingleFeedback = async (feedbackId: string) => {
    try {
      setDeletingFeedbackId(feedbackId);
      setError('');
      
      // Remover o feedback específico da lista
      const updatedFeedbacks = feedbacks.filter(f => f.id !== feedbackId);
      const updatedData = { 'feedback-isis': updatedFeedbacks };
      
      const response = await fetch('https://api.jsonbin.io/v3/b/690605e5ae596e708f3c7bc5', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': '$2a$10$/XmOGvx8./SZzV3qMzQ5i.6FjBjS4toNbeaEFzX2D8QPUddyM6VR2'
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar feedback');
      }

      setFeedbacks(updatedFeedbacks);
    } catch (err) {
      console.error('Erro ao deletar feedback:', err);
      setError('Erro ao deletar pesquisa de satisfação');
    } finally {
      setDeletingFeedbackId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="satisfaction-loading">
        <div className="loading-spinner">⏳</div>
        <p>Carregando pesquisas de satisfação...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="satisfaction-error">
        <div className="error-icon">❌</div>
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
        <button 
          className="back-button"
          onClick={onBack}
          title="Voltar ao Dashboard"
        >
          ← Voltar
        </button>
        <h1 className="satisfaction-title">⭐ Pesquisa de Satisfação</h1>
        <button 
          className="logout-button"
          onClick={onLogout}
          title="Sair do sistema"
        >
          🚪 Sair
        </button>
      </header>

      <div className="survey-stats">
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Total</h3>
            <span className="stat-number">{filteredFeedbacks.length}</span>
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
                        width: filteredFeedbacks.length > 0 
                          ? `${(count / filteredFeedbacks.length) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                  <span className="count-label">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="satisfaction-filters">
        <div className="filter-group">
          <label>Empresa:</label>
          <input
            type="text"
            value={filter.empresa}
            onChange={(e) => setFilter(prev => ({ ...prev, empresa: e.target.value }))}
            placeholder="Filtrar por empresa..."
          />
        </div>

        <div className="filter-group">
          <label>Projeto:</label>
          <input
            type="text"
            value={filter.projeto}
            onChange={(e) => setFilter(prev => ({ ...prev, projeto: e.target.value }))}
            placeholder="Filtrar por projeto..."
          />
        </div>

        <div className="filter-group">
          <label>Estrelas:</label>
          <select
            value={filter.estrelas}
            onChange={(e) => setFilter(prev => ({ ...prev, estrelas: parseInt(e.target.value) || 0 }))}
          >
            <option value={0}>Todas</option>
            <option value={5}>5 ⭐</option>
            <option value={4}>4 ⭐</option>
            <option value={3}>3 ⭐</option>
            <option value={2}>2 ⭐</option>
            <option value={1}>1 ⭐</option>
          </select>
        </div>

        <button onClick={loadFeedbacks} className="refresh-btn">
          🔄 Atualizar
        </button>
        
        <button 
          onClick={() => setShowDeleteConfirm(true)} 
          className="delete-all-btn"
          disabled={filteredFeedbacks.length === 0}
          title="Apagar todas as pesquisas"
        >
          🗑️ Apagar Todas
        </button>
      </div>

      <div className="feedbacks-list">
        {filteredFeedbacks.length === 0 ? (
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
                    onClick={() => handleDeleteSingleFeedback(feedback.id)}
                    className="delete-feedback-btn"
                    disabled={deletingFeedbackId === feedback.id}
                    title="Apagar esta pesquisa"
                  >
                    {deletingFeedbackId === feedback.id ? '⏳' : '🗑️'}
                  </button>
                </div>
              </div>
              
              {feedback.comentario && (
                <div className="feedback-comment">
                  <p>"{feedback.comentario}"</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal de confirmação para deletar */}
      {showDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-modal">
            <div className="delete-confirm-header">
              <h3>⚠️ Confirmar Exclusão</h3>
            </div>
            <div className="delete-confirm-content">
              <p>Tem certeza que deseja apagar <strong>todas as {feedbacks.length} pesquisas</strong> de satisfação?</p>
              <p className="warning-text">Esta ação não pode ser desfeita!</p>
            </div>
            <div className="delete-confirm-actions">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="cancel-delete-btn"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteAllFeedbacks}
                className="confirm-delete-btn"
                disabled={isDeleting}
              >
                {isDeleting ? '⏳ Apagando...' : '🗑️ Apagar Todas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SatisfactionSurvey;
