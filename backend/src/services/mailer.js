import nodemailer from 'nodemailer';
import config from '../config/env.js';

/**
 * Aviso por correo de cada solicitud del formulario.
 *
 * El mensaje ya quedo guardado en la base de datos antes de llegar aqui, asi
 * que si el SMTP falla no se pierde nada: solo se registra el fallo y el
 * fotografo lo vera igual en el panel.
 */

let transporter = null;

function getTransporter() {
  if (!config.mail.host || !config.mail.user) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.port === 465,
      auth: { user: config.mail.user, pass: config.mail.pass },
    });
  }
  return transporter;
}

/** Escapa el contenido del visitante antes de meterlo en el HTML del correo. */
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export async function sendContactNotification(message) {
  const mailer = getTransporter();
  const to = config.mail.to;

  if (!mailer || !to) {
    console.warn('[mailer] SMTP sin configurar: el mensaje solo queda en la base de datos.');
    return { sent: false, reason: 'smtp-no-configurado' };
  }

  const rows = [
    ['Nombre', message.name],
    ['Correo', message.email],
    ['Teléfono', message.phone],
    ['Tipo de evento', message.eventType],
    ['Fecha tentativa', message.eventDate || 'Sin definir'],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#888">${label}</td>` +
        `<td style="padding:6px 0"><strong>${escapeHtml(value)}</strong></td></tr>`,
    )
    .join('');

  await mailer.sendMail({
    from: config.mail.from,
    to,
    replyTo: message.email,
    subject: `Nueva solicitud: ${message.eventType} - ${message.name}`,
    text:
      `Nueva solicitud desde el sitio web\n\n` +
      `Nombre: ${message.name}\nCorreo: ${message.email}\nTeléfono: ${message.phone}\n` +
      `Evento: ${message.eventType}\nFecha: ${message.eventDate || 'Sin definir'}\n\n` +
      `${message.message}\n`,
    html:
      `<div style="font-family:system-ui,sans-serif;max-width:560px">` +
      `<h2 style="color:#0f0f0f">Nueva solicitud desde el sitio web</h2>` +
      `<table style="font-size:14px">${rows}</table>` +
      `<p style="margin-top:18px;padding:14px;background:#f5f5f5;border-left:3px solid #b6e925;white-space:pre-wrap">` +
      `${escapeHtml(message.message)}</p>` +
      `<p style="font-size:12px;color:#888">Responde a este correo para contestarle directamente.</p>` +
      `</div>`,
  });

  return { sent: true };
}

export default { sendContactNotification };
