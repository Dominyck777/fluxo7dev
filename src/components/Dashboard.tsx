import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DemandCard, { type Demand } from './DemandCard';
import Modal from './Modal';
import NewDemandForm from './NewDemandForm';
import EditDemandForm from './EditDemandForm';
import ConfirmDialog from './ConfirmDialog';
import Loading from './Loading';
import { jsonbinClient, type Developer } from '../utils/jsonbin-client';
import './Dashboard.css';

interface DashboardProps {
  onLogout: () => void;
  currentUser: Developer;
  onOpenSidebar?: () => void;
}
const Dashboard = ({ onLogout, currentUser, onOpenSidebar }: DashboardProps) => {
  const navigate = useNavigate();
  const [selectedDev, setSelectedDev] = useState<string>(currentUser.name);
  const [selectedProject, setSelectedProject] = useState<string>('Todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');
  const [selectedPriority, setSelectedPriority] = useState<string>('Todas');
  const [searchDescription, setSearchDescription] = useState<string>('');
  const [demands, setDemands] = useState<Demand[]>([]);
  const [devs, setDevs] = useState<string[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDemand, setEditingDemand] = useState<Demand | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [completingId, setCompletingId] = useState<string | number | null>(null);

  // Load devs, projects, demands from preloaded data or API
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Tentar usar dados pré-carregados primeiro
        const preloadedConfig = localStorage.getItem('preloaded_config');
        const preloadedDemands = localStorage.getItem('preloaded_demands');
        
        if (preloadedConfig && preloadedDemands) {
          // Usar dados pré-carregados (carregamento instantâneo)
          const config = JSON.parse(preloadedConfig);
          const demands = JSON.parse(preloadedDemands);
          
          if (!mounted) return;
          setDevs(config.devs || []);
          setProjects(config.projects || []);
          setPriorities(config.priorities || []);
          setDemands(demands);
          setSelectedDev(currentUser.name);
          setIsLoading(false);
          
          // Limpar dados pré-carregados após uso
          localStorage.removeItem('preloaded_config');
          localStorage.removeItem('preloaded_demands');
        } else {
          // Fallback: carregar da API se não houver dados pré-carregados
          // Isso só acontece quando o usuário atualiza a página
          const [config, demands] = await Promise.all([
            jsonbinClient.getConfig(),
            jsonbinClient.getDemands(),
          ]);
          if (!mounted) return;
          setDevs(config.devs || []);
          setProjects(config.projects || []);
          setPriorities(config.priorities || []);
          setDemands(demands);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [currentUser]);

  // (Removido) Persistência via localStorage substituída pela API

  // Sort demands: Pendentes first (by priority), then Concluídas at the end
  const priorityOrder = { 'Urgente': 0, 'Alta': 1, 'Média': 2, 'Baixa': 3 };
  const sortedDemands = [...demands].sort((a, b) => {
    // First, separate by status: Pendente comes before Concluído
    if (a.status !== b.status) {
      return a.status === 'Pendente' ? -1 : 1;
    }
    
    // Within same status, sort by priority
    const priorityDiff = priorityOrder[a.prioridade] - priorityOrder[b.prioridade];
    if (priorityDiff !== 0) return priorityDiff;
    
    // If same priority, sort by date (most recent first)
    const dateA = a.dataCriacao ? new Date(a.dataCriacao).getTime() : 0;
    const dateB = b.dataCriacao ? new Date(b.dataCriacao).getTime() : 0;
    return dateB - dateA;
  });

  const filteredDemands = sortedDemands.filter(demand => {
    const matchesDev = selectedDev === 'Todos' || demand.desenvolvedor === selectedDev;
    const matchesProject = selectedProject === 'Todos' || demand.projeto === selectedProject;
    const matchesStatus = selectedStatus === 'Todos' || demand.status === selectedStatus;
    const matchesPriority = selectedPriority === 'Todas' || demand.prioridade === selectedPriority;
    const matchesDescription = searchDescription === '' || demand.descricao.toLowerCase().includes(searchDescription.toLowerCase());
    return matchesDev && matchesProject && matchesStatus && matchesPriority && matchesDescription;
  });

  // Separate pending and completed demands
  const pendingDemands = filteredDemands.filter(d => d.status === 'Pendente');
  const completedDemands = filteredDemands.filter(d => d.status === 'Concluído');

  // Calculate stats based on filtered demands (all filters applied)
  const demandsForStats = demands.filter(demand => {
    const matchesDev = selectedDev === 'Todos' || demand.desenvolvedor === selectedDev;
    const matchesProject = selectedProject === 'Todos' || demand.projeto === selectedProject;
    const matchesStatus = selectedStatus === 'Todos' || demand.status === selectedStatus;
    const matchesPriority = selectedPriority === 'Todas' || demand.prioridade === selectedPriority;
    const matchesDescription = searchDescription === '' || demand.descricao.toLowerCase().includes(searchDescription.toLowerCase());
    return matchesDev && matchesProject && matchesStatus && matchesPriority && matchesDescription;
  });

  // Count demands by status (from filtered demands)
  const statusCounts = {
    total: demandsForStats.length,
    pendente: demandsForStats.filter(d => d.status === 'Pendente').length,
    concluido: demandsForStats.filter(d => d.status === 'Concluído').length
  };
  
  // Calculate completion rate based on filtered demands
  const completionRate = demandsForStats.length > 0 
    ? Math.round((statusCounts.concluido / demandsForStats.length) * 100) 
    : 0;

  const isConfigLoading = !devs.length || !projects.length || !priorities.length;

  // Marca todos os itens de checklist da descrição como concluídos (- [x])
  const markAllChecklistDone = (description: string): string => {
    if (!description) return '';
    // Substitui qualquer "- [ ]" ou "- [x]" (maiúsculo/minúsculo) por "- [x]"
    return description.replace(/-\s*\[(?:x|X|\s)\]/g, '- [x]');
  };

  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const refreshDemands = async () => {
    setIsLoading(true);
    try {
      const demandsData = await jsonbinClient.getDemands();
      setDemands(demandsData);
    } catch (error) {
      console.error('Erro ao atualizar demandas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDemand = async (newDemand: Omit<Demand, 'id'>) => {
    setIsCreating(true);
    try {
      const payload = { ...newDemand, dataCriacao: new Date().toISOString() };
      const created = await jsonbinClient.createDemand(payload);
      setDemands(prev => [created, ...prev]);
      setIsModalOpen(false);
      showSuccessNotification('Demanda criada com sucesso!');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditDemand = (demand: Demand) => {
    setEditingDemand(demand);
    setIsEditModalOpen(true);
  };

  const handleUpdateDemand = async (updatedDemand: Demand) => {
    setIsEditing(true);
    try {
      const saved = await jsonbinClient.updateDemand(updatedDemand);
      setDemands(prev => prev.map(d => d.id === saved.id ? saved : d));
      setIsEditModalOpen(false);
      setEditingDemand(null);
      showSuccessNotification('Demanda atualizada com sucesso!');
    } finally {
      setIsEditing(false);
    }
  };

  // Função específica para atualizar descrição (checkboxes) sem loading states
  const handleUpdateDescription = async (updatedDemand: Demand) => {
    try {
      const saved = await jsonbinClient.updateDemand(updatedDemand);
      setDemands(prev => prev.map(d => d.id === saved.id ? saved : d));
    } catch (error) {
      console.error('Erro ao atualizar descrição:', error);
    }
  };

  const handleCompleteDemand = async (updatedDemand: Demand) => {
    setCompletingId(updatedDemand.id);
    try {
      const descricaoMarcada = markAllChecklistDone(updatedDemand.descricao);
      const payload: Demand = { ...updatedDemand, descricao: descricaoMarcada };
      const saved = await jsonbinClient.updateDemand(payload);
      setDemands(prev => prev.map(d => d.id === saved.id ? saved : d));
      showSuccessNotification('Demanda concluída com sucesso!');
    } finally {
      setCompletingId(null);
    }
  };

  const handleDeleteDemand = (id: string | number) => {
    setConfirmDelete(id);
  };

  const confirmDeleteDemand = async () => {
    if (confirmDelete) {
      setIsDeleting(true);
      try {
        await jsonbinClient.deleteDemand(confirmDelete);
        setDemands(prev => prev.filter(d => d.id !== confirmDelete));
        setConfirmDelete(null);
        showSuccessNotification('Demanda excluída com sucesso!');
      } finally {
        setIsDeleting(false);
      }
    }
  };
  return (
    <div className="dashboard">
      <header className="dashboard-header" role="banner">
        <div className="header-content">
          <span 
            className={`header-icon ${onOpenSidebar ? 'clickable' : ''}`} 
            onClick={onOpenSidebar}
            title={onOpenSidebar ? 'Abrir menu' : ''}
            style={{ cursor: onOpenSidebar ? 'pointer' : 'default' }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="#f05902" strokeWidth="2"/>
              <path d="M8 8L10 10L8 12" stroke="#ffaa33" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12H16" stroke="#91b0b0" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="18" cy="18" r="4" fill="#1a1a1a" stroke="#f05902" strokeWidth="1.5"/>
              <path d="M18 16V20M16 18H20" stroke="#ffaa33" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </span>
          <h1 className="header-logo">
            <span className="logo-fluxo">Fluxo</span>
            <span className="logo-7">7</span>
            <span className="logo-dev"> Dev</span>
          </h1>
          <div className="header-user-section">
            <div className="user-info">
              <span className="user-name">Olá, {currentUser.name}</span>
            </div>
            <button 
              onClick={onLogout} 
              className="logout-button"
              aria-label="Sair do sistema"
            >
              🚪 Sair
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main" role="main">
        <div className="dashboard-content">
          <div className="content-header">
            {/* Status Counters */}
            <div className="summary-cards">
              {isLoading ? (
                // Skeleton loading para os cards
                <>
                  <div className="summary-card skeleton-card">
                    <div className="skeleton-icon"></div>
                    <div className="card-content">
                      <div className="skeleton-text skeleton-title"></div>
                      <div className="skeleton-text skeleton-number"></div>
                    </div>
                  </div>
                  <div className="summary-card skeleton-card">
                    <div className="skeleton-icon"></div>
                    <div className="card-content">
                      <div className="skeleton-text skeleton-title"></div>
                      <div className="skeleton-text skeleton-number"></div>
                    </div>
                  </div>
                  <div className="summary-card skeleton-card">
                    <div className="skeleton-icon"></div>
                    <div className="card-content">
                      <div className="skeleton-text skeleton-title"></div>
                      <div className="skeleton-text skeleton-number"></div>
                    </div>
                  </div>
                </>
              ) : (
                // Cards normais com dados
                <>
                  <div className="summary-card card-completion">
                    <div className="card-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="card-content">
                      <h3>Taxa de Conclusão</h3>
                      <div className="card-number">{completionRate}%</div>
                    </div>
                  </div>
                  
                  <div className="summary-card card-pending">
                    <div className="card-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="card-content">
                      <h3>Pendentes</h3>
                      <div className="card-number">{statusCounts.pendente}</div>
                    </div>
                  </div>
                  
                  <div className="summary-card card-completed">
                    <div className="card-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="card-content">
                      <h3>Concluídas</h3>
                      <div className="card-number">{statusCounts.concluido}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="controls">
              <div className="filters">
                <div className="filter-group">
                  <label htmlFor="dev-filter">Desenvolvedor:</label>
                  <select
                    id="dev-filter"
                    value={selectedDev}
                    onChange={(e) => setSelectedDev(e.target.value)}
                    className="dev-filter"
                    disabled={isConfigLoading}
                  >
                    {isConfigLoading ? (
                      <option value={selectedDev}>Carregando...</option>
                    ) : (
                      <>
                        <option value="Todos">Todos</option>
                        {devs.map((dev) => (
                          <option key={dev} value={dev}>
                            {dev}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="project-filter">Projeto:</label>
                  <select
                    id="project-filter"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="project-filter"
                    disabled={isConfigLoading}
                  >
                    {isConfigLoading ? (
                      <option value={selectedProject}>Carregando...</option>
                    ) : (
                      <>
                        <option value="Todos">Todos</option>
                        {projects.map((project) => (
                          <option key={project} value={project}>{project}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
                
                <div className="filter-group">
                  <label htmlFor="status-filter">Status:</label>
                  <select
                    id="status-filter"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="status-filter"
                  >
                    <option value="Todos">Todos</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label htmlFor="priority-filter">Prioridade:</label>
                  <select
                    id="priority-filter"
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="priority-filter"
                    disabled={isConfigLoading}
                  >
                    {isConfigLoading ? (
                      <option value={selectedPriority}>Carregando...</option>
                    ) : (
                      <>
                        <option value="Todas">Todas</option>
                        {priorities && priorities.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>
              
              <button 
                className="new-demand-button"
                onClick={() => setIsModalOpen(true)}
                aria-label="Criar nova demanda"
              >
                Nova Demanda +
              </button>
            </div>
          </div>

          {/* Demandas Pendentes */}
          {(selectedStatus === 'Todos' || selectedStatus === 'Pendente') && (
            <div className="demands-section">
              <div className="section-header">
                <h3 className="section-title">Demandas Pendentes</h3>
                <button
                  className="refresh-button"
                  onClick={refreshDemands}
                  aria-label="Atualizar demandas"
                  title="Atualizar lista de demandas"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 4v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div className="search-container">
                <div className="filter-group">
                  <label htmlFor="search-description">Buscar:</label>
                  <input
                    type="text"
                    id="search-description"
                    value={searchDescription}
                    onChange={(e) => setSearchDescription(e.target.value)}
                    placeholder="Digite para buscar na descrição..."
                    className="search-input"
                  />
                </div>
              </div>
              <div className="demands-grid">
                {isLoading ? (
                  // Skeleton cards para demandas
                  <>
                    <div className="demand-skeleton">
                      <div className="skeleton-header">
                        <div className="skeleton-text skeleton-title-large"></div>
                        <div className="skeleton-actions"></div>
                      </div>
                      <div className="skeleton-body">
                        <div className="skeleton-text skeleton-line"></div>
                        <div className="skeleton-text skeleton-line"></div>
                        <div className="skeleton-text skeleton-line-short"></div>
                      </div>
                      <div className="skeleton-footer">
                        <div className="skeleton-text skeleton-tag"></div>
                        <div className="skeleton-text skeleton-date"></div>
                      </div>
                    </div>
                    <div className="demand-skeleton">
                      <div className="skeleton-header">
                        <div className="skeleton-text skeleton-title-large"></div>
                        <div className="skeleton-actions"></div>
                      </div>
                      <div className="skeleton-body">
                        <div className="skeleton-text skeleton-line"></div>
                        <div className="skeleton-text skeleton-line"></div>
                        <div className="skeleton-text skeleton-line-short"></div>
                      </div>
                      <div className="skeleton-footer">
                        <div className="skeleton-text skeleton-tag"></div>
                        <div className="skeleton-text skeleton-date"></div>
                      </div>
                    </div>
                    <div className="demand-skeleton">
                      <div className="skeleton-header">
                        <div className="skeleton-text skeleton-title-large"></div>
                        <div className="skeleton-actions"></div>
                      </div>
                      <div className="skeleton-body">
                        <div className="skeleton-text skeleton-line"></div>
                        <div className="skeleton-text skeleton-line"></div>
                        <div className="skeleton-text skeleton-line-short"></div>
                      </div>
                      <div className="skeleton-footer">
                        <div className="skeleton-text skeleton-tag"></div>
                        <div className="skeleton-text skeleton-date"></div>
                      </div>
                    </div>
                  </>
                ) : pendingDemands.length > 0 ? (
                  pendingDemands.map(demand => (
                    <DemandCard 
                      key={demand.id} 
                      demand={demand}
                      onEdit={handleEditDemand}
                      onDelete={handleDeleteDemand}
                      onComplete={handleCompleteDemand}
                      onUpdate={handleUpdateDescription}
                      isCompleting={completingId === demand.id}
                    />
                  ))
                ) : (
                  <div className="empty-state">
                    <p>Nenhuma demanda pendente</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Demandas Concluídas */}
          {completedDemands.length > 0 && (
            <div className="demands-section completed-section">
              <div className="section-header">
                <h3 className="section-title">Demandas Concluídas ({completedDemands.length})</h3>
                <button
                  className="refresh-button"
                  onClick={refreshDemands}
                  aria-label="Atualizar demandas"
                  title="Atualizar lista de demandas"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 4v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div className="demands-grid">
                {completedDemands.map(demand => (
                  <DemandCard 
                    key={demand.id} 
                    demand={demand}
                    onEdit={handleEditDemand}
                    onDelete={handleDeleteDemand}
                    onComplete={handleCompleteDemand}
                    onUpdate={handleUpdateDescription}
                    isCompleting={completingId === demand.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Nova Demanda */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova Demanda"
      >
        {!devs || !projects || !priorities || devs.length === 0 || projects.length === 0 || priorities.length === 0 ? (
          <Loading message="Carregando formulário..." />
        ) : (
          <div style={{ position: 'relative' }}>
            <div style={{ opacity: isCreating ? 0.3 : 1, pointerEvents: isCreating ? 'none' : 'auto', transition: 'opacity 0.3s', filter: isCreating ? 'blur(2px)' : 'none' }}>
              <NewDemandForm
                onSubmit={handleCreateDemand}
                onCancel={() => setIsModalOpen(false)}
                devs={devs}
                projects={projects}
                priorities={priorities}
                defaultDeveloper={currentUser.name}
              />
            </div>
            {isCreating && (
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--color-orange)',
                textAlign: 'center',
                background: 'rgba(0, 0, 0, 0.9)',
                padding: '2rem 3rem',
                borderRadius: '12px',
                border: '2px solid var(--color-orange)',
                boxShadow: '0 8px 32px rgba(255, 107, 0, 0.4)',
                zIndex: 10
              }}>
                ⏳ Criando demanda...
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal de Editar Demanda */}
      {editingDemand && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingDemand(null);
          }}
          title="Editar Demanda"
        >
          <EditDemandForm
            demand={editingDemand}
            onSubmit={handleUpdateDemand}
            onCancel={() => {
              setIsEditModalOpen(false);
              setEditingDemand(null);
            }}
            devs={devs}
            projects={projects}
            priorities={priorities}
            isLoading={isEditing}
          />
        </Modal>
      )}

      {/* Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title="Excluir Demanda"
        message="Tem certeza que deseja excluir esta demanda? Esta ação não pode ser desfeita."
        onConfirm={confirmDeleteDemand}
        onCancel={() => setConfirmDelete(null)}
        isLoading={isDeleting}
      />

      {/* Mensagem de Sucesso */}
      {showSuccess && (
        <div className="success-notification">
          ✓ {successMessage}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
