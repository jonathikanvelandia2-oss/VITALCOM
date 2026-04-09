# Vitalcom Platform

> Plataforma de proveeduría de productos de bienestar con presencia en 🇨🇴 Colombia, 🇪🇨 Ecuador, 🇬🇹 Guatemala y 🇨🇱 Chile.

**Vitalcom Platform** combina dos productos en uno:

- **SaaS administrativo** para operar el negocio multi-país (catálogo, stock, pedidos, inbox interno entre áreas, finanzas).
- **Plataforma comunitaria tipo Skool** para los ~1500 usuarios de Vitalcom con feed, cursos, gamificación, calculadora de precios para dropshippers, generador de flujos Luzitbot y chat interno.

> 📖 **Lectura obligatoria antes de tocar código:** [`CLAUDE.md`](./CLAUDE.md) — contiene la visión completa, branding, schema, módulos y reglas del proyecto.

---

## 🧰 Stack

- **Next.js 14** (App Router) + **TypeScript strict**
- **Tailwind CSS v4** + **Shadcn Base UI**
- **Framer Motion** (animaciones)
- **Prisma v5** + **PostgreSQL** (Supabase)
- **NextAuth v4** + **Supabase Auth**
- **Supabase Storage + Realtime**
- **OpenAI GPT-4o** (asistente comunidad)
- **Dropi API** (logística multi-país)
- **Wompi / MercadoPago / Stripe** (pagos LATAM, Fase 2)

## 🎨 Branding

Verde lima neón `#C6FF3C` sobre negro profundo `#0A0A0A`. Tipografía display **Orbitron** (geométrica futurista, igual al logo).

Logo en `public/assets/branding/`.

## 🚀 Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env.local
# (rellenar con credenciales reales)

# 3. Generar cliente Prisma
npm run prisma:generate

# 4. Correr migración inicial
npm run prisma:migrate

# 5. Levantar dev server
npm run dev
```

App en [http://localhost:3000](http://localhost:3000)

## 📂 Estructura

```
vitalcom/
├── CLAUDE.md              # Contexto maestro del proyecto
├── prisma/schema.prisma   # Schema BD multi-rol + multi-país
├── public/assets/branding # Logo Vitalcom
├── src/
│   ├── app/
│   │   ├── (marketing)/   # Sitio público
│   │   ├── (auth)/        # Login / registro
│   │   ├── (admin)/       # SaaS interno Vitalcom
│   │   ├── (community)/   # Plataforma para los 1500 usuarios
│   │   └── api/           # API routes (incluye /api/public/* para Zendu)
│   ├── components/        # UI por dominio (admin, community, tools)
│   ├── lib/               # db, auth, countries, pricing, workflows, integrations
│   ├── hooks/
│   └── types/
```

## 🌎 Multi-país

Configuración por país en [`src/lib/countries/index.ts`](./src/lib/countries/index.ts) — moneda, transportadoras, métodos de pago, impuestos, fulfillment partner.

## 🔌 Conexión con Zendu

Vitalcom es proveedor oficial del **Marketplace de Zendu**. Esta plataforma expone APIs públicas en `/api/public/*` que Zendu consume:

- `GET /api/public/catalog` — catálogo Vitalcom
- `GET /api/public/stock/:sku` — stock por país
- `POST /api/public/orders` — recibir pedidos generados en tiendas Zendu
- `GET /api/public/tracking/:orderId` — estado de fulfillment

La conexión es **API-to-API**, no comparten BD ni código.

## 📋 Estado

🏗️ **MVP en construcción** — fundación lista, próximos pasos en `CLAUDE.md → Estado actual del proyecto`.

---

*Vitalcom · Bienestar que conecta · 2026*
