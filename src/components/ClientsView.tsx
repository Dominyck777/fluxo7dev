import { useEffect, useState } from 'react';
import './FinancialView.css';
import { jsonbinClient } from '../utils/jsonbin-client';
import Modal from './Modal';

interface ClientsViewProps {
  onOpenSidebar?: () => void;
  onLogout: () => void;
}

interface Client {
  id: string;
  code: string;
  name: string;
  project: string;
  status: 'ativo' | 'pendente';
  activationDate: string;
  endDate: string;
}

const CLIENTS_STORAGE_KEY = 'fluxo7_clients';

const isPastDate = (isoDate: string) => {
  if (!isoDate) return false;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date < today;
};

const ClientsView = ({ onOpenSidebar, onLogout }: ClientsViewProps) => {
  const [projects, setProjects] = useState<string[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega projetos da config (ou do preloaded_config se existir)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const preloadedConfig = localStorage.getItem('preloaded_config');
        if (preloadedConfig) {
          const config = JSON.parse(preloadedConfig);
          if (!mounted) return;
          setProjects(config.projects || []);
        } else {
          const config = await jsonbinClient.getConfig();
          if (!mounted) return;
          setProjects(config.projects || []);
        }
      } catch (error) {
        console.error('Erro ao carregar projetos para Clientes:', error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Carrega clientes do JSONBin (com fallback para localStorage)
  useEffect(() => {
    let mounted = true;

    (async () => {
      // 1) Tenta carregar do JSONBin
      try {
        if (mounted) {
          setIsLoading(true);
        }
        const remoteClients = await jsonbinClient.getClients();
        if (!mounted) return;

        const normalizedFromBin: Client[] = remoteClients.map((client) => {
          const activationDate = client.activationDate || '';
          const endDate = client.endDate || '';
          const baseStatus = client.status ?? 'ativo';
          const status: 'ativo' | 'pendente' = isPastDate(endDate) ? 'pendente' : baseStatus;

          return {
            id: String(client.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
            code: client.code || '',
            name: client.name || '',
            project: client.project || '',
            status,
            activationDate,
            endDate,
          };
        });

        setClients(normalizedFromBin);

        try {
          localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(normalizedFromBin));
        } catch (error) {
          console.error('Erro ao salvar clientes no localStorage após carregar do JSONBin:', error);
        }

        if (mounted) {
          setIsLoading(false);
        }

        return; // sucesso, não precisa fallback
      } catch (error) {
        console.error('Erro ao carregar clientes do JSONBin:', error);
      }

      // 2) Fallback: tenta carregar do localStorage
      try {
        const stored = localStorage.getItem(CLIENTS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<Client>[];
          const normalized = parsed.map((client) => {
            const activationDate = client.activationDate || '';
            const endDate = client.endDate || '';
            const baseStatus = client.status ?? 'ativo';
            const status: 'ativo' | 'pendente' = isPastDate(endDate) ? 'pendente' : baseStatus;

            return {
              id: client.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              code: client.code || '',
              name: client.name || '',
              project: client.project || '',
              status,
              activationDate,
              endDate,
            };
          });
          if (mounted) {
            setClients(normalized);
            setIsLoading(false);
          }
        }
      } catch (fallbackError) {
        console.error('Erro ao carregar clientes do localStorage (fallback):', fallbackError);
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleToggleClientStatus = (clientId: string) => {
    setClients((prev) => {
      const updated = prev.map((client) =>
        client.id === clientId
          ? {
              ...client,
              status: (client.status === 'ativo' ? 'pendente' : 'ativo') as 'ativo' | 'pendente',
            }
          : client
      );

      try {
        localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Erro ao salvar clientes no localStorage ao alternar status:', error);
      }

      // Persiste também no JSONBin (sem bloquear a UI)
      jsonbinClient
        .saveClients(updated)
        .catch((error) => console.error('Erro ao salvar clientes no JSONBin ao alternar status:', error));

      return updated;
    });
  };

  const handleAddClient = (data: {
    name: string;
    project: string;
    status: 'ativo' | 'pendente';
    code: string;
    activationDate: string;
    endDate: string;
  }) => {
    const activationDate = data.activationDate;
    const endDate = data.endDate;
    const baseStatus: 'ativo' | 'pendente' = data.status;
    const finalStatus: 'ativo' | 'pendente' = isPastDate(endDate) ? 'pendente' : baseStatus;

    const newClient: Client = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      code: data.code.trim(),
      name: data.name.trim(),
      project: data.project,
      status: finalStatus,
      activationDate,
      endDate,
    };

    const updated = [newClient, ...clients];
    setClients(updated);
    try {
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Erro ao salvar clientes no localStorage:', error);
    }

    // Persiste também no JSONBin (sem bloquear a UI)
    jsonbinClient
      .saveClients(updated)
      .catch((error) => console.error('Erro ao salvar clientes no JSONBin ao criar novo cliente:', error));

    setIsModalOpen(false);
  };

  const formatDate = (isoDate: string) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return isoDate;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="financial-view">
      <header className="financial-header">
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
          <h1 className="financial-title">Clientes</h1>
          <div className="header-user-section">
            <button 
              onClick={onLogout}
              className="logout-button"
              aria-label="Sair do sistema"
            >
              <span className="emoji-only">🚪</span> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="financial-content">
        <div className="new-transaction-section" style={{ marginBottom: '2rem' }}>
          <button
            type="button"
            className="new-transaction-button"
            onClick={() => setIsModalOpen(true)}
          >
            Novo Cliente +
          </button>
        </div>

        {isLoading ? (
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Carregando clientes...</h3>
            <div className="transactions-list clients-grid">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="transaction-skeleton">
                  <div className="skeleton-icon"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-text skeleton-line"></div>
                    <div className="skeleton-text skeleton-line-short"></div>
                  </div>
                  <div className="skeleton-text skeleton-value"></div>
                </div>
              ))}
            </div>
          </div>
        ) : clients.length > 0 ? (
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Clientes Cadastrados</h3>
            <div className="transactions-list clients-grid">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="demand-card client-card"
                  data-status={client.status === 'ativo' ? 'Concluído' : 'Pendente'}
                  style={{ cursor: 'default' }}
                >
                  <div className="card-header">
                    <span className="developer-badge">{client.name}</span>
                    <span
                      className={`status-badge ${
                        client.status === 'ativo' ? 'status-concluido' : 'status-pendente'
                      }`}
                      onClick={() => handleToggleClientStatus(client.id)}
                      title="Clique para alternar o status deste cliente"
                    >
                      {client.status === 'ativo' ? 'Ativo' : 'Pendente'}
                    </span>
                  </div>

                  <div className="card-body">
                    <div className="project-header">
                      <h3 className="project-title">{client.project || 'Sem projeto vinculado'}</h3>
                    </div>

                    <div className="client-info-list">
                      {client.code && (
                        <p className="client-info-line">ID: {client.code}</p>
                      )}

                      {client.activationDate && (
                        <p className="client-info-line">
                          Ativação: {formatDate(client.activationDate)}
                        </p>
                      )}

                      {client.endDate && (
                        <p className="client-info-line">
                          Encerramento: {formatDate(client.endDate)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>Nenhum cliente cadastrado.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Novo Cliente"
        >
          <NewClientForm
            projects={projects}
            onSubmit={handleAddClient}
            onCancel={() => setIsModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
};

interface NewClientFormProps {
  projects: string[];
  onSubmit: (data: {
    name: string;
    project: string;
    status: 'ativo' | 'pendente';
    code: string;
    activationDate: string;
    endDate: string;
  }) => void;
  onCancel: () => void;
}

const NewClientForm = ({ projects, onSubmit, onCancel }: NewClientFormProps) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [project, setProject] = useState('');
  const [status, setStatus] = useState<'ativo' | 'pendente'>('ativo');
  const [activationDate, setActivationDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !code.trim() || !project || !activationDate || !endDate) {
      alert(
        'Preencha o nome do cliente, o código, selecione um projeto, as datas de ativação e encerramento e o status da assinatura.'
      );
      return;
    }

    onSubmit({ name, project, status, code, activationDate, endDate });
  };

  return (
    <form onSubmit={handleSubmit} className="new-transaction-form clients-form" style={{ maxWidth: '480px' }}>
      <div className="form-group">
        <label htmlFor="client-name-modal">Nome do Cliente *</label>
        <input
          id="client-name-modal"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: João Silva"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="client-code-modal">Código do Cliente / ID *</label>
        <input
          id="client-code-modal"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Ex: CLT-001"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="client-project-modal">Projeto que utiliza *</label>
        <select
          id="client-project-modal"
          value={project}
          onChange={(e) => setProject(e.target.value)}
          required
        >
          <option value="">Selecione um projeto</option>
          {projects.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="client-activation-date-modal">Data de ativação do sistema *</label>
        <input
          id="client-activation-date-modal"
          type="date"
          value={activationDate}
          onChange={(e) => setActivationDate(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="client-end-date-modal">Data de encerramento *</label>
        <input
          id="client-end-date-modal"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="client-status-modal">Status da assinatura *</label>
        <select
          id="client-status-modal"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'ativo' | 'pendente')}
          required
        >
          <option value="ativo">Ativo</option>
          <option value="pendente">Pendente</option>
        </select>
      </div>

      <div className="form-actions">
        <button type="button" className="cancel-button" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="submit-button">
          Salvar Cliente
        </button>
      </div>
    </form>
  );
};

export default ClientsView;
