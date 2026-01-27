import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import FinancialView from './components/FinancialView';
import ClientsView from './components/ClientsView';
import SatisfactionSurvey from './components/SatisfactionSurvey';
import Sidebar from './components/Sidebar';
import ProfileView from './components/ProfileView';
import { type Developer } from './utils/jsonbin-client';
import { notificationService } from './utils/notification-service';

const AUTH_KEY = 'fluxo7dev_auth';
const USER_KEY = 'fluxo7dev_user';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<Developer | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Carrega estado de autenticação do localStorage ao montar
  // Mantém o usuário logado mesmo após fechar o navegador
  // Só é limpo ao fazer logout ou limpar o cache do navegador
  useEffect(() => {
    const auth = localStorage.getItem(AUTH_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    
    if (auth === 'true' && userStr) {
      try {
        const user = JSON.parse(userStr) as Developer;
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (error) {
        // Se houver erro ao parsear, limpa o localStorage
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
  }, []);

  const handleLogin = (user: Developer) => {
    localStorage.setItem(AUTH_KEY, 'true');
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
    navigate('/demandas');
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
    setCurrentUser(null);
    setIsAuthenticated(false);
    navigate('/');
  };

  const handleUpdateUser = (updatedUser: Developer) => {
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Erro ao atualizar usuário no localStorage:', error);
    }
  };

  const handleNavigate = (tab: 'dashboard' | 'financial' | 'clients' | 'satisfaction' | 'profile') => {
    switch (tab) {
      case 'dashboard':
        navigate('/demandas');
        break;
      case 'financial':
        navigate('/financeiro');
        break;
      case 'clients':
        navigate('/clientes');
        break;
      case 'satisfaction':
        navigate('/feedbacks');
        break;
      case 'profile':
        navigate('/perfil');
        break;
      default:
        navigate('/demandas');
        break;
    }
  };

  // Adicionar listener para swipe gesture (arrastar para abrir sidebar)
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;
      
      // Swipe da esquerda para direita (abrir sidebar)
      if (Math.abs(diffX) > Math.abs(diffY) && diffX > 100 && startX < 50) {
        setIsSidebarOpen(true);
      }
    };
    
    if (isAuthenticated) {
      document.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchend', handleTouchEnd);
    }
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isAuthenticated]);

  // Inicializa Web Push (inscrição) quando autenticado
  useEffect(() => {
    const initPush = async () => {
      try {
        if (isAuthenticated && currentUser) {
          // Usa o nome do dev como userId para manter consistência com assignedUser
          await notificationService.initializePushServer(currentUser.name);
        }
      } catch (err) {
        console.error('Falha ao inicializar notificações:', err);
      }
    };
    initPush();
  }, [isAuthenticated, currentUser]);

  return (
    <>
      {isAuthenticated && currentUser ? (
        <>
          <Routes>
            <Route
              path="/demandas"
              element={
                <Dashboard 
                  onLogout={handleLogout} 
                  currentUser={currentUser} 
                  onOpenSidebar={() => setIsSidebarOpen(true)}
                />
              }
            />
            <Route
              path="/financeiro"
              element={
                <FinancialView 
                  onOpenSidebar={() => setIsSidebarOpen(true)} 
                  onLogout={handleLogout} 
                />
              }
            />
            <Route
              path="/clientes"
              element={
                <ClientsView
                  onOpenSidebar={() => setIsSidebarOpen(true)}
                  onLogout={handleLogout}
                />
              }
            />
            <Route
              path="/feedbacks"
              element={
                <SatisfactionSurvey 
                  onOpenSidebar={() => setIsSidebarOpen(true)} 
                  onLogout={handleLogout} 
                />
              }
            />
            <Route
              path="/perfil"
              element={
                <ProfileView
                  currentUser={currentUser}
                  onOpenSidebar={() => setIsSidebarOpen(true)}
                  onLogout={handleLogout}
                  onUpdateUser={handleUpdateUser}
                />
              }
            />
            <Route path="/" element={<Navigate to="/demandas" replace />} />
            <Route path="*" element={<Navigate to="/demandas" replace />} />
          </Routes>
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
            user={currentUser} 
            onLogout={handleLogout}
            onNavigate={handleNavigate}
          />
        </>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  );
}

export default App;
