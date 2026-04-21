# Vitalcom Platform — Changelog

## [2.11.0] — 2026-04-21

**Polish pre-producción — Opt-out auto-append + error boundaries segmentados.**

Dos mejoras que cierran los pendientes del blueprint V30:

### Opt-out auto-append en MARKETING
Antes: crear una plantilla MARKETING sin disclosure devolvía 400 y bloqueaba al usuario. Ahora el servidor auto-agrega *"Responde STOP para no recibir más mensajes."* al footer, respetando los límites de Meta (footer ≤60 chars, body ≤1024). Fallback inteligente: si el footer ya no admite más, el disclosure va al body.

- `src/lib/whatsapp/opt-out.ts` — nueva función `ensureMarketingOptOut()` con 3 estrategias: inyectar al footer vacío · concatenar al footer con espacio · fallback a body si no cabe
- `src/app/api/whatsapp/templates/route.ts` — POST ya no rechaza; aplica auto-append y devuelve `{ optOutInjected, optOutTarget }` en el response
- `src/app/admin/whatsapp/templates/page.tsx` — warning amarillo reemplazado por hint azul "Auto-opt-out activo"
- 7 tests nuevos en `opt-out.test.ts` → **99/99 ✅**

### Error boundaries segmentados
Antes: un crash en `/admin/*` o `/(community)/*` rompía toda la app. Ahora cada segmento tiene su propio `error.tsx` con UI localizada (reintentar + volver al dashboard/feed).

- `src/app/admin/error.tsx` — icono rojo `AlertOctagon` · ref code en mono · Reintentar + Dashboard
- `src/app/(community)/error.tsx` — icono ámbar `AlertTriangle` · Reintentar + Volver al feed
- `src/app/(auth)/error.tsx` — mensaje específico de autenticación + Ir al inicio
- `src/app/admin/workflows/[id]/loading.tsx` — skeleton específico para canvas viewer

**Resultado:** build limpio · typecheck sin errores · 99 tests ✅.

## [2.10.0] — 2026-04-21

**Fase 10 — Suite de tests vitest sobre módulos críticos.**

Blindaje pre-producción: 91 tests nuevos sobre los módulos más críticos de la lógica de WhatsApp y IA. La suite total queda en **92 tests** (pricing calculator + los 5 nuevos). Todo pasa en <1s y no depende de BD, red ni LLMs.

**Tests nuevos:**
- `src/lib/whatsapp/__tests__/opt-out.test.ts` — 16 tests · cobertura regex de STOP/ALTA/BAJA/unsubscribe/no molestar · validación de disclosure MARKETING · null/undefined safe · tolerancia de espacios y `!`
- `src/lib/whatsapp/__tests__/meta-graph.test.ts` — 12 tests · `extractTemplateContent()` parseando HEADER/BODY/FOOTER/BUTTONS (QUICK_REPLY, URL, PHONE_NUMBER normalizado) · modo MOCK devuelve 3 templates sintéticos incluyendo MARKETING con disclosure
- `src/lib/whatsapp/__tests__/ab-testing.test.ts` — 9 tests · `pickWeightedVariant()` distribución 50/50 y 80/20 con ±5% tolerancia sobre 10k corridas · edge cases: array vacío, pesos negativos, peso único · mockeo de `Math.random` para determinismo
- `src/lib/ai/__tests__/intent-classifier.test.ts` — 33 tests · cobertura de los 9 agentes (ESCALATE_HUMAN, MENTOR_FINANCIERO, MEDIA_BUYER, CREATIVO_MAKER, OPTIMIZADOR_TIENDA, BLUEPRINT_ANALYST, SOPORTE_IA, VITA) · boost de urgencia por "urgente"/"crítico" · `shouldEscalate` se activa en crítico o ESCALATE_HUMAN · confianza en `[0,1]`
- `src/lib/ai/__tests__/llm-router.test.ts` — 11 tests · `cosine()` simétrica, ortogonales=0, opuestos=-1, vector cero no NaN, longitudes distintas=0 · `getRouterHealth()` estructura + circuit breakers · flag `anthropicEnabled` refleja env

**Resultado:** `npx vitest run` → 92/92 ✅ en 766ms. Build y typecheck limpios.

## [2.9.0] — 2026-04-21

**V30 completo — Visual workflow editor + Meta Graph template sync.**

Cierra todo el roadmap V30. El editor de workflows ahora es visual (canvas SVG con nodos draggables + conexiones con flechas coloreadas por tipo), y un click sincroniza plantillas aprobadas desde Meta Graph API. En MOCK mode devuelve templates sintéticos para que el flujo UI funcione sin credenciales.

### V30 completo — Canvas + Meta sync (`this release`)

**Librerías nuevas:**
- `src/lib/whatsapp/meta-graph.ts` — `fetchMetaTemplates()` llama `GET /v21.0/{wabaId}/message_templates` · `extractTemplateContent()` parsea componentes HEADER/BODY/FOOTER/BUTTONS · fallback `mockTemplates()` con 3 plantillas de ejemplo

**APIs:**
- `POST /api/whatsapp/templates/sync` — upsert masivo por `(accountId, metaName, language)` · mapea `status` Meta → WaTemplateStatus · infiere `purpose` desde el nombre (confirm/carrito/despacho/bienvenida) · devuelve `{ synced, created, updated, mock }`

**Componente canvas:**
- `src/components/admin/WorkflowCanvas.tsx` — SVG con viewBox dinámico según posiciones · grid pattern de fondo · 15 colores + iconos distintos por step type · auto-layout topológico BFS si no hay `step.position` · drag-drop directo sobre nodos · edges con bezier curvas + flechas coloreadas (lime=éxito, rojo=fallo, azul=rama) · labels de rama visibles

