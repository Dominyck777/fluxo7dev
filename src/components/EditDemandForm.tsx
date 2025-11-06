import { useState, type FormEvent } from 'react';
import { type Demand } from './DemandCard';
import './NewDemandForm.css';

interface EditDemandFormProps {
  demand: Demand;
  onSubmit: (demand: Demand) => void;
  onCancel: () => void;
  devs: string[];
  projects: string[];
  priorities: string[];
}

const EditDemandForm = ({ demand, onSubmit, onCancel, devs, projects, priorities }: EditDemandFormProps) => {
  const [formData, setFormData] = useState<Demand>(demand);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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

  return (
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
        <div className="description-header">
          <label htmlFor="descricao">
            Descrição <span className="required">*</span>
          </label>
          <button
            type="button"
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            className="expand-btn"
            title={isDescriptionExpanded ? 'Contrair descrição' : 'Expandir descrição'}
          >
            {isDescriptionExpanded ? '📖 Contrair' : '📋 Expandir'}
          </button>
        </div>
        <textarea
          id="descricao"
          placeholder="Descreva a demanda..."
          value={formData.descricao}
          onChange={(e) => handleChange('descricao', e.target.value)}
          className={errors.descricao ? 'error' : ''}
          rows={isDescriptionExpanded ? 15 : 5}
        />
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
        </button>
        <button
          type="submit"
          className="btn-submit"
        >
          Salvar Alterações
        </button>
      </div>
    </form>
  );
};

export default EditDemandForm;
