# CLAUDE.md — Vitalcom Platform

> Este archivo es el contexto maestro del proyecto Vitalcom. Claude Code debe leerlo completo al inicio de cada sesión antes de tocar cualquier archivo.

---

## 🌿 ¿Qué es Vitalcom?

**Vitalcom** es una empresa de proveeduría de productos de bienestar con presencia en 4 países de Latinoamérica:

- 🇨🇴 **Colombia**
- 🇪🇨 **Ecuador**
- 🇬🇹 **Guatemala**
- 🇨🇱 **Chile**

Vitalcom ya tiene una **comunidad de ~1500 usuarios** (dropshippers, emprendedores de bienestar, revendedores) y este proyecto es la plataforma digital interna para:

1. **Operar el negocio** (SaaS administrativo multi-país)
2. **Servir a su comunidad** (plataforma tipo Skool con herramientas de comercio electrónico)

---

## 🎯 Visión del producto

Vitalcom Platform es una plataforma todo-en-uno que combina:

### A) SaaS Administrativo (uso interno Vitalcom)
- Catálogo maestro de productos multi-país
- Stock por país (CO/EC/GT/CL)
- Gestión de pedidos B2B/B2C
- CRM de clientes y dropshippers
- Inbox interno para comunicación entre áreas (ventas, logística, marketing, soporte, dirección)
- Panel financiero con liquidaciones por país
- Analytics: ventas, productos top, países top
- Integración con Dropi para fulfillment

### B) Comunidad + Herramientas (cara al usuario / 1500 miembros)
- **Comunidad tipo Skool**: feed, posts, comentarios, niveles, gamificación, cursos
- **Calculadora de precios para dropshippers**: precio base + envío + márgen + comisiones por país
- **Generador de flujos Luzitbot**: plantillas listas + builder visual de chatflows
- **Inbox / chat de comunidad**: mensajería entre miembros y entre áreas
- **Catálogo público navegable**: el dropshipper ve el catálogo Vitalcom y solicita productos
- **Cursos y formación**: módulos sobre dropshipping, marketing, ventas, mindset
- **Eventos y lives**: agendas de webinars y formaciones en vivo

### C) Conexión con Zendu (fase 2)
Vitalcom es proveedor oficial del **Marketplace de Zendu** (ver `ZENDU_VITALCOM_MODULO.md` en la carpeta de Zendu). Esta plataforma debe **exponer APIs** para que Zendu consuma:
- `GET /api/public/catalog` — catálogo Vitalcom
- `GET /api/public/stock/:sku` — stock por país
- `POST /api/public/orders` — recibir pedidos generados en tiendas Zendu
- `GET /api/public/tracking/:orderId` — estado de fulfillment

Importante: la conexión Zendu↔Vitalcom es **API-to-API**, no compartiendo BD ni código.

---

## 🎨 Identidad visual y branding de Vitalcom

**CRÍTICO**: Todo el código visual debe respetar esta identidad. Vitalcom NO usa la paleta de Zendu. Vitalcom es **tech-natural**: futurismo neón con alma wellness.

### Personalidad de marca
- Energía y vitalidad (verde lima neón)
- Tecnología de punta (negro profundo + glow)
- Naturaleza y bienestar (las hojas del isotipo)
- Claridad y confianza (alto contraste)

### Paleta de colores oficial

