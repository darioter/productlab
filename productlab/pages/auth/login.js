import { useState } from 'react';
import { supabase } from '../lib/supabase';
import Head from 'next/head';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleMagicLink(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` }
    });
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    });
  }

  return (
    <>
      <Head>
        <title>ProductLab — Ingresar</title>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#080C10;color:#E8F0F8;font-family:'Syne',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;}
        body::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(0,229,160,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,160,0.02) 1px,transparent 1px);background-size:40px 40px;pointer-events:none;}
        .card{background:#0D1219;border:1px solid rgba(255,255,255,0.07);padding:40px;width:100%;max-width:420px;position:relative;z-index:1;}
        .card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#00E5A0,transparent);}
        .logo{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#00E5A0;margin-bottom:6px;}
        .logo span{color:#5A7A8A;}
        h1{font-size:24px;font-weight:800;margin-bottom:6px;}
        .sub{font-size:13px;color:#5A7A8A;margin-bottom:32px;font-family:'JetBrains Mono',monospace;}
        .btn-google{width:100%;padding:12px;background:#131B24;border:1px solid rgba(255,255,255,0.1);color:#E8F0F8;font-family:'Syne',sans-serif;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:all 0.2s;margin-bottom:20px;}
        .btn-google:hover{border-color:rgba(255,255,255,0.2);background:#1A2535;}
        .divider{display:flex;align-items:center;gap:12px;margin-bottom:20px;}
        .divider::before,.divider::after{content:'';flex:1;height:1px;background:rgba(255,255,255,0.07);}
        .divider span{font-family:'JetBrains Mono',monospace;font-size:10px;color:#5A7A8A;letter-spacing:0.1em;text-transform:uppercase;}
        label{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#5A7A8A;display:block;margin-bottom:8px;}
        input{width:100%;background:#080C10;border:1px solid rgba(255,255,255,0.07);color:#E8F0F8;font-family:'Syne',sans-serif;font-size:14px;padding:12px 14px;outline:none;transition:border-color 0.2s;margin-bottom:14px;}
        input:focus{border-color:rgba(0,229,160,0.4);}
        input::placeholder{color:#5A7A8A;}
        .btn-primary{width:100%;background:#00E5A0;color:#000;border:none;padding:12px;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;}
        .btn-primary:hover{filter:brightness(1.1);}
        .btn-primary:disabled{opacity:0.5;cursor:not-allowed;}
        .success{background:rgba(0,229,160,0.08);border:1px solid rgba(0,229,160,0.3);padding:14px;font-size:13px;color:#00E5A0;margin-top:16px;line-height:1.6;}
        .error{background:rgba(255,71,87,0.08);border:1px solid rgba(255,71,87,0.3);padding:12px;font-size:12px;color:#FF4757;margin-top:12px;font-family:'JetBrains Mono',monospace;}
      `}</style>
      <div className="card">
        <div className="logo">Product<span>Lab</span></div>
        <h1>Bienvenido</h1>
        <div className="sub">// sistema de e-commerce inteligente</div>

        <button className="btn-google" onClick={handleGoogle}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/><path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/><path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.31z"/></svg>
          Continuar con Google
        </button>

        <div className="divider"><span>o con email</span></div>

        {!sent ? (
          <form onSubmit={handleMagicLink}>
            <label>Email</label>
            <input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <button className="btn-primary" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar magic link →'}
            </button>
            {error && <div className="error">{error}</div>}
          </form>
        ) : (
          <div className="success">
            ✅ Revisá tu email — te enviamos un link para ingresar. Podés cerrar esta pestaña.
          </div>
        )}
      </div>
    </>
  );
}
