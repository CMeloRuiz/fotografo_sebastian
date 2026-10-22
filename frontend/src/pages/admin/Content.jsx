import { useEffect, useRef, useState } from 'react';
import Icon from '../../components/ui/Icon';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { api, uploadWithProgress } from '../../lib/api';
import { useToast } from '../../context/ToastProvider';
import './Content.css';

const TABS = [
  { id: 'portada', label: 'Portada' },
  { id: 'sobre-mi', label: 'Sobre mí' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'testimonios', label: 'Testimonios' },
  { id: 'contacto', label: 'Contacto y redes' },
];

const EMPTY_TESTIMONIAL = { author: '', eventType: '', text: '', isPublished: true };

/** Campo de texto conectado a una clave de site_content. */
function Field({ label, hint, value, onChange, type = 'text', rows }) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return (
    <div className="afield">
      <label htmlFor={id}>{label}</label>
      {rows ? (
        <textarea id={id} rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <p className="admin-hint">{hint}</p>}
    </div>
  );
}

export default function Content() {
  const toast = useToast();
  const [tab, setTab] = useState('portada');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(null);

  const [newTestimonial, setNewTestimonial] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [isBusy, setIsBusy] = useState(false);

  const heroInput = useRef(null);
  const aboutInput = useRef(null);
  const [uploadingKey, setUploadingKey] = useState(null);

  const load = () =>
    api
      .get('/api/admin/content')
      .then(setData)
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  /** Edita una clave en memoria; se guarda con el botón de la sección. */
  const edit = (key, patch) =>
    setData((d) => ({ ...d, content: { ...d.content, [key]: { ...d.content[key], ...patch } } }));

  const saveKey = async (key) => {
    setSaving(key);
    try {
      await api.put('/api/admin/content', { key, value: data.content[key] });
      toast.success('Guardado. Ya se ve en el sitio.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  };

  const uploadMedia = async (key, file) => {
    if (!file) return;
    setUploadingKey(key);
    const formData = new FormData();
    formData.append('photos', file);

    try {
      const result = await uploadWithProgress(`/api/admin/content/media/${key}`, formData);
      setData((d) => ({ ...d, content: { ...d.content, [key]: result.value } }));
      toast.success('Imagen actualizada.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploadingKey(null);
    }
  };

  const saveTestimonial = async (testimonial) => {
    setIsBusy(true);
    try {
      if (testimonial.id) {
        const updated = await api.patch(`/api/admin/testimonials/${testimonial.id}`, testimonial);
        setData((d) => ({
          ...d,
          testimonials: d.testimonials.map((t) => (t.id === updated.id ? updated : t)),
        }));
      } else {
        const created = await api.post('/api/admin/testimonials', testimonial);
        setData((d) => ({ ...d, testimonials: [...d.testimonials, created] }));
        setNewTestimonial(null);
      }
      toast.success('Testimonio guardado.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsBusy(false);
    }
  };

  const saveService = async (service) => {
    setSaving(service.id);
    try {
      const updated = await api.patch(`/api/admin/services/${service.id}`, service);
      setData((d) => ({
        ...d,
        services: d.services.map((s) => (s.id === updated.id ? updated : s)),
      }));
      toast.success('Servicio guardado.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  };

  if (error) {
    return (
      <div className="astate">
        <Icon name="close" size={28} />
        <h3>No se pudo cargar el contenido</h3>
        <p>{error}</p>
        <button type="button" className="abtn abtn--secondary" onClick={load}>
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="astate">
        <span className="aspinner" />
        <p>Cargando el contenido...</p>
      </div>
    );
  }

  const c = data.content;

  return (
    <>
      <div className="admin-section-title">
        <div>
          <h1>Contenido del sitio</h1>
          <p className="admin-hint">
            Todo lo que se lee en tu página. Lo que guardes aquí se ve al instante.
          </p>
        </div>
      </div>

      <div className="content-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`content-tab ${tab === t.id ? 'is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Portada ───────────────────────────────────────── */}
      {tab === 'portada' && (
        <section className="admin-card">
          <h2>Lo primero que se ve</h2>
          <p className="admin-hint" style={{ marginBottom: 'var(--space-5)' }}>
            El título grande sobre la foto de fondo, y los botones de abajo.
          </p>

          <Field
            label="Frase pequeña de arriba"
            value={c.hero?.eyebrow}
            onChange={(v) => edit('hero', { eyebrow: v })}
          />
          <Field
            label="Título principal"
            rows={2}
            value={c.hero?.title}
            onChange={(v) => edit('hero', { title: v })}
          />
          <Field
            label="Texto debajo del título"
            rows={3}
            value={c.hero?.subtitle}
            onChange={(v) => edit('hero', { subtitle: v })}
          />

          <div className="content-media">
            <div>
              <h3>Foto de fondo</h3>
              <p className="admin-hint">
                Se ve a pantalla completa. Usa una horizontal y luminosa, de tu mejor trabajo.
              </p>
            </div>

            {c.heroMedia?.fallback && (
              <img src={c.heroMedia.fallback} alt="Fondo actual de la portada" />
            )}

            <input
              ref={heroInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                uploadMedia('heroMedia', e.target.files[0]);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              className="abtn abtn--secondary"
              onClick={() => heroInput.current?.click()}
              disabled={uploadingKey === 'heroMedia'}
            >
              <Icon name="upload" size={16} />
              {uploadingKey === 'heroMedia' ? 'Subiendo...' : 'Cambiar la foto de fondo'}
            </button>
          </div>

          <button
            type="button"
            className="abtn abtn--primary"
            onClick={() => saveKey('hero')}
            disabled={saving === 'hero'}
          >
            <Icon name="save" size={16} />
            {saving === 'hero' ? 'Guardando...' : 'Guardar la portada'}
          </button>
        </section>
      )}

      {/* ── Sobre mí ──────────────────────────────────────── */}
      {tab === 'sobre-mi' && (
        <section className="admin-card">
          <h2>Tu historia</h2>
          <p className="admin-hint" style={{ marginBottom: 'var(--space-5)' }}>
            Es lo que más leen antes de escribirte. Habla en primera persona.
          </p>

          <Field
            label="Frase pequeña de arriba"
            value={c.about?.eyebrow}
            onChange={(v) => edit('about', { eyebrow: v })}
          />
          <Field
            label="Título"
            value={c.about?.title}
            onChange={(v) => edit('about', { title: v })}
          />
          <Field
            label="Saludo"
            hint="Sale resaltado en verde."
            value={c.about?.intro}
            onChange={(v) => edit('about', { intro: v })}
          />

          {(c.about?.paragraphs || []).map((paragraph, i) => (
            <Field
              key={i}
              label={`Párrafo ${i + 1}`}
              rows={4}
              value={paragraph}
              onChange={(v) => {
                const next = [...c.about.paragraphs];
                next[i] = v;
                edit('about', { paragraphs: next });
              }}
            />
          ))}

          <button
            type="button"
            className="abtn abtn--secondary"
            style={{ marginBottom: 'var(--space-5)' }}
            onClick={() => edit('about', { paragraphs: [...(c.about?.paragraphs || []), ''] })}
          >
            <Icon name="plus" size={16} />
            Añadir otro párrafo
          </button>

          <div className="content-media">
            <div>
              <h3>Tu foto</h3>
              <p className="admin-hint">Un retrato tuyo, vertical. La ven en la portada y en Sobre mí.</p>
            </div>

            {c.aboutPhoto?.fallback && <img src={c.aboutPhoto.fallback} alt="Tu retrato actual" />}

            <input
              ref={aboutInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                uploadMedia('aboutPhoto', e.target.files[0]);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              className="abtn abtn--secondary"
              onClick={() => aboutInput.current?.click()}
              disabled={uploadingKey === 'aboutPhoto'}
            >
              <Icon name="upload" size={16} />
              {uploadingKey === 'aboutPhoto' ? 'Subiendo...' : 'Cambiar mi foto'}
            </button>
          </div>

          <button
            type="button"
            className="abtn abtn--primary"
            onClick={() => saveKey('about')}
            disabled={saving === 'about'}
          >
            <Icon name="save" size={16} />
            {saving === 'about' ? 'Guardando...' : 'Guardar Sobre mí'}
          </button>
        </section>
      )}

      {/* ── Servicios ─────────────────────────────────────── */}
      {tab === 'servicios' && (
        <div className="content-list">
          {data.services.map((service) => (
            <section className="admin-card" key={service.id}>
              <Field
                label="Nombre del servicio"
                value={service.title}
                onChange={(v) =>
                  setData((d) => ({
                    ...d,
                    services: d.services.map((s) => (s.id === service.id ? { ...s, title: v } : s)),
                  }))
                }
              />
              <Field
                label="Descripción"
                rows={2}
                value={service.description}
                onChange={(v) =>
                  setData((d) => ({
                    ...d,
                    services: d.services.map((s) =>
                      s.id === service.id ? { ...s, description: v } : s,
                    ),
                  }))
                }
              />
              <Field
                label="Qué incluye"
                hint="Una cosa por línea."
                rows={4}
                value={(service.features || []).join('\n')}
                onChange={(v) =>
                  setData((d) => ({
                    ...d,
                    services: d.services.map((s) =>
                      s.id === service.id
                        ? { ...s, features: v.split('\n').map((f) => f.trim()).filter(Boolean) }
                        : s,
                    ),
                  }))
                }
              />
              <Field
                label="Precio"
                hint='Si no tienes precio fijo, deja "Cotizar".'
                value={service.priceLabel}
                onChange={(v) =>
                  setData((d) => ({
                    ...d,
                    services: d.services.map((s) =>
                      s.id === service.id ? { ...s, priceLabel: v } : s,
                    ),
                  }))
                }
              />

              <button
                type="button"
                className="abtn abtn--primary"
                onClick={() => saveService(service)}
                disabled={saving === service.id}
              >
                <Icon name="save" size={16} />
                {saving === service.id ? 'Guardando...' : 'Guardar'}
              </button>
            </section>
          ))}
        </div>
      )}

      {/* ── Testimonios ───────────────────────────────────── */}
      {tab === 'testimonios' && (
        <>
          <div className="admin-section-title">
            <p className="admin-hint">
              Lo que dicen tus clientes. Pídeles permiso antes de publicar su nombre.
            </p>
            <button
              type="button"
              className="abtn abtn--primary"
              onClick={() => setNewTestimonial(EMPTY_TESTIMONIAL)}
            >
              <Icon name="plus" size={16} />
              Añadir testimonio
            </button>
          </div>

          <div className="content-list">
            {newTestimonial && (
              <section className="admin-card content-new">
                <h3>Nuevo testimonio</h3>
                <Field
                  label="Nombre del cliente"
                  value={newTestimonial.author}
                  onChange={(v) => setNewTestimonial((t) => ({ ...t, author: v }))}
                />
                <Field
                  label="Tipo de evento"
                  value={newTestimonial.eventType}
                  onChange={(v) => setNewTestimonial((t) => ({ ...t, eventType: v }))}
                />
                <Field
                  label="Lo que dijo"
                  rows={4}
                  value={newTestimonial.text}
                  onChange={(v) => setNewTestimonial((t) => ({ ...t, text: v }))}
                />
                <div className="content-row-actions">
                  <button
                    type="button"
                    className="abtn abtn--primary"
                    onClick={() => saveTestimonial(newTestimonial)}
                    disabled={isBusy}
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    className="abtn abtn--ghost"
                    onClick={() => setNewTestimonial(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </section>
            )}

            {data.testimonials.map((t) => (
              <section className="admin-card" key={t.id}>
                {t.isDemo && <span className="badge badge--demo">Ejemplo</span>}

                <Field
                  label="Nombre del cliente"
                  value={t.author}
                  onChange={(v) =>
                    setData((d) => ({
                      ...d,
                      testimonials: d.testimonials.map((x) =>
                        x.id === t.id ? { ...x, author: v } : x,
                      ),
                    }))
                  }
                />
                <Field
                  label="Tipo de evento"
                  value={t.eventType}
                  onChange={(v) =>
                    setData((d) => ({
                      ...d,
                      testimonials: d.testimonials.map((x) =>
                        x.id === t.id ? { ...x, eventType: v } : x,
                      ),
                    }))
                  }
                />
                <Field
                  label="Lo que dijo"
                  rows={4}
                  value={t.text}
                  onChange={(v) =>
                    setData((d) => ({
                      ...d,
                      testimonials: d.testimonials.map((x) =>
                        x.id === t.id ? { ...x, text: v } : x,
                      ),
                    }))
                  }
                />

                <label className="aswitch">
                  <input
                    type="checkbox"
                    checked={t.isPublished}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        testimonials: d.testimonials.map((x) =>
                          x.id === t.id ? { ...x, isPublished: e.target.checked } : x,
                        ),
                      }))
                    }
                  />
                  <span className="aswitch__track" />
                  <span className="aswitch__label">Visible en el sitio</span>
                </label>

                <div className="content-row-actions">
                  <button
                    type="button"
                    className="abtn abtn--primary"
                    onClick={() => saveTestimonial(t)}
                    disabled={isBusy}
                  >
                    <Icon name="save" size={16} />
                    Guardar
                  </button>
                  <button
                    type="button"
                    className="abtn abtn--ghost"
                    onClick={() => setToDelete(t)}
                  >
                    <Icon name="trash" size={16} />
                    Eliminar
                  </button>
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      {/* ── Contacto y redes ──────────────────────────────── */}
      {tab === 'contacto' && (
        <section className="admin-card">
          <h2>Cómo te contactan</h2>
          <p className="admin-hint" style={{ marginBottom: 'var(--space-5)' }}>
            Estos datos salen en el pie de página, en Contacto y en el botón verde de WhatsApp.
          </p>

          <Field
            label="Número de WhatsApp"
            hint="Con el indicativo del país y sin espacios ni signos. Ej: 573001234567"
            value={c.contact?.whatsapp}
            onChange={(v) => edit('contact', { whatsapp: v })}
          />
          <Field
            label="Mensaje que llega escrito al abrir WhatsApp"
            rows={2}
            value={c.contact?.whatsappMessage}
            onChange={(v) => edit('contact', { whatsappMessage: v })}
          />
          <div className="afield-row">
            <Field
              label="Teléfono"
              value={c.contact?.phone}
              onChange={(v) => edit('contact', { phone: v })}
            />
            <Field
              label="Correo"
              type="email"
              value={c.contact?.email}
              onChange={(v) => edit('contact', { email: v })}
            />
          </div>
          <Field
            label="Dirección"
            value={c.contact?.address}
            onChange={(v) => edit('contact', { address: v })}
          />
          <Field
            label="Horario"
            value={c.contact?.schedule}
            onChange={(v) => edit('contact', { schedule: v })}
          />

          <button
            type="button"
            className="abtn abtn--primary"
            onClick={() => saveKey('contact')}
            disabled={saving === 'contact'}
            style={{ marginBottom: 'var(--space-7)' }}
          >
            <Icon name="save" size={16} />
            {saving === 'contact' ? 'Guardando...' : 'Guardar datos de contacto'}
          </button>

          <h2>Tus redes</h2>
          <p className="admin-hint" style={{ marginBottom: 'var(--space-4)' }}>
            Pega el enlace completo. Si lo dejas vacío, ese icono no aparece en el sitio.
          </p>

          {(c.social || []).map((network, i) => (
            <Field
              key={network.network}
              label={network.label}
              type="url"
              value={network.url}
              onChange={(v) => {
                const next = [...c.social];
                next[i] = { ...network, url: v };
                setData((d) => ({ ...d, content: { ...d.content, social: next } }));
              }}
            />
          ))}

          <button
            type="button"
            className="abtn abtn--primary"
            onClick={() => saveKey('social')}
            disabled={saving === 'social'}
          >
            <Icon name="save" size={16} />
            {saving === 'social' ? 'Guardando...' : 'Guardar mis redes'}
          </button>
        </section>
      )}

      {toDelete && (
        <ConfirmDialog
          title={`¿Eliminar el testimonio de ${toDelete.author}?`}
          confirmLabel="Sí, eliminar"
          isBusy={isBusy}
          onConfirm={async () => {
            setIsBusy(true);
            try {
              await api.delete(`/api/admin/testimonials/${toDelete.id}`);
              setData((d) => ({
                ...d,
                testimonials: d.testimonials.filter((t) => t.id !== toDelete.id),
              }));
              setToDelete(null);
              toast.success('Testimonio eliminado.');
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
