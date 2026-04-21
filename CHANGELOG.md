# Vitalcom Platform — Changelog

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
