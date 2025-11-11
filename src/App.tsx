import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import FinancialView from './components/FinancialView';
import SatisfactionSurvey from './components/SatisfactionSurvey';
import Sidebar from './components/Sidebar';
import { type Developer } from './utils/jsonbin-client';

const AUTH_KEY = 'fluxo7dev_auth';
const USER_KEY = 'fluxo7dev_user';

type ActiveView = 'dashboard' | 'financial' | 'satisfaction';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<Developer | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

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
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveView('dashboard'); // Reset para dashboard ao fazer logout
  };

  const handleNavigate = (view: ActiveView) => {
    setActiveView(view);
  };

  const renderCurrentView = () => {
    if (!currentUser) return null;
    
    switch (activeView) {
      case 'dashboard':
        return (
          <Dashboard 
            onLogout={handleLogout} 
            currentUser={currentUser} 
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />
        );
      case 'financial':
        return (
          <FinancialView 
            onBack={() => setActiveView('dashboard')} 
            onLogout={handleLogout} 
          />
        );
      case 'satisfaction':
        return (
          <SatisfactionSurvey 
            onBack={() => setActiveView('dashboard')} 
            onLogout={handleLogout} 
          />
        );
      default:
        return (
          <Dashboard 
            onLogout={handleLogout} 
            currentUser={currentUser} 
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />
        );
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

  return (
    <>
      {isAuthenticated && currentUser ? (
        <>
          {renderCurrentView()}
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
