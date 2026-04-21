// V26 — Intent Classifier híbrido (keyword + regex)
// ═══════════════════════════════════════════════════════════
// Clasifica el mensaje del usuario en uno de los 9 agentes de
// Vitalcom. Sin embeddings — pure regex/keywords. 0 latencia,
// 0 costo, determinista. En V28 se podrá agregar embeddings
// como tiebreaker si la confianza keyword es baja.
//
// Salida incluye urgencia (low/medium/high/critical) y flag
// `shouldEscalate` para derivar a humano.

export type AgentKey =
  | 'VITA'
  | 'MENTOR_FINANCIERO'
  | 'BLUEPRINT_ANALYST'
  | 'CEO_ADVISOR'
  | 'MEDIA_BUYER'
  | 'CREATIVO_MAKER'
  | 'OPTIMIZADOR_TIENDA'
  | 'SOPORTE_IA'
  | 'ESCALATE_HUMAN'

export type Urgency = 'low' | 'medium' | 'high' | 'critical'

export interface ClassificationResult {
  agent: AgentKey
  urgency: Urgency
  confidence: number                          // 0..1
  matchedRule?: string
  shouldEscalate: boolean
}

// ─── Reglas por agente ──────────────────────────────────────
// Cada regla: { agent, urgency, pattern, score }
// score = puntos que aporta si matchea. Se suman todos los
// matches y el agente con mayor puntaje gana.

interface Rule {
  agent: AgentKey
  urgency: Urgency
  pattern: RegExp
  score: number
  description: string
}

