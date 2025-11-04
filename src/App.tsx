import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { type Developer } from './utils/jsonbin-client';

const AUTH_KEY = 'fluxo7dev_auth';
const USER_KEY = 'fluxo7dev_user';

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
    <>
      {isAuthenticated && currentUser ? (
        <Dashboard onLogout={handleLogout} currentUser={currentUser} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  );
}

export default App;
