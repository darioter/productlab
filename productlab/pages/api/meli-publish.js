export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Get MeLi token from cookie
  const cookieHeader = req.headers.cookie || '';
  const meliCookie = cookieHeader.split(';').find(c => c.trim().startsWith('meli_session='));
  if (!meliCookie) return res.status(401).json({ error: 'No conectado a MercadoLibre. Conectá tu cuenta primero.' });

  let meliSession;
  try {
    meliSession = JSON.parse(decodeURIComponent(meliCookie.split('=')[1]));
  } catch(e) {
    return res.status(401).json({ error: 'Sesión MeLi inválida' });
  }

  const { nombre, descripcion, precio, categoria_id, condicion, stock, envio_gratis } = req.body;

  if (!nombre || !precio || !categoria_id) {
    return res.status(400).json({ error: 'Faltan campos requeridos: nombre, precio, categoria_id' });
  }

  // Build MeLi listing
  const listing = {
    title: nombre,
    category_id: categoria_id,
    price: parseFloat(precio),
    currency_id: 'ARS',
    available_quantity: parseInt(stock) || 1,
    buying_mode: 'buy_it_now',
    condition: condicion || 'new',
    listing_type_id: 'gold_special', // Publicación premium
    description: { plain_text: descripcion || nombre },
    shipping: {
      mode: 'me2',
      free_shipping: envio_gratis === true,
    },
  };

  try {
    const publishResp = await fetch(`https://api.mercadolibre.com/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${meliSession.access_token}`,
      },
      body: JSON.stringify(listing),
    });

    const publishData = await publishResp.json();

    if (publishData.error) {
      return res.status(400).json({ error: publishData.message || publishData.error, details: publishData });
    }

    return res.status(200).json({
      success: true,
      item_id: publishData.id,
      permalink: publishData.permalink,
      status: publishData.status,
      title: publishData.title,
      price: publishData.price,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
