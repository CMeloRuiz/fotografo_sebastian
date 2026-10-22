import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import AuthProvider, { useAuth } from '../../context/AuthProvider';
import ToastProvider from '../../context/ToastProvider';
import { api, hasBackend } from '../../lib/api';

import Login from './Login';
import Dashboard from './Dashboard';
import Albums from './Albums';
import AlbumEditor from './AlbumEditor';
import Content from './Content';
import Messages from './Messages';
import Account from './Account';

import '../../styles/admin.css';

/** Mientras comprobamos la cookie no sabemos aún si hay sesión o no. */
function Checking() {
  return (
    <div className="admin" style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh' }}>
      <span className="aspinner" />
    </div>
  );
}

function NoBackend() {
  return (
    <div className="admin" style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh', padding: '2rem' }}>
      <div className="astate" style={{ maxWidth: 480 }}>
        <h3>El panel necesita el backend</h3>
        <p>
          Este sitio se está sirviendo sin API. Configura <code>VITE_API_URL</code> en el
          frontend y vuelve a construir para poder entrar al panel.
        </p>
      </div>
    </div>
  );
}

function AdminRoutes() {
  const { isAuthenticated, isChecking } = useAuth();
  const [newMessages, setNewMessages] = useState(0);

  // El contador del menú lateral se refresca al entrar y al cambiar de ruta.
  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get('/api/admin/stats')
      .then((stats) => setNewMessages(stats.newMessages))
      .catch(() => {});
  }, [isAuthenticated]);

  if (isChecking) return <Checking />;
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="login" element={<Navigate to="/admin" replace />} />
      <Route element={<AdminLayout newMessages={newMessages} />}>
        <Route index element={<Dashboard />} />
        <Route path="albumes" element={<Albums />} />
        <Route path="albumes/:id" element={<AlbumEditor />} />
        <Route path="contenido" element={<Content />} />
        <Route path="mensajes" element={<Messages />} />
        <Route path="cuenta" element={<Account />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}

export default function AdminApp() {
  if (!hasBackend) return <NoBackend />;

  return (
    <AuthProvider>
      <ToastProvider>
        <AdminRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}