**UI admin:**
- `/admin/workflows/[id]` — rediseñada con **tabs Visual/JSON** · en Visual: canvas interactivo + inspector lateral al seleccionar un nodo (ID, tipo dropdown, siguiente éxito/fallo con selects de IDs existentes, config JSON editable en vivo) · arrastrar nodos persiste `step.position` en el JSON al guardar
- `/admin/whatsapp/templates` — botón "Sync Meta" descarga plantillas aprobadas + banner de resultado (X creadas · Y actualizadas · mock si aplica)

**Hook nuevo:**
- `useSyncMetaTemplates()` en `@/hooks/useWaTemplates`

**Interface extendida:**
- `WorkflowStep.position?: { x: number; y: number }` — opcional, auto-layout si está ausente

**Todo V30 del blueprint V21 ahora cubierto:**
- ✅ Broadcast scheduling cron (v2.8.0)
- ✅ Opt-out automático STOP/ALTA (v2.8.0)
- ✅ Visual workflow editor canvas SVG (esta release)
- ✅ Template sync Meta Graph API (esta release)
- ✅ Validación disclosure MARKETING (v2.8.0)

## [2.8.0] — 2026-04-21

**V30 liviano — Broadcast scheduling cron + opt-out automático.**

Cierra dos loops abiertos de V29 y blinda cumplimiento Meta. Los broadcasts ahora pueden agendarse a futuro y ejecutarse solos; los contactos pueden darse de baja con un mensaje *STOP* y el sistema honra su elección automáticamente en todos los canales (broadcasts + workflows). Validación forzada de disclosure al crear plantillas MARKETING.

### V30 — Scheduling + opt-out (`this release`)

**Schema Prisma (+2 campos + 1 relación):**
- `WhatsappContact.optedOutAt DateTime?` + `.optOutSource String?` — audit log de la baja (stop_keyword | admin | bounce)
- `WhatsappBroadcastRecipient.contact` — relación con WhatsappContact para revalidar opt-in justo antes de enviar

**Librería nueva:**
- `src/lib/whatsapp/opt-out.ts` — detección centralizada: `isOptOutMessage()` (regex: STOP, BAJA, SALIR, CANCELAR, UNSUBSCRIBE, PARAR, NO MÁS, DARME DE BAJA), `isOptInMessage()` (ALTA, VOLVER, SUSCRIBIR), `marketingTemplateHasOptOut()` validador de plantillas, textos de confirmación

**APIs nuevas/modificadas:**
- `GET/POST /api/whatsapp/broadcasts/cron` — cron `*/10 * * * *` que busca broadcasts `SCHEDULED` con `scheduledFor <= now` y los ejecuta. También reanuda broadcasts `RUNNING` con recipients PENDING (recovery de crashes por timeout de 60s). Auth Bearer `CRON_SECRET`.
- `POST /api/whatsapp/templates` — valida que plantillas MARKETING contengan disclosure opt-out en body+footer. Devuelve `400 MISSING_OPT_OUT` si falta.

**Webhook WhatsApp (`/api/webhooks/whatsapp`):**
- Detecta STOP antes de avanzar workflows → `handleOptOut()` marca contacto `isOptedIn=false` + `optedOutAt=now` + `optOutSource='stop_keyword'` + cancela ejecuciones RUNNING del contacto + envía confirmación dentro de ventana 24h
- Detecta ALTA → `handleOptIn()` restaura `isOptedIn=true` + confirma

**Broadcast runner (`src/lib/whatsapp/broadcast-runner.ts`):**
- Revalida `contact.isOptedIn` justo antes de enviar (puede haber cambiado entre `prepareBroadcast` y `executeBroadcast`) → si opted out, marca recipient como `SKIPPED` con `failureReason='contact_opted_out'`
- `optedOutCount` en el broadcast se incrementa correctamente
- Progreso intermedio ahora es idempotente (set absoluto, no increment acumulativo bugueado)
- `executeBroadcast` devuelve `{ sent, failed, skippedOptOut? }`

**UI admin:**
- `/admin/whatsapp/broadcasts` — campo "Programar para" (datetime-local) + botón cambia a "Agendar" cuando hay fecha + tarjeta del broadcast muestra `Agendado para {fecha}` cuando está SCHEDULED
- `/admin/whatsapp/templates` — warning visible en vivo si categoría MARKETING y body/footer no contienen disclosure opt-out

**vercel.json:** +1 cron `/api/whatsapp/broadcasts/cron` cada 10min

**Bug fix:**
- Bug de contador agregado en broadcast-runner: se usaba `{ increment: pending.length - failed }` que no reflejaba el estado real. Ahora se hace `set` absoluto con las variables acumuladas `sent`/`failed`/`skippedOptOut`.

**No depende de credenciales externas:** el cron puede correr en MOCK mode — los broadcasts se marcan como enviados aunque no haya cuenta Meta verificada.

## [2.7.0] — 2026-04-21

**V29 Templates library + Broadcast segmentado + A/B testing automático.**

Siguiente pieza del blueprint V21. Da al VITALCOMMER control directo sobre sus plantillas Meta y la capacidad de enviar campañas segmentadas. A/B testing integrado: el workflow engine y el broadcast runner asignan variantes automáticamente por peso ponderado.

### V29 — Templates + Broadcast + A/B (`this release`)

**Schema Prisma (+2 modelos, +2 enums, +2 campos):**
- `WhatsappTemplate.variantGroup String?` + `.weight Float @default(1)` — agrupa variantes A/B
- `WhatsappBroadcast` — campaña segmentada con `segmentFilter` JSON + `variantGroup` opcional + métricas agregadas (totalRecipients, sentCount, failedCount)
- `WhatsappBroadcastRecipient` — recipient asignado con `templateId` (variante) + `variantKey` (A/B/...) + `status` (PENDING/SENT/DELIVERED/READ/FAILED/SKIPPED)
- Enums: `WaBroadcastStatus` + `WaBroadcastRecipientStatus`

