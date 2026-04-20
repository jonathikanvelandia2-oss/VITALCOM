'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Rocket, AlertCircle,
  Package, Users, Image as ImageIcon, DollarSign, Eye, CheckCircle2,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { useProducts } from '@/hooks/useProducts'
import {
  useCampaignDraft,
  useUpdateCampaignDraft,
  useLaunchCampaignDraft,
  useSuggestCreative,
  type CampaignDraftPatch,
  type CampaignObjective,
  type AdPlatform,
} from '@/hooks/useCampaignDrafts'

// ── Wizard de 5 pasos ────────────────────────────────────
// 1. Producto  2. Audiencia  3. Creativo  4. Presupuesto  5. Review+Lanzar

const STEPS = [
  { n: 1, title: 'Producto',    icon: Package },
  { n: 2, title: 'Audiencia',   icon: Users },
  { n: 3, title: 'Creativo',    icon: ImageIcon },
  { n: 4, title: 'Presupuesto', icon: DollarSign },
  { n: 5, title: 'Revisar',     icon: Eye },
] as const

const OBJECTIVES: { value: CampaignObjective; label: string; desc: string }[] = [
  { value: 'CONVERSIONS', label: 'Conversiones', desc: 'Ventas directas del producto' },
  { value: 'TRAFFIC',     label: 'Tráfico',      desc: 'Visitas a tu tienda o landing' },
  { value: 'LEADS',       label: 'Leads',        desc: 'Capturar WhatsApp / email' },
  { value: 'MESSAGES',    label: 'Mensajes',     desc: 'Conversaciones por DM' },
  { value: 'ENGAGEMENT',  label: 'Interacción',  desc: 'Likes, comentarios, shares' },
  { value: 'REACH',       label: 'Alcance',      desc: 'Visibilidad masiva' },
]

const COUNTRIES = [
  { code: 'CO', name: 'Colombia',  flag: '🇨🇴' },
  { code: 'EC', name: 'Ecuador',   flag: '🇪🇨' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'CL', name: 'Chile',     flag: '🇨🇱' },
] as const

const PLACEMENTS_BY_PLATFORM: Record<AdPlatform, { value: string; label: string }[]> = {
  META: [
    { value: 'FEED',    label: 'Feed' },
    { value: 'STORIES', label: 'Stories' },
    { value: 'REELS',   label: 'Reels' },
    { value: 'EXPLORE', label: 'Explora' },
  ],
  TIKTOK: [
    { value: 'FEED',      label: 'For You Feed' },
    { value: 'TOPVIEW',   label: 'TopView' },
    { value: 'SPARK_ADS', label: 'Spark Ads' },
  ],
  GOOGLE: [
    { value: 'SEARCH',   label: 'Búsqueda' },
    { value: 'DISPLAY',  label: 'Display' },
    { value: 'YOUTUBE',  label: 'YouTube' },
    { value: 'DISCOVER', label: 'Discover' },
  ],
  OTHER: [{ value: 'OTHER', label: 'Otro' }],
}

const CTA_OPTIONS = [
  { value: 'BUY_NOW',     label: 'Comprar ahora' },
  { value: 'SHOP_NOW',    label: 'Compra aquí' },
  { value: 'LEARN_MORE',  label: 'Más información' },
  { value: 'SIGN_UP',     label: 'Registrarme' },
  { value: 'CONTACT_US',  label: 'Contactar' },
  { value: 'MESSAGE',     label: 'Enviar mensaje' },
]

