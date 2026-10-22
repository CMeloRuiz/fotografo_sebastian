import { useEffect, useState } from 'react';
import Icon from '../../components/ui/Icon';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastProvider';
import { whatsappLink } from '../../lib/whatsapp';
import './Messages.css';

const FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'nuevo', label: 'Nuevos' },
  { value: 'respondido', label: 'Respondidos' },
  { value: 'archivado', label: 'Archivados' },
];

function formatWhen(iso) {
  const date = new Date(iso);
  return date.toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Messages() {
  const toast = useToast();
  const [filter, setFilter] = useState('');
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [isBusy, setIsBusy] = useState(false);

  const load = (status) => {
    setMessages(null);
    setError('');
    api
      .get(`/api/admin/messages${status ? `?status=${status}` : ''}`)
      .then(setMessages)
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    load(filter);
  }, [filter]);

  const setStatus = async (message, status) => {
    try {
      const updated = await api.patch(`/api/admin/messages/${message.id}`, { status });
      setMessages((list) => list.map((m) => (m.id === message.id ? updated : m)));
      toast.success(status === 'respondido' ? 'Marcado como respondido.' : 'Mensaje archivado.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <div className="admin-section-title">
        <div>
          <h1>Mensajes</h1>
          <p className="admin-hint">Las solicitudes que llegan desde el formulario del sitio.</p>
        </div>
      </div>

      <div className="msg-filters" role="group" aria-label="Filtrar mensajes">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`abtn abtn--sm ${filter === f.value ? 'abtn--primary' : 'abtn--secondary'}`}
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="astate">
          <Icon name="close" size={28} />
          <h3>No se pudieron cargar los mensajes</h3>
          <p>{error}</p>
          <button type="button" className="abtn abtn--secondary" onClick={() => load(filter)}>
            Reintentar
          </button>
        </div>
      )}

      {!messages && !error && (
        <div className="msg-list">
          {Array.from({ length: 3 }, (_, i) => (
            <span className="askeleton msg-skeleton" key={i} />
          ))}
        </div>
      )}

      {messages?.length === 0 && (
        <div className="astate">
          <Icon name="inbox" size={32} />
          <h3>Sin mensajes por aquí</h3>
          <p>
            Cuando alguien llene el formulario de contacto del sitio, su solicitud aparecerá en
            esta lista y también te llegará al correo.
          </p>
        </div>
      )}

      {messages?.length > 0 && (
        <div className="msg-list">
          {messages.map((message) => {
            const wa = whatsappLink(
              message.phone,
              `Hola ${message.name.split(' ')[0]}, soy Sebastián. Vi tu solicitud sobre tu ${message.eventType.toLowerCase()}.`,
            );

            return (
              <article className={`msg msg--${message.status}`} key={message.id}>
                <header className="msg__head">
                  <div>
                    <h2>{message.name}</h2>
                    <p className="msg__when">{formatWhen(message.createdAt)}</p>
                  </div>
                  <span className={`badge ${message.status === 'nuevo' ? 'badge--new' : 'badge--draft'}`}>
                    {message.status}
                  </span>
                </header>

                <dl className="msg__data">
                  <div>
                    <dt>Evento</dt>
                    <dd>{message.eventType}</dd>
                  </div>
                  {message.eventDate && (
                    <div>
                      <dt>Fecha</dt>
                      <dd>{message.eventDate}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Teléfono</dt>
                    <dd>{message.phone}</dd>
                  </div>
                  <div>
                    <dt>Correo</dt>
                    <dd>
                      <a href={`mailto:${message.email}`}>{message.email}</a>
                    </dd>
                  </div>
                </dl>

                <p className="msg__text">{message.message}</p>

                <footer className="msg__actions">
                  {wa && (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="abtn abtn--primary abtn--sm"
                    >
                      <Icon name="whatsapp" size={15} />
                      Responder por WhatsApp
                    </a>
                  )}

                  {message.status !== 'respondido' && (
                    <button
                      type="button"
                      className="abtn abtn--secondary abtn--sm"
                      onClick={() => setStatus(message, 'respondido')}
                    >
                      <Icon name="check" size={15} />
                      Ya respondí
                    </button>
                  )}

                  {message.status !== 'archivado' && (
                    <button
                      type="button"
                      className="abtn abtn--ghost abtn--sm"
                      onClick={() => setStatus(message, 'archivado')}
                    >
                      Archivar
                    </button>
                  )}

                  <button
                    type="button"
                    className="abtn abtn--ghost abtn--sm msg__delete"
                    onClick={() => setToDelete(message)}
                  >
                    <Icon name="trash" size={15} />
                    Eliminar
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {toDelete && (
        <ConfirmDialog
          title={`¿Eliminar el mensaje de ${toDelete.name}?`}
          message="Se borra definitivamente. Si solo quieres sacarlo de la lista, archívalo."
          confirmLabel="Sí, eliminar"
          isBusy={isBusy}
          onConfirm={async () => {
            setIsBusy(true);
            try {
              await api.delete(`/api/admin/messages/${toDelete.id}`);
              setMessages((list) => list.filter((m) => m.id !== toDelete.id));
              setToDelete(null);
              toast.success('Mensaje eliminado.');
            } catch (err) {
              toast.error(err.message);
            } finally {
              setIsBusy(false);
            }
          }}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}