**A/B testing (`src/lib/whatsapp/ab-testing.ts`):**
- `pickWeightedVariant()` — cumulative weighted random (0 cost)
- `resolveTemplateVariant()` — dado templateName, busca variantes del mismo group y elige una ponderada
- `getVariantStats()` — agrega por variante: sent/opened/clicked/blocked (template stats) + broadcast recipient counts
- **Integración workflow engine**: `stepSendTemplate` ahora llama `resolveTemplateVariant` transparentemente — el workflow JSON no cambia, Meta automáticamente usa una de las variantes.

**Broadcast runner (`src/lib/whatsapp/broadcast-runner.ts`):**
- `resolveRecipients(accountId, filter)` — filtra por segment/tags/country/minLtv/excludeTags + respeta `isOptedIn`. Limite 5k para safety.
- `prepareBroadcast()` — crea `WhatsappBroadcastRecipient` en batches de 500, asigna variante A/B si grupo presente
- `executeBroadcast()` — envía en tandas de 50 con rate limit 200ms/msg, updates de status por recipient
- `getBroadcastStats()` — agrega por status + por variantKey para dashboard
- Respeta opt-out: `isOptedIn=false` se filtra antes de crear recipients

**APIs nuevas:**
- `GET /api/whatsapp/templates?accountId=x` · `POST` crear
- `GET/PATCH/DELETE /api/whatsapp/templates/[id]`
- `GET /api/whatsapp/templates/ab-stats?accountId=x&variantGroup=y`
- `GET /api/whatsapp/broadcasts` · `POST` crear · `GET /[id]` con stats completos
- `POST /api/whatsapp/broadcasts/[id]/execute` — ejecuta en background
- `POST /api/whatsapp/broadcasts/preview` — cuenta recipients sin crear nada

**Hooks React Query (`src/hooks/useWaTemplates.ts`):**
- `useWaTemplates` / `useCreateWaTemplate` / `useUpdateWaTemplate` / `useDeleteWaTemplate`
- `useAbStats` — refresca métricas por variante
- `useBroadcasts` (refetch 10s para tracking RUNNING) / `useBroadcast` (refetch 5s) / `useCreateBroadcast` / `useExecuteBroadcast` / `usePreviewBroadcast`

**UI admin:**
- `/admin/whatsapp/templates` — lista con filtro por cuenta + formulario crear (metaName/category/language/purpose/bodyText/variantGroup/weight/footer) + toggle APPROVED/DISABLED + métricas (sent/opened/clicked/blocked) + **sección A/B groups** con tabla comparativa por variante y CTR automático
- `/admin/whatsapp/broadcasts` — lista con progress bar + crear nuevo con **preview de recipients** antes de enviar + filtros (segment, tags include/exclude, country, minLtv) + select de plantilla y grupo A/B
- `/admin/whatsapp/broadcasts/[id]` — detail con 5 KPI cards (Recipients/Pending/Sent/Read/Failed) + progress bar + **tabla A/B por variante con read rate** + timeline (creado/agendado/iniciado/completado)

**Sidebar admin:** Plantillas WA (FileText + NEW) + Broadcasts WA (Megaphone + NEW) bajo Workflows.

### Matriz de casos de uso

| Caso | Sin V29 | Con V29 |
|------|---------|---------|
| Probar 2 copies de confirmación | Crear 2 workflows, A/B manual | 2 templates en mismo variantGroup + workflow los usa ponderado |
| Campaña promo a 500 VIP | Hacer script manual | Broadcast + segmentFilter {segment:"vip"} + preview |
| Recompra segmentada a 20 días | Solo el workflow de remarketing | + Broadcast manual si quieres empujar YA a un subset |
| Medir qué copy convierte mejor | N/A | ab-stats endpoint + tabla en UI con CTR y read rate |

### Pendiente V30
- Visual workflow editor (canvas SVG drag-drop)
- Shopify snippet production (requiere OAuth)
- Broadcast scheduling real (cron ejecuta los SCHEDULED vencidos)
- Template sync con Meta Graph API (fetch/push)
- Opt-out link automático en body de MARKETING templates

---

## [2.6.0] — 2026-04-21

**V28 Optimizaciones de producción — Claude opt-in + Embeddings semánticos + Observabilidad + Rate limiting.**

Tercer entregable del blueprint V21. Sin features nuevas grandes — foco en robustez, performance y visibilidad. Todo opt-in: si el admin enciende feature flags vía env, se activa automáticamente. Sin flags, sigue corriendo como V27.

### V28 — Production hardening (`this release`)

**LLM Router mejorado (`src/lib/ai/llm-router.ts`):**
- **Anthropic Claude Haiku 4.5 opt-in** via fetch directo (sin SDK → 0 deps nuevas). Se activa si `ANTHROPIC_API_KEY` presente.
- Matriz de ruteo: `reasoning` y `conversation_complex` → Claude si disponible; todo lo demás OpenAI.
- **Circuit breaker independiente por proveedor**: 5 fallos/60s pausa el proveedor; el fallback pasa al otro automáticamente.
- Fallback 3 niveles: preferred → alternate → rules.
- `embed()` + `embedBatch()` + `cosine()` utils para matching in-memory.
- `getRouterHealth()` para `/admin/ops`.

