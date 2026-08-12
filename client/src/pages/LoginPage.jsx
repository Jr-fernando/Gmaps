import { useState } from 'react';
import { LockKeyhole, LogIn } from 'lucide-react';
import { authService } from '../services/api';

export default function LoginPage({ onAuthenticated }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.login(password);
      onAuthenticated();
    } catch (err) {
      setError(err.message || 'Não foi possível iniciar a sessão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="logo-icon"><LockKeyhole size={20} /></div>
        <h1>AgenticLeads</h1>
        <p>Entre para acessar seu espaço comercial.</p>
        <label htmlFor="admin-password">Chave de acesso</label>
        <input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={loading} />
        {error && <p className="login-error" role="alert">{error}</p>}
        <button type="submit" className="btn-search" disabled={loading}>
          <LogIn size={16} /> {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
