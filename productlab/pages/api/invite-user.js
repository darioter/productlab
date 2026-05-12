import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const ADMIN_EMAIL = 'dario@dali-arquitectura.com.ar';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verify session
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No autorizado' });
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Sesión inválida' });

  // Verify admin
  if (user.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Solo el administrador puede invitar usuarios' });

  const { email, nombre, role = 'viewer', action = 'add' } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  if (action === 'remove') {
    const { error } = await supabase.from('allowed_users').delete().eq('email', email.toLowerCase().trim());
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, message: 'Usuario removido' });
  }

  const { data, error } = await supabase.from('allowed_users').upsert({
    email: email.toLowerCase().trim(),
    nombre: nombre || email.split('@')[0],
    role,
    invited_by: user.id,
  }, { onConflict: 'email' }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true, user: data });
}
