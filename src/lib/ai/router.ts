// ─── Router inteligente de modelos para VITA ───
// Clasifica consultas y asigna GPT-4o-mini (barato) o GPT-4o (premium)
// Regla: si la respuesta puede resolverse con datos directos → mini
//        si requiere análisis, estrategia o creatividad → full

type QueryClassification = {
  model: 'gpt-4o-mini' | 'gpt-4o'
  reason: string
  detectedIntent: string
  keywords: string[]
  confidence: number
}

const PREMIUM_PATTERNS = [
  { pattern: /estrategia|plan de (negocio|ventas|marketing)/i, intent: 'strategy' },
  { pattern: /analiz[aá]|compar[aá]|recomiend[aá]|sug[ié]r[eé]/i, intent: 'analysis' },
  { pattern: /por ?qu[eé]|c[oó]mo (puedo|debo|mejor)/i, intent: 'advice' },
  { pattern: /idea|consejo|tip|ense[ñn]/i, intent: 'coaching' },
  { pattern: /tendencia|mercado|competencia/i, intent: 'market_analysis' },
  { pattern: /escribe|redacta|genera.*texto|copy|descripci[oó]n/i, intent: 'content_generation' },
  { pattern: /ayud[aá]me a (entender|decidir|elegir|planear)/i, intent: 'decision_support' },
  { pattern: /qu[eé] (opinas|piensas|har[ií]as)/i, intent: 'opinion' },
  { pattern: /mejor (forma|manera|opci[oó]n)/i, intent: 'optimization' },
  { pattern: /problema|error|no funciona|no puedo/i, intent: 'troubleshooting' },
]

const MINI_PATTERNS = [
  { pattern: /mu[eé]strame|ver|lista|busca|encuentra/i, intent: 'search' },
  { pattern: /precio|cu[aá]nto (cuesta|vale)/i, intent: 'pricing' },
  { pattern: /stock|disponib|inventario|hay/i, intent: 'stock_check' },
  { pattern: /pedido|orden|estado|tracking/i, intent: 'order_status' },
  { pattern: /ranking|puesto|nivel|puntos/i, intent: 'ranking' },
  { pattern: /estad[ií]stica|resumen|m[eé]trica/i, intent: 'stats' },
  { pattern: /catálogo|producto|categor[ií]a/i, intent: 'catalog' },
  { pattern: /calcula|margen|ganancia/i, intent: 'calculate' },
  { pattern: /hola|buenos|buenas|hey/i, intent: 'greeting' },
  { pattern: /gracias|ok|listo|entendido/i, intent: 'acknowledgement' },
]

export function classifyQuery(message: string): QueryClassification {
  const keywords: string[] = []
  let premiumScore = 0
  let miniScore = 0
  let detectedIntent = 'general'

  for (const { pattern, intent } of PREMIUM_PATTERNS) {
    if (pattern.test(message)) {
      premiumScore += 2
      keywords.push(intent)
      detectedIntent = intent
    }
  }

  for (const { pattern, intent } of MINI_PATTERNS) {
    if (pattern.test(message)) {
      miniScore += 2
      keywords.push(intent)
      if (detectedIntent === 'general') detectedIntent = intent
    }
  }

  // Mensajes cortos (<20 chars) casi siempre son simples
  if (message.length < 20) miniScore += 3

  // Mensajes largos (>100 chars) tienden a ser más complejos
  if (message.length > 100) premiumScore += 1

  // Signos de pregunta múltiples sugieren consulta compleja
  if ((message.match(/\?/g) || []).length > 1) premiumScore += 1

  const usePremium = premiumScore > miniScore
  const totalScore = premiumScore + miniScore
  const confidence = totalScore > 0
    ? Math.min(Math.abs(premiumScore - miniScore) / totalScore, 1)
    : 0.5

  return {
    model: usePremium ? 'gpt-4o' : 'gpt-4o-mini',
    reason: usePremium
      ? `Consulta compleja (${detectedIntent})`
      : `Consulta directa (${detectedIntent})`,
    detectedIntent,
    keywords,
    confidence,
  }
}

export function getModelId(overrideModel?: string): string {
  return overrideModel || 'gpt-4o-mini'
}