const RULES: Rule[] = [
  // ─── ESCALATE_HUMAN — reclamos graves, legal, cobros ─────
  { agent: 'ESCALATE_HUMAN', urgency: 'critical', score: 10, pattern: /(demand|legal|abogado|prensa|denunci|fiscali)/i, description: 'legal' },
  { agent: 'ESCALATE_HUMAN', urgency: 'critical', score: 10, pattern: /(me cobra(ron|n) (dos|\d|m[aá]s)|cobro duplicad|doble cobro)/i, description: 'doble-cobro' },
  { agent: 'ESCALATE_HUMAN', urgency: 'high',     score: 8,  pattern: /(cancelar (mi )?cuenta|eliminar mi cuenta|cerrar mi cuenta)/i, description: 'cancelar-cuenta' },
  { agent: 'ESCALATE_HUMAN', urgency: 'high',     score: 7,  pattern: /(reembols|devolver.*dinero|devuel(va|vame))/i, description: 'reembolso' },
  { agent: 'ESCALATE_HUMAN', urgency: 'high',     score: 6,  pattern: /(no me (lleg[oó]|llega).*(pedido|producto|paquete).*(semana|mes|d[ií]as))/i, description: 'pedido-perdido' },
  { agent: 'ESCALATE_HUMAN', urgency: 'critical', score: 9,  pattern: /(estafa|fraude|enga[ñn]aron|timar|robaron)/i, description: 'fraude' },
  { agent: 'ESCALATE_HUMAN', urgency: 'high',     score: 6,  pattern: /(hablar con (una|un) (persona|humano|agente|alguien))/i, description: 'pide-humano' },

  // ─── MENTOR_FINANCIERO — dinero, P&G, costos, ROAS ───────
  { agent: 'MENTOR_FINANCIERO', urgency: 'medium', score: 5, pattern: /(p.?g|p.?l|utilidad|margen|ganancia|rentabil)/i, description: 'pg-margen' },
  { agent: 'MENTOR_FINANCIERO', urgency: 'high',   score: 6, pattern: /(estoy perdiendo|p[eé]rdida|en rojo|negativ.*utilidad)/i, description: 'en-perdida' },
  { agent: 'MENTOR_FINANCIERO', urgency: 'medium', score: 4, pattern: /(cu[aá]nto (gan[eé]|gastar|gast[eé])|cu[aá]nto facturamos|facturaci[oó]n)/i, description: 'facturacion' },
  { agent: 'MENTOR_FINANCIERO', urgency: 'low',    score: 3, pattern: /(qu[eé] es (el )?roas|qu[eé] es (el )?cac|explica(me)? (roas|cac|margen))/i, description: 'educativo-finanzas' },
  { agent: 'MENTOR_FINANCIERO', urgency: 'medium', score: 4, pattern: /(costo.*producto|cogs|proveedor|costo unitario)/i, description: 'costos' },
  { agent: 'MENTOR_FINANCIERO', urgency: 'medium', score: 3, pattern: /(gastos?|gast[eé]).*(mes|semana|d[ií]a)/i, description: 'gastos' },
  { agent: 'MENTOR_FINANCIERO', urgency: 'medium', score: 3, pattern: /(break.?even|punto de equilibrio)/i, description: 'breakeven' },

  // ─── BLUEPRINT_ANALYST — diagnóstico holístico ───────────
  { agent: 'BLUEPRINT_ANALYST', urgency: 'medium', score: 5, pattern: /(blueprint|diagn[oó]stic|audit[ao]ra?)/i, description: 'blueprint' },
  { agent: 'BLUEPRINT_ANALYST', urgency: 'medium', score: 4, pattern: /(c[oó]mo (est[aá]|va) mi (tienda|negocio|cuenta)|qu[eé] (tal|pasa) con mi)/i, description: 'como-va-mi' },
  { agent: 'BLUEPRINT_ANALYST', urgency: 'low',    score: 3, pattern: /(qu[eé] me falta|qu[eé] debo mejorar|en qu[eé] fallo)/i, description: 'que-falta' },
  { agent: 'BLUEPRINT_ANALYST', urgency: 'low',    score: 3, pattern: /(scorecard|score de mi|puntaje (de )?mi)/i, description: 'scorecard' },

  // ─── MEDIA_BUYER — campañas, ROAS por campaña, pausar ────
  { agent: 'MEDIA_BUYER', urgency: 'high',   score: 6, pattern: /(campa[ñn]a.*(no (est[aá]|van)|mal|flop|roto))/i, description: 'campana-mala' },
  { agent: 'MEDIA_BUYER', urgency: 'medium', score: 5, pattern: /(pausar?|escal(ar|emos)|cortar|matar).*(campa[ñn]a|ad)/i, description: 'pausar-escalar' },
  { agent: 'MEDIA_BUYER', urgency: 'medium', score: 4, pattern: /(cpa|cpm|cpc|ctr|thumb.stop|frecuencia)/i, description: 'metricas-ads' },
  { agent: 'MEDIA_BUYER', urgency: 'medium', score: 4, pattern: /(roas (cay[oó]|baj[oó]|malo|bajo)|mi roas es)/i, description: 'roas-bajo' },
  { agent: 'MEDIA_BUYER', urgency: 'medium', score: 5, pattern: /(meta ads|facebook ads|tiktok ads|google ads|publicidad pagada|lanzar (un )?anuncio)/i, description: 'ads-platforms' },
  { agent: 'MEDIA_BUYER', urgency: 'medium', score: 3, pattern: /(audiencia|lookalike|retargeting|p[uú]blico objetivo)/i, description: 'audiencias' },
  { agent: 'MEDIA_BUYER', urgency: 'medium', score: 4, pattern: /(cu[aá]nto (debo|deber[ií]a) (gastar|invertir) en (ads|meta|tiktok|google))/i, description: 'presupuesto-ads' },

  // ─── CREATIVO_MAKER — copy, creativos, ángulos ──────────
  { agent: 'CREATIVO_MAKER', urgency: 'low', score: 5, pattern: /(copy|copywriting|redacta|escribe un (anuncio|ad|reel|texto|post))/i, description: 'copy' },
  { agent: 'CREATIVO_MAKER', urgency: 'low', score: 5, pattern: /(creativo|creatividad|[aá]ngulo|hook|gancho)/i, description: 'creativo' },
  { agent: 'CREATIVO_MAKER', urgency: 'low', score: 4, pattern: /(idea.*(anunci|ad|reel|video|contenido)|ideas de (anunci|ads|reels|videos))/i, description: 'ideas' },
  { agent: 'CREATIVO_MAKER', urgency: 'low', score: 4, pattern: /(t[ií]tulo|headline|primary text|descripci[oó]n del (ad|anuncio))/i, description: 'headline' },
  { agent: 'CREATIVO_MAKER', urgency: 'low', score: 3, pattern: /(testimonio|prueba social|social proof|urgencia)/i, description: 'angulos' },

  // ─── OPTIMIZADOR_TIENDA — conversión, pricing, catálogo ─
  { agent: 'OPTIMIZADOR_TIENDA', urgency: 'medium', score: 5, pattern: /(convers[ií]on|mi landing no convierte|tasa de conversi[oó]n)/i, description: 'conversion' },
  { agent: 'OPTIMIZADOR_TIENDA', urgency: 'medium', score: 4, pattern: /(cross.?sell|upsell|bundle|combo|venta cruzada)/i, description: 'cross-sell' },
  { agent: 'OPTIMIZADOR_TIENDA', urgency: 'medium', score: 4, pattern: /(mejor precio|subir precio|bajar precio|precio (ideal|sugerido|de venta))/i, description: 'pricing' },
  { agent: 'OPTIMIZADOR_TIENDA', urgency: 'medium', score: 4, pattern: /(destacar|bestseller|producto (ganador|estrella)|qu[eé] producto vend)/i, description: 'producto-ganador' },
  { agent: 'OPTIMIZADOR_TIENDA', urgency: 'medium', score: 4, pattern: /(restock|reposici[oó]n|stock (bajo|agotando)|se (me )?acab[oó])/i, description: 'restock' },
  { agent: 'OPTIMIZADOR_TIENDA', urgency: 'low',    score: 3, pattern: /(c[oó]mo (aumento|subo) (mis )?ventas|aumentar ventas)/i, description: 'aumentar-ventas' },

  // ─── CEO_ADVISOR — solo para admin/dirección (se filtra en orchestrator) ─
  { agent: 'CEO_ADVISOR', urgency: 'low', score: 5, pattern: /(estrategia (de|del) (negocio|empresa|marca)|direcci[oó]n estrat[eé]gica)/i, description: 'estrategia' },
  { agent: 'CEO_ADVISOR', urgency: 'low', score: 4, pattern: /(tendencia.*(comunidad|mercado|sector))/i, description: 'tendencias' },
  { agent: 'CEO_ADVISOR', urgency: 'low', score: 4, pattern: /(oportunidad.*(producto|mercado|categor[ií]a))/i, description: 'oportunidad' },

  // ─── SOPORTE_IA — uso de plataforma, errores técnicos ───
  { agent: 'SOPORTE_IA', urgency: 'low',    score: 4, pattern: /(c[oó]mo (uso|funciona|entro a|accedo)|no s[eé] c[oó]mo)/i, description: 'como-usar' },
  { agent: 'SOPORTE_IA', urgency: 'low',    score: 4, pattern: /(d[oó]nde (est[aá]|veo|encuentro)|no encuentro)/i, description: 'donde-esta' },
  { agent: 'SOPORTE_IA', urgency: 'medium', score: 5, pattern: /(no puedo (entrar|acceder|loguear|iniciar sesi[oó]n))/i, description: 'no-puede-entrar' },
  { agent: 'SOPORTE_IA', urgency: 'low',    score: 3, pattern: /(error|fall[oó]|no carga|se trab[oó]|no funciona.*(boton|bot[oó]n))/i, description: 'error-tecnico' },
  { agent: 'SOPORTE_IA', urgency: 'low',    score: 3, pattern: /(reset.*(password|contrase[ñn]a)|olvid[eé].*(clave|contrase[ñn]a))/i, description: 'reset-password' },

  // ─── VITA — catch-all / saludos / navegación general ────
  { agent: 'VITA', urgency: 'low', score: 3, pattern: /^(hola|buenas|buen d[ií]a|qu[eé] tal|saludos)/i, description: 'saludo' },
  { agent: 'VITA', urgency: 'low', score: 3, pattern: /(qu[eé] (productos|catalog)|mostrame el catalogo|ver catalogo)/i, description: 'catalogo' },
  { agent: 'VITA', urgency: 'low', score: 2, pattern: /(producto m[aá]s vendido|qu[eé] vende m[aá]s)/i, description: 'mas-vendido' },
]

