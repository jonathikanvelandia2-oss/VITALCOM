// V33 — UGC Scriptwriter
// ═══════════════════════════════════════════════════════════
// Genera paquetes COMPLETOS para que un dropshipper grabe un reel
// sin tener que escribir nada: hooks + shot list + voiceover +
// b-roll + captions + hashtags + best post times.
//
// Reusa el llm-router existente (OpenAI + Claude opt-in) — sin
// dependencias nuevas. Valida JSON de respuesta con Zod.

import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { route } from '@/lib/ai/llm-router'
import { captureException } from '@/lib/observability'
import { SalesAngle } from '@prisma/client'

export interface UgcScriptParams {
  productId: string
  angle: SalesAngle
  persona: string
  platform: 'instagram_reel' | 'tiktok' | 'youtube_shorts'
  durationSec: 15 | 30 | 60
  country?: 'CO' | 'EC' | 'GT' | 'CL'
  dropshipperId?: string
}

// ─── Validación del output del LLM ──────────────────────
const HookSchema = z.object({
  text: z.string().min(1).max(160),
  seconds: z.number().int().min(1).max(5),
})

const ShotSchema = z.object({
  shotNum: z.number().int().min(1),
  type: z.string().min(1).max(60),
  description: z.string().min(1).max(400),
  durationSec: z.number().int().min(1).max(60),
  assetIdSuggested: z.string().nullable().optional(),
  setup: z.string().max(400).optional(),
})

const BRollSchema = z.object({
  assetId: z.string(),
  timestampSec: z.number().min(0),
  durationSec: z.number().min(0.5),
  reason: z.string().max(200).optional(),
})

const CaptionOverlaySchema = z.object({
  text: z.string().min(1).max(60),
  startSec: z.number().min(0),
  endSec: z.number().min(0),
  style: z.string().max(40).optional(),
})

const UgcPackageSchema = z.object({
  hookOptions: z.array(HookSchema).min(3).max(7),
  shotList: z.array(ShotSchema).min(2).max(20),
  voiceoverScript: z.string().min(20).max(4000),
  bRollSuggested: z.array(BRollSchema).max(20).default([]),
  captionOverlays: z.array(CaptionOverlaySchema).max(20).default([]),
  musicStyle: z.string().min(1).max(60),
  hashtags: z.array(z.string()).max(30).default([]),
  bestPostTimes: z.record(z.string()).default({}),
})

export type UgcPackageOutput = z.infer<typeof UgcPackageSchema>

// ─── Prompts ────────────────────────────────────────────
const SYSTEM_PROMPT = `Eres un director creativo especializado en UGC para dropshipping LATAM.
Generas paquetes COMPLETOS de contenido que un vendedor sin experiencia puede ejecutar con solo su celular.
OBJETIVO ÚNICO: conversión en la plataforma especificada — no likes ni engagement.

REGLAS:
- Hook rompe scroll en 3 segundos. Disparadores: problema visceral · transformación · pregunta directa · dato sorpresa · comparación radical.
- Cada toma del shot list es ejecutable con un celular en casa.
- Voiceover natural en español LATAM, no corporativo. Habla de tú.
- Captions con palabras clave (máx 5 palabras por overlay).
- Hashtags: mix relevante + alcance + nicho (nunca genéricos #fyp).
- CUMPLE leyes sanitarias: NO prometas curar · usa "ayuda a", "apoya", "complementa".
- Respuesta EN JSON estricto. Sin markdown. Sin explicaciones. Sin \`\`\`.`

