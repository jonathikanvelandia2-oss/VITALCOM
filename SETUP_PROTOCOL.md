# Protocolo de Setup — Vitalcom → Producción Real

> **Alcance:** de v2.27.0 (actual) a operación real con tienda interna Vitalcom CO y primera cohorte de dropshippers conectando tiendas Shopify reales.
>
> **Última actualización:** 2026-04-24 · versión 2.27.0

---

## 1. Estado actual del proyecto

### ✅ Lo que YA está en producción

| Sistema | Estado |
|---------|--------|
| 41 páginas UI completas (admin + community + marketing) | LIVE |
| Auth NextAuth + JWT + 6 roles | LIVE |
| 614 tests automatizados | LIVE |
| Audit log global (V40) + dashboard `/admin/seguridad` | LIVE |
| Reporte de compliance imprimible (V41) para Dropi/Effi | LIVE |
| Onboarding interactivo (V42) | LIVE |
| WhatsApp channels deep-link (V38) | LIVE |
| Inbox interno staff con SLA (V39) | LIVE |
| Product ecosystem consulta + agentes IA (V36, MOCK) | LIVE |
| Manual fulfillment + 14 carriers LATAM (V37) | LIVE |
| Calculadora dropshipper multi-país | LIVE |
| Sistema de niveles + gamificación | LIVE |
| Community Pulse CEO dashboard (V35) | LIVE |
| Weekly Insights cron dominical (V34) | LIVE |
| VITA + 8 agentes IA orchestrator | LIVE (mock/real según env) |

### ⚠️ Lo que está en MOCK mode (funciona pero sin credenciales reales)

| Sistema | Bloqueador |
|---------|-----------|
| Shopify OAuth install de dropshippers | CEO debe crear app en Partners |
| Dropi fulfillment automático | CEO debe solicitar API key |
| Effi fulfillment automático | Pendiente pitch al proveedor |
| Emails transaccionales reales | CEO debe validar DNS con Resend |
| Product Studio (Drive + Cloudinary) | CEO debe crear service accounts |
| WhatsApp Business API envíos | WABA + Embedded Signup pendiente |
| Pagos Wompi/MercadoPago | Post go-live |

### 🔴 Lo que FALTA resolver antes del go-live real

1. **Imágenes reales del catálogo** (actualmente Unsplash placeholders)
2. **Seed real de productos Vitalcom** (100+ SKUs ya modelados, falta ejecutar seed con imágenes y precios finales)
3. **Activar Shopify OAuth** para permitir instalación real de la primera tienda interna
4. **Configurar credenciales de IA** (OpenAI + opcionalmente Anthropic) si se quiere pasar de mock a real
5. **DNS de dominio final** (si se migra de `vitalcom.vercel.app` a `vitalcom.co` o equivalente)

---

## 2. Catálogo e imágenes reales

### Problema actual

`src/lib/catalog/products.ts` tiene 100+ productos con URLs Unsplash genéricas (no son fotos reales de productos Vitalcom). Esto es aceptable para demo y para que el CEO evalúe la plataforma, pero **debe resolverse antes de que la primera tienda interna reciba pedidos reales**.

### Ruta recomendada (2 opciones)

**OPCIÓN A — Cloudinary (recomendado, ~USD $0-89/mes)**
Ya tenemos el Product Studio V33 listo para consumir Cloudinary. Solo falta:

1. Crear cuenta en https://cloudinary.com (plan gratis: 25 GB storage + 25 GB bandwidth/mes — suficiente para arrancar)
2. Obtener `CLOUD_NAME`, `API_KEY`, `API_SECRET` en el panel
3. Subir al menos una foto real por SKU en una carpeta `vitalcom/products/{SKU}/hero.jpg`
4. Configurar en Vercel:
   ```
   CLOUDINARY_CLOUD_NAME=tu-cloud-name
   CLOUDINARY_API_KEY=123...
   CLOUDINARY_API_SECRET=xxx
   ```
5. Ejecutar script de migración que reemplaza URLs Unsplash → Cloudinary equivalent

**OPCIÓN B — Supabase Storage (ya está incluido, $0 adicional)**
Aprovechar el storage de Supabase ya contratado:

