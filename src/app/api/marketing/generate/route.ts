import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { z } from 'zod'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

// ── POST /api/marketing/generate ─────────────────────────
// Genera contenido de marketing (post, story, tiktok, whatsapp)
// para productos de bienestar Vitalcom usando OpenAI.
// Si no hay OPENAI_API_KEY configurada, devuelve plantilla estática.

const schema = z.object({
  type: z.enum(['posts', 'stories', 'tiktok', 'whatsapp']),
  topic: z.string().min(1).max(200),
})

const SYSTEM_PROMPT = `Eres experto en copywriting de bienestar para dropshippers Vitalcom (Colombia, Ecuador, Guatemala, Chile).

Tu trabajo: generar contenido de marketing orgánico para productos naturales de bienestar (colágeno, proteína vegana, detox, vitaminas, belleza, etc.).

REGLAS:
- Español neutro LATAM, tono cercano y auténtico
- NUNCA prometer curas milagrosas ni resultados garantizados
- NUNCA dar consejos médicos — usar lenguaje como "puede ayudar", "apoya", "complementa"
- Enfoque en beneficios concretos + prueba social + CTA claro
- Para productos, asumir que el vendedor es parte de la comunidad Vitalcom`

const TYPE_INSTRUCTIONS: Record<string, string> = {
  posts: `Genera un POST de Instagram (2-4 párrafos):
- Primer párrafo: hook con pregunta o dato impactante
- Segundo párrafo: beneficios concretos (3-4 bullets con emoji ✅)
- CTA: invitación a comentar o escribir al DM
- 4-6 hashtags al final relacionados (bienestar, salud, Vitalcom, país)`,

  stories: `Genera una SECUENCIA DE 5 STORIES de Instagram:
Para cada story numerada (1-5) especifica:
- HOOK / PROBLEMA / SOLUCIÓN / PRUEBA SOCIAL / CTA
- Incluir la indicación entre [corchetes] sobre qué mostrar visualmente
- Copy corto pensado para consumo rápido`,

  tiktok: `Genera un SCRIPT DE TIKTOK (30-45 segundos):
Estructura con timestamps:
- 00:00-00:03 [HOOK]: agarre en los primeros 3 segundos
- 00:03-00:10 [CONTEXTO]: problema que resuelve
- 00:10-00:25 [DESARROLLO]: beneficios + transformación
- 00:25-00:35 [PRUEBA]: resultado o cifra
- 00:35-00:45 [CTA]: link en bio
Incluir indicaciones entre paréntesis sobre qué mostrar visualmente.
Terminar con 3 hashtags + sugerencia de audio trending.`,

  whatsapp: `Genera una PLANTILLA DE WHATSAPP para vender por mensaje directo:
- Saludo personalizado con {nombre}
- Presentación breve (1 línea)
- Producto con 3-4 beneficios rápidos en bullets
- Precio con ancla (antes $X, ahora $Y)
- Envío/logística
- CTA claro para obtener el link de pago
- Usar *asteriscos* para negrita y emojis adecuados para WhatsApp`,
}

export const POST = withErrorHandler(async (req: Request) => {
  await requireSession()
  const body = await req.json()
  const { type, topic } = schema.parse(body)

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    // Fallback de respeto sin IA
    return apiSuccess({
      content: buildFallback(type, topic),
      source: 'fallback',
    })
  }

  try {
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.8,
      max_tokens: 800,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Tema/producto: ${topic}\n\n${TYPE_INSTRUCTIONS[type]}`,
        },
      ],
    })

    const content = completion.choices[0]?.message?.content?.trim()
    if (!content) throw new Error('Respuesta vacía')

    return apiSuccess({ content, source: 'openai' })
  } catch (err: any) {
    console.error('[marketing/generate] OpenAI error:', err?.message)
    return apiSuccess({
      content: buildFallback(type, topic),
      source: 'fallback',
      warning: 'IA no disponible — usando plantilla base',
    })
  }
})

function buildFallback(type: string, topic: string): string {
  const t = topic.trim()
  switch (type) {
    case 'posts':
      return `🌿 ¿Sabías que ${t} puede marcar la diferencia en tu bienestar?

Cada vez más personas están descubriendo los beneficios de ${t}:
✅ Apoya tu energía diaria
✅ Complementa una rutina saludable
✅ Aporte natural, sin químicos agresivos
✅ Respaldado por la comunidad Vitalcom

💚 Escríbeme al DM y te cuento cómo agregarlo a tu rutina sin complicaciones.

#BienestarNatural #Vitalcom #VidaSaludable #RutinaSaludable #DropshippingLATAM`

    case 'stories':
      return `📱 SECUENCIA DE 5 STORIES — ${t}

STORY 1 — HOOK
"¿Llevas tiempo escuchando de ${t} pero no sabes por dónde empezar?"
[Foto del producto con emoji 👀]

STORY 2 — PROBLEMA
"El 70% abandona sus metas de salud en el primer mes"
[Dato con tipografía grande]

STORY 3 — SOLUCIÓN
"${t} en presentación premium, fácil de tomar, 100% respaldado"
[Foto del producto con precio]

STORY 4 — PRUEBA
"Así le fue a Laura después de 30 días →"
[Screenshot real de testimonio]

STORY 5 — CTA
"Escríbeme 'QUIERO' y te paso el link 📩"
[Sticker de respuesta directa]`

    case 'tiktok':
      return `🎬 SCRIPT TIKTOK (40 segundos) — ${t}

00:00-00:03 [HOOK]
"Probé ${t} durante 30 días y esto fue lo que pasó..."
(Cara seria, caminando hacia cámara)

00:03-00:10 [CONTEXTO]
"Siempre buscaba algo natural que me ayudara sin efectos raros"
(Mostrando el producto en mano)

00:10-00:25 [DESARROLLO]
"Primera semana: energía estable. Segunda: mejor descanso. Tercera: notas la diferencia al verte al espejo"
(Transiciones rápidas entre momentos del día)

00:25-00:35 [RESULTADO]
"Sin dietas milagro, sin promesas vacías"
(Plano en espejo con sonrisa)

00:35-00:40 [CTA]
"Link en mi bio si quieres probarlo"
(Señalando hacia arriba)

🎵 Audio sugerido: trending motivacional
#${t.replace(/\s+/g, '')} #Bienestar #Vitalcom`

    case 'whatsapp':
    default:
      return `💬 PLANTILLA WHATSAPP — ${t}

Hola {nombre} 👋

Soy [tu nombre] de la comunidad Vitalcom 🌿

Vi que te interesó ${t} y quería contarte una promo que tenemos esta semana:

✨ *${t} — Presentación premium*
• Fórmula natural, sin químicos
• Fácil de incorporar a tu rutina
• Envío en 2-3 días hábiles
• Precio especial (antes $X, ahora $Y)

📦 Enviamos con Servientrega a todo el país.

¿Quieres que te reserve uno? Respóndeme "SÍ" y te paso el link de pago seguro 🔒

Si tienes dudas, aquí estoy para ayudarte 💚`
  }
}
