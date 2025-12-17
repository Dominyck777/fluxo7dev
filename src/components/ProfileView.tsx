import { useEffect, useState } from 'react';
import './ProfileView.css';
import type { Developer } from '../utils/jsonbin-client';
import type { Demand } from './DemandCard';
import { supabaseDemands } from '../utils/supabase-demands';
import { supabaseDevs } from '../utils/supabase-devs';
import Modal from './Modal';

interface ProfileViewProps {
  currentUser: Developer;
  onOpenSidebar?: () => void;
  onLogout: () => void;
  onUpdateUser: (user: Developer) => void;
}

const ProfileView = ({ currentUser, onOpenSidebar, onLogout, onUpdateUser }: ProfileViewProps) => {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editedName, setEditedName] = useState(currentUser.name);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await supabaseDemands.getDemands();
        if (!mounted) return;
        setDemands(data);
      } catch (error) {
        console.error('[ProfileView] Erro ao carregar demandas para relatório:', error);
      } finally {
        if (mounted) {
          setIsLoadingStats(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const totalDemands = demands.length;
  const completedDemands = demands.filter(d => d.status === 'Concluído').length;
  const pendingDemands = demands.filter(d => d.status === 'Pendente').length;

  const mostActiveDay = (() => {
    if (demands.length === 0) return null;

    const counts: Record<string, number> = {};

    for (const d of demands) {
      if (!d.dataCriacao) continue;
      const day = new Date(d.dataCriacao).toLocaleDateString('pt-BR');
      counts[day] = (counts[day] || 0) + 1;
    }

    const entries = Object.entries(counts);
    if (entries.length === 0) return null;

    entries.sort((a, b) => b[1] - a[1]);
    const [day, count] = entries[0];
    return { day, count };
  })();

  return (
    <div className="dashboard profile-view">
      <header className="dashboard-header" role="banner">
        <div className="header-content">
          <span
            className={`header-icon ${onOpenSidebar ? 'clickable' : ''}`}
            onClick={onOpenSidebar}
            title={onOpenSidebar ? 'Abrir menu' : ''}
            style={{ cursor: onOpenSidebar ? 'pointer' : 'default' }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="#f05902" strokeWidth="2" />
              <path d="M8 8L10 10L8 12" stroke="#ffaa33" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 12H16" stroke="#91b0b0" strokeWidth="2" strokeLinecap="round" />
              <circle cx="18" cy="18" r="4" fill="#1a1a1a" stroke="#f05902" strokeWidth="1.5" />
              <path d="M18 16V20M16 18H20" stroke="#ffaa33" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>

          <h1 className="header-logo">
            <span className="logo-fluxo">Fluxo</span>
            <span className="logo-7">7</span>
            <span className="logo-dev"> Dev</span>
          </h1>

          <div className="header-user-section">
            <div className="user-info">
              <span className="user-name">Perfil: {currentUser.name}</span>
            </div>
            <button
              className="logout-button"
              onClick={onLogout}
              title="Sair do sistema"
            >
              🚪 Sair
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="profile-section">
          <div className="profile-header-main">
            <div className="profile-avatar-wrapper">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="sidebar-avatar"
                />
              ) : (
                <div className="profile-avatar-placeholder">👨‍💻</div>
              )}
            </div>
            <h2 className="profile-name">{currentUser.name}</h2>
          </div>

          <div className="profile-content">
            <div className="profile-card">
              <h3>Relatório de Demandas</h3>
              {isLoadingStats ? (
                <p className="profile-status">Carregando estatísticas...</p>
              ) : (
                <div className="profile-info">
                  <p className="profile-role">Total de demandas: {totalDemands}</p>
                  <p className="profile-status">Concluídas: {completedDemands}</p>
                  <p className="profile-status">Pendentes: {pendingDemands}</p>
                  <p className="profile-status">
                    Dia mais ativo:{' '}
                    {mostActiveDay
                      ? `${mostActiveDay.day} (${mostActiveDay.count} demanda${mostActiveDay.count > 1 ? 's' : ''})`
                      : '—'}
                  </p>
                </div>
              )}
            </div>

            <div className="profile-card">
              <h3>Patch Notes</h3>
              <p className="profile-patch-note">
                Houve uma atualização recente no Fluxo7 Dev. Caso algo pareça estranho, deslogue e entre novamente
                para garantir que você está usando a versão mais recente da aplicação.
              </p>
            </div>

            <div className="profile-card">
              <h3>Configurações de Perfil</h3>
              <button
                type="button"
                className="profile-edit-button"
                onClick={() => {
                  setEditedName(currentUser.name);
                  setIsEditProfileOpen(true);
                }}
              >
                Editar perfil
              </button>
            </div>
          </div>
        </section>
      </main>

      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title="Editar Perfil"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const trimmed = editedName.trim();
            if (!trimmed) {
              return;
            }

            let updatedUser: Developer = { ...currentUser, name: trimmed };

            // Atualiza nome no Supabase
            try {
              await supabaseDevs.updateDeveloperName(currentUser.id, trimmed);
            } catch (error) {
              console.error('[ProfileView] Erro ao atualizar nome no Supabase:', error);
            }

            // Se um arquivo de avatar foi selecionado, faz upload para o bucket e atualiza a URL
            if (avatarFile) {
              try {
                const avatarUrl = await supabaseDevs.uploadAvatar(currentUser.id, avatarFile);
                if (avatarUrl) {
                  updatedUser = { ...updatedUser, avatar: avatarUrl };
                }
              } catch (error) {
                console.error('[ProfileView] Erro ao atualizar avatar no Supabase:', error);
              }
            }

            onUpdateUser(updatedUser);
            setAvatarFile(null);
            setIsEditProfileOpen(false);
          }}
          className="profile-edit-form"
        >
          <div className="profile-edit-field">
            <label htmlFor="profile-name">Nome</label>
            <input
              id="profile-name"
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
            />
          </div>
          <div className="profile-edit-field">
            <label htmlFor="profile-avatar">Avatar (opcional)</label>
            <input
              id="profile-avatar"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setAvatarFile(file);
              }}
            />
          </div>
          <p className="profile-edit-note">
            Em breve novas opções de personalização vão ser aplicadas aqui (avatar, tema, notificações e muito mais).
          </p>
          <div className="profile-edit-actions">
            <button type="button" onClick={() => setIsEditProfileOpen(false)}>
              Cancelar
            </button>
            <button type="submit">
              Salvar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProfileView;
