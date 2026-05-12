import React, { useEffect, useState } from 'react';
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

// ═══════════════════════════════════════════
// MANUAL BOOK COMPONENT
// ═══════════════════════════════════════════
const CAPITULOS = [
  {
    num:'00', emoji:'📖', title:'Génesis del E-Commerce', subtitle:'El mapa completo del sistema', color:'#00E5A0',
    sections:[
      { label:'¿Qué es realmente?', text:'El e-commerce no es "vender por internet". Es construir un sistema de flujo de valor donde el producto correcto llega a la persona correcta en el momento correcto, a través del canal correcto. La diferencia entre quien fracasa y quien escala no está en el producto — está en el sistema que construyeron alrededor de ese producto.' },
      { label:'Los tres modelos', items:[
        ['Arbitraje','Comprás un producto donde está barato y lo revendés donde está caro. Amazon → MeLi, Alibaba → Amazon, mayorista local → tienda online. Barrera de entrada baja, márgenes ajustados, ideal para aprender el sistema sin inventario de marca propia.'],
        ['Marca Propia (Private Label)','Mandás fabricar un producto con tu marca, diseño y packaging. Mayor margen, mayor control, mayor inversión inicial. Es el modelo de largo plazo y el que genera activos vendibles.'],
        ['Wholesale','Comprás en cantidad a un distribuidor autorizado y revendés en marketplaces. Volumen alto, márgenes predecibles, menos trabajo creativo.'],
      ]},
      { label:'El stack completo', items:[
        ['Canales de venta','Amazon FBA (global, USD) · MercadoLibre (LATAM, ARS/USD) · Shopify (marca propia, DTC)'],
        ['Sourcing','Alibaba.com (internacional, inglés) · 1688.com (fábrica directa, chino, más barato)'],
        ['Sistema operativo','ProductLab — research IA + calculadora + dashboard + publicación'],
        ['Pagos','Payoneer o Wise para cobrar en USD desde Argentina'],
        ['Legal','LLC en Wyoming (EE.UU.) para operar en Amazon US con cuenta bancaria propia'],
      ]},
      { label:'La regla de oro', highlight:true, text:'El e-commerce es un negocio de sistemas, no de productos. El producto cambia. El sistema permanece. Construís el sistema una vez y lo aplicás a decenas de productos.' },
    ]
  },
  {
    num:'01', emoji:'🧠', title:'Mentalidad Inquebrantable', subtitle:'La ventaja invisible que separa a los que escalan', color:'#0066FF',
    sections:[
      { label:'El primer producto va a fallar', text:'No como posibilidad — como certeza estadística. Más del 70% de los primeros productos en Amazon no logran escalar. Esto no es fracaso — es el costo de la educación. La pregunta no es si va a pasar, sino cuánto te va a costar y qué vas a aprender. El error más caro es abandonar después del primero.' },
      { label:'Los tres pilares', items:[
        ['Tolerancia al ciclo largo','Un negocio de e-commerce desde cero hasta flujo de caja positivo sostenible tarda entre 6 y 18 meses. No es un ingreso rápido. Es un activo digital que construís con tiempo, capital y decisiones. Quien entra buscando resultados en 30 días siempre pierde.'],
        ['Decisiones basadas en datos','El mayor riesgo del e-commerce es el "me parece". Me parece que este producto va a vender. Me parece que este precio es correcto. Cada decisión tiene que estar respaldada por data: BSR, volumen de búsqueda mensual, tendencia, competencia real, margen post-fees calculado con precisión.'],
        ['Velocidad de ejecución','El listing imperfecto que está live hoy genera más data que el listing perfecto que seguís editando. Lanzar, medir, iterar. El mercado te enseña más en dos semanas de ventas reales que en dos meses de planificación.'],
      ]},
      { label:'La trampa del curso eterno', text:'El ciclo más común en e-commerce: curso → video → podcast → otro curso → planilla de análisis → otro video. Sin nunca ejecutar. El conocimiento sin acción no genera ingresos. Fijate una fecha de primer lanzamiento y respetala aunque no te sientas 100% listo. No vas a estarlo nunca.' },
      { label:'Regla de capital', highlight:true, text:'Nunca inviertas en inventario dinero que no podés perder. El primer lote es una inversión en educación, no en ganancias. Si perderlo te genera una crisis financiera real, el monto es demasiado alto.' },
    ]
  },
  {
    num:'02', emoji:'🏪', title:'Marketplace o Tienda Propia', subtitle:'Cuándo usar cada canal y cómo combinarlos', color:'#A85636',
    sections:[
      { label:'La pregunta correcta', text:'No es "¿marketplace o tienda propia?". Es "¿cuál va primero?". Cada canal tiene ventajas que el otro no puede replicar. El negocio maduro usa los tres. La estrategia está en la secuencia de entrada.' },
      { label:'Comparativa de canales', items:[
        ['Amazon FBA','Tráfico millonario incluido. Fees 28–35%. Control de marca limitado (Amazon no te da los datos del cliente). Fulfillment delegado (FBA). Ideal para producto con demanda validada y margen > 40%.'],
        ['MercadoLibre','Mercado hispanohablante dominante. Fees 13–18%. Envío Gratis mejora el ranking. Menos competencia que Amazon para productos de nicho. Cobro en ARS (convertible a USD vía Payoneer).'],
        ['Shopify (DTC)','Margen más alto (fees 5–8%). Control total del cliente: email, retargeting, LTV. Requiere generar el tráfico vos (Meta Ads, TikTok Ads, SEO). Ideal para marca con identidad propia.'],
      ]},
      { label:'La secuencia ganadora', items:[
        ['Paso 1 — Validar en MeLi','Menor fricción operativa. Mercado local. No necesitás LLC ni cuenta bancaria en el exterior. El feedback es rápido. Si vendés 20–30 unidades por mes, el producto está validado.'],
        ['Paso 2 — Escalar a Amazon US','Con el producto validado, entrás al mercado más grande del mundo. Precio en USD. Volumen 10x. Requiere LLC + cuenta en Mercury/Wise + prep center en EE.UU.'],
        ['Paso 3 — Construir Shopify','Con tracción en Amazon o MeLi, construís la marca propia. Capturás el email del cliente. Podés hacer retargeting. Subís el ticket con bundles y suscripciones.'],
      ]},
      { label:'La fórmula', highlight:true, text:'Amazon te da el volumen. MeLi te da la validación local y el cash flow en pesos. Shopify te da el margen y el cliente. Los tres juntos son el sistema completo.' },
    ]
  },
  {
    num:'03', emoji:'🔍', title:'Búsqueda de Productos', subtitle:'El corazón del negocio — con ProductLab', color:'#B8924A',
    sections:[
      { label:'Las tres segmentaciones', items:[
        ['🔥 Tendencia','Producto que está explotando ahora mismo en redes sociales, búsquedas y ventas. Ventana de oportunidad de 3–6 meses. Entrás rápido o perdés la ola. Alto upside, mayor riesgo. Fuentes: TikTok Creative Center, Google Trends, Amazon Movers & Shakers.'],
        ['📅 Estacional','Demanda con pico predecible según fecha (Navidad, Día de la Madre, Vuelta al Cole) o estación (verano, invierno). Planificás el stock con 60–90 días de anticipación por el envío marítimo. El timing lo es todo.'],
        ['🔄 Cotidiano','Demanda constante los 365 días del año, sin estacionalidad marcada. Base predecible del negocio. Más competencia pero más estable. Ideal para construir reputación y reviews sólidos.'],
      ]},
      { label:'Criterios de validación', items:[
        ['Precio','Entre USD 20 y USD 80. Debajo de $20 el margen post-fees no aguanta. Arriba de $80 el ticket frena la conversión impulsiva.'],
        ['Peso y tamaño','Menos de 2 kg por unidad. Dimensiones compactas. Determina el costo de FBA (Fulfillment by Amazon) y el flete desde China.'],
        ['Demanda','Mínimo 300 unidades/mes de demanda total en el nicho. Medido con Helium 10 o Jungle Scout.'],
        ['Competencia','Los 3 primeros resultados con menos de 200 reviews. Si están todos por encima de 500, el nicho está muy consolidado.'],
        ['Margen','Mínimo 40% de margen bruto después de: costo del producto + flete + aduana + fees del canal. El ProductLab lo calcula automáticamente.'],
      ]},
      { label:'El portfolio ideal', text:'No depender de un solo producto. El portfolio ganador combina los tres segmentos: un producto cotidiano como base de ingresos estables, uno estacional para capitalizar los picos con stock planificado, y uno de tendencia como apuesta de upside. Si falla la tendencia, el cotidiano sigue generando caja.' },
      { label:'Clave del sistema', highlight:true, text:'ProductLab hace el research con IA: ingresás la categoría, el segmento y el mercado, y el sistema devuelve 3 productos rankeados con score de oportunidad, métricas de demanda, margen estimado, links directos a Alibaba/1688/MeLi/Amazon y cálculo de timing de barco si hay una fecha objetivo.' },
    ]
  },
  {
    num:'04', emoji:'🏭', title:'Búsqueda de Proveedores', subtitle:'Alibaba, 1688, negociación y calidad', color:'#00B386',
    sections:[
      { label:'Los dos canales de sourcing', items:[
        ['Alibaba.com','Plataforma internacional en inglés. Trade Assurance protege el pago. Precio de exportación (20–40% más caro que fábrica directa). MOQ generalmente 100–500 unidades. Ideal para el primer proveedor.'],
        ['1688.com','Mercado interno chino, en mandarín. Precio directo de fábrica — el más bajo posible. Requiere agente intermediario o hablar chino. MOQ desde 50 unidades en muchos casos. Para escalar con mayor margen.'],
      ]},
      { label:'Proceso de selección paso a paso', items:[
        ['1 — Buscar','Mínimo 10 proveedores del producto en Alibaba. Filtrar por: Gold Supplier + Trade Assurance + mínimo 3 años activo + tasa de respuesta > 90%.'],
        ['2 — Contactar','Enviar RFQ (Request for Quotation) a los 5 mejores. Pedir precio para 200/500/1.000 unidades, especificaciones, tiempo de producción y opciones de packaging.'],
        ['3 — Muestras','Pedir muestra a los 2–3 finalistas. Costo típico: USD 30–80 con envío aéreo incluido. Evaluar: calidad real vs fotos, tiempo de respuesta, proactividad del proveedor.'],
        ['4 — Negociar','Precio, MOQ, tiempo de producción, incoterm (FOB o EXW), condiciones de pago. Siempre negociar — el primer precio nunca es el mejor.'],
        ['5 — Primer pedido','30% adelanto contra factura proforma. 70% contra copia del BL (Bill of Lading). Para pedidos grandes (>USD 3.000), contratar inspector en China (QIMA, SGS): USD 200–400.'],
      ]},
      { label:'Template de primer contacto', highlight:true, text:'Hello, I am looking for [producto]. Please send me: 1) Best price for 200/500/1,000 units, 2) Product specifications and materials, 3) Sample cost and shipping, 4) Production lead time, 5) Packaging options. I am building a long-term supply chain and looking for a reliable partner.' },
    ]
  },
  {
    num:'05', emoji:'📦', title:'Armado de Ofertas', subtitle:'Cómo diferenciarte y subir el ticket', color:'#FF3B8B',
    sections:[
      { label:'El producto es el mínimo viable', text:'Dos vendedores con el mismo producto compiten por precio — race to the bottom. Dos vendedores con ofertas distintas compiten por valor. La oferta es lo que hace tu listing único aunque el producto no lo sea.' },
      { label:'Tipos de combinaciones', items:[
        ['Bundle complementario','Agrupás productos que se usan juntos en un solo listing. Ejemplo: prensa smash burger + espátula + recetario digital. Amazon no puede hacer price-matching exacto sobre un bundle. Menor competencia directa, precio 40–80% más alto que cada producto por separado.'],
        ['Multipack','El mismo producto en mayor cantidad (pack x3, x6, x12). AOV más alto, costo por unidad más bajo, mejor posición en búsquedas de volumen. Funciona especialmente bien en consumibles y accesorios.'],
        ['Gift Set / Edición especial','Packaging premium orientado a regalo. Funciona para fechas clave: Navidad, Día de la Madre, Día del Padre. Permite subir el precio 20–40% sobre el producto estándar con el mismo costo de fabricación + packaging.'],
        ['Kit de inicio (Starter Kit)','Bundle orientado a principiantes de una actividad. Captura búsquedas de alto intent: "cómo empezar con X". El comprador valora no tener que decidir qué más necesita.'],
      ]},
      { label:'Cálculo del margen del bundle', text:'La lógica del bundle: si el producto A solo da 45% de margen a $24.99, el bundle A+B a $34.99 puede dar 55% de margen porque el costo marginal de B es bajo y el precio de venta sube más que proporcional. El bundle sube el margen absoluto y el porcentual al mismo tiempo.' },
      { label:'Palanca clave', highlight:true, text:'El bundle bien armado es la palanca más eficiente del catálogo. No requiere más inventario complejo — requiere creatividad en el packaging y en la propuesta de valor.' },
    ]
  },
  {
    num:'06', emoji:'📈', title:'SEO & Tráfico', subtitle:'Orgánico y pago — los dos motores', color:'#FF9500',
    sections:[
      { label:'El listing perfecto', items:[
        ['Título','Keyword principal al inicio (los primeros 5 palabras son las más pesadas para el algoritmo). Característica clave + variante/tamaño. Máximo 200 caracteres. Sin símbolos raros, sin MAYÚSCULAS innecesarias.'],
        ['Bullet points','5 bullets. Primera palabra de cada uno en MAYÚSCULA. Formato: BENEFICIO — explicación del feature. No al revés. Keyword secundaria integrada de forma natural en cada uno.'],
        ['Backend keywords','Hasta 250 bytes (no 250 palabras). Sin repetir lo que ya está en el listing. Sin comas. Incluir: variantes de escritura, errores ortográficos comunes, sinónimos, términos en inglés si aplica.'],
        ['Imágenes','Mínimo 7 imágenes. Principal: fondo blanco puro, producto ocupa 85% del frame. Resto: lifestyle (producto en uso), infografía con features, dimensiones reales, comparativa, packaging, bundle.'],
      ]},
      { label:'PPC en Amazon — estructura', items:[
        ['Campaña automática (semanas 1–2)','Amazon decide dónde mostrar el anuncio. Recolecta data de search terms reales. Budget: USD 15–20/día. Dejar correr 2 semanas sin tocar.'],
        ['Campaña manual exacta (semana 3+)','Con los search terms ganadores de la automática. Bidear más alto en las keywords que convierten. Negar las que tuvieron clicks pero cero ventas.'],
        ['Campaña de competidores','Mostrar tu producto en los listings de los competidores principales. CTR más bajo, pero capturas demanda caliente.'],
        ['Optimización semanal','Revisar cada lunes. ACoS objetivo < 30%. Subir bids en keywords que convierten bien. Negar términos irrelevantes o no rentables.'],
      ]},
      { label:'Tráfico externo', items:[
        ['TikTok Ads','El canal más potente ahora mismo para tendencias. In-Feed video de producto en uso real (no producción). Costo por clic más bajo que Meta. El tráfico externo a Amazon mejora el ranking orgánico.'],
        ['Meta Ads (Facebook/Instagram)','Mejor para retargeting y audiencias por interés. Creative ganadora: video testimonial o "before/after". Mandar tráfico a Shopify (no directo a Amazon) para capturar el email.'],
        ['Influencers','Micro-influencers (10K–100K) mejor ROI que mega. Modelo: gifting + comisión 10–15% por venta. Para Amazon usar URL con código de descuento único para trackear conversiones.'],
      ]},
      { label:'El multiplicador', highlight:true, text:'El tráfico externo (TikTok, Meta, influencers) que mandás a Amazon mejora el BSR y el ranking orgánico, además de generar ventas directas. Es decir: el paid media te da ventas hoy Y mejora el orgánico para mañana. Es el mayor multiplicador del sistema.' },
    ]
  },
  {
    num:'07', emoji:'🚀', title:'Sistemas de Escala', subtitle:'Del primer producto al negocio estructurado y vendible', color:'#0A1628',
    sections:[
      { label:'Las cuatro etapas', items:[
        ['Etapa 1 — Validación (0–3 meses)','Primer producto live. Foco total en encontrar product-market fit. Métricas clave: conversion rate, velocidad de ventas, primeras reviews. No escalar hasta que el producto demuestre tracción orgánica.'],
        ['Etapa 2 — Optimización (3–6 meses)','Mejorar listing, PPC, packaging. Lanzar variantes o segundo producto del mismo nicho. Objetivo: ACoS < 30%, margen > 35%, al menos 20 reviews con 4.0+ promedio.'],
        ['Etapa 3 — Escala (6–12 meses)','Añadir canales (MeLi si no lo hiciste, Shopify). Aumentar inventario. Primer VA (asistente virtual). Objetivo: USD 10K+ revenue/mes, flujo de caja positivo.'],
        ['Etapa 4 — Sistemización (12+ meses)','SOPs documentados para cada proceso. Equipo. 5–10 productos activos. Explorar marca propia. Considerar venta del negocio a agregadores (3–5x EBITDA anual).'],
      ]},
      { label:'LLC en EE.UU. — Wyoming', items:[
        ['Por qué Wyoming','Sin impuesto estatal a las ganancias. Costo anual mínimo (USD 102). Privacidad total del owner. Ideal para no residentes.'],
        ['Proceso de formación','1) Registrar LLC con servicio como Northwest o Incfile (USD 100–200). 2) Obtener EIN del IRS (gratis, online, 2–3 semanas). 3) Abrir cuenta en Mercury Bank o Relay (acepta no residentes). 4) Vincular Payoneer/Wise.'],
        ['Delaware vs Wyoming','Delaware: preferido por inversores y VCs. Más complejo y caro. Solo si buscás funding externo. Wyoming: perfecto para operación propia sin inversores.'],
      ]},
      { label:'Virtual Assistants (VAs)', text:'El primer hire recomendado es un VA de servicio al cliente en Amazon: respuesta a reviews, manejo de casos con Seller Support, monitoreo de listing hijacking. Costo: USD 5–10/hora desde Filipinas (Onlinejobs.ph) o LATAM.' },
      { label:'El activo', highlight:true, text:'Un negocio de e-commerce bien sistemizado no depende de vos para funcionar. Eso lo hace vendible. En Amazon, negocios rentables se venden entre 3x y 5x el EBITDA anual a agregadores como Thrasio, Branded o Berlin Brands. El objetivo final no es solo vender productos — es construir algo que valga.' },
    ]
  },
  {
    num:'08', emoji:'⚙️', title:'ProductLab — El Sistema', subtitle:'Cómo usar el sistema operativo de tu negocio', color:'#00E5A0',
    sections:[
      { label:'El flujo de 4 pasos', items:[
        ['Paso 1 — Calendario','Seleccionás la fecha para la que estás comprando: Navidad, Día de la Madre, Hot Sale, Black Friday, vacaciones, etc. El sistema calcula automáticamente si llegás en barco o solo en aéreo, y te muestra la fecha límite de orden al proveedor.'],
        ['Paso 2 — Research','Elegís el segmento (Tendencia / Estacional / Cotidiano) y la categoría. La IA analiza y devuelve 3 productos con score de oportunidad, métricas de demanda, margen estimado por canal y links directos para buscar en Alibaba, 1688, Amazon y MeLi.'],
        ['Paso 3 — Decisión de compra','Ingresás el costo del proveedor. El sistema calcula automáticamente el costo de aterrizaje completo: flete (barco o aéreo según la fecha), seguro, aduana con el arancel correcto por categoría, prep center y banco. Muestra si conviene comprar (✅), evaluar (⚠️) o no comprar (🛑).'],
        ['Paso 4 — Plan de acción','Generás el checklist de lanzamiento personalizado por canal. Elegís en qué canal comprás (Alibaba/1688/Amazon/local) y en cuál vendés (MeLi/Amazon/Shopify). Un click → el producto aparece en el Dashboard con estado "Ordenado".'],
      ]},
      { label:'El Dashboard', items:[
        ['Mis productos','Todos los productos comprados con su estado actual: Ordenado → Producción → En barco → Aduana → Live → Vendido. Podés cambiar el estado con un click. El P&L real se calcula automáticamente.'],
        ['Publicar en MeLi','Desde el Dashboard, un producto Live se puede publicar directamente en MercadoLibre. El sistema busca la categoría, precalcula el precio en ARS con el tipo de cambio BNA real del día, y publica vía API.'],
        ['Análisis guardados','Todos los research que guardaste desde el Scout quedan acá para referencia. Podés convertir un análisis en producto con un click.'],
        ['Manual','Este libro digital que estás leyendo.'],
      ]},
      { label:'Tipo de cambio', text:'El sistema usa el tipo de cambio oficial BNA (Banco Nación Argentina) en tiempo real para convertir precios USD a ARS al momento de publicar en MeLi. Siempre podés ajustar el precio antes de confirmar la publicación.' },
      { label:'Acceso', highlight:true, text:'ProductLab es una plataforma privada de acceso por invitación. Cada usuario ve solo sus propios datos. El administrador puede invitar nuevos usuarios desde el panel. La API key de IA y las credenciales de MeLi están seguras en el servidor — nunca expuestas en el código del cliente.' },
    ]
  },
];

