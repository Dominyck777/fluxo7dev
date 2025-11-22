import { useState, useEffect, type FormEvent } from 'react';
import { type Demand } from './DemandCard';
import ExpandedDescriptionModal from './ExpandedDescriptionModal';
import ChecklistDescription from './ChecklistDescription';
import './NewDemandForm.css';

interface EditDemandFormProps {
  demand: Demand;
  onSubmit: (demand: Demand) => void;
  onCancel: () => void;
  devs: string[];
  projects: string[];
  priorities: string[];
  isLoading?: boolean;
}

const EditDemandForm = ({ demand, onSubmit, onCancel, devs, projects, priorities, isLoading = false }: EditDemandFormProps) => {
  const [formData, setFormData] = useState<Demand>(demand);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemText, setNewItemText] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.desenvolvedor) {
      newErrors.desenvolvedor = 'Selecione um desenvolvedor';
    }
    if (!formData.projeto.trim()) {
      newErrors.projeto = 'Digite o nome do projeto';
    }
    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Digite a descrição da demanda';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
      setErrors({});
    }
  };

  const handleChange = (
    field: keyof Demand,
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Atalhos de teclado: ESC para cancelar, Ctrl+Enter para salvar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const form = document.querySelector('.new-demand-form') as HTMLFormElement | null;
        if (form) {
          form.requestSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleAddChecklistItem = () => {
    if (!newItemText.trim()) return;

    const newItem = `- [ ] ${newItemText.trim()}`;
    const base = formData.descricao?.trimEnd();
    const updatedDescription = base ? `${base}\n${newItem}` : newItem;

    handleChange('descricao', updatedDescription);
    setNewItemText('');
    setIsAddingItem(false);
  };

  const handleCancelAddItem = () => {
    setNewItemText('');
    setIsAddingItem(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ 
        opacity: isLoading ? 0.3 : 1, 
        pointerEvents: isLoading ? 'none' : 'auto', 
        transition: 'opacity 0.3s', 
        filter: isLoading ? 'blur(2px)' : 'none' 
      }}>
        <form onSubmit={handleSubmit} className="new-demand-form">
      <div className="form-field">
        <label htmlFor="desenvolvedor">
          Desenvolvedor <span className="required">*</span>
        </label>
        <select
          id="desenvolvedor"
          value={formData.desenvolvedor}
          onChange={(e) => handleChange('desenvolvedor', e.target.value)}
          className={errors.desenvolvedor ? 'error' : ''}
        >
          <option value="">Selecione um desenvolvedor</option>
          {devs.map((dev) => (
            <option key={dev} value={dev}>{dev}</option>
          ))}
        </select>
        {errors.desenvolvedor && (
          <span className="error-text">{errors.desenvolvedor}</span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="projeto">
          Projeto <span className="required">*</span>
        </label>
        <select
          id="projeto"
          value={formData.projeto}
          onChange={(e) => handleChange('projeto', e.target.value)}
          className={errors.projeto ? 'error' : ''}
        >
          <option value="">Selecione um projeto</option>
          {projects.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        {errors.projeto && (
          <span className="error-text">{errors.projeto}</span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="descricao">
          Descrição <span className="required">*</span>
        </label>

        {isEditingDescription ? (
          <div className="textarea-container">
            <textarea
              id="descricao"
              placeholder="Descreva a demanda..."
              value={formData.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
              className={errors.descricao ? 'error' : ''}
              rows={5}
            />
            <button
              type="button"
              onClick={() => setIsDescriptionModalOpen(true)}
              className="fullscreen-btn"
              title="Expandir para tela cheia"
            >
              ◰
            </button>
          </div>
        ) : (
          <div
            className="description-viewer"
            onClick={() => setIsEditingDescription(true)}
          >
            <ChecklistDescription
              description={formData.descricao}
              demandId={formData.id}
              onUpdate={(updated) => handleChange('descricao', updated)}
              isExpanded={true}
              showProgressOnly={false}
            />
          </div>
        )}

        <div className="add-item-section">
          {!isAddingItem ? (
            <button
              type="button"
              onClick={() => setIsAddingItem(true)}
              className="btn-add-item"
              title="Adicionar novo item de checklist"
            >
              ➕ Adicionar item
            </button>
          ) : (
            <div className="add-item-form">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Digite o nome do item..."
                className="add-item-input"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    handleCancelAddItem();
                  }
                }}
              />
              <div className="add-item-actions">
                <button
                  type="button"
                  onClick={handleAddChecklistItem}
                  className="btn-confirm-item"
                  title="Adicionar item (Enter)"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={handleCancelAddItem}
                  className="btn-cancel-item"
                  title="Cancelar (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {errors.descricao && (
          <span className="error-text">{errors.descricao}</span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="prioridade">
          Prioridade <span className="required">*</span>
        </label>
        <select
          id="prioridade"
          value={formData.prioridade}
          onChange={(e) => handleChange('prioridade', e.target.value as 'Baixa' | 'Média' | 'Alta' | 'Urgente')}
        >
          {priorities.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="status">
          Status <span className="required">*</span>
        </label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value as 'Pendente' | 'Concluído')}
        >
          <option value="Pendente">Pendente</option>
          <option value="Concluído">Concluído</option>
        </select>
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn-cancel"
        >
          Cancelar
          <span className="keyboard-badge">ESC</span>
        </button>
        <button
          type="submit"
          className="btn-submit"
        >
          Salvar Alterações
          <span className="keyboard-badge">Ctrl+Enter</span>
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
          color: 'var(--color-orange)',
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.9)',
          padding: '2rem 3rem',
          borderRadius: '12px',
          border: '2px solid var(--color-orange)',
          boxShadow: '0 8px 32px rgba(255, 107, 0, 0.4)',
          zIndex: 10
        }}>
          ⏳ Salvando alterações...
        </div>
      )}
      
      <ExpandedDescriptionModal
        isOpen={isDescriptionModalOpen}
        onClose={() => setIsDescriptionModalOpen(false)}
        value={formData.descricao}
        onChange={(value) => handleChange('descricao', value)}
        title="Editar Descrição da Demanda"
        placeholder="Descreva a demanda..."
      />
    </div>
  );
};

export default EditDemandForm;
