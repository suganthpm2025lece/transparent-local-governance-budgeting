import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('civicledger_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('civicledger_token')));
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const persistSession = (token, userObj) => {
    localStorage.setItem('civicledger_token', token);
    localStorage.setItem('civicledger_user', JSON.stringify(userObj));
    setUser(userObj);
  };

  const clearSession = () => {
    localStorage.removeItem('civicledger_token');
    localStorage.removeItem('civicledger_user');
    setUser(null);
    setUnreadNotifications(0);
  };

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('civicledger_token');
    if (!token) {
      setLoading(false);
      return null;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      localStorage.setItem('civicledger_user', JSON.stringify(data.user));
      setUnreadNotifications(data.unreadNotifications || 0);
      return data.user;
    } catch {
      clearSession();
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    persistSession(data.token, data.user);
    await refreshProfile();
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    persistSession(data.token, data.user);
    return data.user;
  };

  const logout = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'admin',
        unreadNotifications,
        setUnreadNotifications,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
