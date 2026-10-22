import { useState } from 'react';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import Reveal from '../components/ui/Reveal';
import { useSiteData } from '../context/SiteDataProvider';
import useSeo from '../hooks/useSeo';
import { api, hasBackend } from '../lib/api';
import { whatsappLink } from '../lib/whatsapp';
import './Contact.css';

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  eventType: '',
  eventDate: '',
  message: '',
};

// Sin barras invertidas a proposito: basta con exigir algo@algo.algo
const EMAIL_RE = /^[^@\s]+@[^@\s]+[.][^@\s]{2,}$/;

function validate(values) {
  const errors = {};
  if (values.name.trim().length < 2) errors.name = 'Escribe tu nombre.';
  if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Revisa el correo.';
  if (values.phone.replace(/[^0-9]/g, '').length < 7) errors.phone = 'Escribe un teléfono válido.';
  if (!values.eventType) errors.eventType = 'Elige el tipo de evento.';
  if (values.message.trim().length < 10) errors.message = 'Cuéntame un poco más (mínimo 10 caracteres).';
  return errors;
}

export default function Contact() {
  const { content } = useSiteData();
  const { contact, eventTypes } = content;

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [serverError, setServerError] = useState('');

  useSeo({
    title: 'Contacto',
    description:
      'Escríbeme para cotizar la cobertura de tu matrimonio, quince años, bautizo o evento musical. Respondo por WhatsApp el mismo día.',
    path: '/contacto',
  });

  const wa = whatsappLink(contact.whatsapp, contact.whatsappMessage);

  const update = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setServerError('');

    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Lleva el foco al primer campo con error, para no obligar a buscarlo
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }

    // Sin backend el formulario no se pierde: se traslada a WhatsApp
    if (!hasBackend) {
      const text = [
        `Hola Sebastián, soy ${values.name}.`,
        `Evento: ${values.eventType}${values.eventDate ? ` (${values.eventDate})` : ''}`,
        `Teléfono: ${values.phone}`,
        `Correo: ${values.email}`,
        '',
        values.message,
      ].join('\n');
      window.open(whatsappLink(contact.whatsapp, text), '_blank', 'noopener');
      setStatus('sent');
      setValues(EMPTY);
      return;
    }

    setStatus('sending');
    try {
      await api.post('/api/contact', values);
      setStatus('sent');
      setValues(EMPTY);
    } catch (error) {
      setStatus('error');
      setServerError(
        error.status === 429
          ? 'Has enviado varios mensajes seguidos. Espera un momento e inténtalo de nuevo.'
          : 'No se pudo enviar el mensaje. Escríbeme por WhatsApp y lo resolvemos al instante.',
      );
    }
  };

  const fieldProps = (name) => ({
    id: name,
    name,
    value: values[name],
    onChange: update(name),
    'aria-invalid': errors[name] ? 'true' : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  });

  return (
    <>
      <PageHero
        eyebrow="Contacto"
        title="Conversemos"
        lead="Cuéntame qué celebras y te respondo con disponibilidad y precio. Sin compromiso."
      />

      <section className="section contact">
        <div className="container contact__grid">
          <Reveal variant="left" className="contact__info">
            <h2>Dónde encontrarme</h2>

            <ul className="contact__list">
              <li>
                <span className="contact__icon"><Icon name="mapPin" size={19} /></span>
                <div>
                  <h3>Ubicación</h3>
                  <p>{contact.address}</p>
                </div>
              </li>
              <li>
                <span className="contact__icon"><Icon name="phone" size={19} /></span>
                <div>
                  <h3>Teléfono</h3>
                  <p><a href={`tel:${contact.phone.replace(/[^+0-9]/g, '')}`}>{contact.phone}</a></p>
                </div>
              </li>
              <li>
                <span className="contact__icon"><Icon name="mail" size={19} /></span>
                <div>
                  <h3>Correo</h3>
                  <p><a href={`mailto:${contact.email}`}>{contact.email}</a></p>
                </div>
              </li>
              <li>
                <span className="contact__icon"><Icon name="clock" size={19} /></span>
                <div>
                  <h3>Horario</h3>
                  <p>{contact.schedule}</p>
                </div>
              </li>
            </ul>

            {wa && (
              <a href={wa} className="btn btn--primary contact__wa" target="_blank" rel="noopener noreferrer">
                <Icon name="whatsapp" size={18} />
                Escríbeme por WhatsApp
              </a>
            )}

            <p className="contact__note">
              Suelo responder más rápido por WhatsApp que por correo.
            </p>
          </Reveal>

          <Reveal variant="right" className="contact__form-wrap" delay={110}>
            {status === 'sent' ? (
              <div className="contact__success" role="status">
                <span className="contact__success-icon"><Icon name="check" size={28} /></span>
                <h2>¡Mensaje enviado!</h2>
                <p>
                  Gracias por escribir. Te respondo lo antes posible, normalmente el mismo día.
                </p>
                <button type="button" className="btn btn--ghost" onClick={() => setStatus('idle')}>
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form className="contact__form" onSubmit={onSubmit} noValidate>
                <h2>Cuéntame de tu evento</h2>

                <div className="field">
                  <label htmlFor="name">Nombre completo</label>
                  <input type="text" autoComplete="name" required {...fieldProps('name')} />
                  {errors.name && <p className="field__error" id="name-error">{errors.name}</p>}
                </div>

                <div className="field-row">
                  <div className="field">
                    <label htmlFor="email">Correo electrónico</label>
                    <input type="email" autoComplete="email" required {...fieldProps('email')} />
                    {errors.email && <p className="field__error" id="email-error">{errors.email}</p>}
                  </div>

                  <div className="field">
                    <label htmlFor="phone">Teléfono</label>
                    <input type="tel" autoComplete="tel" required {...fieldProps('phone')} />
                    {errors.phone && <p className="field__error" id="phone-error">{errors.phone}</p>}
                  </div>
                </div>

                <div className="field-row">
                  <div className="field">
                    <label htmlFor="eventType">Tipo de evento</label>
                    <select required {...fieldProps('eventType')}>
                      <option value="">Selecciona una opción</option>
                      {eventTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {errors.eventType && (
                      <p className="field__error" id="eventType-error">{errors.eventType}</p>
                    )}
                  </div>

                  <div className="field">
                    <label htmlFor="eventDate">
                      Fecha tentativa <span className="field__optional">(opcional)</span>
                    </label>
                    <input type="date" {...fieldProps('eventDate')} />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="message">Tu mensaje</label>
                  <textarea rows="5" required {...fieldProps('message')} />
                  {errors.message && <p className="field__error" id="message-error">{errors.message}</p>}
                </div>

                {serverError && (
                  <p className="contact__server-error" role="alert">{serverError}</p>
                )}

                <button type="submit" className="btn btn--primary contact__submit" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Enviando...' : 'Enviar mensaje'}
                  {status !== 'sending' && <Icon name="send" size={18} />}
                </button>
              </form>
            )}
          </Reveal>
        </div>
      </section>

      {contact.mapEmbed && (
        <section className="contact__map">
          <iframe
            src={contact.mapEmbed}
            title={`Ubicación: ${contact.address}`}
            width="100%"
            height="420"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </section>
      )}
    </>
  );
}