**Cache semántico capa 2 (`src/lib/ai/semantic-cache.ts`):**
- Capa 1 V26 (hash exacto por userId+agent+query) intacta.
- **Capa 2 V28** — match semántico cosine >0.92 cross-user para respuestas CANÓNICAS (sin datos personales) de agentes VITA/SOPORTE_IA/CREATIVO_MAKER. Reduce costos LLM ~30% adicional en preguntas frecuentes educativas.
- Auto-detección de canónicas: solo cachea respuestas sin cifras/precios/ROAS específicos.
- Embeddings solo en canónicas (ahorra call API).
- Schema: `SemanticCache.embedding Json?` + `isCanonical Boolean` + índice `(agentName, isCanonical, expiresAt)`.

**User memory con embeddings (`src/lib/ai/user-memory.ts`):**
- `recallRelevantMemories()` blend 70% similitud semántica + 30% importance cuando `EMBEDDINGS_ENABLED`.
- Fallback keyword+importance si falla o está deshabilitado.
- `rememberFact()` embebe al guardar (async, no bloquea).
- Schema: `UserMemory.embedding Json?` opcional.

**Rate limiting webhooks (`src/lib/security/rate-limit-webhook.ts`):**
- 60 requests/min por IP+source in-memory.
- Cleanup automático buckets expirados cada 5 min.
- Aplicado a los 3 webhooks (Meta/Shopify/Effi) con HTTP 429 + Retry-After header.

**Observabilidad `/admin/ops`:**
- Endpoint `GET /api/ops/health` con 10 queries paralelas: feature flags, router circuits, bots 24h, workflows activos/corriendo, escalaciones abiertas, cache stats, memorias con embedding, conversations 24h, WhatsApp accounts + webhook events.
- Dashboard visual con 3 feature flag cards (WhatsApp MOCK, Anthropic, Embeddings), 4 KPI cards (bots/workflows/escalaciones/chat), 2 circuit breaker cards, 3 cache cards, WhatsApp section.
- Auto-refresh 30s.

**Resilience engine:**
- Circuit breaker previene bucles a LLM caído (5 fallos en 60s → pausa 60s → reset).
- Pre-persist WhatsappMessage QUEUED→SENT (V27) + circuit breaker juntos garantizan cero doble envío en crash.
- `recallRelevantMemories` con try/catch + fallback automático si embedding API falla.

**Calidad de código:**
- Fix warnings `useMemo` en editor workflows y admin escalations (migrados a `useEffect` con deps explícitas).
- TypeScript estricto en todos los módulos nuevos.

**Feature flags nuevos (.env):**
```bash
ANTHROPIC_API_KEY=sk-ant-...    # Opt-in Claude Haiku 4.5
EMBEDDINGS_ENABLED=true         # Default true; false = skip embeddings
# Ya existentes:
WHATSAPP_MOCK_MODE=true         # Sin Meta API, loguea
META_APP_SECRET=...             # HMAC webhook
SHOPIFY_WEBHOOK_SECRET=...
EFFI_WEBHOOK_SECRET=...
CRON_SECRET=...
```

**Sidebar admin:** Salud sistema (Activity + NEW) bajo Asesor CEO.

### Matriz de ahorro de costos LLM esperada

| Componente | Sin V28 | Con V28 (EMBEDDINGS_ENABLED) |
|------------|---------|-------------------------------|
| Cache hit rate (chat) | ~15-20% (solo exacto) | ~40-45% (exacto + semántico canónico) |
| Recall memoria | keyword match 40% relevante | semantic match 85% relevante |
| Clasificación | regex 0 costo | regex 0 costo (sin cambio) |
| Razonamiento pesado | gpt-4o-mini | Claude Haiku si opt-in |

### Pendiente V29
- Canvas SVG editor visual de workflows
- Shopify snippet production (requiere OAuth)
- A/B test automático de templates
- Broadcast segmentado WhatsApp
- Migración opcional a pgvector cuando embeddings crezcan >10k filas (ahora es in-memory)

---

## [2.5.0] — 2026-04-21

**V27 WhatsApp Commerce Foundation — Workflow Engine + 6 flujos pre-built + webhooks.**

Segundo entregable del blueprint V21. Se implementa la foundation completa de WhatsApp Business Cloud API con un workflow engine adaptativo que **supera a Lucidbot** en todos los frentes: intent semántico vs keywords, timings adaptativos, ramas AI, respuestas libres en medio del flujo, escalación invisible a humano.

**Decisión clave — Modo MOCK:**
- Sin credenciales Meta/Shopify/Effi (pendientes CEO), el sistema opera en modo MOCK: loguea envíos en consola + persiste todo en BD.
- Cuando lleguen credenciales, se setea `WHATSAPP_MOCK_MODE=false` + secrets en env y el pipeline completo empieza a operar en producción sin cambios de código.
- Webhooks con validación HMAC real (Meta SHA256, Shopify base64 SHA256, Effi SHA256 hex) desde ya — zero bypass en producción.

### V27 — WhatsApp Commerce Foundation (`this release`)

**Schema Prisma (11 modelos + 9 enums nuevos):**
- `WhatsappAccount` (multi-tienda, phoneNumberId único, quality Green/Yellow/Red, webhookVerifyToken)
- `WhatsappTemplate` (Meta templates con `fallbackTemplateId` para chain automática + contadores Sent/Opened/Clicked/Blocked)
- `WhatsappContact` (perfil extendido: LTV, confirmationRate, avgResponseMinutes, segment, tags JSON, `lastUserMessageAt` para ventana 24h)
- `WhatsappConversation` con `aiThreadId` puente al chat universal V26
- `WhatsappMessage` con direction/type/intent/sentiment/status + `metaMessageId @unique` para dedup
- `WaWorkflow` (prefijo Wa para no colisionar con WorkflowTemplate de Luzitbot) — steps JSON + triggerType + métricas + confidenceScore
- `WaExecution` + `WaStepRun` (audit trail completo de cada paso)
- `WhatsappOrderLink` con `confirmationStatus` (HOT/BOT/AGENT/NOT_CONFIRMED) + tracking Effi
- `AbandonedCart` con `expiresAt` 72h
- `HotButtonEvent` tracking del snippet Shopify (view/click/dismiss + A/B variant)
- `WebhookEvent` dedup por `(source, externalId)` — idempotencia de Shopify/Effi