function buildUserPrompt(
  params: UgcScriptParams,
  productName: string,
  productDescription: string | null,
  assetInventory: Array<{ id: string; type: string; title: string | null; duration: number | null }>,
): string {
  return `PRODUCTO: ${productName}
DESCRIPCIÓN: ${productDescription ?? 'N/A'}

ÁNGULO COMERCIAL: ${params.angle}
PERSONA OBJETIVO: ${params.persona}
PLATAFORMA: ${params.platform}
DURACIÓN TOTAL: ${params.durationSec} segundos
PAÍS: ${params.country ?? 'CO'}

ASSETS DISPONIBLES para b-roll (IDs referenciables):
${JSON.stringify(assetInventory.slice(0, 15), null, 2)}

Genera JSON estricto con este shape:
{
  "hookOptions": [{"text":"...","seconds":3}, ...]  // 5 variantes,
  "shotList": [{"shotNum":1,"type":"face_to_camera|product_close|hands_on_product|lifestyle|screen_recording|b_roll","description":"...","durationSec":3,"assetIdSuggested":null|"id","setup":"..."}],
  "voiceoverScript": "texto completo con [pausas] marcadas",
  "bRollSuggested": [{"assetId":"...","timestampSec":5,"durationSec":2,"reason":"..."}],
  "captionOverlays": [{"text":"MAX 5 PALABRAS","startSec":0,"endSec":3,"style":"bold_top|highlight|bottom_caption"}],
  "musicStyle": "upbeat|emotional|minimal|...",
  "hashtags": ["#...","#..."],  // 10 items
  "bestPostTimes": {"CO":"19:00","EC":"20:00","GT":"19:30","CL":"21:00"}
}`
}

// ─── Entry point ────────────────────────────────────────
export async function generateUgcPackage(params: UgcScriptParams): Promise<{
  packageId: string
  output: UgcPackageOutput
  costUsd: number
  llmModel: string
}> {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: params.productId },
    select: {
      id: true,
      name: true,
      description: true,
      productAssets: {
        where: { status: { in: ['APPROVED', 'FEATURED'] } },
        select: { id: true, type: true, title: true, durationSec: true },
        take: 20,
      },
    },
  })

  const assetInventory = product.productAssets.map(a => ({
    id: a.id,
    type: String(a.type),
    title: a.title,
    duration: a.durationSec,
  }))

  const userPrompt = buildUserPrompt(params, product.name, product.description ?? null, assetInventory)

  let parsed: UgcPackageOutput
  let llmModel: string
  let costUsd: number

  try {
    const res = await route({
      taskType: 'creative',
      systemPrompt: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
      jsonMode: true,
      maxTokens: 2500,
      temperature: 0.7,
      userId: params.dropshipperId,
    })

    llmModel = res.model
    costUsd = res.costUsd

    const raw = JSON.parse(res.content)
    parsed = UgcPackageSchema.parse(raw)
  } catch (err) {
    captureException(err, {
      route: 'lib/studio/ugc-scriptwriter',
      userId: params.dropshipperId,
      extra: { productId: params.productId, angle: params.angle },
    })
    throw new Error(`UGC_GEN_FAILED: ${err instanceof Error ? err.message : String(err)}`)
  }

  // Persistir paquete
  const pkg = await prisma.ugcPackage.create({
    data: {
      productId: params.productId,
      dropshipperId: params.dropshipperId ?? null,
      angle: params.angle,
      persona: params.persona,
      platform: params.platform,
      durationSec: params.durationSec,
      hookOptions: parsed.hookOptions as never,
      shotList: parsed.shotList as never,
      voiceoverScript: parsed.voiceoverScript,
      bRollSuggested: parsed.bRollSuggested as never,
      captionOverlays: parsed.captionOverlays as never,
      musicStyle: parsed.musicStyle,
      hashtags: parsed.hashtags,
      bestPostTimes: parsed.bestPostTimes as never,
      llmModel,
      costUsd,
    },
  })

  return { packageId: pkg.id, output: parsed, costUsd, llmModel }
}

// ─── Listado por producto ───────────────────────────────
export async function listUgcPackages(productId: string, limit = 20) {
  return prisma.ugcPackage.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      angle: true,
      persona: true,
      platform: true,
      durationSec: true,
      musicStyle: true,
      timesUsed: true,
      createdAt: true,
      dropshipperId: true,
    },
  })
}