1. Crear bucket `products` público en el panel de Supabase
2. Subir fotos con misma estructura
3. URL directa tipo: `https://{project}.supabase.co/storage/v1/object/public/products/{SKU}/hero.jpg`

**Recomendación:** Opción B para MVP (cero costo extra), migrar a Cloudinary cuando superemos 5 GB o necesitemos transformaciones on-the-fly (resize, formato webp automático, overlays para ads).

### Checklist concreto de imágenes

- [ ] Exportar lista de 100+ SKUs a CSV
- [ ] Fotografiar/obtener del Drive del CEO imagen hero + 2-3 secundarias por producto
- [ ] Normalizar tamaño: 1200×1200px, fondo blanco o contexto limpio
- [ ] Subir con nombres `{SKU}-hero.jpg`, `{SKU}-2.jpg`, `{SKU}-3.jpg`
- [ ] Actualizar `src/lib/catalog/products.ts` con URLs reales
- [ ] Ejecutar `npx prisma db seed` para poblar tabla `Product` y `Stock`

---

## 3. Configuración de APIs de IA

Vitalcom ya tiene orchestrator (V26) + 9 agentes + semantic cache (V28). Todo funciona en modo mock sin credenciales, pero para respuestas reales:

### 3.1 OpenAI (agentes base — obligatorio si quieres IA real)

```bash
# Obtener en: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o              # o gpt-4o-mini (~10× más barato, calidad suficiente para la mayoría de agentes)
```

**Costo estimado:** USD $20-50/mes con `gpt-4o-mini` para comunidad de 800 miembros con uso moderado (3-5 interacciones con IA / miembro activo / semana).

### 3.2 Anthropic Claude (opcional — para razonamiento profundo)

El orchestrator V26 ya soporta rutear queries complejas a Claude. Activar solo si notamos que `gpt-4o-mini` es insuficiente en casos específicos (VITA CEO advisor, análisis de insights semanales).

```bash
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-haiku-4-5-20251001    # económico, rápido
# o bien:
CLAUDE_MODEL=claude-sonnet-4-6            # calidad máxima, ~3× costo
```

**Cuándo activar:** después de 2 semanas de operar solo con OpenAI. Revisamos métricas en `/admin/seguridad` + feedback cualitativo de la comunidad.

### 3.3 Embeddings (semantic cache)

Ya implementado. Requiere OpenAI key activa — usa `text-embedding-3-small` ($0.02 / 1M tokens, prácticamente gratis al volumen actual).

```bash
OPENAI_EMBEDDINGS_ENABLED=true
```

### 3.4 Feature flags que debes revisar

Desde `/admin/ops` (Salud del sistema):
- `WhatsApp MOCK` — debe estar **OFF** cuando tengamos WABA activa
- `Anthropic (Claude)` — ON si activamos sección 3.2
- `Embeddings` — ON para cache semántico

---

## 4. Shopify — protocolo completo de configuración

### 4.1 Crear la aplicación en Shopify Partners

**PASO 1 — Cuenta de Partners (gratis, 5 min)**

1. Ir a https://partners.shopify.com
2. Registrarse con el email del CEO (o email dedicado `integraciones@vitalcom.co`)
3. Elegir país Colombia + aceptar términos

**PASO 2 — Crear la app**

1. En el dashboard de Partners → `Apps` → `Create app`
2. Tipo de distribución: **Custom app** (GRATIS, sin revisión de Shopify — apropiado para instalar en tiendas de dropshippers de Vitalcom)
   > *Si en el futuro quieres publicar en Shopify App Store abierto, será `Public app` + review. Por ahora Custom es lo correcto.*
3. Nombre de la app: `Vitalcom Integration`
4. URL de la app: `https://vitalcom.vercel.app`
5. URLs permitidas de redirección (Allowed redirection URLs):
   ```
   https://vitalcom.vercel.app/api/shopify/callback
   ```
   > *Si usas dominio custom después, agregar también: `https://vitalcom.co/api/shopify/callback`*

**PASO 3 — Configurar scopes**

En `App setup` → `Access scopes`, marcar:
- `read_products` · `write_products`
- `read_orders` · `write_orders`
- `read_customers`
- `read_inventory` · `write_inventory`
- `read_fulfillments` · `write_fulfillments`

