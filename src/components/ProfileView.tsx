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
  const [isDemandsChartOpen, setIsDemandsChartOpen] = useState(false); // controla modal de demandas

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

  // Filtra demandas apenas do usuário logado
  const userDemands = demands.filter(d => d.desenvolvedor === currentUser.name);

  const totalDemands = userDemands.length;
  const completedDemands = userDemands.filter(d => d.status === 'Concluído').length;
  const pendingDemands = userDemands.filter(d => d.status === 'Pendente').length;

  // Estatísticas por dia para gráfico (dia x quantidade)
  const dailyDemandStats = (() => {
    if (userDemands.length === 0) return [] as { day: string; count: number; sortValue: number }[];

    // Função auxiliar para obter o início da semana (segunda-feira) de uma data
    const getWeekStart = (date: Date) => {
      const d = new Date(date);
      const day = d.getDay(); // 0 = domingo, 1 = segunda, ...
      const diff = day === 0 ? -6 : 1 - day; // ajusta para segunda-feira
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const counts: Record<string, { label: string; count: number; sortValue: number }> = {};

    for (const d of userDemands) {
      if (!d.dataCriacao) continue;
      const originalDate = new Date(d.dataCriacao);
      if (Number.isNaN(originalDate.getTime())) continue;

      const weekStart = getWeekStart(originalDate);
      const key = weekStart.toISOString();
      const label = weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const sortValue = weekStart.getTime();

      if (!counts[key]) {
        counts[key] = { label, count: 0, sortValue };
      }
      counts[key].count += 1;
    }

    return Object.values(counts)
      .map(({ label, count, sortValue }) => ({ day: label, count, sortValue }))
      // Ordena por início da semana (mais antigo para mais recente)
      .sort((a, b) => a.sortValue - b.sortValue);
  })();

  // Dados preparados para o gráfico 2D (linha + área) em SVG
  const demandsChartData = (() => {
    if (dailyDemandStats.length === 0) return null;

    const maxCount = Math.max(...dailyDemandStats.map((s) => s.count));
    if (maxCount <= 0) return null;

    // Usa o intervalo real de tempo (início da semana) para distribuir os pontos no eixo X
    const firstTime = dailyDemandStats[0].sortValue;
    const lastTime = dailyDemandStats[dailyDemandStats.length - 1].sortValue;
    const timeRange = Math.max(1, lastTime - firstTime);

    const linePoints = dailyDemandStats
      .map((stat) => {
        const x = ((stat.sortValue - firstTime) / timeRange) * 100;
        const y = 100 - (stat.count / maxCount) * 80; // deixa margem no topo
        return `${x},${y}`;
      })
      .join(' ');

    const areaPoints = `0,100 ${linePoints} 100,100`;

    return {
      linePoints,
      areaPoints,
      maxCount,
    };
  })();

  // Largura relativa do gráfico detalhado no modal, baseada na quantidade de dias
  const modalChartWidthPercent = Math.max(100, dailyDemandStats.length * 14);

  const mostActiveDay = (() => {
    if (dailyDemandStats.length === 0) return null;

    // Dia mais ativo é o que tem maior contagem
    const sortedByCount = [...dailyDemandStats].sort((a, b) => b.count - a.count);
    const top = sortedByCount[0];
    return { day: top.day, count: top.count };
  })();

  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'orange');

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
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="var(--color-logo-fluxo)" strokeWidth="2" />
              <path d="M8 8L10 10L8 12" stroke="var(--color-logo-7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 12H16" stroke="#91b0b0" strokeWidth="2" strokeLinecap="round" />
              <circle cx="18" cy="18" r="4" fill="#1a1a1a" stroke="var(--color-logo-fluxo)" strokeWidth="1.5" />
              <path d="M18 16V20M16 18H20" stroke="var(--color-logo-7)" strokeWidth="1.5" strokeLinecap="round" />
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
              type="button"
              className="theme-toggle-header"
              title="Alternar Tema"
              onClick={() => {
                const newTheme = theme === 'orange' ? 'blue' : 'orange';
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('fluxo7dev_theme', newTheme);
                setTheme(newTheme);
              }}
            >
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{ 
                  transform: theme === 'blue' ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <path d="M17 2l4 4-4 4" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 11V9a4 4 0 0 1 4-4h14" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 22l-4-4 4-4" stroke="#1E90FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 13v2a4 4 0 0 1-4 4H3" stroke="#1E90FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              className="logout-button"
              onClick={onLogout}
              aria-label="Sair do sistema"
              title="Sair do sistema"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
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
              ) : !demandsChartData ? (
                <p className="profile-status">Você ainda não possui demandas cadastradas.</p>
              ) : (
                <button
                  type="button"
                  className="profile-demands-chart-main"
                  onClick={() => setIsDemandsChartOpen(true)}
                >
                  <span className="profile-demands-chart-hint">
                    Gráfico de demandas por dia (clique para ver detalhes)
                  </span>
                  <div className="profile-demands-chart-preview">
                    <svg
                      className="profile-demands-svg"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      <polygon
                        className="profile-demands-area"
                        points={demandsChartData.areaPoints}
                      />
                      <polyline
                        className="profile-demands-line"
                        points={demandsChartData.linePoints}
                      />
                    </svg>
                  </div>
                </button>
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
      <Modal
        isOpen={isDemandsChartOpen}
        onClose={() => setIsDemandsChartOpen(false)}
        title="Relatório de Demandas"
      >
        {isLoadingStats ? (
          <p className="profile-status">Carregando estatísticas...</p>
        ) : (
          <div className="profile-demands-modal-content">
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
            {demandsChartData && (
              <div className="profile-demands-chart-expanded">
                <div className="profile-demands-chart-scroll">
                  <svg
                    className="profile-demands-svg large"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    style={{ width: `${modalChartWidthPercent}%` }}
                  >
                    <polygon
                      className="profile-demands-area"
                      points={demandsChartData.areaPoints}
                    />
                    <polyline
                      className="profile-demands-line"
                      points={demandsChartData.linePoints}
                    />
                  </svg>
                </div>
                <div className="profile-demands-x-labels modal">
                  {dailyDemandStats.map((stat) => (
                    <div key={stat.day} className="profile-demands-x-item">
                      <span className="profile-demands-count-label">{stat.count}</span>
                      <span className="profile-demands-day-label">{stat.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProfileView;