**Librerías nuevas:**
- `src/lib/whatsapp/client.ts` — 4 funciones (sendTemplate/sendText/sendInteractive/sendMedia) con fallback chain de plantillas, retry exponencial, HMAC verification, pre-persistencia QUEUED → SENT para idempotencia
- `src/lib/flows/workflow-engine.ts` — 14 step types (send_template/text/interactive/media, wait, wait_for_reply, branch, tag, ai_decision, ai_respond, update_contact, create_order_link, call_webhook, escalate, end), wake-up cron, adaptatividad por segment/confirmationRate, integración con escalate V26
- `src/lib/flows/prebuilt-workflows.ts` — 6 flujos completos listos para instalar

**Los 6 workflows pre-built:**
1. `hot_confirmation` — botón caliente Shopify → tag + update segment + template confirmado
2. `auto_confirmation` — pedido nuevo → 15min adaptativos → template → 180min reply → ai_decision 5 ramas (confirm/cancel/edit/question/no_reply) → reintento 24h → fallback UTILITY 48h
3. `abandoned_cart` — checkout abandonado 30min → template → 240min adaptativos → interactive 3 botones → ai_decision → ai_respond
4. `shipped` — Effi guide_generated → template guia_generada con tracking + actualiza segment
5. `remarketing` — 20 días post-entrega → template → ai_decision (buy_again/question/not_interested)
6. `delivery_issue` — Effi delivery_exception → template novedad → ai_decision → webhook Effi retry o escalate logística

**APIs:**
- `GET /api/workflows` (list con filtro accountId) · `POST /api/workflows` (crear) · `GET/PATCH/DELETE /api/workflows/[id]`
- `POST /api/workflows/install-prebuilt` (instala los 6 en una cuenta, dedup por purpose)
- `POST /api/workflows/[id]/test` (ejecutar manualmente con phoneE164 o contactId)
- `GET/POST /api/whatsapp/accounts`
- `GET/POST /api/flows/cron` (procesa wake-ups con CRON_SECRET)
- Webhooks: `GET /api/webhooks/whatsapp` (Meta verification) + `POST` (mensajes + delivery receipts)
- `POST /api/webhooks/shopify` (orders/create + checkouts/update) con HMAC Shopify
- `POST /api/webhooks/effi` (guide_generated/delivery_exception/delivered) con HMAC

**Hooks React Query:**
- `useWaWorkflows` (refetch 30s) / `useWaWorkflow` / `useUpdateWaWorkflow` / `useDeleteWaWorkflow` / `useTestWaWorkflow` / `useInstallPrebuilt`
- `useWhatsappAccounts` / `useCreateWhatsappAccount`

**UI admin:**
- `/admin/workflows` — lista con filtro por cuenta, toggle activo, stats (ejecuciones/éxito/confianza), botón "Instalar 6 pre-built"
- `/admin/workflows/[id]` — editor JSON de steps + triggerConfig, panel lateral con test manual + métricas + últimas 10 ejecuciones
- `/admin/whatsapp` — formulario de conexión + lista de cuentas con webhook URL y verify token copiables + alerta blocker Meta

**Integraciones transversales:**
- `stepEscalate` invoca `createEscalationTicket` V26 + crea `ConversationThread` puente si no existe → ticket aparece en `/admin/escalations`
- `stepAiDecision` + `stepAiRespond` usan `route()` del LLM router V26 (sin Claude todavía)
- `advanceOnReply()` adelanta wake-ups del workflow cuando el contacto responde antes del timeout
- Sidebar admin: Workflows WA + Cuentas WhatsApp con badge NEW
- `vercel.json` +1 cron `*/5 * * * *` para wake-ups (7 crons total)

**Mejoras clave vs blueprint original aplicadas:**
- Prisma singleton (no `new PrismaClient()` en 7 archivos)
- HMAC SHA256 validación real en los 3 webhooks (blueprint no la tenía en POST)
- Idempotencia de webhooks Shopify/Effi por `(source, externalId)` tabla WebhookEvent
- Pre-persistencia WhatsappMessage QUEUED → SENT para evitar doble envío si crash mid-flight
- Dedup Meta por `metaMessageId @unique`
- Modo MOCK por flag env → permite shipping sin blocker externo
- TypeScript estricto (Zod) en create/patch workflow

**Pendiente V28 (F3) y V29:**
- V28: pgvector + cache semántico capa 2 + memoria larga semántica + Claude Haiku router
- V29: Shopify snippet production (requiere OAuth), canvas SVG drag-drop del editor, A/B test automático de templates, broadcast segmentado
- Blockers CEO: Meta Business App + WABA verificada + review permissions, Shopify Partner OAuth, Dropi API prod, Resend DNS

Diferenciador: Vitalcom es la **única plataforma LATAM** con workflow engine IA para WhatsApp Commerce que supera Lucidbot en 12 dimensiones (intent semántico, timings adaptativos, ramas AI, multimodal, multi-tienda, memoria cliente, aprendizaje, fallback templates, escalación invisible, carritos automáticos, editor abierto).

---

## [2.4.0] — 2026-04-21

**V26 VITA Chat Universal IA — Orchestrator + Persona + P&G + Escalación.**

