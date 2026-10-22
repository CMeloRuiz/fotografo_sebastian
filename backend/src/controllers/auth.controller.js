import bcrypt from 'bcryptjs';
import { z } from 'zod';
import supabase from '../db/supabase.js';
import { issueSession, clearSession } from '../middleware/auth.js';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Correo no válido.'),
  password: z.string().min(1, 'Escribe tu contraseña.'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Escribe tu contraseña actual.'),
    newPassword: z
      .string()
      .min(10, 'La nueva contraseña debe tener al menos 10 caracteres.')
      .max(200),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ['newPassword'],
    message: 'La nueva contraseña debe ser distinta de la actual.',
  });

export async function login(req, res) {
  const { email, password } = req.body;

  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  /*
   * Si el correo no existe igualmente comparamos contra un hash ficticio.
   * Sin esto, un correo inexistente responderia mucho mas rapido que uno
   * real y eso revela que cuentas existen.
   */
  const hash = admin?.password_hash || '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';
  const ok = await bcrypt.compare(password, hash);

  if (!admin || !ok) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  }

  issueSession(res, admin);
  await supabase.from('admins').update({ last_login_at: new Date().toISOString() }).eq('id', admin.id);

  return res.json({ admin: { id: admin.id, email: admin.email, name: admin.name } });
}

export async function logout(req, res) {
  clearSession(res);
  return res.json({ ok: true });
}

export async function me(req, res) {
  const { data: admin } = await supabase
    .from('admins')
    .select('id, email, name, last_login_at')
    .eq('id', req.admin.id)
    .maybeSingle();

  if (!admin) {
    clearSession(res);
    return res.status(401).json({ error: 'Tu usuario ya no existe.' });
  }

  return res.json({ admin });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('id', req.admin.id)
    .maybeSingle();

  if (!admin) return res.status(401).json({ error: 'Tu usuario ya no existe.' });

  const ok = await bcrypt.compare(currentPassword, admin.password_hash);
  if (!ok) return res.status(400).json({ error: 'La contraseña actual no es correcta.' });

  const password_hash = await bcrypt.hash(newPassword, 12);
  const { error } = await supabase.from('admins').update({ password_hash }).eq('id', admin.id);

  if (error) {
    console.error('[auth] no se pudo cambiar la contraseña:', error);
    return res.status(500).json({ error: 'No se pudo guardar la nueva contraseña.' });
  }

  // Cerrar la sesion obliga a entrar con la contrasena nueva y confirma
  // al fotografo que el cambio surtio efecto.
  clearSession(res);
  return res.json({ ok: true });
}

export default { login, logout, me, changePassword, loginSchema, changePasswordSchema };
