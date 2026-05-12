# ProductLab

Sistema completo de research y decisión de compra para e-commerce.

## Stack
- Next.js 14
- Vercel (deploy)
- Anthropic Claude API (via server-side proxy)

## Módulos
- **Paso 1** — Calendario inteligente con 20 fechas clave y timing de shipping
- **Paso 2** — Research de producto con IA (Amazon / MeLi / Shopify / Multi-canal)
- **Paso 3** — Calculadora de compra: margen, break-even, ROI, canal óptimo
- **Paso 4** — Plan de acción con checklist de lanzamiento

## Setup local

```bash
npm install
cp .env.example .env.local
# Agregar tu ANTHROPIC_API_KEY en .env.local
npm run dev
```

## Deploy en Vercel

1. Conectar repo en vercel.com
2. Agregar variable de entorno: `ANTHROPIC_API_KEY`
3. Deploy automático en cada push a main

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `ANTHROPIC_API_KEY` | API key de Anthropic (nunca en el código) |
