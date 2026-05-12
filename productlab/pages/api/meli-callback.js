export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error) {
    return res.redirect('/dashboard?meli=error&reason=' + error);
  }

  if (!code) {
    return res.redirect('/dashboard?meli=error&reason=no_code');
  }

  try {
    // Exchange code for access token
    const tokenResp = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.MELI_APP_ID,
        client_secret: process.env.MELI_SECRET_KEY,
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/meli-callback`,
      }),
    });

    const tokenData = await tokenResp.json();

    if (!tokenData.access_token) {
      return res.redirect('/dashboard?meli=error&reason=token_failed');
    }

    // Get MeLi user info
    const userResp = await fetch('https://api.mercadolibre.com/users/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const meliUser = await userResp.json();

    // Store tokens in cookie (httpOnly, secure)
    const tokenPayload = JSON.stringify({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      user_id: meliUser.id,
      nickname: meliUser.nickname,
      connected_at: Date.now(),
    });

    res.setHeader('Set-Cookie', [
      `meli_session=${encodeURIComponent(tokenPayload)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=21600`,
    ]);

    return res.redirect('/dashboard?meli=connected&nickname=' + meliUser.nickname);
  } catch (err) {
    return res.redirect('/dashboard?meli=error&reason=' + err.message);
  }
}