```css
/* ─── PALETA VITALCOM — usar estos valores exactos en todo el proyecto ─── */
:root {
  /* Verdes lima — color dominante de marca */
  --vc-lime-main:      #C6FF3C;  /* Verde lima principal — CTAs, acentos */
  --vc-lime-electric:  #A8FF00;  /* Verde eléctrico — hover states */
  --vc-lime-glow:      #DFFF80;  /* Verde glow — brillos, bordes activos */
  --vc-lime-soft:      #E8FFB3;  /* Verde suave — highlights de texto */
  --vc-lime-deep:      #7FB800;  /* Verde profundo — fondos de sección */
  --vc-lime-dark:      #4A6B00;  /* Verde oscuro — texto sobre claro */

  /* Negros y grises — fondos y superficies */
  --vc-black:          #0A0A0A;  /* Negro profundo — fondo principal */
  --vc-black-mid:      #141414;  /* Negro medio — cards */
  --vc-black-soft:     #1F1F1F;  /* Negro suave — superficies elevadas */
  --vc-gray-dark:      #2A2A2A;  /* Gris oscuro — bordes */
  --vc-gray-mid:       #4A4A4A;  /* Gris medio — texto secundario */

  /* Neutros sobre oscuro */
  --vc-white:          #FFFFFF;
  --vc-white-soft:     #F5F5F5;  /* Texto principal sobre negro */
  --vc-white-dim:      #B8B8B8;  /* Texto secundario sobre negro */

  /* Efectos de luz */
  --vc-glow-lime:      rgba(198, 255, 60, 0.4);   /* Glow suave */
  --vc-glow-strong:    rgba(168, 255, 0, 0.65);   /* Glow intenso */
  --vc-glow-white:     rgba(255, 255, 255, 0.08); /* Brillo sutil */

  /* Estados */
  --vc-success:        #C6FF3C;  /* Mismo verde de marca */
  --vc-warning:        #FFB800;
  --vc-error:          #FF4757;
  --vc-info:           #3CC6FF;

  /* Gradientes oficiales */
  --vc-gradient-primary: linear-gradient(135deg, #A8FF00 0%, #C6FF3C 50%, #DFFF80 100%);
  --vc-gradient-dark:    linear-gradient(135deg, #0A0A0A 0%, #1F1F1F 50%, #2A2A2A 100%);
  --vc-gradient-hero:    linear-gradient(180deg, #0A0A0A 0%, #141414 60%, #1F1F1F 100%);
  --vc-gradient-glow:    radial-gradient(circle at center, rgba(198,255,60,0.25) 0%, transparent 70%);
}
```

### Tipografía oficial

```css
/* Fuentes del proyecto */
--font-display:  'Orbitron', sans-serif;       /* Logo, hero, headlines XL — geométrica futurista */
--font-heading:  'Space Grotesk', sans-serif;  /* H1-H4, nav, secciones */
--font-body:     'Inter', sans-serif;          /* Cuerpo, UI, formularios */
--font-mono:     'JetBrains Mono', monospace;  /* Códigos, SKUs, datos técnicos */

/* Importar en layout.tsx desde Google Fonts:
   Orbitron: weights 500, 700, 900
   Space Grotesk: weights 400, 500, 600, 700
   Inter: weights 400, 500, 600
   JetBrains Mono: weights 400, 500
*/
```

### Componentes visuales clave

**Botón primario Vitalcom:**
```css
background: var(--vc-lime-main);
color: var(--vc-black);
box-shadow: 0 0 24px var(--vc-glow-lime), 0 4px 16px rgba(168,255,0,0.25);
border: 1px solid rgba(223, 255, 128, 0.4);
border-radius: 10px;
font-family: var(--font-heading);
font-weight: 700;
letter-spacing: 0.03em;
text-transform: uppercase;
transition: all 0.3s ease;

/* Hover */
hover: background: var(--vc-lime-electric);
       box-shadow: 0 0 40px var(--vc-glow-strong);
       transform: translateY(-1px);
```

**Cards de dashboard:**
```css
background: var(--vc-black-mid);
border: 1px solid rgba(198, 255, 60, 0.15);
border-radius: 14px;
hover: border-color: rgba(198, 255, 60, 0.5);
       box-shadow: 0 0 24px var(--vc-glow-lime);
```

**Navbar/Header:**
```css
background: rgba(10, 10, 10, 0.85);
backdrop-filter: blur(20px);
border-bottom: 1px solid rgba(198, 255, 60, 0.18);
```

**Texto hero (con gradiente):**
```css
background: var(--vc-gradient-primary);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
font-family: var(--font-display);
font-weight: 900;
letter-spacing: 0.02em;
```

