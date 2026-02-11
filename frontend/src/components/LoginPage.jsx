import { useState } from 'react';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const { t, lang, toggleLang } = useLang();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error || t('loginFailed'));
      }
    } catch {
      setError(t('loginFailed'));
    }
    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <button className="login-lang-toggle" onClick={toggleLang} type="button">
          {lang === 'en' ? 'العربية' : 'English'}
        </button>

        <img src="/logo.png" alt="Logo" className="login-logo" />

        <h2 className="login-title">{t('appTitle')}</h2>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>{t('email')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>{t('password')}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '10px' }}
          >
            {loading ? t('loading') : t('login')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
