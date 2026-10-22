import { createClient } from '@supabase/supabase-js';
import config from '../config/env.js';

/**
 * Cliente de Supabase con la service_role key.
 *
 * Salta RLS a proposito: toda la autorizacion la decide este backend, que es
 * quien sabe si la peticion viene del panel o del sitio publico. La clave
 * nunca sale del servidor.
 */
export const supabase = createClient(config.supabase.url, config.supabase.serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export default supabase;
