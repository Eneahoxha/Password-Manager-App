import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [masterPassword, setMasterPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState('');

  async function checkAuth() {
    setIsLoading(true);
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
      setNotice('');
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    checkAuth();
  }, []);

  async function login(email, password, vaultPassword) {
    const response = await api.post('/auth/login', { email, password });
    setUser(response.data.user);
    setMasterPassword(vaultPassword || password);
    setNotice('Accesso effettuato correttamente.');
    return response.data.user;
  }

  async function register(email, password) {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
  }

  async function logout() {
    await api.post('/auth/logout');
    setUser(null);
    setMasterPassword('');
    setNotice('Sessione chiusa.');
  }

  const value = useMemo(() => ({
    user,
    isLoading,
    masterPassword,
    notice,
    setNotice,
    login,
    register,
    logout,
    checkAuth,
    setMasterPassword
  }), [user, isLoading, masterPassword, notice]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve essere usato dentro AuthProvider.');
  }

  return context;
}