### Modo oscuro por defecto
**Vitalcom es dark-first siempre.** No hay modo claro en la plataforma. Toda la UI vive sobre `--vc-black` con acentos de verde lima. Esto refuerza el contraste neón del branding.

### Logo
Asset principal en:
```
public/assets/branding/imagen vitalcom.jpeg   ← logo original entregado por el cliente
public/assets/branding/logo.png               ← versión limpia (pendiente de generar)
public/assets/branding/logo-icon.svg          ← ícono simplificado para favicon
```

### Animaciones de marca
```css
/* Pulso neón en CTAs principales */
@keyframes vc-pulse {
  0%, 100% { box-shadow: 0 0 20px var(--vc-glow-lime); }
  50%      { box-shadow: 0 0 40px var(--vc-glow-strong); }
}

/* Glow flotante en cards activas */
@keyframes vc-float-glow {
  0%, 100% { transform: translateY(0); box-shadow: 0 0 20px var(--vc-glow-lime); }
  50%      { transform: translateY(-2px); box-shadow: 0 0 30px var(--vc-glow-strong); }
}

/* Reveal de texto */
@keyframes vc-reveal {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

---

## 🗂️ Estructura del proyecto

```
vitalcom/
├── CLAUDE.md                          # Este archivo — leer siempre primero
├── .env.local                         # Variables de entorno (nunca commitear)
├── .env.example                       # Plantilla de variables
├── next.config.ts
├── tailwind.config.ts
├── prisma/
│   └── schema.prisma                  # Schema completo de la BD
├── public/
│   └── assets/
│       └── branding/                  # Logo y assets de marca
├── src/
│   ├── app/
│   │   ├── (marketing)/               # Sitio público de Vitalcom
│   │   │   ├── page.tsx               # Homepage
│   │   │   ├── catalogo/page.tsx      # Catálogo público
│   │   │   ├── comunidad/page.tsx     # Landing comunidad
│   │   │   └── contacto/page.tsx
│   │   ├── (auth)/                    # Autenticación
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (admin)/                   # SaaS interno Vitalcom
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # Dashboard admin
│   │   │   ├── catalogo/              # Gestión catálogo maestro
│   │   │   ├── stock/                 # Stock multi-país
│   │   │   ├── pedidos/               # Pedidos B2B/B2C
│   │   │   ├── clientes/              # CRM
│   │   │   ├── inbox/                 # Inbox interno entre áreas
│   │   │   ├── finanzas/              # Liquidaciones, pagos
│   │   │   └── ajustes/
│   │   ├── (community)/               # Plataforma para los 1500 usuarios
│   │   │   ├── layout.tsx
│   │   │   ├── feed/page.tsx          # Muro tipo Skool
│   │   │   ├── cursos/                # Formación y módulos
│   │   │   ├── eventos/               # Agenda de lives
│   │   │   ├── herramientas/
│   │   │   │   ├── calculadora/page.tsx     # Calculadora dropshipper
│   │   │   │   ├── flujos/page.tsx          # Generador Luzitbot
│   │   │   │   └── catalogo/page.tsx        # Explorar catálogo Vitalcom
│   │   │   ├── chat/                  # Mensajería miembros
│   │   │   ├── perfil/                # Perfil y niveles
│   │   │   └── ranking/               # Leaderboard gamificación
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── catalog/route.ts
│   │   │   ├── stock/route.ts
│   │   │   ├── orders/route.ts
│   │   │   ├── inbox/route.ts
│   │   │   ├── community/
│   │   │   │   ├── posts/route.ts
│   │   │   │   ├── comments/route.ts
│   │   │   │   └── reactions/route.ts
│   │   │   ├── tools/
│   │   │   │   ├── pricing-calculator/route.ts
│   │   │   │   └── workflow-generator/route.ts
│   │   │   └── public/                # APIs expuestas a Zendu y otros
│   │   │       ├── catalog/route.ts
│   │   │       ├── stock/route.ts
│   │   │       └── orders/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                        # Shadcn Base UI
│   │   ├── marketing/
│   │   ├── admin/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── StockMatrix.tsx        # Tabla stock multi-país
│   │   │   └── OrderTable.tsx
│   │   ├── community/
│   │   │   ├── PostCard.tsx
│   │   │   ├── FeedComposer.tsx
│   │   │   ├── CourseCard.tsx
│   │   │   ├── LevelBadge.tsx
│   │   │   └── ChatInbox.tsx
│   │   ├── tools/
│   │   │   ├── PricingCalculator.tsx
│   │   │   └── WorkflowBuilder.tsx
│   │   └── shared/
│   │       ├── CountryFlag.tsx
│   │       └── Logo.tsx
│   ├── lib/
│   │   ├── db/prisma.ts               # Cliente Prisma singleton
│   │   ├── auth/auth.config.ts        # NextAuth config
│   │   ├── countries/                 # Config por país
│   │   │   ├── colombia.ts
│   │   │   ├── ecuador.ts
│   │   │   ├── guatemala.ts
│   │   │   └── chile.ts
│   │   ├── pricing/
│   │   │   └── calculator.ts          # Lógica calculadora dropshipper
│   │   ├── workflows/
│   │   │   └── luzitbot.ts            # Generador de flujos
│   │   ├── community/
│   │   │   ├── levels.ts              # Sistema de niveles
│   │   │   └── gamification.ts
│   │   ├── integrations/
│   │   │   ├── dropi.ts               # Cliente Dropi
│   │   │   ├── zendu.ts               # Cliente Zendu Marketplace
│   │   │   └── whatsapp.ts            # WhatsApp Business
│   │   └── utils/
│   │       ├── slugify.ts
│   │       ├── currency.ts            # Conversión COP/USD/GTQ/CLP
│   │       └── cn.ts
│   ├── hooks/
│   │   ├── useCountry.ts              # País activo del usuario
│   │   ├── useCommunity.ts
│   │   └── useInbox.ts
│   └── types/
│       ├── index.ts
│       ├── catalog.types.ts
│       ├── community.types.ts
│       └── inbox.types.ts
```

---

## 🛠️ Stack tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| Framework | **Next.js 14** (App Router) | SSR/SSG, rutas dinámicas, API routes |
| Lenguaje | **TypeScript strict** | 100% tipado |
| Estilos | **Tailwind CSS v4** + **Shadcn Base UI** | UI components + utilidades |
| Animaciones | **Framer Motion** | Animaciones scroll, transiciones, glow |
| Base de datos | **PostgreSQL** + **Prisma v5** | ORM tipado, migraciones |
| Auth | **NextAuth v4** + **Supabase Auth** | Sesiones multi-rol |
| Storage | **Supabase Storage** | Imágenes de productos, avatares |
| Tiempo real | **Supabase Realtime** | Inbox, chat comunidad, stock live |
| IA | **OpenAI GPT-4o** | Asistente comunidad, generación contenido |
| Pagos | **Wompi** + **MercadoPago** + **Stripe** | LATAM + internacional |
| Email | **Resend** | Transaccionales |
| Logística | **Dropi API** | Fulfillment multi-país |
| Hosting | **Vercel** | Deploy, edge functions |
| Monitoreo | **Sentry** | Error tracking |

---

## 🗄️ Schema de base de datos (Prisma) — base inicial

```prisma
// Roles del sistema
enum UserRole {
  SUPERADMIN      // Dueños de Vitalcom
  ADMIN           // Equipo administrativo
  MANAGER_AREA    // Líderes de área (ventas, logística, marketing, etc.)
  EMPLOYEE        // Empleados de áreas
  COMMUNITY       // Miembros de la comunidad (1500 usuarios)
  DROPSHIPPER     // Dropshippers verificados
}