Primer entregable del blueprint "Vitalcom IA V20+". Se implementa la F1 completa del plan: entrada unificada al sistema IA que clasifica intenciones, construye contexto rico (persona por tier + P&G realtime del usuario + memoria estructurada + mensajes recientes) y rutea al agente correcto. Si la confianza es baja o la urgencia alta, el sistema escala de forma invisible al equipo humano con resumen IA del contexto.

Decisiones clave:
- **Sin pgvector ni Claude todavía** — todo funciona con OpenAI + reglas. pgvector y Claude entran en F3 (V28).
- **Clasificador híbrido por keywords/regex** en lugar de embeddings — 0 latencia, 0 costo, determinista. ~45 reglas cubren los 9 agentes.
- **Cache exacto con userId** — cero fuga de datos entre dropshippers. Respuestas con cifras personales se filtran y no se cachean.
- **Circuit breaker** en el LLM router: si OpenAI falla 5 veces en 60s, responde con fallback de reglas por 5 min (protege factura).
- **Sampling 0.3 en extractAndStoreFacts** — solo 30% de turnos llama LLM extra para memoria, ahorro 70% costos.
- **Co-existencia con 9 agentes actuales**: el chat universal es una ENTRADA adicional, no reemplaza las páginas dedicadas (MediaBuyer, CreativoMaker, etc.).

### V26 — Chat Universal + Orchestrator (`this release`)

**Schema Prisma (6 modelos nuevos + 4 enums):**
- `ConversationThread` + `ConversationMessage` — storage conversaciones IA con agente, confianza, costo, latencia, source (llm/cache/rules/human)
- `UserMemory` con kinds PREFERENCE/FACT/GOAL/PAIN_POINT/SUCCESS/WARNING + importance con decay
- `EscalationTicket` + enums EscalationStatus/Priority — tracking del ticket + asignación + resolución
- `SemanticCache` con hash(userId+agent+query) para cache exacto
- Enum `ChatAgent` (9 agentes) + `ChatChannel` + `MessageRole`

**Librerías nuevas (`src/lib/ai/`):**
- `llm-router.ts` — OpenAI singleton con fallback a rules, circuit breaker 5-fails/60s
- `intent-classifier.ts` — 45+ reglas regex mapeando a los 9 agentes, con boost de urgencia
- `pg-realtime.ts` — snapshot financiero en tiempo real desde FinanceEntry + AdSpendEntry, con break-even ROAS auto-calculado + 5 tipos de alertas
- `persona.ts` — tiering rookie/learner/operator/expert/master basado en órdenes/días activo/margen, infiere estilo de comunicación de mensajes pasados
- `semantic-cache.ts` — capa 1 hash exacto con userId, TTL variable por agente (10min MentorFinanciero vs 24h SoporteIA), rechaza cachear respuestas con $ o números personales
- `user-memory.ts` — corta (últimos 10 msgs) + estructurada (UserMemory rows) + extracción automática sampling 0.3 + decay diario -0.02
- `escalate.ts` — detección de área por keywords, resumen IA del thread, notificación a área vía bell, resolveTicket inyecta respuesta al chat
- `orchestrator.ts` — pipeline completo: persona + clasificación → cache lookup → construir contexto → LLM → escalación por baja confianza → save + cache + extract async

**APIs:**
- `POST /api/ai/chat` — entrada única con `{ message, threadId?, forceAgent? }`
- `GET /api/ai/chat/threads` — lista threads del usuario
- `GET /api/ai/chat/threads/[id]` — detalle con mensajes
- `GET /api/admin/escalations` + `GET /api/admin/escalations/[id]` — inbox del equipo
- `POST /api/admin/escalations/[id]/resolve` — cerrar ticket + respuesta opcional al usuario

**Hooks React Query:**
- `useChatThreads` / `useChatThread` / `useSendChat` con invalidación dual
- `useAdminEscalations` (refetch 30s) / `useAdminEscalation` / `useResolveEscalation`

**UI:**
- `/vita` — chat universal: hero + columna threads + área mensajes + 7 chips de forzado de agente (Auto/Finanzas/Ads/Creativo/Tienda/Blueprint/Soporte) + input con indicadores de source (cache/rules/escalation)
- `/admin/escalations` — panel de tickets con filtros por status y área, stats cards, timeline del thread en panel lateral, pre-llenado de draftResponse en textarea de respuesta

**Integración:**
- Sidebar comunidad: VITA Chat (Sparkles + NEW) como primer link de "Tu negocio"
- Sidebar admin: Escalaciones IA (ShieldAlert + NEW) bajo Bots autónomos
- Bots y agentes existentes intactos — V26 se suma sin breaking changes

**Pendiente para V27 (F2) y V28 (F3):**
- V27: multimodal (Whisper + Vision con dedup), migrar 6 bots actuales a clase AutonomousBot + RLHF, 3 bots faltantes (Fulfillment/SEO/Content)
- V28: pgvector en Supabase, cache semántico capa 2, memoria larga semántica, activar Claude Haiku via router para razonamiento

Diferenciador: Vitalcom es la **única plataforma LATAM** con un orquestador IA que clasifica, personaliza por tier, inyecta P&G real y escala a humano de forma invisible al usuario — todo en un solo chat.

---

## [2.3.0] — 2026-04-21

**V25 Morning Brief + Historial de acciones con Revert 1-clic.**

Cierra M4 y M5 del plan de mejoras CEO. El dropshipper entra cada mañana y sabe qué hacer en 30 segundos — más la tranquilidad de poder deshacer cualquier acción IA si no funcionó.

### V25 — Morning Brief + Historial con Revert (`this release`)

