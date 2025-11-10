import { useState, useEffect, type FormEvent } from 'react';
import { type Demand } from './DemandCard';
import ExpandedDescriptionModal from './ExpandedDescriptionModal';
import './NewDemandForm.css';

interface NewDemandFormProps {
  onSubmit: (demand: Omit<Demand, 'id'>) => void;
  onCancel: () => void;
  devs: string[];
  projects: string[];
  priorities: string[];
  defaultDeveloper?: string;
}

const NewDemandForm = ({ onSubmit, onCancel, devs, projects, priorities, defaultDeveloper }: NewDemandFormProps) => {
  const [formData, setFormData] = useState({
    desenvolvedor: defaultDeveloper || devs[0] || '',
    projeto: projects[0] || '',
    descricao: '',
    status: 'Pendente' as const,
    prioridade: 'Média' as const
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);

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
      // Reset form
      setFormData({
        desenvolvedor: defaultDeveloper || devs[0] || '',
        projeto: projects[0] || '',
        descricao: '',
        status: 'Pendente',
        prioridade: 'Média'
      });
      setErrors({});
    }
  };

  const handleChange = (
    field: string,
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
      // Ctrl+Enter or Cmd+Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const form = document.querySelector('.new-demand-form') as HTMLFormElement;
        if (form) {
          form.requestSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <>
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
        <div className="textarea-container">
          <textarea
            id="descricao"
            value={formData.descricao}
            onChange={(e) => handleChange('descricao', e.target.value)}
            placeholder="Descreva a demanda..."
            className={errors.descricao ? 'error' : ''}
            autoFocus
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
          Criar Demanda
          <span className="keyboard-badge">Ctrl+Enter</span>
        </button>
      </div>
    </form>
    
    <ExpandedDescriptionModal
      isOpen={isDescriptionModalOpen}
      onClose={() => setIsDescriptionModalOpen(false)}
      value={formData.descricao}
      onChange={(value) => handleChange('descricao', value)}
      title="Nova Descrição da Demanda"
      placeholder="Descreva a demanda..."
    />
    </>
  );
};

export default NewDemandForm;