enum Country {
  CO  // Colombia
  EC  // Ecuador
  GT  // Guatemala
  CL  // Chile
}

enum Area {
  VENTAS
  LOGISTICA
  MARKETING
  SOPORTE
  FINANZAS
  DIRECCION
  PRODUCTO
  COMUNIDAD
}

model User {
  id            String     @id @default(cuid())
  email         String     @unique
  name          String?
  password      String?
  role          UserRole   @default(COMMUNITY)
  country       Country?
  area          Area?
  avatar        String?
  phone         String?
  whatsapp      String?
  // Comunidad
  level         Int        @default(1)
  points        Int        @default(0)
  bio           String?
  // Estado
  active        Boolean    @default(true)
  verified      Boolean    @default(false)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  posts         Post[]
  comments      Comment[]
  inboxSent     InboxMessage[] @relation("MessageSender")
  inboxReceived InboxMessage[] @relation("MessageReceiver")
  orders        Order[]
}

// ─── CATÁLOGO ──────────────────────────────────────────
model Product {
  id            String     @id @default(cuid())
  sku           String     @unique
  name          String
  slug          String     @unique
  description   String?
  category      String?
  images        String[]
  basePrice     Float      // Precio base Vitalcom
  suggestedPrice Float     // Precio sugerido al consumidor final
  weight        Float?
  active        Boolean    @default(true)
  bestseller    Boolean    @default(false)

  stock         Stock[]
  orderItems    OrderItem[]
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}

