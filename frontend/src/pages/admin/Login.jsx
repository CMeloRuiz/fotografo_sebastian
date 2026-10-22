import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { useAuth } from '../../context/AuthProvider';
import useSeo from '../../hooks/useSeo';
import './Login.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  useSeo({ title: 'Entrar al panel', description: 'Acceso privado.' });

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Escribe tu correo y tu contraseña.');
      return;
    }

    setIsBusy(true);

    try {
      await login(email, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(
        err.status === 429
          ? err.data?.error || 'Demasiados intentos. Espera unos minutos.'
          : err.message || 'No se pudo entrar.',
      );
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="admin login">
      {/* noValidate: los avisos nativos del navegador salen en su idioma,
          no en el del sitio. Validamos aquí y en el servidor. */}
      <form className="login__card" onSubmit={onSubmit} noValidate>
        <picture>
          <source type="image/webp" srcSet="/media/logo.webp" />
          <img src="/media/logo.png" alt="Sebastián Sisa" width="119" height="92" />
        </picture>

        <h1>Entra a tu panel</h1>
        <p className="login__lead">Desde aquí manejas tus álbumes, tus fotos y tus mensajes.</p>

        <div className="afield">
          <label htmlFor="email">Correo</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="afield">
          <label htmlFor="password">Contraseña</label>
          <div className="login__password">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="abtn abtn--icon"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar la contraseña' : 'Mostrar la contraseña'}
            >
              <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
            </button>
          </div>
        </div>

        {error && (
          <p className="login__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="abtn abtn--primary login__submit" disabled={isBusy}>
          {isBusy ? 'Entrando...' : 'Entrar'}
          {!isBusy && <Icon name="arrowRight" size={17} />}
        </button>
      </form>
    </div>
  );
}
