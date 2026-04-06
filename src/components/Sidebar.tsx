import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { type Developer } from '../utils/jsonbin-client';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: Developer;
  onLogout: () => void;
  onNavigate: (tab: ActiveTab) => void;
}

type ActiveTab = 'dashboard' | 'financial' | 'clients' | 'satisfaction' | 'profile';

const Sidebar = ({ isOpen, onClose, user, onLogout, onNavigate }: SidebarProps) => {
  const location = useLocation();

  let currentTab: ActiveTab = 'dashboard';
  if (location.pathname.startsWith('/financeiro')) {
    currentTab = 'financial';
  } else if (location.pathname.startsWith('/clientes')) {
    currentTab = 'clients';
  } else if (location.pathname.startsWith('/feedbacks')) {
    currentTab = 'satisfaction';
  } else if (location.pathname.startsWith('/perfil')) {
    currentTab = 'profile';
  } else {
    currentTab = 'dashboard';
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    return () => {
      document.removeEventListener('keydown', handleEscape);
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
          <button
            type="button"
            className="sidebar-logo sidebar-logo-button"
            onClick={() => {
              onNavigate('profile');
              onClose();
            }}
            title="Abrir perfil"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="sidebar-avatar"
              />
            ) : (
              <span className="logo-icon" />
            )}
            <div className="sidebar-user-text">
              <span className="sidebar-user-name">{user.name}</span>
              <span className="sidebar-user-role">{user.role}</span>
            </div>
          </button>
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
            className={`sidebar-tab ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabClick('dashboard')}
          >
            <span className="tab-label">Dashboard</span>
          </button>
          
          <button
            className={`sidebar-tab ${currentTab === 'financial' ? 'active' : ''}`}
            onClick={() => handleTabClick('financial')}
          >
            <span className="tab-label">Financeiro</span>
          </button>

          <button
            className={`sidebar-tab ${currentTab === 'clients' ? 'active' : ''}`}
            onClick={() => handleTabClick('clients')}
          >
            <span className="tab-label">Clientes</span>
          </button>
          
          <button
            className={`sidebar-tab ${currentTab === 'satisfaction' ? 'active' : ''}`}
            onClick={() => handleTabClick('satisfaction')}
          >
            <span className="tab-label">Feedbacks</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button
            className="logout-btn"
            onClick={onLogout}
            aria-label="Sair"
            title="Sair"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
