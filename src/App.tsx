import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

const AUTH_KEY = 'fluxo7dev_auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Carrega estado de autenticação do localStorage ao montar
  // Mantém o usuário logado mesmo após fechar o navegador
  // Só é limpo ao fazer logout ou limpar o cache do navegador
  useEffect(() => {
    const auth = localStorage.getItem(AUTH_KEY);
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    localStorage.setItem(AUTH_KEY, 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
  };

  return (
    <>
      {isAuthenticated ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  );
}

export default App;
