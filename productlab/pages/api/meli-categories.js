export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query requerido' });

  try {
    const resp = await fetch(
      `https://api.mercadolibre.com/sites/MLA/domain_discovery/search?limit=8&q=${encodeURIComponent(q)}`
    );
    const data = await resp.json();
    return res.status(200).json(data);
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
