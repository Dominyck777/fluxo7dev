import { useState, useEffect } from 'react';
import DemandCard, { type Demand } from './DemandCard';
import Modal from './Modal';
import NewDemandForm from './NewDemandForm';
import EditDemandForm from './EditDemandForm';
import ConfirmDialog from './ConfirmDialog';
import Loading from './Loading';
import { jsonbinClient } from '../utils/jsonbin-client';
import './Dashboard.css';

interface DashboardProps {
  onLogout: () => void;
}


const Dashboard = ({ onLogout }: DashboardProps) => {
  const [selectedDev, setSelectedDev] = useState<string>('Todos');
  const [selectedProject, setSelectedProject] = useState<string>('Todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');
  const [selectedPriority, setSelectedPriority] = useState<string>('Todas');
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
  const [completingId, setCompletingId] = useState<string | number | null>(null);

  // Load devs, projects, demands from API or localStorage
  useEffect(() => {
    let mounted = true;
    (async () => {
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
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
    return matchesDev && matchesProject && matchesStatus && matchesPriority;
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
    return matchesDev && matchesProject && matchesStatus && matchesPriority;
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

  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
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
    const saved = await jsonbinClient.updateDemand(updatedDemand);
    setDemands(prev => prev.map(d => d.id === saved.id ? saved : d));
    setIsEditModalOpen(false);
    setEditingDemand(null);
    showSuccessNotification('Demanda atualizada com sucesso!');
  };

  const handleCompleteDemand = async (updatedDemand: Demand) => {
    setCompletingId(updatedDemand.id);
    try {
      const saved = await jsonbinClient.updateDemand(updatedDemand);
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
      await jsonbinClient.deleteDemand(confirmDelete);
      setDemands(prev => prev.filter(d => d.id !== confirmDelete));
      setConfirmDelete(null);
      showSuccessNotification('Demanda excluída com sucesso!');
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header" role="banner">
        <div className="header-content">
          <span className="header-icon" aria-hidden="true">
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
          <button 
            onClick={onLogout} 
            className="logout-button"
            aria-label="Sair do sistema"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="dashboard-main" role="main">
        <div className="dashboard-content">
          <div className="content-header">
            {/* Status Counters */}
            <div className="summary-cards">
              <div className="summary-card card-total">
                <div className="card-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M12 12L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="card-content">
                  <h3>Taxa de Conclusão</h3>
                  {isLoading ? (
                    <div className="card-loading">
                      <div className="loading-spinner-small"></div>
                    </div>
                  ) : (
                    <p className="card-number">{completionRate}%</p>
                  )}
                </div>
              </div>
              
              <div className="summary-card card-pendente">
                <div className="card-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 7V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="card-content">
                  <h3>Pendentes</h3>
                  {isLoading ? (
                    <div className="card-loading">
                      <div className="loading-spinner-small"></div>
                    </div>
                  ) : (
                    <p className="card-number">{statusCounts.pendente}</p>
                  )}
                </div>
              </div>
              
              <div className="summary-card card-concluido">
                <div className="card-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="card-content">
                  <h3>Concluídas</h3>
                  {isLoading ? (
                    <div className="card-loading">
                      <div className="loading-spinner-small"></div>
                    </div>
                  ) : (
                    <p className="card-number">{statusCounts.concluido}</p>
                  )}
                </div>
              </div>
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
                  >
                    <option value="Todos">Todos</option>
                    {devs.map((dev) => (
                      <option key={dev} value={dev}>{dev}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="project-filter">Projeto:</label>
                  <select
                    id="project-filter"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="project-filter"
                  >
                    <option value="Todos">Todos</option>
                    {projects.map((project) => (
                      <option key={project} value={project}>{project}</option>
                    ))}
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
                  >
                    <option value="Todas">Todas</option>
                    {priorities && priorities.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
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
              <h3 className="section-title">Demandas Pendentes</h3>
              <div className="demands-grid">
                {isLoading ? (
                  <Loading message="Carregando demandas..." />
                ) : pendingDemands.length > 0 ? (
                  pendingDemands.map(demand => (
                    <DemandCard 
                      key={demand.id} 
                      demand={demand}
                      onEdit={handleEditDemand}
                      onDelete={handleDeleteDemand}
                      onComplete={handleCompleteDemand}
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
              <h3 className="section-title">Demandas Concluídas ({completedDemands.length})</h3>
              <div className="demands-grid">
                {completedDemands.map(demand => (
                  <DemandCard 
                    key={demand.id} 
                    demand={demand}
                    onEdit={handleEditDemand}
                    onDelete={handleDeleteDemand}
                    onComplete={handleCompleteDemand}
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
