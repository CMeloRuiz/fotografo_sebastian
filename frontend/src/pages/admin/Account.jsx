import { useState } from 'react';
import Icon from '../../components/ui/Icon';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthProvider';
import { useToast } from '../../context/ToastProvider';

export default function Account() {
  const { admin, logout } = useAuth();
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [errors, setErrors] = useState({});
  const [isBusy, setIsBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    const found = {};
    if (!currentPassword) found.currentPassword = 'Escribe tu contraseña actual.';
    if (newPassword.length < 10) found.newPassword = 'Usa al menos 10 caracteres.';
    if (newPassword !== repeat) found.repeat = 'Las dos contraseñas no coinciden.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setIsBusy(true);
    try {
      await api.post('/api/auth/password', { currentPassword, newPassword });
      toast.success('Contraseña cambiada. Entra otra vez con la nueva.');
      // El backend cierra la sesión al cambiarla: reflejamos eso aquí.
      await logout();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <>
      <div className="admin-section-title">
        <div>
          <h1>Mi cuenta</h1>
          <p className="admin-hint">Tu acceso al panel.</p>
        </div>
      </div>

      <section className="admin-card" style={{ marginBottom: 'var(--space-5)' }}>
        <h2 style={{ marginBottom: 'var(--space-3)' }}>Datos de acceso</h2>
        <p className="admin-hint">
          Entras con <strong>{admin?.email}</strong>.
          {admin?.last_login_at && (
            <>
              {' '}
              Tu último ingreso fue el{' '}
              {new Date(admin.last_login_at).toLocaleString('es-CO', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
              .
            </>
          )}
        </p>
      </section>

      <form className="admin-card" onSubmit={submit} style={{ maxWidth: 460 }}>
        <h2 style={{ marginBottom: 'var(--space-5)' }}>Cambiar la contraseña</h2>

        <div className="afield">
          <label htmlFor="currentPassword">Contraseña actual</label>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          {errors.currentPassword && <p className="afield__error">{errors.currentPassword}</p>}
        </div>

        <div className="afield">
          <label htmlFor="newPassword">Contraseña nueva</label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          {errors.newPassword ? (
            <p className="afield__error">{errors.newPassword}</p>
          ) : (
            <p className="admin-hint">
              Mínimo 10 caracteres. Una frase que recuerdes es mejor que una palabra con símbolos.
            </p>
          )}
        </div>

        <div className="afield">
          <label htmlFor="repeat">Repite la contraseña nueva</label>
          <input
            id="repeat"
            type="password"
            autoComplete="new-password"
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
          />
          {errors.repeat && <p className="afield__error">{errors.repeat}</p>}
        </div>

        <button type="submit" className="abtn abtn--primary" disabled={isBusy}>
          <Icon name="lock" size={16} />
          {isBusy ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </form>
    </>
  );
}
