import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No autorizado — no hay token' });

  const token = authHeader.replace('Bearer ', '');

  // Use anon client to verify the user token
  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Token inválido: ' + (authError?.message || 'sin usuario') });
  }

  const {
    nombre, nicho, categoria, canal, score, segmento,
    precio_venta, costo_estimado, margen_estimado,
    demanda_mensual, competencia, fecha_clave, data_json
  } = req.body;

  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });

  // Use user-scoped client (passes RLS)
  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data, error } = await supabaseUser.from('analyses').insert({
    user_id: user.id,
    nombre, nicho, categoria, canal,
    score: parseInt(score) || 0,
    segmento, precio_venta, costo_estimado,
    margen_estimado, demanda_mensual, competencia,
    fecha_clave, data_json
  }).select().single();

  if (error) {
    return res.status(500).json({ error: error.message, code: error.code, details: error.details });
  }

  return res.status(200).json({ success: true, analysis: data });
}
