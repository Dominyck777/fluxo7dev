import { useState, type FormEvent } from 'react';
import './Login.css';

interface LoginProps {
  onLogin: () => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (password === 'f740028922') {
      onLogin();
    } else {
      setError('Senha incorreta. Tente novamente.');
      setPassword('');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="login-icon">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="#f05902" strokeWidth="2"/>
              <path d="M8 8L10 10L8 12" stroke="#ffaa33" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12H16" stroke="#91b0b0" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="18" cy="18" r="4" fill="#0a0a0a" stroke="#f05902" strokeWidth="1.5"/>
              <path d="M18 16V20M16 18H20" stroke="#ffaa33" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="login-logo">
            <span className="logo-fluxo">Fluxo</span>
            <span className="logo-7">7</span>
            <span className="logo-dev"> Dev</span>
          </h1>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="password">Senha de Acesso</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Digite a senha"
              autoFocus
              required
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="login-button">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
