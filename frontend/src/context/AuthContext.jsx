import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { login as apiLogin, getProfile, getMyPermissions } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadSessionData() {
    const [profile, perms] = await Promise.all([getProfile(), getMyPermissions()]);
    setUser(profile);
    setPermissions(perms || []);
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadSessionData()
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
          setPermissions([]);
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
        await loadSessionData();
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
    setPermissions([]);
  }

  function refreshUser() {
    return loadSessionData().catch(() => {});
  }

  const value = useMemo(() => ({
    user,
    permissions,
    login,
    logout,
    loading,
    refreshUser,
    hasPermission: (permission) => permissions.includes(permission),
    hasAnyPermission: (required = []) => required.some((p) => permissions.includes(p)),
  }), [user, permissions, loading]);

  return (
    <AuthContext.Provider value={value}>
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