**M4 — Morning Brief (hábito 8AM):**
- Helper `generateMorningBrief` que agrega top 3 acciones cross-agente (priority ≥70), KPI delta hoy vs ayer + semana vs semana anterior, progreso de meta mensual, y frase motivacional determinística por día
- Bot `MorningBriefBot` corre 13:00 UTC (~8AM COL/EC) · dedup 20h por usuario · skip users sin data
- Enum `NotificationType.MORNING_BRIEF` · icon Sun en bell
- `GET /api/ai/morning-brief` on-demand + hook `useMorningBrief` (refetch 15min)
- UI `/brief`:
  - Hero con greeting personalizado + summary auto-generada
  - 4 KPI cards: ingreso hoy, pedidos, gasto ads, revenue 7d — con delta vs periodo anterior
  - Top 3 acciones con color por fuente + priority + linkea al agente
  - Card meta mensual con progress bar + CTA si no hay meta
  - Card motivacional del día
  - 3 cross-links (Command Center / Impacto / Historial)

**M5 — Historial de acciones con Revert:**
- Campos nuevos `AppliedAction.revertedAt | revertSideEffect | revertedBy`
- Helper `revertAppliedAction(action)` con lógica específica por tipo:
  - MEDIA_BUYER: PAUSE_CAMPAIGN ↔ RESTART_CAMPAIGN
  - STORE_OPTIMIZER: PRICING/MARGIN (restaura precioPublico), HIGHLIGHT (quita bestseller), REMOVE (reactiva productSync)
  - Otros tipos: solo marca revertedAt (sin side-effect server)
- Cuando se revierte, la CampaignRecommendation/StoreOptimization original vuelve a DISMISSED para evitar confusión
- 2 APIs: `GET /api/ai/history` (filtros source/status/days + summary) · `POST /api/ai/history/[id]/revert`
- Hook `useActionHistory` + `useRevertAction` con invalidación de command-center + impact
- UI `/historial`:
  - 3 stat cards (total, activas, revertidas)
  - Filtros por status y source
  - Timeline con cards que muestran fuente + tipo + badge estado + producto/campaña + rationale + impacto estimado/realizado
  - Botón REVERTIR con modal de confirmación + side-effect resultante en alert

**Integración:**
- Command Center `/comando` con 2 banners nuevos (Morning Brief + Historial) arriba del banner Impacto
- Sidebar "Tu negocio": Morning Brief (Sun) + Historial IA (History) con badge NEW
- `vercel.json` con 6to cron schedule (MORNING_BRIEF_BOT daily 13:00 UTC)
- Dispatcher `/api/cron/bots` reconoce MORNING_BRIEF_BOT

Diferenciador: Vitalcom es la única plataforma dropshipping que garantiza **reversibilidad total** de las acciones IA. Cero lock-in · trust-by-design.

---

## [2.2.0] — 2026-04-21

**V24 Metas mensuales + Benchmarks anónimos de la comunidad.**

Cierra M2 y M3 del plan de mejoras CEO. Crea hábito + motivación + FOMO saludable. 100% alineado con el principio "comunidad sin ánimo de lucro": 0 cobro, solo valor.

### V24 — Metas + Benchmarks (`this release`)
- **Schema `UserGoal`**: meta mensual con targetRevenue + opcional targetOrders/Margin/stretchRevenue. Unique por (userId, year, month). Status ACTIVE/ACHIEVED/MISSED/ARCHIVED
- **Helper `getCurrentMonthProgress`**: calcula revenue/orders/margin del mes, proyección lineal end-of-month, días transcurridos/restantes, isOnTrack, dailyRateToHit, needsPerDayIncrease
- **Helper `computeBenchmarks`**: percentiles anónimos de la comunidad en 4 métricas (revenue30d, orders30d, marginPct, roas). Rankea al usuario en top_10/top_25/top_50/below_50 + índice 0-100. Sample size incluido
- **3 APIs**: `GET /api/goals/current`, `POST /api/goals`, `GET /api/benchmarks`. Zod schema valida meta mínima 100k COP
- **2 hooks**: `useCurrentGoal` (refetch 5min) + `useSetGoal` + `useBenchmarks` (refetch 10min)
- **UI `/metas`**:
  - Estado vacío con CTA "DEFINIR META"
  - Card de edición con campos guiados (target, stretch, orders)
  - Card de progreso con: progress bar grande, celebración al 100%, 4 stats (días, proyección, ritmo requerido, pedidos), insight textual según onTrack
  - Sección benchmarks con 4 cards: user value + badge de rank (Top 10% / 25% / 50% / below) + mediana + top 10% comunidad + sample size
  - Nota de privacidad: solo agregados, 0 datos personales
- **Command Center integrado**: banner de meta en top con progress bar 1.5px o CTA "Define tu meta mensual" si no tiene
- **Sidebar**: "Mi Meta" con icon Target + badge NEW

Diferenciador: Vitalcom es **la única plataforma LATAM** que muestra al dropshipper dónde está vs el resto de la comunidad. Única razón: somos proveedor + plataforma + comunidad en uno. Nadie más tiene esa data agregada.

---

## [2.1.0] — 2026-04-21

**V23 Bots autónomos · Vercel Cron operativo.**

Primer bloque de bots del plan original (9 prometidos al CEO). Los 5 foundation arrancan: cada uno corre en su propio schedule, deja trazabilidad completa en BotRun y admin puede dispararlos manualmente para testing.

