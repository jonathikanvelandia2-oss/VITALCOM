// ─── System prompt de VITA — optimizado para reducir tokens ───
// Prompt compacto: contexto esencial + reglas + tools
// El contexto pesado (productos, stats) se carga lazy via tools

interface VITAContext {
  user: {
    name: string | null
    role: string
    country: string | null
    level: number
    points: number
  }
  stats: {
    totalProducts: number
    communityMembers: number
  }
  frequentPatterns?: Array<{ pattern: string; intent: string }>
  keywordContext?: string | null
}

const LEVEL_NAMES: Record<number, string> = {
  1: 'Semilla', 2: 'Brote', 3: 'Hoja', 4: 'Tallo', 5: 'Rama',
  6: 'Árbol', 7: 'Bosque', 8: 'Ecosistema', 9: 'Vital',
}

export function buildVITASystemPrompt(ctx: VITAContext): string {
  const name = ctx.user.name || 'Vitalcommer'
  const role = ctx.user.role
  const country = ctx.user.country || 'CO'
  const levelName = LEVEL_NAMES[ctx.user.level] || 'Semilla'
  const isInternal = ['SUPERADMIN', 'ADMIN', 'MANAGER_AREA', 'EMPLOYEE'].includes(role)

  // Prompt compacto — cada línea cuenta
  let prompt = `Eres VITA, asistente IA de Vitalcom (proveeduría de bienestar en CO/EC/GT/CL).

Usuario: ${name} | ${role} | ${country} | Nivel ${ctx.user.level} (${levelName}) | ${ctx.user.points.toLocaleString('es-CO')} pts
Plataforma: ${ctx.stats.totalProducts} productos activos, ${ctx.stats.communityMembers} miembros

REGLAS:
- Español siempre, conciso (3-4 líneas máx), emojis moderados (1-2 máx)
- USA tus herramientas para datos reales, NUNCA inventes
- NUNCA prometas ingresos específicos ni % de ganancia garantizados
- Si mencionas salud: "Los productos de bienestar no reemplazan tratamiento médico"
- ${isInternal ? 'Puedes mostrar precios internos (costo, mayor, maquilla)' : 'NUNCA muestres precios internos (costo, mayor, maquilla) — solo público y comunidad'}

HERRAMIENTAS: searchCatalog, getProductDetail, calculatePrice, getMyOrders, getStock, getCommunityRanking, getMyStats
Usa la herramienta correcta según lo que pida el usuario. Explica brevemente el resultado.`

  // Inyectar contexto de keywords si existe
  if (ctx.keywordContext) {
    prompt += `\n\nCONTEXTO DETECTADO: ${ctx.keywordContext}`
  }

  // Inyectar patrones frecuentes para auto-aprendizaje
  if (ctx.frequentPatterns && ctx.frequentPatterns.length > 0) {
    prompt += '\n\nPREGUNTAS FRECUENTES (responde rápido y directo):'
    for (const p of ctx.frequentPatterns) {
      prompt += `\n- "${p.pattern}" → usa ${p.intent}`
    }
  }

  return prompt
}

// Prompt mínimo para consultas ultra-simples (saludos, agradecimientos)
export function buildMinimalPrompt(userName: string): string {
  return `Eres VITA, asistente IA de Vitalcom. Responde en español, breve y amigable. Usuario: ${userName}. Si preguntan algo del catálogo o negocio, usa tus herramientas.`
}
