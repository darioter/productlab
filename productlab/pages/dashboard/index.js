import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

const ESTADOS = {
  ordenado:   { label: 'Ordenado',     color: '#5A7A8A', icon: '📋' },
  produccion: { label: 'En producción', color: '#FFB800', icon: '🏭' },
  en_barco:   { label: 'En tránsito',  color: '#0066FF', icon: '🚢' },
  aduana:     { label: 'En aduana',    color: '#FF6A00', icon: '🛃' },
  live:       { label: 'Live',         color: '#00E5A0', icon: '🟢' },
  pausado:    { label: 'Pausado',      color: '#FF4757', icon: '⏸' },
  vendido:    { label: 'Vendido',      color: '#96BF48', icon: '✅' },
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('productos');
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [saving, setSaving] = useState(false);
  const [meliConnected, setMeliConnected] = useState(false);
  const [meliNickname, setMeliNickname] = useState('');
  const [showPublish, setShowPublish] = useState(false);
  const [publishProduct, setPublishProduct] = useState(null);
  const [publishData, setPublishData] = useState({ nombre:'', descripcion:'', precio:'', categoria_id:'', categoria_nombre:'', stock:'1', envio_gratis:true, condicion:'new' });
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [dolar, setDolar] = useState(null);
  const [newProduct, setNewProduct] = useState({
    nombre: '', proveedor: '', costo_real: '', costo_envio: '',
    costo_aduana: '', costo_packaging: '', unidades: '',
    precio_venta: '', canal: 'amazon', estado: 'ordenado',
    fecha_orden: new Date().toISOString().split('T')[0], notas: ''
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth/login'); return; }
      setUser(session.user);
      loadData(session.user.id);
    });
    // Fetch BNA dollar rate
    fetch('/api/dolar').then(r=>r.json()).then(d=>setDolar(d)).catch(()=>{});

    // Check MeLi connection from URL params
    const params = new URLSearchParams(window.location.search);
    if (params.get('meli') === 'connected') {
      setMeliConnected(true);
      setMeliNickname(params.get('nickname') || '');
      window.history.replaceState({}, '', '/dashboard');
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') router.push('/auth/login');
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadData(userId) {
    setLoading(true);
    const [{ data: prof }, { data: prods }, { data: anal }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('products').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('analyses').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
    ]);
    setProfile(prof);
    setProducts(prods || []);
    setAnalyses(anal || []);
    setLoading(false);
  }

  async function saveProduct(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('products').insert({
      ...newProduct,
      user_id: user.id,
      costo_real: parseFloat(newProduct.costo_real) || 0,
      costo_envio: parseFloat(newProduct.costo_envio) || 0,
      costo_aduana: parseFloat(newProduct.costo_aduana) || 0,
      costo_packaging: parseFloat(newProduct.costo_packaging) || 0,
      unidades: parseInt(newProduct.unidades) || 0,
      precio_venta: parseFloat(newProduct.precio_venta) || 0,
    });
    if (!error) {
      setShowNewProduct(false);
      setNewProduct({ nombre:'',proveedor:'',costo_real:'',costo_envio:'',costo_aduana:'',costo_packaging:'',unidades:'',precio_venta:'',canal:'amazon',estado:'ordenado',fecha_orden:new Date().toISOString().split('T')[0],notas:'' });
      loadData(user.id);
    }
    setSaving(false);
  }

  async function updateEstado(productId, nuevoEstado) {
    const prod = products.find(p => p.id === productId);
    await supabase.from('product_updates').insert({
      product_id: productId,
      estado_anterior: prod.estado,
      estado_nuevo: nuevoEstado,
    });
    await supabase.from('products').update({ estado: nuevoEstado }).eq('id', productId);
    loadData(user.id);
  }

  async function deleteProduct(id) {
    if (!confirm('¿Eliminar este producto?')) return;
    await supabase.from('products').delete().eq('id', id);
    loadData(user.id);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

  function openPublish(product) {
    setPublishProduct(product);
    setPublishResult(null);
    const tcVenta = dolar?.venta || 1060;
    const precioARS = product.precio_venta ? Math.round(product.precio_venta * tcVenta) : '';
    setPublishData({
      nombre: product.nombre,
      descripcion: `${product.nombre}. Producto nuevo en perfectas condiciones.`,
      precio: precioARS,
      categoria_id: '',
      categoria_nombre: '',
      stock: product.unidades || '1',
      envio_gratis: true,
      condicion: 'new',
    });
    setCategorySuggestions([]);
    setShowPublish(true);
  }

  async function searchCategories(query) {
    if (query.length < 3) return;
    try {
      const resp = await fetch(`/api/meli-categories?q=${encodeURIComponent(query)}`);
      const data = await resp.json();
      setCategorySuggestions(Array.isArray(data) ? data.slice(0, 6) : []);
    } catch(e) {}
  }

  async function handlePublish(e) {
    e.preventDefault();
    if (!publishData.categoria_id) { alert('Seleccioná una categoría'); return; }
    setPublishing(true);
    setPublishResult(null);
    try {
      const resp = await fetch('/api/meli-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publishData),
      });
      const data = await resp.json();
      if (data.success) {
        setPublishResult({ success: true, ...data });
        // Update product estado to live
        await supabase.from('products').update({ estado: 'live', fecha_live: new Date().toISOString().split('T')[0] }).eq('id', publishProduct.id);
        loadData(user.id);
      } else {
        setPublishResult({ success: false, error: data.error });
      }
    } catch(err) {
      setPublishResult({ success: false, error: err.message });
    }
    setPublishing(false);
  }

  // STATS
  const totalInvertido = products.reduce((a, p) => a + (p.inversion_total || 0), 0);
  const productosLive = products.filter(p => p.estado === 'live').length;
  const productosEnCamino = products.filter(p => ['en_barco','aduana','produccion'].includes(p.estado)).length;

  if (loading) return (
    <div style={{background:'#080C10',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'JetBrains Mono',color:'#5A7A8A',fontSize:'12px',letterSpacing:'0.1em'}}>
      Cargando...
    </div>
  );

  return (
    <>
      <Head>
        <title>ProductLab — Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#080C10;color:#E8F0F8;font-family:'Syne',sans-serif;min-height:100vh;}
        body::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(0,229,160,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,160,0.018) 1px,transparent 1px);background-size:40px 40px;pointer-events:none;z-index:0;}
        .wrap{max-width:1060px;margin:0 auto;padding:0 20px;position:relative;z-index:1;}
        /* NAV */
        nav{border-bottom:1px solid rgba(255,255,255,0.07);padding:16px 0;display:flex;align-items:center;justify-content:space-between;margin-bottom:0;}
        .nav-logo{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#00E5A0;}
        .nav-logo span{color:#5A7A8A;}
        .nav-right{display:flex;align-items:center;gap:12px;}
        .nav-user{font-family:'JetBrains Mono',monospace;font-size:11px;color:#5A7A8A;}
        .btn-sm{font-family:'JetBrains Mono',monospace;font-size:10px;padding:6px 14px;border:1px solid rgba(255,255,255,0.1);color:#5A7A8A;background:none;cursor:pointer;letter-spacing:0.08em;text-transform:uppercase;transition:all 0.15s;}
        .btn-sm:hover{border-color:rgba(255,255,255,0.2);color:#E8F0F8;}
        .btn-scout{background:#00E5A0;color:#000;border:none;}
        .btn-scout:hover{filter:brightness(1.1);}
        .btn-meli{background:rgba(255,230,0,0.1);color:#FFE600;border:1px solid rgba(255,230,0,0.3);}
        .btn-meli:hover{background:rgba(255,230,0,0.15);}
        .btn-meli.connected{background:rgba(255,230,0,0.08);color:#FFE600;}
        .btn-publish{background:rgba(255,230,0,0.1);color:#FFE600;border:1px solid rgba(255,230,0,0.3);font-family:'JetBrains Mono',monospace;font-size:10px;padding:4px 12px;cursor:pointer;transition:all 0.15s;text-transform:uppercase;letter-spacing:0.06em;}
        .btn-publish:hover{background:rgba(255,230,0,0.2);}
        .publish-result-ok{background:rgba(0,229,160,0.08);border:1px solid rgba(0,229,160,0.3);padding:16px;margin-top:14px;}
        .publish-result-err{background:rgba(255,71,87,0.08);border:1px solid rgba(255,71,87,0.3);padding:16px;margin-top:14px;font-family:'JetBrains Mono',monospace;font-size:12px;color:#FF4757;}
        .cat-suggestion{padding:8px 12px;cursor:pointer;font-size:12px;border-bottom:1px solid rgba(255,255,255,0.05);transition:background 0.1s;}
        .cat-suggestion:hover{background:rgba(0,229,160,0.06);}
        .cat-list{background:#080C10;border:1px solid rgba(255,255,255,0.1);margin-top:-13px;margin-bottom:14px;}
        /* HERO */
        .dash-hero{padding:28px 0 20px;}
        .dash-hero h1{font-size:clamp(20px,3vw,30px);font-weight:800;margin-bottom:4px;}
        .dash-hero h1 span{color:#00E5A0;}
        .dash-hero p{font-family:'JetBrains Mono',monospace;font-size:11px;color:#5A7A8A;}
        /* STATS */
        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:24px;}
        .stat{background:#0D1219;border:1px solid rgba(255,255,255,0.07);padding:16px;}
        .stat-label{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:#5A7A8A;margin-bottom:8px;}
        .stat-value{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:500;}
        .stat-value.green{color:#00E5A0;}
        .stat-value.amber{color:#FFB800;}
        .stat-value.blue{color:#0066FF;}
        /* TABS */
        .tabs{display:flex;border:1px solid rgba(255,255,255,0.07);background:#0D1219;margin-bottom:20px;overflow:hidden;}
        .tab{flex:1;padding:12px;background:none;border:none;color:#5A7A8A;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;border-right:1px solid rgba(255,255,255,0.07);transition:all 0.15s;}
        .tab:last-child{border-right:none;}
        .tab.active{color:#00E5A0;background:rgba(0,229,160,0.05);}
        /* PRODUCTS */
        .product-list{display:flex;flex-direction:column;gap:10px;}
        .product-item{background:#0D1219;border:1px solid rgba(255,255,255,0.07);padding:18px 20px;display:grid;grid-template-columns:1fr auto;gap:16px;align-items:start;transition:border-color 0.2s;}
        .product-item:hover{border-color:rgba(255,255,255,0.12);}
        .pi-name{font-size:15px;font-weight:700;margin-bottom:4px;}
        .pi-meta{font-family:'JetBrains Mono',monospace;font-size:10px;color:#5A7A8A;display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;}
        .pi-metrics{display:flex;gap:16px;flex-wrap:wrap;}
        .pi-metric{display:flex;flex-direction:column;gap:2px;}
        .pi-metric-label{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:#5A7A8A;}
        .pi-metric-value{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500;}
        .pi-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px;}
        .estado-badge{font-family:'JetBrains Mono',monospace;font-size:10px;padding:4px 10px;border:1px solid;letter-spacing:0.08em;text-transform:uppercase;}
        .estado-select{background:#080C10;border:1px solid rgba(255,255,255,0.07);color:#E8F0F8;font-family:'JetBrains Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer;outline:none;letter-spacing:0.06em;}
        .btn-delete{font-family:'JetBrains Mono',monospace;font-size:10px;color:#FF4757;background:none;border:1px solid rgba(255,71,87,0.3);padding:4px 10px;cursor:pointer;transition:all 0.15s;}
        .btn-delete:hover{background:rgba(255,71,87,0.1);}
        /* ANALYSES */
        .analysis-list{display:flex;flex-direction:column;gap:8px;}
        .analysis-item{background:#0D1219;border:1px solid rgba(255,255,255,0.07);padding:14px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
        .ai-left h4{font-size:13px;font-weight:700;margin-bottom:3px;}
        .ai-left p{font-family:'JetBrains Mono',monospace;font-size:10px;color:#5A7A8A;}
        .ai-score{font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:500;}
        /* MODAL */
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;}
        .modal{background:#0D1219;border:1px solid rgba(255,255,255,0.1);width:100%;max-width:560px;max-height:90vh;overflow-y:auto;position:relative;}
        .modal::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#00E5A0,transparent);}
        .modal-header{padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;justify-content:space-between;}
        .modal-header h2{font-size:16px;font-weight:700;}
        .modal-close{font-family:'JetBrains Mono',monospace;font-size:10px;color:#5A7A8A;cursor:pointer;padding:4px 10px;border:1px solid rgba(255,255,255,0.1);}
        .modal-body{padding:24px;}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;}
        .form-field{display:flex;flex-direction:column;gap:6px;}
        .form-field.full{grid-column:1/-1;}
        .form-field label{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#5A7A8A;}
        .form-field input,.form-field select,.form-field textarea{background:#080C10;border:1px solid rgba(255,255,255,0.07);color:#E8F0F8;font-family:'Syne',sans-serif;font-size:13px;padding:10px 12px;outline:none;transition:border-color 0.2s;width:100%;}
        .form-field input:focus,.form-field select:focus,.form-field textarea:focus{border-color:rgba(0,229,160,0.4);}
        .form-field input::placeholder,.form-field textarea::placeholder{color:#5A7A8A;}
        .form-field textarea{resize:vertical;min-height:70px;}
        .form-field select option{background:#0D1219;}
        .form-section{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#5A7A8A;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.07);}
        .btn-save{width:100%;background:#00E5A0;color:#000;border:none;padding:12px;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;margin-top:6px;}
        .btn-save:disabled{opacity:0.5;cursor:not-allowed;}
        .empty{padding:40px;text-align:center;color:#5A7A8A;font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:0.08em;}
        .btn-new{background:#00E5A0;color:#000;border:none;padding:10px 20px;font-family:'Syne',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;}
        .btn-new:hover{filter:brightness(1.1);}
        .section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
        .section-title{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#5A7A8A;}
        @media(max-width:640px){
          .stats-grid{grid-template-columns:1fr 1fr;}
          .form-grid{grid-template-columns:1fr;}
          .product-item{grid-template-columns:1fr;}
        }
      `}</style>

      <div className="wrap">
        <nav>
          <div className="nav-logo">Product<span>Lab</span></div>
          <div className="nav-right">
            {meliConnected ? (
              <span className="btn-sm btn-meli connected">🟡 MeLi: {meliNickname}</span>
            ) : (
              <a href="/api/meli-connect" className="btn-sm btn-meli">Conectar MeLi</a>
            )}
            <span className="nav-user">{profile?.nombre || user?.email}</span>
            <Link href="/"><button className="btn-sm btn-scout" onClick={async()=>{
              const { data: { session } } = await supabase.auth.getSession();
              if(session?.access_token) {
                sessionStorage.setItem('pl_token', session.access_token);
              }
            }}>🔍 Scout</button></Link>
            <button className="btn-sm" onClick={handleLogout}>Salir</button>
          </div>
        </nav>

        <div className="dash-hero">
          <h1>Hola, <span>{profile?.nombre?.split(' ')[0] || 'usuario'}</span> 👋</h1>
          <p>// dashboard · {new Date().toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' })}</p>
        </div>

        {/* STATS */}
        <div className="stats-grid">
          <div className="stat">
            <div className="stat-label">Productos activos</div>
            <div className="stat-value green">{products.length}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Live ahora</div>
            <div className="stat-value green">{productosLive}</div>
          </div>
          <div className="stat">
            <div className="stat-label">En camino</div>
            <div className="stat-value blue">{productosEnCamino}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Invertido total</div>
            <div className="stat-value amber">${totalInvertido.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</div>
          </div>
        </div>

        {/* TABS */}
        <div className="tabs">
          <button className={`tab${activeTab==='productos'?' active':''}`} onClick={()=>setActiveTab('productos')}>Mis productos</button>
          <button className={`tab${activeTab==='analyses'?' active':''}`} onClick={()=>setActiveTab('analyses')}>Análisis guardados</button>
          <button className={`tab${activeTab==='manual'?' active':''}`} onClick={()=>setActiveTab('manual')}>📖 Manual</button>
        </div>

        {/* PRODUCTOS */}
        {activeTab === 'productos' && (
          <>
            <div className="section-header">
              <div className="section-title">{products.length} productos registrados</div>
              <button className="btn-new" onClick={()=>setShowNewProduct(true)}>+ Nuevo producto</button>
            </div>
            {products.length === 0 ? (
              <div className="empty">
                Todavía no registraste ningún producto.<br/>
                Usá el Scout para encontrar uno y guardalo acá.
              </div>
            ) : (
              <div className="product-list">
                {products.map(p => {
                  const est = ESTADOS[p.estado] || ESTADOS.ordenado;
                  const costoTotal = (p.costo_real||0)+(p.costo_envio||0)+(p.costo_aduana||0)+(p.costo_packaging||0);
                  const gananciaU = p.precio_venta ? p.precio_venta - costoTotal : null;
                  const margen = gananciaU && p.precio_venta ? ((gananciaU/p.precio_venta)*100).toFixed(0) : null;
                  return (
                    <div className="product-item" key={p.id}>
                      <div>
                        <div className="pi-name">{p.nombre}</div>
                        <div className="pi-meta">
                          <span>{p.proveedor || 'Sin proveedor'}</span>
                          <span>{p.canal?.toUpperCase()}</span>
                          {p.fecha_orden && <span>Orden: {new Date(p.fecha_orden+'T12:00:00').toLocaleDateString('es-AR')}</span>}
                        </div>
                        <div className="pi-metrics">
                          <div className="pi-metric"><span className="pi-metric-label">Unidades</span><span className="pi-metric-value">{p.unidades?.toLocaleString()}</span></div>
                          <div className="pi-metric"><span className="pi-metric-label">Costo/u</span><span className="pi-metric-value">${costoTotal.toFixed(2)}</span></div>
                          {p.precio_venta && <div className="pi-metric"><span className="pi-metric-label">Precio venta</span><span className="pi-metric-value" style={{color:'#00E5A0'}}>${p.precio_venta}</span></div>}
                          {margen && <div className="pi-metric"><span className="pi-metric-label">Margen</span><span className="pi-metric-value" style={{color:'#FFB800'}}>{margen}%</span></div>}
                          {p.inversion_total && <div className="pi-metric"><span className="pi-metric-label">Inversión total</span><span className="pi-metric-value">${p.inversion_total?.toLocaleString('es-AR',{minimumFractionDigits:0})}</span></div>}
                        </div>
                      </div>
                      <div className="pi-right">
                        <div className="estado-badge" style={{color:est.color, borderColor:est.color+'44'}}>
                          {est.icon} {est.label}
                        </div>
                        <select className="estado-select" value={p.estado} onChange={e=>updateEstado(p.id,e.target.value)}>
                          {Object.entries(ESTADOS).map(([k,v])=>(
                            <option key={k} value={k}>{v.icon} {v.label}</option>
                          ))}
                        </select>
                        <button className="btn-delete" onClick={()=>deleteProduct(p.id)}>Eliminar</button>
                        {p.estado !== 'live' && (
                          <button className="btn-publish" onClick={()=>openPublish(p)}>🟡 Publicar en MeLi</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ANALYSES */}
        {activeTab === 'analyses' && (
          <>
            <div className="section-header">
              <div className="section-title">{analyses.length} análisis guardados</div>
              <Link href="/"><button className="btn-new">+ Nuevo análisis</button></Link>
            </div>
            {analyses.length === 0 ? (
              <div className="empty">
                Todavía no guardaste ningún análisis.<br/>
                Usá el Scout y hacé click en "Guardar análisis".
              </div>
            ) : (
              <div className="analysis-list">
                {analyses.map(a => (
                  <div className="analysis-item" key={a.id}>
                    <div className="ai-left">
                      <h4>{a.nombre}</h4>
                      <p>{a.nicho} · {a.canal?.toUpperCase()} · {a.segmento} · {new Date(a.created_at).toLocaleDateString('es-AR')}</p>
                    </div>
                    <div className="ai-score" style={{color: a.score>=75?'#00E5A0':a.score>=55?'#FFB800':'#FF4757'}}>
                      {a.score}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* MANUAL TAB */}
        {activeTab === 'manual' && (
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>

            {/* RESUMEN DEL SISTEMA */}
            <div style={{background:'#0D1219',border:'1px solid rgba(255,255,255,0.07)',padding:'20px 24px',borderLeft:'3px solid #00E5A0'}}>
              <div style={{fontFamily:'JetBrains Mono',fontSize:'10px',letterSpacing:'0.15em',textTransform:'uppercase',color:'#5A7A8A',marginBottom:'12px'}}>ProductLab — Resumen del sistema</div>
              <h3 style={{fontSize:'18px',fontWeight:'800',marginBottom:'8px',color:'#E8F0F8'}}>El sistema operativo de tu e-commerce</h3>
              <p style={{fontSize:'13px',color:'#5A7A8A',lineHeight:'1.6',marginBottom:'16px'}}>ProductLab integra research con IA, análisis de costos, gestión operativa y publicación en marketplaces en un flujo de 4 pasos. Acceso por invitación, datos guardados en Supabase.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                {[
                  {n:'01',t:'Calendario',d:'20+ fechas 2026–2028 con timing de barco automático',c:'#FF9500'},
                  {n:'02',t:'Research IA',d:'Productos por segmento y canal con links directos a proveedores',c:'#00E5A0'},
                  {n:'03',t:'Decisión de compra',d:'Costo de aterrizaje completo: flete + aduana + fees',c:'#FFB800'},
                  {n:'04',t:'Plan de acción',d:'Checklist + confirmar al Dashboard + publicar en MeLi',c:'#0066FF'},
                ].map(s=>(
                  <div key={s.n} style={{padding:'12px',border:`1px solid ${s.c}33`,background:`${s.c}08`}}>
                    <div style={{fontFamily:'JetBrains Mono',fontSize:'10px',color:s.c,marginBottom:'4px'}}>PASO {s.n} — {s.t.toUpperCase()}</div>
                    <div style={{fontSize:'12px',color:'#7A9BB5',lineHeight:'1.5'}}>{s.d}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* CAPÍTULOS */}
            {[
              { num:'01', title:'Génesis del E-Commerce', color:'#1E3A5F',
                content:'El e-commerce es un negocio de sistemas, no de productos. Los tres modelos: Arbitraje (aprender), Marca Propia (escalar), Wholesale (volumen). Stack: Amazon + MeLi + Shopify + Alibaba + 1688 + ProductLab.' },
              { num:'02', title:'Mentalidad Inquebrantable', color:'#1E3A5F',
                content:'El primer producto va a fallar — es el costo de la educación. Los tres pilares: tolerancia al ciclo largo (6–18 meses), decisiones basadas en data, velocidad de ejecución sobre perfeccionismo.' },
              { num:'03', title:'Marketplace o Tienda Propia', color:'#A85636',
                content:'Secuencia correcta: 1) Validar en MeLi (local, rápido), 2) Escalar a Amazon (dólares, global), 3) Construir Shopify (marca propia, email list, LTV). Amazon da volumen. MeLi da validación. Shopify da margen.' },
              { num:'04', title:'Búsqueda de Productos', color:'#B8924A',
                content:'Tres segmentos: 🔥 Tendencia (ventana corta, upside alto), 📅 Estacional (timing predecible, planificar 60–90 días antes), 🔄 Cotidiano (base estable del negocio). Criterios: USD 20–80, <2kg, >300 unidades/mes, <200 reviews top 3.' },
              { num:'05', title:'Búsqueda de Proveedores', color:'#00B386',
                content:'Alibaba: inglés, Trade Assurance, precio exportación. 1688: chino, precio fábrica directo, requiere agente. Proceso: 10 candidatos → 5 contactados → 2–3 muestras → 1 proveedor. Pago: 30% adelanto, 70% contra BL.' },
              { num:'06', title:'Armado de Ofertas', color:'#FF3B8B',
                content:'Bundle: productos complementarios en un listing (menor competencia directa). Multipack: misma unidad en mayor cantidad (AOV más alto). Gift Set: packaging premium para fechas (precio 20–40% más alto). El bundle es la palanca más eficiente.' },
              { num:'07', title:'SEO & Tráfico', color:'#FF9500',
                content:'Listing: keyword principal al inicio del título, 5 bullets con beneficio > feature, 250 bytes de backend keywords, mín. 7 imágenes. PPC: automática (2 semanas) → manual exacta → competidores. ACoS objetivo < 30%. TikTok Ads mejora el ranking orgánico en Amazon.' },
              { num:'08', title:'Sistemas de Escala y LLC', color:'#0A1628',
                content:'Etapas: Validación (0–3m) → Optimización (3–6m) → Escala (6–12m, +USD 10K/mes) → Sistemización (12m+, SOPs, equipo, venta 3–5x EBITDA). LLC Wyoming: USD 102/año, Mercury Bank, EIN del IRS.' },
              { num:'09', title:'ProductLab — Sistema Propio', color:'#00E5A0',
                content:'4 pasos integrados: Calendario (fechas + timing barco) → Research IA (nichos + links directos) → Calculadora (costo aterrizaje = proveedor + flete + aduana + prep) → Plan de acción (checklist + publicar MeLi). Dashboard: ciclo de vida del producto, P&L real, tipo de cambio BNA.' },
            ].map(cap => (
              <div key={cap.num} style={{background:'#0D1219',border:'1px solid rgba(255,255,255,0.07)',overflow:'hidden'}}>
                <div style={{display:'grid',gridTemplateColumns:'60px 1fr',background:'#080C10'}}>
                  <div style={{background:cap.color,display:'flex',alignItems:'center',justifyContent:'center',padding:'14px',fontFamily:'JetBrains Mono',fontSize:'18px',fontWeight:'700',color:'#fff'}}>
                    {cap.num}
                  </div>
                  <div style={{padding:'14px 18px'}}>
                    <div style={{fontSize:'14px',fontWeight:'700',color:'#E8F0F8',marginBottom:'6px'}}>{cap.title}</div>
                    <div style={{fontSize:'12px',color:'#5A7A8A',lineHeight:'1.6'}}>{cap.content}</div>
                  </div>
                </div>
              </div>
            ))}

            {/* DOWNLOAD LINK */}
            <div style={{background:'#0D1219',border:'1px solid rgba(0,229,160,0.2)',padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:'13px',fontWeight:'700',marginBottom:'4px'}}>📄 Génesis del E-Commerce v2.0</div>
                <div style={{fontFamily:'JetBrains Mono',fontSize:'11px',color:'#5A7A8A'}}>Documento completo · 9 capítulos · Word (.docx)</div>
              </div>
              <a href="https://github.com/darioter/productlab" target="_blank" style={{background:'#00E5A0',color:'#000',padding:'9px 18px',fontFamily:'JetBrains Mono',fontSize:'11px',fontWeight:'700',letterSpacing:'0.08em',textTransform:'uppercase',textDecoration:'none'}}>
                Ver en GitHub →
              </a>
            </div>

          </div>
        )}
      </div>

      {/* MODAL NUEVO PRODUCTO */}
      {showNewProduct && (
        <div className="modal-bg" onClick={e=>{if(e.target===e.currentTarget)setShowNewProduct(false)}}>
          <div className="modal">
            <div className="modal-header">
              <h2>+ Nuevo producto</h2>
              <span className="modal-close" onClick={()=>setShowNewProduct(false)}>✕ cerrar</span>
            </div>
            <div className="modal-body">
              <form onSubmit={saveProduct}>
                <div className="form-section">Datos del producto</div>
                <div className="form-grid">
                  <div className="form-field full">
                    <label>Nombre del producto *</label>
                    <input type="text" placeholder="ej: Prensa smash burger inox 18cm" required value={newProduct.nombre} onChange={e=>setNewProduct({...newProduct,nombre:e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>Proveedor</label>
                    <input type="text" placeholder="ej: Guangzhou Metal Tools" value={newProduct.proveedor} onChange={e=>setNewProduct({...newProduct,proveedor:e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>Canal de venta</label>
                    <select value={newProduct.canal} onChange={e=>setNewProduct({...newProduct,canal:e.target.value})}>
                      <option value="amazon">Amazon FBA</option>
                      <option value="meli">MercadoLibre</option>
                      <option value="shopify">Shopify</option>
                      <option value="multi">Multi-canal</option>
                    </select>
                  </div>
                </div>

                <div className="form-section" style={{marginTop:8}}>Costos (USD por unidad)</div>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Costo proveedor *</label>
                    <input type="number" step="0.01" placeholder="7.50" required value={newProduct.costo_real} onChange={e=>setNewProduct({...newProduct,costo_real:e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>Envío marítimo</label>
                    <input type="number" step="0.01" placeholder="1.20" value={newProduct.costo_envio} onChange={e=>setNewProduct({...newProduct,costo_envio:e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>Aduana + prep</label>
                    <input type="number" step="0.01" placeholder="0.80" value={newProduct.costo_aduana} onChange={e=>setNewProduct({...newProduct,costo_aduana:e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>Packaging</label>
                    <input type="number" step="0.01" placeholder="0.40" value={newProduct.costo_packaging} onChange={e=>setNewProduct({...newProduct,costo_packaging:e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>Unidades compradas *</label>
                    <input type="number" placeholder="200" required value={newProduct.unidades} onChange={e=>setNewProduct({...newProduct,unidades:e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>Precio de venta</label>
                    <input type="number" step="0.01" placeholder="29.99" value={newProduct.precio_venta} onChange={e=>setNewProduct({...newProduct,precio_venta:e.target.value})} />
                  </div>
                </div>

                <div className="form-section" style={{marginTop:8}}>Estado y fechas</div>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Estado actual</label>
                    <select value={newProduct.estado} onChange={e=>setNewProduct({...newProduct,estado:e.target.value})}>
                      {Object.entries(ESTADOS).map(([k,v])=>(
                        <option key={k} value={k}>{v.icon} {v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Fecha de orden</label>
                    <input type="date" value={newProduct.fecha_orden} onChange={e=>setNewProduct({...newProduct,fecha_orden:e.target.value})} />
                  </div>
                  <div className="form-field full">
                    <label>Notas</label>
                    <textarea placeholder="Observaciones, detalles del proveedor, próximos pasos..." value={newProduct.notas} onChange={e=>setNewProduct({...newProduct,notas:e.target.value})} />
                  </div>
                </div>

                <button className="btn-save" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar producto →'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PUBLICAR EN MELI */}
      {showPublish && (
        <div className="modal-bg" onClick={e=>{if(e.target===e.currentTarget){setShowPublish(false);setPublishResult(null);}}}>
          <div className="modal">
            <div className="modal-header">
              <h2>🟡 Publicar en MercadoLibre</h2>
              <span className="modal-close" onClick={()=>{setShowPublish(false);setPublishResult(null);}}>✕ cerrar</span>
            </div>
            <div className="modal-body">
              {!meliConnected ? (
                <div style={{textAlign:'center',padding:'20px 0'}}>
                  <div style={{fontSize:'14px',marginBottom:'16px',color:'var(--muted)'}}>
                    Primero conectá tu cuenta de MercadoLibre
                  </div>
                  <a href="/api/meli-connect" style={{background:'#FFE600',color:'#000',padding:'12px 24px',fontWeight:'700',fontSize:'13px',textDecoration:'none',display:'inline-block'}}>
                    Conectar MercadoLibre →
                  </a>
                </div>
              ) : !publishResult ? (
                <form onSubmit={handlePublish}>
                  <div className="form-section">Datos de la publicación</div>
                  <div className="form-grid">
                    <div className="form-field full">
                      <label>Título del listing *</label>
                      <input type="text" value={publishData.nombre} onChange={e=>setPublishData({...publishData,nombre:e.target.value})} required maxLength={60} />
                      <div style={{fontSize:'10px',color:'var(--muted)',fontFamily:'JetBrains Mono',marginTop:'3px'}}>{publishData.nombre.length}/60 caracteres</div>
                    </div>
                    <div className="form-field full">
                      <label>Categoría MeLi *</label>
                      <input
                        type="text"
                        placeholder="Escribí para buscar categoría..."
                        value={publishData.categoria_nombre}
                        onChange={e=>{
                          setPublishData({...publishData,categoria_nombre:e.target.value,categoria_id:''});
                          searchCategories(e.target.value);
                        }}
                      />
                      {categorySuggestions.length > 0 && !publishData.categoria_id && (
                        <div className="cat-list">
                          {categorySuggestions.map(c=>(
                            <div key={c.category_id} className="cat-suggestion" onClick={()=>{
                              setPublishData({...publishData,categoria_id:c.category_id,categoria_nombre:c.category_name});
                              setCategorySuggestions([]);
                            }}>
                              <span style={{color:'#00E5A0',fontFamily:'JetBrains Mono',fontSize:'10px'}}>{c.category_id}</span> — {c.category_name}
                              {c.domain_name && <span style={{color:'var(--muted)',fontSize:'11px'}}> · {c.domain_name}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      {publishData.categoria_id && (
                        <div style={{fontSize:'11px',color:'#00E5A0',fontFamily:'JetBrains Mono',marginTop:'4px'}}>✓ {publishData.categoria_id}</div>
                      )}
                    </div>
                    <div className="form-field">
                      <label>Precio ARS *</label>
                      <input type="number" value={publishData.precio} onChange={e=>setPublishData({...publishData,precio:e.target.value})} required />
                      {dolar && (
                        <div style={{fontSize:'10px',color:'var(--muted)',fontFamily:'JetBrains Mono',marginTop:'3px'}}>
                          TC BNA: ${dolar.venta} venta · {dolar.fuente}
                          {publishData.precio && ` · USD equiv: $${(publishData.precio / dolar.venta).toFixed(2)}`}
                        </div>
                      )}
                    </div>
                    <div className="form-field">
                      <label>Stock disponible</label>
                      <input type="number" value={publishData.stock} onChange={e=>setPublishData({...publishData,stock:e.target.value})} min="1" />
                    </div>
                    <div className="form-field full">
                      <label>Descripción</label>
                      <textarea value={publishData.descripcion} onChange={e=>setPublishData({...publishData,descripcion:e.target.value})} rows={4} />
                    </div>
                    <div className="form-field">
                      <label>Condición</label>
                      <select value={publishData.condicion} onChange={e=>setPublishData({...publishData,condicion:e.target.value})}>
                        <option value="new">Nuevo</option>
                        <option value="used">Usado</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Envío gratis</label>
                      <select value={publishData.envio_gratis} onChange={e=>setPublishData({...publishData,envio_gratis:e.target.value==='true'})}>
                        <option value="true">✓ Sí — activo</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>
                  <button className="btn-save" disabled={publishing} style={{background:'#FFE600',color:'#000'}}>
                    {publishing ? 'Publicando...' : '🟡 Publicar en MercadoLibre →'}
                  </button>
                </form>
              ) : publishResult.success ? (
                <div className="publish-result-ok">
                  <div style={{fontSize:'16px',fontWeight:'700',color:'#00E5A0',marginBottom:'12px'}}>✅ Publicado exitosamente</div>
                  <div style={{fontSize:'13px',color:'var(--muted)',marginBottom:'8px'}}>ID: <span style={{fontFamily:'JetBrains Mono',color:'var(--text)'}}>{publishResult.item_id}</span></div>
                  <div style={{fontSize:'13px',color:'var(--muted)',marginBottom:'16px'}}>Precio: <span style={{color:'#FFE600',fontFamily:'JetBrains Mono'}}>${publishResult.price?.toLocaleString('es-AR')}</span></div>
                  <a href={publishResult.permalink} target="_blank" rel="noreferrer"
                    style={{display:'inline-block',background:'#FFE600',color:'#000',padding:'10px 20px',fontWeight:'700',fontSize:'13px',textDecoration:'none',marginRight:'10px'}}>
                    Ver publicación →
                  </a>
                  <button onClick={()=>{setShowPublish(false);setPublishResult(null);}} style={{background:'none',border:'1px solid var(--border)',color:'var(--muted)',padding:'10px 16px',cursor:'pointer',fontFamily:'JetBrains Mono',fontSize:'11px'}}>
                    Cerrar
                  </button>
                </div>
              ) : (
                <div className="publish-result-err">
                  ✗ Error: {publishResult.error}
                  <div style={{marginTop:'10px'}}>
                    <button onClick={()=>setPublishResult(null)} style={{background:'none',border:'1px solid rgba(255,71,87,0.4)',color:'#FF4757',padding:'6px 14px',cursor:'pointer',fontFamily:'JetBrains Mono',fontSize:'11px'}}>
                      Intentar de nuevo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
