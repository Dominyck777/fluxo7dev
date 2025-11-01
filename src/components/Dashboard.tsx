import { useState, useEffect } from 'react';
import DemandCard, { type Demand } from './DemandCard';
import Modal from './Modal';
import NewDemandForm from './NewDemandForm';
import EditDemandForm from './EditDemandForm';
import ConfirmDialog from './ConfirmDialog';
import { apiClient } from '../utils/api-client';
import './Dashboard.css';

interface DashboardProps {
  onLogout: () => void;
}


const Dashboard = ({ onLogout }: DashboardProps) => {
  const [selectedDev, setSelectedDev] = useState<string>('Todos');
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

  // Load devs, projects, demands from API or localStorage
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [config, demands] = await Promise.all([
        apiClient.getConfig(),
        apiClient.getDemands(),
      ]);
      if (!mounted) return;
      setDevs(config.devs || []);
      setProjects(config.projects || []);
      setPriorities(config.priorities || []);
      setDemands(demands);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // (Removido) Persistência via localStorage substituída pela API

  // Sort demands by date (most recent first)
  const sortedDemands = [...demands].sort((a, b) => {
    const dateA = a.dataCriacao ? new Date(a.dataCriacao).getTime() : 0;
    const dateB = b.dataCriacao ? new Date(b.dataCriacao).getTime() : 0;
    return dateB - dateA;
  });

  const filteredDemands = sortedDemands.filter(demand => {
    const matchesDev = selectedDev === 'Todos' || demand.desenvolvedor === selectedDev;
    const matchesStatus = selectedStatus === 'Todos' || demand.status === selectedStatus;
    const matchesPriority = selectedPriority === 'Todas' || demand.prioridade === selectedPriority;
    return matchesDev && matchesStatus && matchesPriority;
  });

  // Count demands by status
  const statusCounts = {
    total: demands.length,
    pendente: demands.filter(d => d.status === 'Pendente').length,
    andamento: demands.filter(d => d.status === 'Em Andamento').length,
    concluido: demands.filter(d => d.status === 'Concluído').length
  };

  const pct = (n: number) => {
    if (statusCounts.total === 0) return '0%';
    return `${Math.round((n / statusCounts.total) * 100)}%`;
  };

  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleCreateDemand = async (newDemand: Omit<Demand, 'id'>) => {
    const payload = { ...newDemand, dataCriacao: new Date().toISOString() };
    const created = await apiClient.createDemand(payload);
    setDemands(prev => [created, ...prev]);
    setIsModalOpen(false);
    showSuccessNotification('Demanda criada com sucesso!');
  };

  const handleEditDemand = (demand: Demand) => {
    setEditingDemand(demand);
    setIsEditModalOpen(true);
  };

  const handleUpdateDemand = async (updatedDemand: Demand) => {
    const saved = await apiClient.updateDemand(updatedDemand);
    setDemands(prev => prev.map(d => d.id === saved.id ? saved : d));
    setIsEditModalOpen(false);
    setEditingDemand(null);
    showSuccessNotification('Demanda atualizada com sucesso!');
  };

  const handleDeleteDemand = (id: string | number) => {
    setConfirmDelete(id);
  };

  const confirmDeleteDemand = async () => {
    if (confirmDelete) {
      await apiClient.deleteDemand(confirmDelete);
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
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="7" r="4" stroke="#ffaa33" strokeWidth="2"/>
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="#f05902" strokeWidth="2" strokeLinecap="round"/>
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
            <h2 className="page-title">Demandas</h2>
            
            {/* Status Counters */}
            <div className="status-counters" role="region" aria-label="Contadores de status das demandas">
              <div className="counter-item total">
                <span className="counter-value">{statusCounts.total}</span>
                <span className="counter-label">Demandas Totais</span>
              </div>
              <div className="counter-item pendente">
                <span className="counter-icon">⏸</span>
                <span className="counter-value">{statusCounts.pendente}</span>
                <span className="counter-label">Pendente</span>
                <span className="counter-sublabel">{pct(statusCounts.pendente)} do total</span>
              </div>
              <div className="counter-item andamento">
                <span className="counter-icon">⏱</span>
                <span className="counter-value">{statusCounts.andamento}</span>
                <span className="counter-label">Em Andamento</span>
                <span className="counter-sublabel">{pct(statusCounts.andamento)} do total</span>
              </div>
              <div className="counter-item concluido">
                <span className="counter-icon">✓</span>
                <span className="counter-value">{statusCounts.concluido}</span>
                <span className="counter-label">Concluído</span>
                <span className="counter-sublabel">{pct(statusCounts.concluido)} do total</span>
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
                  <label htmlFor="status-filter">Status:</label>
                  <select
                    id="status-filter"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="status-filter"
                  >
                    <option value="Todos">Todos</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Em Andamento">Em Andamento</option>
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

          <div className="demands-grid">
            {filteredDemands.length > 0 ? (
              filteredDemands.map(demand => (
                <DemandCard 
                  key={demand.id} 
                  demand={demand}
                  onEdit={handleEditDemand}
                  onDelete={handleDeleteDemand}
                />
              ))
            ) : (
              <div className="empty-state">
                <p>Nenhuma demanda encontrada</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="dashboard-footer">
        <p>&copy; 2025 Fluxo7 Dev. Todos os direitos reservados. <span className="version">v1.0</span></p>
      </footer>

      {/* Modal de Nova Demanda */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova Demanda"
      >
        {!devs || !projects || !priorities || devs.length === 0 || projects.length === 0 || priorities.length === 0 ? (
          <div aria-live="polite">Carregando listas de desenvolvedores, projetos e prioridades...</div>
        ) : (
          <NewDemandForm
            onSubmit={handleCreateDemand}
            onCancel={() => setIsModalOpen(false)}
            devs={devs}
            projects={projects}
            priorities={priorities}
          />
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
