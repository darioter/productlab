import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No autorizado' });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Sesión inválida' });

  const { nombre, nicho, categoria, canal, score, segmento, precio_venta,
    costo_estimado, margen_estimado, demanda_mensual, competencia, fecha_clave, data_json } = req.body;

  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });

  const { data, error } = await supabase.from('analyses').insert({
    user_id: user.id, nombre, nicho, categoria, canal, score, segmento,
    precio_venta, costo_estimado, margen_estimado, demanda_mensual,
    competencia, fecha_clave, data_json
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true, analysis: data });
}