function formatMoney(n: number) {
  return `$${n.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
}

export default function WizardPage() {
  const params = useParams<{ id: string }>()
  const id = params.id as string
  const router = useRouter()

  const draftQ = useCampaignDraft(id)
  const updateMut = useUpdateCampaignDraft()
  const launchMut = useLaunchCampaignDraft()

  const draft = draftQ.data

  if (draftQ.isLoading || !draft) {
    return (
      <>
        <CommunityTopbar title="Lanzador" subtitle="Cargando borrador..." />
        <div className="flex flex-1 items-center justify-center p-10">
          <Loader2 className="animate-spin" size={24} color="var(--vc-lime-main)" />
        </div>
      </>
    )
  }

  const step = draft.step

  async function save(patch: CampaignDraftPatch, nextStep?: number) {
    await updateMut.mutateAsync({ id, data: { ...patch, ...(nextStep ? { step: nextStep } : {}) } })
  }

  async function goBack() {
    if (step > 1) await save({}, step - 1)
  }

  return (
    <>
      <CommunityTopbar title={draft.name} subtitle={`Wizard · Paso ${step} de 5`} />
      <div className="flex-1 space-y-5 p-4 md:p-6">
        <Link
          href="/lanzador"
          className="inline-flex items-center gap-2 text-xs"
          style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-heading)' }}
        >
          <ArrowLeft size={12} /> Volver a campañas
        </Link>

        {/* Stepper */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)' }}
        >
          <div className="flex items-center justify-between">
            {STEPS.map((s, idx) => {
              const Icon = s.icon
              const active = step === s.n
              const done = step > s.n
              return (
                <div key={s.n} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
                      style={{
                        background: done ? 'var(--vc-lime-main)' : active ? 'rgba(198,255,60,0.15)' : 'var(--vc-black-soft)',
                        color: done ? 'var(--vc-black)' : active ? 'var(--vc-lime-main)' : 'var(--vc-gray-mid)',
                        border: active ? '1px solid var(--vc-lime-main)' : '1px solid var(--vc-gray-dark)',
                      }}
                    >
                      {done ? <Check size={14} /> : <Icon size={14} />}
                    </div>
                    <p
                      className="mt-1.5 hidden text-[10px] md:block"
                      style={{
                        color: active ? 'var(--vc-lime-main)' : 'var(--vc-gray-mid)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {s.title}
                    </p>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className="mx-1 h-0.5 flex-1 md:mx-2"
                      style={{ background: done ? 'var(--vc-lime-main)' : 'var(--vc-gray-dark)' }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Contenido del paso */}
        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)' }}
        >
          {step === 1 && <Step1Product draft={draft} onNext={(patch) => save(patch, 2)} />}
          {step === 2 && <Step2Audience draft={draft} onNext={(patch) => save(patch, 3)} />}
          {step === 3 && <Step3Creative draft={draft} draftId={id} onNext={(patch) => save(patch, 4)} />}
          {step === 4 && <Step4Budget draft={draft} onNext={(patch) => save(patch, 5)} />}
          {step === 5 && (
            <Step5Review
              draft={draft}
              onLaunch={async () => {
                const r = await launchMut.mutateAsync(id)
                alert(
                  r.oauthConnected
                    ? '✅ Campaña lista y espejo creado en /publicidad'
                    : '✅ Campaña guardada como READY. Conecta tu cuenta ' + draft.platform + ' (OAuth) para publicar en la plataforma.',
                )
                router.push('/lanzador')
              }}
              launching={launchMut.isPending}
            />
          )}
        </div>

        {/* Navegación */}
        {step > 1 && step < 5 && (
          <div className="flex justify-between">
            <button
              onClick={goBack}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase"
              style={{
                background: 'var(--vc-black-soft)',
                border: '1px solid var(--vc-gray-dark)',
                color: 'var(--vc-white-dim)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              <ArrowLeft size={12} /> Atrás
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ─────── PASO 1: PRODUCTO ───────
function Step1Product({ draft, onNext }: { draft: any; onNext: (p: CampaignDraftPatch) => void }) {
  const [productId, setProductId] = useState<string | null>(draft.productId)
  const [objective, setObjective] = useState<CampaignObjective>(draft.objective)

  const productsQ = useProducts({ limit: 100 } as any)
  const products = productsQ.data?.products ?? []

  const selected = products.find((p: any) => p.id === productId)

  const canContinue = !!productId

  return (
    <div className="space-y-5">
      <div>
        <h2 className="mb-1 text-lg font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
          Producto y objetivo
        </h2>
        <p className="text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
          Elige qué producto Vitalcom vas a promocionar y el objetivo de la campaña.
        </p>
      </div>

      <Field label="Producto">
        {productsQ.isLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {products.slice(0, 12).map((p: any) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProductId(p.id)}
                className="flex items-center gap-3 rounded-lg p-3 text-left"
                style={{
                  background: productId === p.id ? 'rgba(198,255,60,0.1)' : 'var(--vc-black-soft)',
                  border: productId === p.id
                    ? '1px solid var(--vc-lime-main)'
                    : '1px solid var(--vc-gray-dark)',
                }}
              >
                <div
                  className="h-10 w-10 shrink-0 overflow-hidden rounded"
                  style={{ background: 'var(--vc-gray-dark)' }}
                >
                  {p.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-xs font-bold"
                    style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
                  >
                    {p.name}
                  </p>
                  <p className="truncate text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>
                    {formatMoney(p.precioComunidad)} · {p.sku}
                  </p>
                </div>
                {productId === p.id && <CheckCircle2 size={16} color="var(--vc-lime-main)" />}
              </button>
            ))}
          </div>
        )}
      </Field>

      <Field label="Objetivo de la campaña">
        <div className="grid gap-2 md:grid-cols-2">
          {OBJECTIVES.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setObjective(o.value)}
              className="rounded-lg p-3 text-left"
              style={{
                background: objective === o.value ? 'rgba(198,255,60,0.1)' : 'var(--vc-black-soft)',
                border: objective === o.value
                  ? '1px solid var(--vc-lime-main)'
                  : '1px solid var(--vc-gray-dark)',
              }}
            >
              <p className="text-xs font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                {o.label}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--vc-gray-mid)' }}>{o.desc}</p>
            </button>
          ))}
        </div>
      </Field>

      <div className="flex justify-end">
        <button
          disabled={!canContinue}
          onClick={() => onNext({ productId, objective })}
          className="flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-bold uppercase disabled:opacity-50"
          style={{
            background: 'var(--vc-lime-main)',
            color: 'var(--vc-black)',
            fontFamily: 'var(--font-heading)',
            boxShadow: canContinue ? '0 0 16px var(--vc-glow-lime)' : 'none',
          }}
        >
          Continuar <ArrowRight size={12} />
        </button>
      </div>
    </div>
  )
}

// ─────── PASO 2: AUDIENCIA ───────
function Step2Audience({ draft, onNext }: { draft: any; onNext: (p: CampaignDraftPatch) => void }) {
  const [country, setCountry] = useState<any>(draft.targetCountry ?? 'CO')
  const [ageMin, setAgeMin] = useState(draft.ageMin ?? 18)
  const [ageMax, setAgeMax] = useState(draft.ageMax ?? 55)
  const [gender, setGender] = useState<'ALL' | 'MALE' | 'FEMALE'>((draft.gender as any) ?? 'ALL')
  const [interests, setInterests] = useState<string[]>(draft.interests ?? [])
  const [placements, setPlacements] = useState<string[]>(draft.placements ?? [])
  const [interestInput, setInterestInput] = useState('')

  const availablePlacements = PLACEMENTS_BY_PLATFORM[draft.platform as AdPlatform] ?? []

  function toggle(arr: string[], v: string) {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]
  }

  function addInterest() {
    const v = interestInput.trim()
    if (v && !interests.includes(v)) setInterests([...interests, v])
    setInterestInput('')
  }

  const canContinue = !!country && ageMin < ageMax && placements.length > 0

  return (
    <div className="space-y-5">
      <div>
        <h2 className="mb-1 text-lg font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
          Audiencia objetivo
        </h2>
        <p className="text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
          A quién le mostramos la campaña. Mientras más específico, mejor ROAS.
        </p>
      </div>

      <Field label="País">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setCountry(c.code)}
              className="flex items-center gap-2 rounded-lg p-3"
              style={{
                background: country === c.code ? 'rgba(198,255,60,0.1)' : 'var(--vc-black-soft)',
                border: country === c.code ? '1px solid var(--vc-lime-main)' : '1px solid var(--vc-gray-dark)',
              }}
            >
              <span className="text-lg">{c.flag}</span>
              <span className="text-xs font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                {c.name}
              </span>
            </button>
          ))}
        </div>
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label={`Edad: ${ageMin} - ${ageMax}`}>
          <div className="flex gap-2">
            <input
              type="number"
              min={13}
              max={65}
              value={ageMin}
              onChange={(e) => setAgeMin(parseInt(e.target.value) || 13)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
            />
            <input
              type="number"
              min={13}
              max={65}
              value={ageMax}
              onChange={(e) => setAgeMax(parseInt(e.target.value) || 65)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
            />
          </div>
        </Field>

        <Field label="Género">
          <div className="grid grid-cols-3 gap-2">
            {(['ALL', 'FEMALE', 'MALE'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className="rounded-lg px-3 py-2 text-xs font-bold uppercase"
                style={{
                  background: gender === g ? 'rgba(198,255,60,0.1)' : 'var(--vc-black-soft)',
                  color: gender === g ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)',
                  border: gender === g ? '1px solid var(--vc-lime-main)' : '1px solid var(--vc-gray-dark)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {g === 'ALL' ? 'Todos' : g === 'FEMALE' ? 'Mujeres' : 'Hombres'}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <Field label="Intereses (enter para agregar)">
        <div className="mb-2 flex flex-wrap gap-2">
          {interests.map((i) => (
            <span
              key={i}
              className="rounded px-2 py-1 text-[11px]"
              style={{ background: 'rgba(198,255,60,0.1)', color: 'var(--vc-lime-main)', border: '1px solid rgba(198,255,60,0.3)' }}
            >
              {i}{' '}
              <button onClick={() => setInterests(interests.filter((x) => x !== i))} style={{ color: 'var(--vc-lime-main)' }}>
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          value={interestInput}
          onChange={(e) => setInterestInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addInterest()
            }
          }}
          placeholder="bienestar, fitness, belleza natural..."
          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
        />
      </Field>

      <Field label={`Ubicaciones de ${draft.platform}`}>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {availablePlacements.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPlacements(toggle(placements, p.value))}
              className="rounded-lg px-3 py-2 text-xs font-bold uppercase"
              style={{
                background: placements.includes(p.value) ? 'rgba(198,255,60,0.1)' : 'var(--vc-black-soft)',
                color: placements.includes(p.value) ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)',
                border: placements.includes(p.value) ? '1px solid var(--vc-lime-main)' : '1px solid var(--vc-gray-dark)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Field>

      <div className="flex justify-end">
        <button
          disabled={!canContinue}
          onClick={() =>
            onNext({
              targetCountry: country,
              ageMin,
              ageMax,
              gender,
              interests,
              placements,
            })
          }
          className="flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-bold uppercase disabled:opacity-50"
          style={{
            background: 'var(--vc-lime-main)',
            color: 'var(--vc-black)',
            fontFamily: 'var(--font-heading)',
            boxShadow: canContinue ? '0 0 16px var(--vc-glow-lime)' : 'none',
          }}
        >
          Continuar <ArrowRight size={12} />
        </button>
      </div>
    </div>
  )
}

// ─────── PASO 3: CREATIVO ───────
function Step3Creative({
  draft, draftId, onNext,
}: { draft: any; draftId: string; onNext: (p: CampaignDraftPatch) => void }) {
  const [headline, setHeadline] = useState(draft.headline ?? '')
  const [primaryText, setPrimaryText] = useState(draft.primaryText ?? '')
  const [description, setDescription] = useState(draft.description ?? '')
  const [cta, setCta] = useState(draft.cta ?? 'BUY_NOW')
  const [imageUrl, setImageUrl] = useState(
    draft.imageUrl ?? draft.product?.images?.[0] ?? '',
  )
  const [landingUrl, setLandingUrl] = useState(draft.landingUrl ?? '')

  const suggestMut = useSuggestCreative()

  async function autoFill() {
    const r = await suggestMut.mutateAsync(draftId)
    setHeadline(r.suggestion.headline)
    setPrimaryText(r.suggestion.primaryText)
    setDescription(r.suggestion.description)
  }

  const canContinue = !!headline && !!primaryText && !!imageUrl

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="mb-1 text-lg font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
            Copy y creativo
          </h2>
          <p className="text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
            El texto que ve tu audiencia y la imagen principal.
          </p>
        </div>
        <button
          onClick={autoFill}
          disabled={suggestMut.isPending}
          className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold uppercase disabled:opacity-50"
          style={{
            background: 'rgba(198,255,60,0.1)',
            border: '1px solid rgba(198,255,60,0.4)',
            color: 'var(--vc-lime-main)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          {suggestMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          Sugerir con IA
        </button>
      </div>

      <Field label="Titular (hook)">
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          maxLength={120}
          placeholder="El secreto natural para recuperar tu energía"
          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
        />
        <p className="mt-1 text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>
          {headline.length}/120
        </p>
      </Field>

      <Field label="Texto principal">
        <textarea
          value={primaryText}
          onChange={(e) => setPrimaryText(e.target.value)}
          maxLength={2000}
          rows={6}
          placeholder="Beneficios concretos, prueba social, CTA..."
          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
        />
        <p className="mt-1 text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>
          {primaryText.length}/2000
        </p>
      </Field>

      <Field label="Descripción corta (opcional)">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          placeholder="Envío gratis · Pago contra entrega"
          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="CTA (botón)">
          <select
            value={cta}
            onChange={(e) => setCta(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
          >
            {CTA_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </Field>

        <Field label="URL del landing (opcional)">
          <input
            value={landingUrl}
            onChange={(e) => setLandingUrl(e.target.value)}
            placeholder="https://mitienda.com/producto"
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
          />
        </Field>
      </div>

      <Field label="Imagen principal (URL)">
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
        />
        {imageUrl && (
          <div className="mt-2 overflow-hidden rounded-lg" style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Preview" className="h-40 w-full object-contain" />
          </div>
        )}
        {draft.product?.images?.length > 0 && (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {draft.product.images.map((img: string, i: number) => (
              <button
                key={i}
                onClick={() => setImageUrl(img)}
                className="h-16 w-16 shrink-0 overflow-hidden rounded"
                style={{ border: imageUrl === img ? '2px solid var(--vc-lime-main)' : '1px solid var(--vc-gray-dark)' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={`opt-${i}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </Field>

      <div className="flex justify-end">
        <button
          disabled={!canContinue}
          onClick={() => onNext({ headline, primaryText, description, cta, imageUrl, landingUrl: landingUrl || null })}
          className="flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-bold uppercase disabled:opacity-50"
          style={{
            background: 'var(--vc-lime-main)',
            color: 'var(--vc-black)',
            fontFamily: 'var(--font-heading)',
            boxShadow: canContinue ? '0 0 16px var(--vc-glow-lime)' : 'none',
          }}
        >
          Continuar <ArrowRight size={12} />
        </button>
      </div>
    </div>
  )
}

