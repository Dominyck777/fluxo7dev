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
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemText, setNewItemText] = useState('');

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

  const handleAddItem = () => {
    if (newItemText.trim()) {
      const newItem = `- [ ] ${newItemText.trim()}`;
      const updatedValue = localValue ? `${localValue}\n${newItem}` : newItem;
      setLocalValue(updatedValue);
      setNewItemText('');
      setIsAddingItem(false);
    }
  };

  const handleCancelAddItem = () => {
    setNewItemText('');
    setIsAddingItem(false);
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
          
          {/* Seção para adicionar novos itens de checklist */}
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
                      handleAddItem();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      handleCancelAddItem();
                    }
                  }}
                />
                <div className="add-item-actions">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="btn-confirm-item"
                    title="Adicionar item (Enter)"
                  >
                    <img className="check-icon-img" src="/check-icon.png" alt="Confirmar" />
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
              <img className="check-icon-img" src="/check-icon.png" alt="Salvar" /> Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpandedDescriptionModal;