function ManualBook() {
  const [page, setPage] = useState(0);
  const cap = CAPITULOS[page];
  const total = CAPITULOS.length;

  return (
    <div style={{fontFamily:'Syne,sans-serif'}}>
      {/* PROGRESS BAR */}
      <div style={{display:'flex',gap:'4px',marginBottom:'16px'}}>
        {CAPITULOS.map((c,i)=>(
          <div key={i} onClick={()=>setPage(i)} style={{
            flex:1, height:'3px', background: i===page ? c.color : i<page ? 'rgba(0,229,160,0.3)' : 'rgba(255,255,255,0.07)',
            cursor:'pointer', transition:'background 0.2s'
          }}/>
        ))}
      </div>

      {/* BOOK PAGE */}
      <div style={{background:'#0D1219',border:'1px solid rgba(255,255,255,0.07)',minHeight:'520px',position:'relative',overflow:'hidden'}}>
        {/* Color accent top */}
        <div style={{position:'absolute',top:0,left:0,right:0,height:'4px',background:`linear-gradient(90deg,${cap.color},transparent)`}}/>

        {/* Header */}
        <div style={{padding:'28px 32px 20px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',gap:'16px'}}>
          <div style={{fontSize:'32px',lineHeight:1}}>{cap.emoji}</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:'JetBrains Mono',fontSize:'10px',letterSpacing:'0.15em',textTransform:'uppercase',color:cap.color,marginBottom:'4px'}}>
              Capítulo {cap.num} · {page+1}/{total}
            </div>
            <div style={{fontSize:'20px',fontWeight:'800',color:'#E8F0F8',lineHeight:1.2}}>{cap.title}</div>
            <div style={{fontSize:'13px',color:'#5A7A8A',marginTop:'4px'}}>{cap.subtitle}</div>
          </div>
        </div>

        {/* Content */}
        <div style={{padding:'24px 32px 80px',overflowY:'auto',maxHeight:'440px'}}>
          {cap.sections.map((s,si)=>(
            <div key={si} style={{marginBottom:'24px'}}>
              <div style={{fontFamily:'JetBrains Mono',fontSize:'10px',letterSpacing:'0.15em',textTransform:'uppercase',color:cap.color,marginBottom:'10px',paddingBottom:'6px',borderBottom:`1px solid ${cap.color}22`}}>
                {s.label}
              </div>
              {s.highlight ? (
                <div style={{padding:'14px 16px',borderLeft:`3px solid ${cap.color}`,background:`${cap.color}10`,fontSize:'13px',color:'#E8F0F8',lineHeight:'1.7'}}>
                  {s.text}
                </div>
              ) : s.text ? (
                <div style={{fontSize:'13px',color:'#B0C4D8',lineHeight:'1.8'}}>{s.text}</div>
              ) : s.items ? (
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  {s.items.map(([k,v],ii)=>(
                    <div key={ii} style={{display:'grid',gridTemplateColumns:'180px 1fr',gap:'12px',alignItems:'start'}}>
                      <div style={{fontFamily:'JetBrains Mono',fontSize:'11px',fontWeight:'600',color:'#E8F0F8',paddingTop:'1px'}}>{k}</div>
                      <div style={{fontSize:'12px',color:'#8AAABB',lineHeight:'1.6'}}>{v}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'14px 32px',borderTop:'1px solid rgba(255,255,255,0.07)',background:'#0D1219',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}
            style={{fontFamily:'JetBrains Mono',fontSize:'11px',padding:'7px 16px',background:'none',border:'1px solid rgba(255,255,255,0.1)',color:page===0?'#2A3A4A':'#E8F0F8',cursor:page===0?'not-allowed':'pointer',letterSpacing:'0.06em',textTransform:'uppercase',transition:'all 0.15s'}}>
            ← Anterior
          </button>
          <div style={{display:'flex',gap:'6px'}}>
            {CAPITULOS.map((c,i)=>(
              <div key={i} onClick={()=>setPage(i)} style={{
                width: i===page?'20px':'6px', height:'6px', borderRadius:'3px',
                background: i===page ? cap.color : 'rgba(255,255,255,0.15)',
                cursor:'pointer', transition:'all 0.2s'
              }}/>
            ))}
          </div>
          <button onClick={()=>setPage(p=>Math.min(total-1,p+1))} disabled={page===total-1}
            style={{fontFamily:'JetBrains Mono',fontSize:'11px',padding:'7px 16px',background:page===total-1?'none':cap.color,border:`1px solid ${page===total-1?'rgba(255,255,255,0.1)':cap.color}`,color:page===total-1?'#2A3A4A':'#000',cursor:page===total-1?'not-allowed':'pointer',letterSpacing:'0.06em',textTransform:'uppercase',fontWeight:'700',transition:'all 0.2s'}}>
            Siguiente →
          </button>
        </div>
      </div>

      {/* CHAPTER INDEX */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'6px',marginTop:'12px'}}>
        {CAPITULOS.map((c,i)=>(
          <div key={i} onClick={()=>setPage(i)} style={{
            padding:'8px 12px',border:`1px solid ${i===page?c.color:'rgba(255,255,255,0.07)'}`,
            background:i===page?`${c.color}10`:'none',cursor:'pointer',transition:'all 0.15s',
            display:'flex',alignItems:'center',gap:'8px'
          }}>
            <span style={{fontSize:'14px'}}>{c.emoji}</span>
            <div>
              <div style={{fontFamily:'JetBrains Mono',fontSize:'9px',color:i===page?c.color:'#5A7A8A',letterSpacing:'0.08em',textTransform:'uppercase'}}>Cap {c.num}</div>
              <div style={{fontSize:'11px',color:i===page?'#E8F0F8':'#7A9BB5',fontWeight:i===page?'700':'400',lineHeight:1.3}}>{c.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
        {activeTab === 'manual' && <ManualBook />}
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