// ─────── PASO 4: PRESUPUESTO ───────
function Step4Budget({ draft, onNext }: { draft: any; onNext: (p: CampaignDraftPatch) => void }) {
  const [dailyBudget, setDailyBudget] = useState<number>(draft.dailyBudget ?? 20000)
  const [durationDays, setDurationDays] = useState<number>(draft.durationDays ?? 7)
  const [startDate, setStartDate] = useState<string>(
    draft.startDate ? new Date(draft.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  )

  const total = dailyBudget * durationDays

  const canContinue = dailyBudget > 0 && durationDays > 0

  return (
    <div className="space-y-5">
      <div>
        <h2 className="mb-1 text-lg font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
          Presupuesto y duración
        </h2>
        <p className="text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
          Cuánto invertir por día y por cuánto tiempo.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Presupuesto diario (COP)">
          <input
            type="number"
            min={5000}
            step={1000}
            value={dailyBudget}
            onChange={(e) => setDailyBudget(parseInt(e.target.value) || 0)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
          />
          <p className="mt-1 text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>
            Recomendado mínimo: $15.000 COP
          </p>
        </Field>

        <Field label="Duración (días)">
          <input
            type="number"
            min={1}
            max={90}
            value={durationDays}
            onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
          />
        </Field>
      </div>

      <Field label="Fecha de inicio">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
        />
      </Field>

      <div
        className="rounded-lg p-4"
        style={{ background: 'rgba(198,255,60,0.05)', border: '1px solid rgba(198,255,60,0.25)' }}
      >
        <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
          Inversión total estimada
        </p>
        <p className="text-3xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
          {formatMoney(total)}
        </p>
        <p className="mt-1 text-[11px]" style={{ color: 'var(--vc-gray-mid)' }}>
          {formatMoney(dailyBudget)}/día × {durationDays} días
        </p>
      </div>

      <div className="flex justify-end">
        <button
          disabled={!canContinue}
          onClick={() =>
            onNext({
              dailyBudget,
              durationDays,
              totalBudget: total,
              startDate: new Date(startDate).toISOString(),
            })
          }
          className="flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-bold uppercase disabled:opacity-50"
          style={{
            background: 'var(--vc-lime-main)',
            color: 'var(--vc-black)',
            fontFamily: 'var(--font-heading)',
            boxShadow: canContinue ? '0 0 16px var(--vc-glow-lime)' : 'none',
          }}
        >
          Continuar <ArrowRight size={12} />
        </button>
      </div>
    </div>
  )
}

// ─────── PASO 5: REVISAR ───────
function Step5Review({
  draft, onLaunch, launching,
}: { draft: any; onLaunch: () => void; launching: boolean }) {
  const rows: { label: string; value: string }[] = [
    { label: 'Nombre', value: draft.name },
    { label: 'Plataforma', value: draft.platform },
    { label: 'Objetivo', value: draft.objective },
    { label: 'Producto', value: draft.product?.name ?? '—' },
    { label: 'País', value: draft.targetCountry ?? '—' },
    { label: 'Audiencia', value: `${draft.ageMin}-${draft.ageMax} · ${draft.gender}` },
    { label: 'Intereses', value: draft.interests?.join(', ') || '—' },
    { label: 'Placements', value: draft.placements?.join(', ') || '—' },
    { label: 'Titular', value: draft.headline ?? '—' },
    { label: 'CTA', value: draft.cta ?? '—' },
    {
      label: 'Presupuesto',
      value: draft.dailyBudget
        ? `${formatMoney(draft.dailyBudget)}/día × ${draft.durationDays}d = ${formatMoney(draft.dailyBudget * (draft.durationDays ?? 0))}`
        : '—',
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="mb-1 text-lg font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
          Revisa y lanza
        </h2>
        <p className="text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
          Todo listo. Si tienes cuenta conectada vía OAuth, se crea el espejo en /publicidad. Si no, queda READY para publicar cuando conectes.
        </p>
      </div>

      {/* Preview visual del creativo */}
      {draft.imageUrl && (
        <div className="grid gap-4 md:grid-cols-2">
          <div
            className="overflow-hidden rounded-xl"
            style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={draft.imageUrl} alt="Creative" className="w-full" />
            <div className="space-y-2 p-3">
              <p className="text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                {draft.headline}
              </p>
              <p className="whitespace-pre-line text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>
                {draft.primaryText}
              </p>
              {draft.description && (
                <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>
                  {draft.description}
                </p>
              )}
              <button
                className="mt-2 w-full rounded-lg py-2 text-xs font-bold uppercase"
                style={{
                  background: 'var(--vc-lime-main)',
                  color: 'var(--vc-black)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {CTA_OPTIONS.find((c) => c.value === draft.cta)?.label ?? 'Comprar'}
              </button>
            </div>
          </div>

          {/* Resumen */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}
          >
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.label} className="flex items-start justify-between gap-3 text-xs">
                  <span style={{ color: 'var(--vc-gray-mid)' }}>{r.label}</span>
                  <span className="text-right" style={{ color: 'var(--vc-white-soft)' }}>
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Aviso sobre OAuth */}
      <div
        className="flex gap-3 rounded-lg p-4"
        style={{ background: 'rgba(60,198,255,0.05)', border: '1px solid rgba(60,198,255,0.25)' }}
      >
        <AlertCircle size={18} color="var(--vc-info)" className="shrink-0" />
        <div>
          <p className="text-xs font-bold" style={{ color: 'var(--vc-info)', fontFamily: 'var(--font-heading)' }}>
            Sobre la publicación automática
          </p>
          <p className="mt-1 text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>
            Para que Vitalcom publique la campaña directo en {draft.platform}, debes conectar tu cuenta vía OAuth en <strong>Publicidad</strong>. Mientras tanto, el borrador queda como READY y visible para tu equipo.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={onLaunch}
          disabled={launching}
          className="flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-bold uppercase disabled:opacity-50"
          style={{
            background: 'var(--vc-lime-main)',
            color: 'var(--vc-black)',
            fontFamily: 'var(--font-heading)',
            boxShadow: '0 0 24px var(--vc-glow-strong)',
          }}
        >
          {launching ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
          Lanzar campaña
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        className="mb-1.5 text-[10px] uppercase tracking-wider"
        style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </p>
      {children}
    </div>
  )
}
