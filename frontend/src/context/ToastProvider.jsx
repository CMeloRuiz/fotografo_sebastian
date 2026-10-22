import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import Icon from '../components/ui/Icon';
import './ToastProvider.css';

const ToastContext = createContext(null);

const ICONS = { success: 'check', error: 'close', info: 'spark' };

/** Avisos emergentes del panel. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message, type = 'success', duration = 4200) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((list) => [...list, { id, message, type }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration),
      );
      return id;
    },
    [dismiss],
  );

  const toast = useMemo(
    () => ({
      success: (message) => push(message, 'success'),
      error: (message) => push(message, 'error', 6000),
      info: (message) => push(message, 'info'),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div className={`toast toast--${t.type}`} key={t.id}>
            <Icon name={ICONS[t.type]} size={17} />
            <span>{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Cerrar aviso">
              <Icon name="close" size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast debe usarse dentro de ToastProvider');
  return context;
}

export default ToastProvider;
