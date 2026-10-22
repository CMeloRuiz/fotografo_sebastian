/**
 * Crea o actualiza el usuario administrador.
 *
 *   node db/createAdmin.js correo@ejemplo.com "una contraseña larga"
 *
 * Sirve tanto para dar de alta al fotógrafo en producción como para
 * recuperar el acceso si olvida la contraseña.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import supabase from '../src/db/supabase.js';

const [, , emailArg, passwordArg] = process.argv;
const email = (emailArg || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = passwordArg || process.env.ADMIN_PASSWORD || '';

if (!email || !password) {
  console.error('Uso: node db/createAdmin.js <correo> <contraseña>');
  process.exit(1);
}

if (password.length < 10) {
  console.error('La contraseña debe tener al menos 10 caracteres.');
  process.exit(1);
}

const password_hash = await bcrypt.hash(password, 12);

const { data: existing } = await supabase
  .from('admins')
  .select('id')
  .eq('email', email)
  .maybeSingle();

if (existing) {
  const { error } = await supabase
    .from('admins')
    .update({ password_hash })
    .eq('id', existing.id);
  if (error) throw error;
  console.log(`Contraseña actualizada para ${email}`);
} else {
  const { error } = await supabase.from('admins').insert({ email, password_hash });
  if (error) throw error;
  console.log(`Administrador creado: ${email}`);
}

process.exit(0);
