import { useState } from 'react';
import './DemandCard.css';
import ChecklistDescription from './ChecklistDescription';

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
  onUpdate?: (demand: Demand) => void;
  isCompleting?: boolean;
}

const DemandCard = ({ demand, onEdit, onDelete, onComplete, onUpdate, isCompleting }: DemandCardProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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

  const createdAtLabel = (() => {
    if (!demand.dataCriacao) return null;
    const date = new Date(demand.dataCriacao);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString('pt-BR');
  })();

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
              <img className="check-icon-img" src="/check-icon.png" alt="Concluir" />
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
              <img className="edit-icon-img" src="/edit-icon.png" alt="Editar" />
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
              <img className="delete-icon-img" src="/delete-icon.png" alt="Excluir" />
            </button>
          )}
        </div>
      </div>
      
      <div className="card-body">
        <div className="project-header">
          <h3 className="project-title">{demand.projeto}</h3>
          <ChecklistDescription
            description={demand.descricao}
            demandId={demand.id}
            onUpdate={(updatedDescription) => {
              if (onUpdate) {
                onUpdate({ ...demand, descricao: updatedDescription });
              }
            }}
            isExpanded={isDescriptionExpanded}
            className="progress-counter"
            showProgressOnly={true}
          />
        </div>
        
        <div className={`description-container ${isDescriptionExpanded ? 'expanded' : ''}`}>
          <ChecklistDescription
            description={demand.descricao}
            demandId={demand.id}
            onUpdate={(updatedDescription) => {
              if (onUpdate) {
                onUpdate({ ...demand, descricao: updatedDescription });
              }
            }}
            isExpanded={isDescriptionExpanded}
            className="project-description"
            showProgressOnly={false}
          />
          {demand.descricao.length > 100 && (
            <button
              className={`expand-description-btn ${isDescriptionExpanded ? 'expanded' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsDescriptionExpanded(!isDescriptionExpanded);
              }}
              title={isDescriptionExpanded ? 'Contrair descrição' : 'Expandir descrição'}
            >
              <span className="expand-icon">›</span>
            </button>
          )}
        </div>
        
        <div className="card-badges">
          <span className={`priority-badge ${getPriorityClass(demand.prioridade)}`}>
            {demand.prioridade}
          </span>
          <span className={`status-badge ${getStatusClass(demand.status)}`}>
            {demand.status}
          </span>
        </div>

        {createdAtLabel && (
          <div className="demand-created-at">
            Demanda criada em {createdAtLabel}
          </div>
        )}
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
          Concluindo...
        </div>
      )}
    </div>
  );
};

export default DemandCard;