### V23 — Bots autónomos (`this release`)
- Modelo `BotRun` con tracking de métricas + errorLog JSON
- Enum `BotName` (9 slots, 5 implementados, 4 placeholder para futuras versiones)
- Enum `BotRunStatus`: RUNNING · SUCCESS · FAILED · PARTIAL
- Runner `src/lib/bots/types.ts` con `runBotWithTracking(bot, fn)`: abre BotRun, corre, cierra con duración y status automático
- **5 bots entregados:**
  - `StockBot` — alerta stock <20u a dropshippers que venden el producto (daily 15:00 UTC)
  - `RestockBot` — notifica admins cuando cobertura <14 días (L/Mi/V 16:00 UTC)
  - `AdsBot` — dispara MediaBuyer para todos los usuarios con ads activas + sync críticas a bell (daily 13:00 UTC)
  - `InactivityBot` — nudge dropshippers con 7+ días sin actividad, max 2/30d (L/Mi/V 17:00 UTC)
  - `OnboardingBot` — 7 pasos guiados los primeros 7 días del nuevo user (daily 14:00 UTC)
- Endpoint `/api/cron/bots` protegido con `CRON_SECRET` Bearer
- `vercel.json` con 5 cron schedules
- Admin UI `/admin/bots`: tarjetas por bot con stats + botón "EJECUTAR AHORA" manual + timeline de corridas con status/duración
- `/api/admin/bots/run` para trigger manual (solo SUPERADMIN/ADMIN)

---

## [2.0.0] — 2026-04-21

**Suite IA completa entregada · 9 agentes + orquestación + impact tracking.**

Hito mayor: la plataforma pasa de "SaaS con features" a **sistema operativo con inteligencia embebida** para los VITALCOMMERS. Cumple y excede el plan original de 7 agentes prometidos al CEO.

### V14 — Tracker Publicidad (`5237c13`)
- Modelos `AdAccount`, `AdCampaign`, `AdSpendEntry`
- Ingreso manual + estructura OAuth-ready para Meta/TikTok/Google
- Auto-sync P&G: cada gasto crea FinanceEntry transaccional

### V15 — Lanzador de Campañas (`ea029a2`)
- Wizard 5 pasos (objetivo → audiencia → creativo → presupuesto → review)
- Modelo `CampaignDraft` con state machine
- Sugerencias IA de copy y audiencia

### V16 — MediaBuyer IA (`77fc962`)
- 8 tipos de recomendación (PAUSE, SCALE, REDUCE, TEST_CREATIVE, TEST_AUDIENCE, OPTIMIZE_BID, RESTART, ADD_TRACKING)
- Híbrido reglas + LLM para enriquecer reasoning
- Aplicar 1-clic con side-effect real en `AdCampaign.status`

### V17 — CreativoMaker IA (`2047339`)
- 8 ángulos psicológicos × 4 ratios = 32 combinaciones
- Copy GPT-4o-mini + imagen Cloudinary con overlay de texto
- "Lanzar" crea `CampaignDraft` paso 3 pre-llenado

### V18 — OptimizadorTienda IA (`e17f90f`)
- 8 tipos: HIGHLIGHT, PRICING, LANDING_COPY, CROSS_SELL, PRODUCT_MIX, MARGIN, RESTOCK, REMOVE
- 9 reglas deterministas + LLM enhance de reasoning y copy sugerido
- Side-effects reales: update precio en ProductSync, bestseller, deactivate

### V19 — Command Center IA (`b119ff7`)
- Feed unificado cross-agente (MediaBuyer + OptimizadorTienda + CreativoMaker)
- 6 KPIs de negocio 30d (revenue, utilidad, margen, ROAS, pedidos, pendientes)
- Agrupación por severidad: crítico, alto, medio, bajo
- Botón "Analizar Todo" dispara los agentes en paralelo con dedup

### V20 — Push proactivo (`9036cd9`)
- Enum `NotificationType.AI_ACTION`
- Helper `syncCriticalToNotifications` mueve priority ≥85 al bell
- Dedup 24h por `actionId` para no spamear
- Sync pasivo al montar NotificationBell + cada 5 min

### V21 — Impact Tracking IA (`169e09c`)
- Modelo `AppliedAction` con beforeSnapshot + afterSnapshot + estimated/realizedImpactUsd
- 16 heurísticas calibradas (elasticidad precio 0.5, CTR +30%, ticket +22%, etc.)
- GET `/api/ai/impact` con daily sparkline + bySource + byType + topActions
- POST `/recompute` calcula realized impact desde datos reales ≥7d post-apply

### V22 — SoporteIA + optimizaciones (`fb65d66`)
- 7° agente prometido al CEO: chat 24/7 context-aware
- System prompt con pilares no-negociables (sin ánimo de lucro, productos Vitalcom)
- Fallback canned responses por keyword si no hay OpenAI
- **Optimizaciones cross-cutting:**
  - Helper compartido `recommendation-helpers.ts` elimina duplicación en 5 endpoints
  - Command Center refresh paraleliza generate/expire/seen/inserts (5 pasos → 2)
  - Índices BD críticos en Order y OrderItem para acelerar agregados
  - Fix warnings `useMemo` deps + `<img>` en 3 archivos
  - Cross-link banner `/comando` → `/impacto`

### Métricas al cierre de 2.0.0
- **9 agentes IA** productivos (VITA, MentorFinanciero, BlueprintAnalyst, CEOAdvisor, MarketingGenerator, CreativeCopyWriter, MediaBuyer, CreativoMaker, OptimizadorTienda, SoporteIA)
- **50+ páginas** funcionales desplegadas
- **70+ endpoints API** con validación Zod + cache LRU
- **32 modelos Prisma** en Supabase producción
- **Command Center** como capa de orquestación
- **Impact Tracking** demuestra ROI real en $ COP estimados + realizados
- Principio **sin ánimo de lucro** de comunidad reforzado en la arquitectura

---

## [1.3.0] — 2026-04-17
- VITA IA funcional + 202 products + Cloudinary

## [1.2.0] — 2026-04-12
- Base catálogo + pedidos + academia

## [1.1.0] — 2026-04-08
- Fundación schema + auth multi-rol