(Exactamente los mismos que ya están declarados en `src/lib/integrations/shopify/scopes.ts`.)

**PASO 4 — Obtener credenciales**

En `App setup` → `Client credentials`:
- Copia el `Client ID`
- Genera y copia el `Client secret`

**PASO 5 — Configurar en Vercel**

En el dashboard de Vercel → Project → Settings → Environment Variables → agregar:

```
SHOPIFY_CLIENT_ID=<el client id del paso 4>
SHOPIFY_CLIENT_SECRET=<el secret del paso 4>
SHOPIFY_API_VERSION=2025-01
```

Y también el key de cifrado para los tokens (OBLIGATORIO en producción):

```bash
# Generar con:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

```
VITALCOM_ENCRYPTION_KEY=<el resultado del comando>
```

Después de guardar → redeploy (Vercel → Deployments → ⋯ → Redeploy).

**PASO 6 — Verificar en ambiente de prueba**

1. Ir a https://vitalcom.vercel.app/mi-tienda
2. Como Vitalcommer logueado, clic en "Conectar tienda Shopify"
3. Debe redirigir a `{tienda}.myshopify.com/admin/oauth/authorize?...` — si aparece error `SHOPIFY_OAUTH_NOT_CONFIGURED` es que faltan las vars del paso 5.
4. Aceptar permisos en Shopify → volver a `/mi-tienda` → ver tienda conectada en la BD.

### 4.2 Protocolo para CREAR tienda interna Vitalcom CO

Esta tienda es para que tú mismo pruebes end-to-end el flujo Vitalcom → Shopify → Dropi → cliente final.

**PASO 1 — Crear tienda de desarrollo (gratis, ilimitada en tiempo)**

1. En Partners → `Stores` → `Add store` → `Development store`
2. Elegir tipo: `Create a store to test and build`
3. Nombre: `Vitalcom CO Interna`
4. Subdominio: `vitalcom-co-interna.myshopify.com` (o similar)
5. País: Colombia · moneda: COP
6. Propósito: `To test or build for a client`

> *Las dev stores no cobran pero tampoco pueden procesar pagos reales — perfectas para QA. Si en algún momento quieres activar pagos reales en esta tienda específica, hay que migrarla a plan Basic ($25 USD/mes).*

**PASO 2 — Conectar la tienda con tu Vitalcom app**

1. Desde Partners → tu app → `Test your app` → seleccionar `Vitalcom CO Interna`
2. Shopify redirige a `vitalcom.vercel.app/api/shopify/install?shop=vitalcom-co-interna.myshopify.com`
3. Aceptar permisos
4. Verificar que aparece en `/mi-tienda` y en `/admin/comunidad` (staff)

**PASO 3 — Configuración básica de la tienda Shopify**

Dentro de la tienda recién creada:
1. `Settings` → `General` → moneda COP · zona horaria Bogotá · email: `tienda@vitalcom.co`
2. `Settings` → `Shipping` → tarifa única `Envío nacional · $12.000 COP` (luego Vitalcom calcula real por país)
3. `Settings` → `Taxes and duties` → Colombia → IVA 19% incluido en precio
4. `Settings` → `Checkout` → desactivar "require customer to create account" (dropshipping → guest checkout)
5. `Settings` → `Locations` → agregar `Bodega Vitalcom Bogotá` (Vitalcom administra inventario desde Dropi, no desde Shopify)

**PASO 4 — Tema y branding**

1. `Online Store` → `Themes` → usar `Dawn` (gratis, rápido)
2. Customize → Logo: subir `public/assets/branding/logo.png` de Vitalcom
3. Colores: primario `#C6FF3C`, fondo `#0A0A0A`, texto `#F5F5F5`
4. Homepage: hero con tagline de Vitalcom + sección de bestsellers

**PASO 5 — Importar primeros 20 bestsellers**

Una vez Shopify OAuth activo, desde Vitalcom:
1. Login como CEO en `vitalcom.vercel.app`
2. Ir a `/admin/catalogo` → filtrar por `bestseller: true`
3. Bulk select → acción `Sincronizar a tienda Vitalcom CO Interna`
4. El endpoint `/api/shopify/sync-products` crea los productos en Shopify con imágenes + descripción + precio público COP
5. Verificar en `{tienda}.myshopify.com/admin/products` que los 20 aparecen con precio y stock

