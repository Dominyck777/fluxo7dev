import React from 'react';
import './DeleteConfirmationModal.css';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName
}) => {
  if (!isOpen) return null;

  // Função para lidar com a tecla Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div className="delete-modal" onClick={e => e.stopPropagation()}>
        <div className="delete-modal-header">
          <h3>Confirmar Exclusão</h3>
          <button 
            className="close-button" 
            onClick={onClose}
            aria-label="Fechar"
          >
            &times;
          </button>
        </div>
        <div className="delete-modal-body">
          <p>Tem certeza que deseja excluir o feedback de <strong>{itemName}</strong>?</p>
          <p className="delete-warning">Esta ação não pode ser desfeita.</p>
        </div>
        <div className="delete-modal-footer">
          <button 
            className="cancel-button" 
            onClick={onClose}
            autoFocus
          >
            Cancelar
          </button>
          <button 
            className="confirm-delete-button" 
            onClick={handleConfirm}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
