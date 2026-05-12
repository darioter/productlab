import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ allowed: false });

  const { data, error } = await supabase
    .from('allowed_users')
    .select('email, nombre, role')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error || !data) return res.status(200).json({ allowed: false });
  return res.status(200).json({ allowed: true, role: data.role, nombre: data.nombre });
}
