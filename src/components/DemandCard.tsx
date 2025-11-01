import './DemandCard.css';

export interface Demand {
  id: string | number;
  desenvolvedor: string;
  projeto: string;
  descricao: string;
  status: 'Pendente' | 'Concluído';
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  dataCriacao?: string;
}

interface DemandCardProps {
  demand: Demand;
  onEdit?: (demand: Demand) => void;
  onDelete?: (id: string | number) => void;
  onComplete?: (demand: Demand) => void;
  isCompleting?: boolean;
}

const DemandCard = ({ demand, onEdit, onDelete, onComplete, isCompleting }: DemandCardProps) => {
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Pendente':
        return 'status-pendente';
      case 'Concluído':
        return 'status-concluido';
      default:
        return '';
    }
  };

  const getPriorityClass = (prioridade: string) => {
    switch (prioridade) {
      case 'Baixa':
        return 'priority-baixa';
      case 'Média':
        return 'priority-media';
      case 'Alta':
        return 'priority-alta';
      case 'Urgente':
        return 'priority-urgente';
      default:
        return '';
    }
  };

  return (
    <div 
      className="demand-card" 
      data-status={demand.status} 
      data-priority={demand.prioridade}
      onClick={() => onEdit && onEdit(demand)}
      style={{ 
        cursor: onEdit ? 'pointer' : 'default',
        opacity: isCompleting ? 0.6 : 1,
        pointerEvents: isCompleting ? 'none' : 'auto',
        position: 'relative'
      }}
    >
      <div className="card-header">
        <span className="developer-badge">{demand.desenvolvedor}</span>
        <div className="card-actions">
          {demand.status !== 'Concluído' && onComplete && (
            <button
              className="action-btn complete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onComplete({ ...demand, status: 'Concluído' });
              }}
              aria-label="Concluir demanda"
              title="Concluir"
            >
              ✓
            </button>
          )}
          {onEdit && (
            <button
              className="action-btn edit-btn"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(demand);
              }}
              aria-label="Editar demanda"
              title="Editar"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              className="action-btn delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(demand.id);
              }}
              aria-label="Excluir demanda"
              title="Excluir"
            >
              ❌
            </button>
          )}
        </div>
      </div>
      
      <div className="card-body">
        <h3 className="project-title">{demand.projeto}</h3>
        
        <p className="project-description">{demand.descricao}</p>
        
        <div className="card-badges">
          <span className={`priority-badge ${getPriorityClass(demand.prioridade)}`}>
            {demand.prioridade}
          </span>
          <span className={`status-badge ${getStatusClass(demand.status)}`}>
            {demand.status}
          </span>
        </div>
      </div>
      
      {isCompleting && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#10B981',
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.9)',
          padding: '1rem 2rem',
          borderRadius: '8px',
          border: '2px solid #10B981',
          zIndex: 10
        }}>
          ✓ Concluindo...
        </div>
      )}
    </div>
  );
};

export default DemandCard;
