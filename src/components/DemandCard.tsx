import './DemandCard.css';

export interface Demand {
  id: string | number;
  desenvolvedor: string;
  projeto: string;
  descricao: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluído';
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  dataCriacao?: string;
}

interface DemandCardProps {
  demand: Demand;
  onEdit?: (demand: Demand) => void;
  onDelete?: (id: string | number) => void;
}

const DemandCard = ({ demand, onEdit, onDelete }: DemandCardProps) => {
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Pendente':
        return 'status-pendente';
      case 'Em Andamento':
        return 'status-andamento';
      case 'Concluído':
        return 'status-concluido';
      default:
        return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pendente':
        return '⏸';
      case 'Em Andamento':
        return '⏱';
      case 'Concluído':
        return '✓';
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
    <div className="demand-card">
      <div className="card-header">
        <span className="developer-badge">{demand.desenvolvedor}</span>
        <div className="card-actions">
          {onEdit && (
            <button
              className="action-btn edit-btn"
              onClick={() => onEdit(demand)}
              aria-label="Editar demanda"
              title="Editar"
            >
              ✎
            </button>
          )}
          {onDelete && (
            <button
              className="action-btn delete-btn"
              onClick={() => onDelete(demand.id)}
              aria-label="Excluir demanda"
              title="Excluir"
            >
              🗑
            </button>
          )}
        </div>
      </div>
      
      <h3 className="project-title">{demand.projeto}</h3>
      
      <p className="project-description">{demand.descricao}</p>
      
      <div className="card-footer">
        <span className={`priority-badge ${getPriorityClass(demand.prioridade)}`}>
          {demand.prioridade}
        </span>
        <span className={`status-badge ${getStatusClass(demand.status)}`}>
          <span className="status-icon">{getStatusIcon(demand.status)}</span>
          {demand.status}
        </span>
      </div>
    </div>
  );
};

export default DemandCard;
