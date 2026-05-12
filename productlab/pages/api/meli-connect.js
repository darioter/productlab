export default function handler(req, res) {
  const appId = process.env.MELI_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/meli-callback`;
  const authUrl = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.redirect(authUrl);
}
