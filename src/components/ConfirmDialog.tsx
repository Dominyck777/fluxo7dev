import './ConfirmDialog.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, isLoading = false }: ConfirmDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay" onClick={isLoading ? undefined : onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
        <div style={{ 
          opacity: isLoading ? 0.3 : 1, 
          pointerEvents: isLoading ? 'none' : 'auto', 
          transition: 'opacity 0.3s', 
          filter: isLoading ? 'blur(2px)' : 'none' 
        }}>
          <h3 className="confirm-title">{title}</h3>
          <p className="confirm-message">{message}</p>
          <div className="confirm-actions">
            <button onClick={onCancel} className="btn-cancel-confirm">
              Cancelar
            </button>
            <button onClick={onConfirm} className="btn-confirm-delete">
              Excluir
            </button>
          </div>
        </div>
        {isLoading && (
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            fontSize: '1.2rem',
            fontWeight: 700,
            color: '#dc2626',
            textAlign: 'center',
            background: 'rgba(0, 0, 0, 0.9)',
            padding: '1.5rem 2.5rem',
            borderRadius: '8px',
            border: '2px solid #dc2626',
            boxShadow: '0 8px 32px rgba(220, 38, 38, 0.4)',
            zIndex: 10
          }}>
            ⏳ Excluindo...
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmDialog;