**PASO 6 — Probar pedido end-to-end**

1. Desde la tienda pública `{tienda}.myshopify.com` comprar 1 producto como cliente anónimo
2. Pago: usar "Bogus Gateway" (test mode) — Shopify lo permite en dev stores
3. Shopify dispara webhook `orders/create` → llega a `/api/shopify/webhooks` → crea `Order` en Vitalcom con `source: ZENDU` (o equivalente)
4. En `/admin/pedidos` ves el pedido nuevo → marcarlo `DISPATCHED` manualmente con tracking ficticio
5. Webhook `fulfillments/create` actualiza la orden en Shopify
6. Cliente final recibe email de Shopify con tracking

Si todos estos pasos funcionan → **la plataforma está técnicamente lista para producción real**.

### 4.3 Protocolo para que los VITALCOMMERS creen su tienda

Este es el flujo que reciben los ~800 dropshippers.

**Pre-requisito:** el VITALCOMMER ya debe tener una tienda Shopify propia (plan Basic $25 USD/mes es el mínimo para procesar pagos reales).

**Flujo 30 minutos — primer setup**

1. **Crear tienda** (si aún no tienen):
   - https://shopify.com/co/free-trial → 3 días gratis + 1 mes a $4/mes
   - Configurar país Colombia (o EC/GT/CL según corresponda)
   - Dominio: `{su-marca}.myshopify.com` (pueden agregar custom domain después)

2. **Configurar pasarela de pago local**:
   - Colombia: Wompi, PayU, MercadoPago, Nequi (vía Wompi), Bold
   - Ecuador: PayPal + tarjeta Stripe + transferencia
   - Guatemala: Recurrente, VisaNet
   - Chile: Flow, Transbank, Khipu
   - Activar "Cash on Delivery" para Colombia/Ecuador (crítico en LATAM)

3. **Conectar con Vitalcom**:
   - Login en `vitalcom.vercel.app`
   - Ir a `/mi-tienda` → botón "Conectar tienda Shopify"
   - Ingresar `{su-tienda}.myshopify.com`
   - Redirección a Shopify → aceptar permisos (9 scopes) → volver a Vitalcom
   - La tienda aparece conectada + badge "Activo"

4. **Importar primeros productos**:
   - Ir a `/producto/{id}` (o `/herramientas/catalogo`)
   - Por cada producto que quieran vender → botón "Importar a mi tienda"
   - El producto se crea en Shopify con imágenes + descripción + precio sugerido
   - El VITALCOMMER ajusta precio final en Shopify si quiere (recomendado: usar la calculadora Vitalcom primero)

5. **Ajuste de precios**:
   - Usar `/herramientas/calculadora`:
     - Producto: el que acaban de importar
     - País destino: CO/EC/GT/CL
     - Margen deseado: 30-50%
     - Método de pago preferido: Wompi/MercadoPago/Stripe
   - La calculadora devuelve precio final sugerido con IVA, envío y comisiones incluidas
   - Copiar ese precio al producto en Shopify

6. **Primera venta**:
   - Cliente final compra en `{su-tienda}.myshopify.com`
   - Webhook llega a Vitalcom → aparece en `/pedidos` del dropshipper
   - Dropshipper confirma → Vitalcom dispara Dropi (o manual)
   - Cliente recibe email con tracking

**Documentar esto como curso:** actualmente tenemos la infraestructura (`/cursos`) pero los contenidos son placeholder. **Recomendación:** grabar 1 video de 10 min con este flujo completo y subirlo como primer curso obligatorio para nuevos vitalcommers. Ese curso completa el step "Conecta tu tienda" del onboarding.

---

## 5. Variables de entorno — checklist completo

Lo que debe estar configurado en Vercel antes de go-live:

