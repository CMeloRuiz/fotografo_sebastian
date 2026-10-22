import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, hasBackend } from '../lib/api';

const AuthContext = createContext(null);

/**
 * Sesion del panel.
 *
 * El token vive en una cookie httpOnly que el navegador manda solo; aqui no
 * se guarda nada. Al arrancar preguntamos a /auth/me quien es el usuario,
 * que es la unica forma de saber si la cookie sigue siendo valida.
 */
export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!hasBackend) {
      setIsChecking(false);
      return;
    }

    api
      .get('/api/auth/me')
      .then((data) => setAdmin(data.admin))
      .catch(() => setAdmin(null))
      .finally(() => setIsChecking(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password });
    setAdmin(data.admin);
    return data.admin;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      setAdmin(null);
    }
  }, []);

  const value = useMemo(
    () => ({ admin, isChecking, isAuthenticated: Boolean(admin), login, logout, setAdmin }),
    [admin, isChecking, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}

export default AuthProvider;