// Indicadores de urgencia adicionales (multiplican la urgencia base)
const URGENCY_BOOST: Array<{ pattern: RegExp; boost: number }> = [
  { pattern: /(urgente|ya|ahora|inmediato|ahorita|ahora mismo)/i, boost: 1 },
  { pattern: /(cr[ií]tico|grave|crisis|emergencia)/i, boost: 2 },
]

const URGENCY_ORDER: Urgency[] = ['low', 'medium', 'high', 'critical']

function boostUrgency(base: Urgency, text: string): Urgency {
  let idx = URGENCY_ORDER.indexOf(base)
  for (const { pattern, boost } of URGENCY_BOOST) {
    if (pattern.test(text)) idx = Math.min(URGENCY_ORDER.length - 1, idx + boost)
  }
  return URGENCY_ORDER[idx]
}

// ─── Clasificador principal ─────────────────────────────────
export function classify(userMessage: string): ClassificationResult {
  const text = userMessage.trim()

  // Acumular puntaje por agente
  const scores = new Map<AgentKey, { total: number; maxUrgency: Urgency; rules: string[] }>()

  for (const rule of RULES) {
    if (rule.pattern.test(text)) {
      const existing = scores.get(rule.agent) ?? { total: 0, maxUrgency: 'low' as Urgency, rules: [] }
      existing.total += rule.score
      if (URGENCY_ORDER.indexOf(rule.urgency) > URGENCY_ORDER.indexOf(existing.maxUrgency)) {
        existing.maxUrgency = rule.urgency
      }
      existing.rules.push(rule.description)
      scores.set(rule.agent, existing)
    }
  }

  // Sin ningún match → VITA default con confianza baja
  if (scores.size === 0) {
    return {
      agent: 'VITA',
      urgency: boostUrgency('low', text),
      confidence: 0.35,
      shouldEscalate: false,
    }
  }

  // Ganador = mayor score
  const sorted = [...scores.entries()].sort((a, b) => b[1].total - a[1].total)
  const [agent, stats] = sorted[0]

  // Confianza: normalizada por score acumulado (10 puntos = 1.0)
  const confidence = Math.min(1, stats.total / 10)
  const urgency = boostUrgency(stats.maxUrgency, text)

  // Escalar si: agent es ESCALATE_HUMAN, urgencia critical, o confianza muy baja en tema grave
  const shouldEscalate =
    agent === 'ESCALATE_HUMAN' ||
    urgency === 'critical'

  return {
    agent,
    urgency,
    confidence,
    matchedRule: stats.rules.join(','),
    shouldEscalate,
  }
}