```bash
# ── Supabase (YA CONFIGURADO) ──
DATABASE_URL=...
DIRECT_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# ── Auth (YA CONFIGURADO) ──
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://vitalcom.vercel.app

# ── IA (OBLIGATORIO para modo real) ──
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini

# ── Anthropic (opcional) ──
# ANTHROPIC_API_KEY=sk-ant-...
# CLAUDE_MODEL=claude-haiku-4-5-20251001

# ── Shopify (OBLIGATORIO para tiendas reales) ──
SHOPIFY_CLIENT_ID=<del partner dashboard>
SHOPIFY_CLIENT_SECRET=<del partner dashboard>
SHOPIFY_API_VERSION=2025-01
VITALCOM_ENCRYPTION_KEY=<generado con crypto.randomBytes(32).toString('base64')>

# ── Dropi (cuando te den acceso) ──
# DROPI_API_KEY=...
# DROPI_API_URL=https://api.dropi.co
# DROPI_WEBHOOK_SECRET=<crypto.randomBytes(32).toString('hex')>

# ── Resend (para emails) ──
RESEND_API_KEY=re_...
EMAIL_FROM=Vitalcom <noreply@vitalcom.co>

# ── Cloudinary (si eliges opción A para imágenes) ──
# CLOUDINARY_CLOUD_NAME=...
# CLOUDINARY_API_KEY=...
# CLOUDINARY_API_SECRET=...

# ── App ──
NEXT_PUBLIC_APP_URL=https://vitalcom.vercel.app
NEXT_PUBLIC_APP_NAME=Vitalcom

# ── CRÍTICO ──
# En producción NO debe existir, o debe ser "false":
# VITALCOM_DEV_BYPASS=false
```

---

## 6. Checklist de go-live real

Antes de enviar el link a los 800 VITALCOMMERS, verificar en este orden:

### Semana -2 (preparación)
- [ ] Fotos reales de al menos los 50 productos más vendidos en Cloudinary/Supabase
- [ ] `CATALOG` actualizado con URLs reales
- [ ] Script de seed ejecutado en BD de producción
- [ ] Stock real por país cargado (mínimo 20 unidades por SKU)

### Semana -1 (integraciones)
- [ ] Shopify Partners app creada + credenciales en Vercel
- [ ] `VITALCOM_ENCRYPTION_KEY` generado y configurado
- [ ] Tienda interna `vitalcom-co-interna.myshopify.com` creada y conectada
- [ ] 20 bestsellers sincronizados a la tienda interna
- [ ] Pedido de prueba end-to-end exitoso (Bogus Gateway)
- [ ] Resend DNS validado (al menos SPF + DKIM del dominio `vitalcom.co`)
- [ ] OpenAI API key activa con límite de gasto configurado ($50/mes inicial)

### Día 0 (lanzamiento)
- [ ] `NEXT_PUBLIC_TESTING_MODE` eliminado o `false`
- [ ] `VITALCOM_DEV_BYPASS` eliminado
- [ ] Ejecutar `npx vitest run` — 614+ tests pasando
- [ ] Ejecutar `npx next build` — sin errores
- [ ] Exportar reporte de compliance desde `/admin/seguridad/compliance` → PDF archivo legal
- [ ] Crear primer backup manual de BD en Supabase
- [ ] Verificar `/api/status` retorna `ok: true` con todas las checks en verde
- [ ] Verificar `/api/version` retorna la versión esperada

### Día +1 a +7 (monitoreo activo)
- [ ] Revisar `/admin/seguridad` cada mañana — logins fallidos, críticos
- [ ] Revisar `/admin/comunidad/pulse` para salud de comunidad
- [ ] Revisar `/admin/ops` para métricas de sistema
- [ ] Primera reunión de retrospectiva con el equipo a los 7 días

---

## 7. Qué seguirá después (roadmap post-go-live)

- **v2.28.0** — Tienda interna CO completamente activa + primer pedido real (requiere pasos §4.2 completados)
- **v2.29.0** — Migración de imágenes a Cloudinary + transformaciones on-the-fly
- **v2.30.0** — WhatsApp Business activation + primer broadcast segmentado
- **v2.31.0** — Action Dispatcher en recomendaciones (botones ejecutables)
- **v2.32.0** — Pagos LATAM (Wompi + MercadoPago)
- **v3.0.0** — Apertura a los 800 VITALCOMMERS

---

*Documento mantenido por el equipo técnico. Actualizar con cada release mayor.*
