import { useEffect } from 'react';
import { type Developer } from '../utils/jsonbin-client';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: Developer;
  onLogout: () => void;
  onNavigate: (tab: ActiveTab) => void;
}

type ActiveTab = 'dashboard' | 'financial' | 'satisfaction';

const Sidebar = ({ isOpen, onClose, user, onLogout, onNavigate }: SidebarProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleTabClick = (tab: ActiveTab) => {
    onNavigate(tab);
    onClose(); // Fecha a sidebar após navegar
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="sidebar-overlay" onClick={onClose} />
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">👨‍💻</span>
          </div>
          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Fechar sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            className="sidebar-tab"
            onClick={() => handleTabClick('dashboard')}
          >
            <span className="tab-icon">📊</span>
            <span className="tab-label">Dashboard</span>
          </button>
          
          <button
            className="sidebar-tab"
            onClick={() => handleTabClick('financial')}
          >
            <span className="tab-icon">💰</span>
            <span className="tab-label">Financeiro</span>
          </button>
          
          <button
            className="sidebar-tab"
            onClick={() => handleTabClick('satisfaction')}
          >
            <span className="tab-icon">⭐</span>
            <span className="tab-label">Pesquisa de Satisfação</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-icon">👤</span>
            <div className="user-details">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.role}</span>
            </div>
          </div>
          <button
            className="logout-btn"
            onClick={onLogout}
            title="Sair"
          >
            🚪
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
