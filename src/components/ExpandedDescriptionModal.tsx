import { useState, useEffect } from 'react';
import './ExpandedDescriptionModal.css';

interface ExpandedDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  title?: string;
}

const ExpandedDescriptionModal = ({ 
  isOpen, 
  onClose, 
  value, 
  onChange, 
  placeholder = "Descreva a demanda...",
  title = "Descrição da Demanda"
}: ExpandedDescriptionModalProps) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleClose = () => {
    onChange(localValue);
    onClose();
  };

  const handleSave = () => {
    onChange(localValue);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="expanded-modal-overlay" onClick={handleClose}>
      <div className="expanded-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="expanded-modal-header">
          <h2 className="expanded-modal-title">📝 {title}</h2>
          <button
            className="expanded-modal-close"
            onClick={handleClose}
            aria-label="Fechar modal"
            title="Fechar (Esc)"
          >
            ✕
          </button>
        </div>
        
        <div className="expanded-modal-body">
          <textarea
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            placeholder={placeholder}
            className="expanded-textarea"
            autoFocus
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
          />
        </div>
        
        <div className="expanded-modal-footer">
          <div className="expanded-stats">
            <span>{localValue.length} caracteres</span>
            <span>{localValue.split('\n').length} linhas</span>
          </div>
          <div className="expanded-actions">
            <button
              type="button"
              onClick={handleSave}
              className="btn-save-expanded"
              title="Salvar e fechar (Ctrl+Enter)"
            >
              ✓ Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpandedDescriptionModal;
