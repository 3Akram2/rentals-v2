import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, getProfile } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getProfile()
        .then(profile => setUser(profile))
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(username, password) {
    try {
      const data = await apiLogin(username, password);
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        const profile = await getProfile();
        setUser(profile);
        return { success: true };
      }
      return { success: false, error: data.message || 'Login failed' };
    } catch {
      return { success: false, error: 'Login failed' };
    }
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  function refreshUser() {
    return getProfile()
      .then(profile => setUser(profile))
      .catch(() => {});
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
