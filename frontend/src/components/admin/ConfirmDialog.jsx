import { useEffect, useRef } from 'react';
import Icon from '../ui/Icon';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import './ConfirmDialog.css';

/**
 * Confirmacion antes de algo que no se puede deshacer.
 *
 * El boton que confirma nunca recibe el foco al abrir: queremos que haya que
 * apuntar a el a proposito, no que un Enter de inercia borre un album.
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  isDestructive = true,
  isBusy = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);
  useLockBodyScroll(true);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !isBusy) onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCancel, isBusy]);

  return (
    <div
      className="admin confirm-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isBusy) onCancel();
      }}
    >
      <div className="confirm">
        <span className={`confirm__icon ${isDestructive ? 'is-danger' : ''}`}>
          <Icon name={isDestructive ? 'trash' : 'spark'} size={20} />
        </span>

        <h2 id="confirm-title">{title}</h2>
        {message && <p>{message}</p>}

        <div className="confirm__actions">
          <button
            type="button"
            ref={cancelRef}
            className="abtn abtn--secondary"
            onClick={onCancel}
            disabled={isBusy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`abtn ${isDestructive ? 'abtn--danger' : 'abtn--primary'}`}
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy ? 'Un momento...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
