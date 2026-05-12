export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Dolarito API - free, no auth required
    const resp = await fetch('https://dolarapi.com/v1/dolares/oficial', {
      headers: { 'User-Agent': 'ProductLab/1.0' }
    });
    const data = await resp.json();

    if (data && data.venta) {
      return res.status(200).json({
        compra: data.compra,
        venta: data.venta,
        promedio: ((data.compra + data.venta) / 2).toFixed(2),
        fuente: 'BNA — Banco Nación Argentina',
        fecha: data.fechaActualizacion || new Date().toISOString(),
      });
    }

    // Fallback to bluelytics if dolarapi fails
    const fallback = await fetch('https://api.bluelytics.com.ar/v2/latest');
    const fbData = await fallback.json();
    const oficial = fbData?.oficial;
    if (oficial) {
      return res.status(200).json({
        compra: oficial.value_buy,
        venta: oficial.value_sell,
        promedio: ((oficial.value_buy + oficial.value_sell) / 2).toFixed(2),
        fuente: 'BNA — Banco Nación Argentina',
        fecha: new Date().toISOString(),
      });
    }

    throw new Error('No se pudo obtener la cotización');
  } catch (err) {
    // Last resort fallback
    return res.status(200).json({
      compra: 1000,
      venta: 1060,
      promedio: '1030',
      fuente: 'Estimado — API no disponible',
      fecha: new Date().toISOString(),
      fallback: true,
    });
  }
}
