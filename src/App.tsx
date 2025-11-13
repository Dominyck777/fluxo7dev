import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import FinancialView from './components/FinancialView';
import SatisfactionSurvey from './components/SatisfactionSurvey';
import Sidebar from './components/Sidebar';
import { type Developer } from './utils/jsonbin-client';

const AUTH_KEY = 'fluxo7dev_auth';
const USER_KEY = 'fluxo7dev_user';

// Componente para rotas autenticadas
function AuthenticatedApp({ user, onLogout }: { user: Developer; onLogout: () => void }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  // Swipe gesture para abrir sidebar
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
    
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <>
      <Routes>
        <Route 
          path="/demandas" 
          element={
            <Dashboard 
              onLogout={onLogout} 
              currentUser={user} 
              onOpenSidebar={() => setIsSidebarOpen(true)}
            />
          } 
        />
        <Route 
          path="/financeiro" 
          element={
            <FinancialView 
              onBack={() => navigate('/demandas')} 
              onLogout={onLogout} 
            />
          } 
        />
        <Route 
          path="/satisfacao" 
          element={
            <SatisfactionSurvey 
              onBack={() => navigate('/demandas')} 
              onLogout={onLogout} 
            />
          } 
        />
        <Route path="/" element={<Navigate to="/demandas" replace />} />
        <Route path="*" element={<Navigate to="/demandas" replace />} />
      </Routes>
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        user={user} 
        onLogout={onLogout}
        onNavigate={handleNavigate}
      />
    </>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<Developer | null>(null);

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
  };

  return (
    <Router>
      {isAuthenticated && currentUser ? (
        <AuthenticatedApp user={currentUser} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </Router>
  );
}

export default App;