model Stock {
  id            String     @id @default(cuid())
  productId     String
  product       Product    @relation(fields: [productId], references: [id])
  country       Country
  quantity      Int        @default(0)
  warehouse     String?    // Bodega física
  updatedAt     DateTime   @updatedAt

  @@unique([productId, country])
}

// ─── PEDIDOS ──────────────────────────────────────────
enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  DISPATCHED
  DELIVERED
  CANCELLED
  RETURNED
}

enum OrderSource {
  DIRECT          // Pedido directo en Vitalcom
  ZENDU           // Vino del marketplace de Zendu
  COMMUNITY       // Generado por miembro de comunidad
  DROPSHIPPER     // Pedido de dropshipper
}

model Order {
  id            String     @id @default(cuid())
  number        String     @unique  // VC-2026-00001
  userId        String?
  user          User?      @relation(fields: [userId], references: [id])
  source        OrderSource
  country       Country
  status        OrderStatus @default(PENDING)
  customerName  String
  customerEmail String
  customerPhone String?
  customerAddress String?
  items         OrderItem[]
  subtotal      Float
  shipping      Float
  total         Float
  trackingCode  String?
  carrier       String?
  notes         String?
  externalRef   String?    // Ref del sistema origen (ej: order ID en Zendu)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}

model OrderItem {
  id            String     @id @default(cuid())
  orderId       String
  order         Order      @relation(fields: [orderId], references: [id])
  productId     String
  product       Product    @relation(fields: [productId], references: [id])
  quantity      Int
  unitPrice     Float
  total         Float
}

// ─── INBOX INTERNO (entre áreas) ───────────────────────
model InboxThread {
  id            String     @id @default(cuid())
  subject       String
  area          Area
  priority      String     @default("normal") // low, normal, high, urgent
  resolved      Boolean    @default(false)
  messages      InboxMessage[]
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}

model InboxMessage {
  id            String     @id @default(cuid())
  threadId      String
  thread        InboxThread @relation(fields: [threadId], references: [id])
  senderId      String
  sender        User       @relation("MessageSender", fields: [senderId], references: [id])
  receiverId    String?
  receiver      User?      @relation("MessageReceiver", fields: [receiverId], references: [id])
  body          String
  attachments   String[]
  read          Boolean    @default(false)
  createdAt     DateTime   @default(now())
}

// ─── COMUNIDAD (estilo Skool) ──────────────────────────
model Post {
  id            String     @id @default(cuid())
  authorId      String
  author        User       @relation(fields: [authorId], references: [id])
  title         String?
  body          String
  images        String[]
  category      String?    // tips, ventas, mindset, casos, dudas
  pinned        Boolean    @default(false)
  likes         Int        @default(0)
  comments      Comment[]
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}

model Comment {
  id            String     @id @default(cuid())
  postId        String
  post          Post       @relation(fields: [postId], references: [id])
  authorId      String
  author        User       @relation(fields: [authorId], references: [id])
  body          String
  parentId      String?    // Para hilos / respuestas
  likes         Int        @default(0)
  createdAt     DateTime   @default(now())
}

model Course {
  id            String     @id @default(cuid())
  title         String
  slug          String     @unique
  description   String?
  cover         String?
  level         String     // beginner, intermediate, advanced
  modules       Json       // Array de módulos con lecciones
  published     Boolean    @default(false)
  order         Int        @default(0)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}

// ─── HERRAMIENTAS GUARDADAS POR USUARIO ────────────────
model PricingCalculation {
  id            String     @id @default(cuid())
  userId        String
  productName   String
  basePrice     Float
  shipping      Float
  margin        Float
  finalPrice    Float
  country       Country
  notes         String?
  createdAt     DateTime   @default(now())
}

model WorkflowTemplate {
  id            String     @id @default(cuid())
  userId        String?    // null = plantilla oficial
  name          String
  description   String?
  category      String     // ventas, soporte, postventa
  steps         Json       // Definición del flujo Luzitbot
  isPublic      Boolean    @default(false)
  uses          Int        @default(0)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}
```

---

## 🌎 Multi-país: configuración por país

Cada país tiene su propia configuración en `src/lib/countries/`:

```typescript
// Ejemplo: src/lib/countries/colombia.ts
export const COLOMBIA = {
  code: 'CO',
  name: 'Colombia',
  currency: 'COP',
  currencySymbol: '$',
  flag: '🇨🇴',
  phonePrefix: '+57',
  defaultCarriers: ['Servientrega', 'Coordinadora', 'Interrapidísimo'],
  paymentMethods: ['Wompi', 'PSE', 'Nequi', 'Daviplata', 'MercadoPago'],
  taxRate: 0.19,           // IVA 19%
  shippingBaseCost: 12000, // COP
  fulfillmentPartner: 'Dropi',
}
```

Países activos:
- 🇨🇴 **Colombia** (sede principal)
- 🇪🇨 **Ecuador**
- 🇬🇹 **Guatemala**
- 🇨🇱 **Chile**

Cada producto tiene un registro de stock por país. Las landings de cada país se sirven dinámicamente con `useCountry()` que detecta país por dominio o cookie.

---

## 🛠️ Herramientas para la comunidad

### 1. Calculadora de precios para dropshippers
**Archivo:** `src/lib/pricing/calculator.ts`

Inputs:
- Precio base Vitalcom
- País del cliente final (CO/EC/GT/CL)
- Margen deseado (%)
- Costo de envío (auto por país)
- Comisiones de pasarela (auto por método de pago)
- Impuestos del país

Outputs:
- Precio de venta sugerido
- Ganancia neta
- Margen real %
- Desglose completo (envío, comisiones, impuestos, ganancia)

Se guarda en `PricingCalculation` para que el dropshipper tenga su histórico.

### 2. Generador de flujos Luzitbot
**Archivo:** `src/lib/workflows/luzitbot.ts`

- Plantillas listas para casos comunes:
  - Bienvenida + cualificación de leads
  - Recuperación de carritos abandonados
  - Seguimiento postventa + reseñas
  - Soporte automatizado nivel 1
- Builder visual: el usuario arma el flujo arrastrando bloques
- Export a formato Luzitbot (JSON compatible con su API)
- Compartir plantillas en la comunidad (`isPublic: true`)

### 3. Inbox / chat comunidad
- Mensajería 1-a-1 entre miembros
- Canales temáticos por nicho (dropshipping, servicios, marca propia)
- Notificaciones en tiempo real (Supabase Realtime)
- Moderación por admins de comunidad

### 4. Catálogo navegable
- Vista pública del catálogo Vitalcom
- Filtros: categoría, país, precio, bestseller
- Solicitar acceso al producto → genera lead a Vitalcom
- Si es dropshipper verificado: importar a su tienda con un clic

### 5. Plataforma de cursos
- Cursos por niveles (principiante, intermedio, avanzado)
- Tracking de progreso
- Certificados al completar
- Sistema de puntos por lección completada

---

## 🏆 Sistema de gamificación (estilo Skool)

```typescript
// Niveles basados en puntos acumulados
const LEVELS = [
  { level: 1, name: 'Semilla', minPoints: 0 },
  { level: 2, name: 'Brote', minPoints: 100 },
  { level: 3, name: 'Hoja', minPoints: 500 },
  { level: 4, name: 'Tallo', minPoints: 1500 },
  { level: 5, name: 'Rama', minPoints: 3500 },
  { level: 6, name: 'Árbol', minPoints: 7000 },
  { level: 7, name: 'Bosque', minPoints: 15000 },
  { level: 8, name: 'Ecosistema', minPoints: 30000 },
  { level: 9, name: 'Vital', minPoints: 60000 },
]

// Puntos por acción
const POINTS = {
  POST_CREATED: 10,
  COMMENT_CREATED: 3,
  LIKE_RECEIVED: 1,
  COURSE_COMPLETED: 50,
  LESSON_COMPLETED: 5,
  EVENT_ATTENDED: 20,
  TOOL_USED: 2,
  REFERRAL: 100,
}
```

Naming alineado con la identidad **bienestar/natural** del logo (hojas → árbol → ecosistema).

---

## 🔌 Integraciones planeadas

### Fase 1 (MVP)
- ✅ Supabase (Auth + Storage + Realtime)
- ✅ Dropi API (logística multi-país)
- ✅ OpenAI (asistente comunidad)
- ✅ Resend (emails)

### Fase 2
- Wompi, MercadoPago, PSE, Nequi (pagos LATAM)
- WhatsApp Business API (notificaciones)
- Zendu Marketplace API (Vitalcom como proveedor)
- Stripe (suscripciones a planes premium de comunidad)

### Fase 3
- Luzitbot API (export real de flujos)
- Klaviyo (email marketing comunidad)
- Meta Pixel + GA4 + TikTok Pixel
- WhatsApp multi-agente

---

## 🔧 Variables de entorno requeridas

```bash
# .env.local

# Base de datos
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Auth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o"

# Dropi
DROPI_API_KEY="..."
DROPI_API_URL="https://api.dropi.co"

# Resend
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@vitalcom.co"

# Pagos LATAM (Fase 2)
WOMPI_PUBLIC_KEY=""
WOMPI_PRIVATE_KEY=""
MERCADOPAGO_ACCESS_TOKEN=""
STRIPE_SECRET_KEY=""

# Zendu Marketplace (Fase 2)
ZENDU_API_URL=""
ZENDU_API_KEY=""

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Vitalcom"
```

---

## 📋 Convenciones de código

### Nomenclatura
- Componentes: PascalCase (`PostCard.tsx`)
- Hooks: camelCase con `use` prefix (`useCountry.ts`)
- Utilities: camelCase (`slugify.ts`)
- Tipos: PascalCase (`Product`, `OrderType`)
- API routes: kebab-case (`pricing-calculator/route.ts`)
- Variables de entorno: SCREAMING_SNAKE_CASE

### Componentes
- 100% TypeScript strict
- `'use client'` solo cuando sea necesario
- Server Components por defecto
- Mobile-first siempre

### Idioma
- **Comentarios en código: español** (consistente con el equipo y con las convenciones del proyecto Zendu)
- Nombres de variables/funciones: inglés
- Strings de UI: español (i18n preparado para futuro mexicano/argentino)

### Manejo de errores
- Try/catch en todas las llamadas externas (Dropi, Supabase, OpenAI)
- Skeletons en lugar de spinners
- Errores de API: `{ error: string, code: string }` con HTTP status correcto
- Sentry en producción

### Estilos
- Solo Tailwind CSS v4
- Variantes con `cva` (class-variance-authority)
- Animaciones complejas → Framer Motion
- Colores SIEMPRE desde tokens CSS (`var(--vc-*)`), nunca hardcodeados

### Patrones aprendidos del proyecto Zendu (aplicables aquí)
- `suppressHydrationWarning` SOLO en `<html>`, nunca en otros elementos
- Event handlers en archivos separados de Server Components
- Pooler de Supabase obligatorio para `DATABASE_URL` (`?pgbouncer=true&connection_limit=1`)
- `DIRECT_URL` para migraciones de Prisma

---

## 🚀 Comandos de desarrollo

```bash
npm install
npm run dev
npx prisma generate
npx prisma migrate dev --name init
npx prisma studio
npm run build
npm run lint
```

---

## ⚠️ Reglas importantes para Claude Code

1. **Siempre leer este archivo antes de empezar** cualquier tarea
2. **Vitalcom NO usa la paleta de Zendu** — verde lima neón sobre negro, no púrpura
3. **Multi-país desde el día 1** — toda query de stock/pedido lleva `country`
4. **Multi-rol desde el día 1** — verificar `role` en cada API protegida
5. **Nunca hardcodear** API keys, URLs o credenciales
6. **Tipar todo** — TypeScript strict
7. **Mobile-first** en todos los componentes de cara al usuario
8. **Comunidad y SaaS son módulos separados** — no mezclar lógica de admin con lógica de comunidad
9. **APIs públicas (`/api/public/*`)** son las que consume Zendu — versionar y documentar
10. **Branding es inviolable** — todo color de UI sale de `var(--vc-*)`
11. **Comentarios en español**
12. **No producción hasta que el usuario lo diga** — todo en GitHub + Vercel beta primero

---

## 📍 Estado actual del proyecto

### ✅ Completado
- [x] CLAUDE.md con visión, branding y schema base
- [x] Logo recibido y paleta extraída

### 🔨 Próximos pasos (sesión 1)
- [ ] `package.json` con todas las dependencias del stack
- [ ] Configs base: `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`
- [ ] `prisma/schema.prisma` inicial
- [ ] `src/app/globals.css` con tokens Vitalcom
- [ ] `src/app/layout.tsx` con fuentes (Orbitron + Space Grotesk + Inter)
- [ ] Página homepage placeholder con branding
- [ ] `.env.example`
- [ ] `README.md`

### 📋 Por hacer — Fase 1 (Fundación)
- [ ] Setup Supabase (auth + storage + realtime)
- [ ] Auth multi-rol con NextAuth
- [ ] Layout admin + sidebar
- [ ] Layout comunidad + sidebar
- [ ] Schema Prisma completo + primera migración

### 📋 Por hacer — Fase 2 (SaaS Admin)
- [ ] CRUD catálogo maestro
- [ ] Stock matrix multi-país
- [ ] Pedidos + estados
- [ ] Inbox interno entre áreas
- [ ] Integración Dropi

### 📋 Por hacer — Fase 3 (Comunidad)
- [ ] Feed estilo Skool (posts, comentarios, likes)
- [ ] Sistema de niveles y gamificación
- [ ] Cursos y módulos
- [ ] Chat 1-a-1 con Realtime
- [ ] Calculadora de precios dropshipper
- [ ] Generador de flujos Luzitbot
- [ ] Catálogo navegable público

### 📋 Por hacer — Fase 4 (Integraciones)
- [ ] Pagos LATAM (Wompi, MercadoPago)
- [ ] WhatsApp Business
- [ ] APIs públicas para Zendu Marketplace
- [ ] Webhooks Dropi
- [ ] Email marketing

---

*Última actualización: 2026-04-08 — Inicio del proyecto Vitalcom*
*Stack: Next.js 14 | Supabase | Prisma | OpenAI GPT-4o | Tailwind v4 | Shadcn Base UI | Framer Motion*
