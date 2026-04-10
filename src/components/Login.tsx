import { useState, type FormEvent } from 'react';
import type { Developer } from '../utils/jsonbin-client';
import { authenticateUserSupabase } from '../utils/auth';
import './Login.css';

interface LoginProps {
  onLogin: (user: Developer) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!userId.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // 1. Autenticar usuário direto no Supabase
      const user = await authenticateUserSupabase(userId.toLowerCase(), password);

      if (user) {
        // 2. Fazer login imediatamente (telas vão carregar os dados quando abrirem)
        onLogin(user);
      } else {
        setError('Usuário ou senha incorretos. Tente novamente.');
        setPassword('');
      }
    } catch (error) {
      setError('Erro ao conectar com o servidor. Tente novamente.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="login-icon">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="var(--color-logo-fluxo)" strokeWidth="2"/>
              <path d="M8 8L10 10L8 12" stroke="var(--color-logo-7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12H16" stroke="var(--color-white-soft)" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="18" cy="18" r="4" fill="#000000" stroke="var(--color-logo-fluxo)" strokeWidth="1.5"/>
              <path d="M18 16V20M16 18H20" stroke="var(--color-logo-7)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="login-logo-img-container">
            <img src="/logo-team.svg" alt="Fluxo7 Team" className="login-logo-img" />
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="userId">Usuário</label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setError('');
              }}
              placeholder="Digite seu usuário"
              autoFocus
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Digite sua senha"
              required
              disabled={isLoading}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Carregando dados...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
