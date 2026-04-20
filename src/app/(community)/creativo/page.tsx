'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles, Wand2, Heart, Trash2, Rocket, Loader2, Copy, Check, X,
  ImageIcon, Share2, Trophy, Filter, RefreshCw, Target, MessageCircle,
  Flame, Eye, Users, Zap, Smile, Repeat, Lightbulb,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import {
  useCreatives,
  useGenerateCreatives,
  useUpdateCreative,
  useDeleteCreative,
  useUseCreative,
  type AdCreative,
  type CreativeAngle,
  type CreativePlatform,
  type CreativeRatio,
} from '@/hooks/useCreativeMaker'
import { useProducts } from '@/hooks/useProducts'

// ── CreativoMaker IA — V17 ───────────────────────────────
// Genera variantes de copy + imagen para cualquier producto.

const ANGLE_META: Record<CreativeAngle, { label: string; icon: typeof Target; color: string; bg: string; desc: string }> = {
  BENEFIT:          { label: 'Beneficio',      icon: Target,       color: 'var(--vc-lime-main)', bg: 'rgba(198,255,60,0.12)', desc: 'Destaca el beneficio #1' },
  PAIN_POINT:       { label: 'Dolor',          icon: Flame,        color: '#FF4757',              bg: 'rgba(255,71,87,0.12)',  desc: 'Conecta con el problema' },
  SOCIAL_PROOF:     { label: 'Prueba Social',  icon: Users,        color: '#3CC6FF',              bg: 'rgba(60,198,255,0.12)', desc: 'Testimonios + números' },
  URGENCY:          { label: 'Urgencia',       icon: Zap,          color: '#FFB800',              bg: 'rgba(255,184,0,0.12)',  desc: 'Escasez + tiempo' },
  LIFESTYLE:        { label: 'Lifestyle',      icon: Smile,        color: '#A855F7',              bg: 'rgba(168,85,247,0.12)', desc: 'Vida aspiracional' },
  TESTIMONIAL:      { label: 'Testimonio',     icon: MessageCircle, color: 'var(--vc-lime-main)', bg: 'rgba(198,255,60,0.12)', desc: 'Historia real' },
  BEFORE_AFTER:     { label: 'Antes/Después',  icon: Repeat,       color: '#3CC6FF',              bg: 'rgba(60,198,255,0.12)', desc: 'Transformación' },
  PROBLEM_SOLUTION: { label: 'Problema→Solución', icon: Lightbulb, color: '#FFB800',              bg: 'rgba(255,184,0,0.12)',  desc: 'Enfoque directo' },
}

const DEFAULT_ANGLES: CreativeAngle[] = ['BENEFIT', 'PAIN_POINT', 'SOCIAL_PROOF', 'URGENCY']

export default function CreativoPage() {
  const [openWizard, setOpenWizard] = useState(false)
  const [filterAngle, setFilterAngle] = useState<CreativeAngle | 'ALL'>('ALL')
  const [onlyFavs, setOnlyFavs] = useState(false)

  const creativesQ = useCreatives({
    angle: filterAngle === 'ALL' ? undefined : filterAngle,
    favorites: onlyFavs || undefined,
  })

  const items = creativesQ.data?.items ?? []
  const counts = creativesQ.data?.counts ?? {}
  const totalCreatives = Object.values(counts).reduce((s: number, v) => s + (v as number), 0)
  const favs = items.filter((c) => c.isFavorite).length
  const usados = items.reduce((s, c) => s + c.timesUsed, 0)
  const avgScore = items.length > 0 ? Math.round(items.reduce((s, c) => s + c.score, 0) / items.length) : 0

  return (
    <>
      <CommunityTopbar title="CreativoMaker IA" subtitle="Genera copy + imagen de ads en segundos" />
      <div className="flex-1 space-y-6 p-4 md:p-6">

        {/* Hero */}
        <div
          className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(198,255,60,0.08), rgba(168,85,247,0.06))',
            border: '1px solid rgba(198,255,60,0.2)',
          }}
        >
          <div
            className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20"
            style={{ background: 'radial-gradient(var(--vc-lime-main), transparent 70%)' }}
          />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <div className="mb-2 flex items-center gap-2">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: 'var(--vc-gradient-primary)' }}
                >
                  <Wand2 size={20} color="var(--vc-black)" />
                </div>
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}
                >
                  V17 · 8 ángulos psicológicos
                </span>
              </div>
              <h1
                className="text-2xl font-bold md:text-3xl"
                style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
              >
                Creativos IA listos para lanzar
              </h1>
              <p className="mt-2 text-sm" style={{ color: 'var(--vc-white-dim)' }}>
                Selecciona cualquier producto Vitalcom y la IA genera variantes de headline + copy + imagen
                con ángulos distintos para que encuentres el ganador. Cada creativo se lanza al Lanzador con un clic.
              </p>
            </div>
            <button
              onClick={() => setOpenWizard(true)}
              className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold uppercase tracking-wider"
              style={{
                background: 'var(--vc-lime-main)',
                color: 'var(--vc-black)',
                boxShadow: '0 0 24px var(--vc-glow-lime)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              <Sparkles size={16} /> Generar creativos
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KPICard label="Creativos" value={totalCreatives} icon={ImageIcon} color="var(--vc-white-soft)" />
          <KPICard label="Favoritos" value={favs} icon={Heart} color="#FF4757" />
          <KPICard label="Usados en ads" value={usados} icon={Rocket} color="var(--vc-lime-main)" />
          <KPICard label="Score promedio" value={`${avgScore}/100`} icon={Trophy} color="#FFB800" />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} style={{ color: 'var(--vc-gray-mid)' }} />
          <FilterChip active={filterAngle === 'ALL'} onClick={() => setFilterAngle('ALL')}>
            Todos
          </FilterChip>
          {(Object.keys(ANGLE_META) as CreativeAngle[]).map((a) => (
            <FilterChip key={a} active={filterAngle === a} onClick={() => setFilterAngle(a)}>
              {ANGLE_META[a].label}
            </FilterChip>
          ))}
          <div className="ml-auto">
            <button
              onClick={() => setOnlyFavs((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold"
              style={{
                background: onlyFavs ? 'rgba(255,71,87,0.15)' : 'var(--vc-black-mid)',
                border: `1px solid ${onlyFavs ? '#FF4757' : 'var(--vc-gray-dark)'}`,
                color: onlyFavs ? '#FF4757' : 'var(--vc-white-dim)',
              }}
            >
              <Heart size={12} fill={onlyFavs ? '#FF4757' : 'none'} /> Solo favoritos
            </button>
          </div>
        </div>

        {/* Grid */}
        {creativesQ.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        ) : items.length === 0 ? (
          <EmptyState onGenerate={() => setOpenWizard(true)} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => <CreativeCard key={c.id} creative={c} />)}
          </div>
        )}
      </div>

      {openWizard && <GenerateWizard onClose={() => setOpenWizard(false)} />}
    </>
  )
}

function KPICard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: typeof Target; color: string }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--vc-black-mid)', border: '1px solid rgba(198,255,60,0.15)' }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
          {label}
        </span>
        <Icon size={14} style={{ color }} />
      </div>
      <div className="text-2xl font-bold" style={{ color, fontFamily: 'var(--font-heading)' }}>
        {value}
      </div>
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-3 py-1 text-xs font-semibold transition-all"
      style={{
        background: active ? 'var(--vc-lime-main)' : 'var(--vc-black-mid)',
        color: active ? 'var(--vc-black)' : 'var(--vc-white-dim)',
        border: `1px solid ${active ? 'var(--vc-lime-main)' : 'var(--vc-gray-dark)'}`,
      }}
    >
      {children}
    </button>
  )
}

function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div
      className="flex flex-col items-center gap-4 rounded-2xl p-10 text-center"
      style={{ background: 'var(--vc-black-mid)', border: '1px dashed rgba(198,255,60,0.3)' }}
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: 'var(--vc-gradient-primary)' }}
      >
        <Wand2 size={28} color="var(--vc-black)" />
      </div>
      <div>
        <h3 className="text-lg font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
          Aún no tienes creativos generados
        </h3>
        <p className="mt-1 max-w-md text-sm" style={{ color: 'var(--vc-white-dim)' }}>
          Elige uno de los 202 productos Vitalcom y la IA arma 4 variantes con distintos ángulos en 10 segundos.
        </p>
      </div>
      <button
        onClick={onGenerate}
        className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold uppercase"
        style={{
          background: 'var(--vc-lime-main)',
          color: 'var(--vc-black)',
          fontFamily: 'var(--font-heading)',
          boxShadow: '0 0 20px var(--vc-glow-lime)',
        }}
      >
        <Sparkles size={14} /> Generar primer creativo
      </button>
    </div>
  )
}

function CreativeCard({ creative }: { creative: AdCreative }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const updateMut = useUpdateCreative()
  const deleteMut = useDeleteCreative()
  const useMut = useUseCreative()

  const angle = ANGLE_META[creative.angle]
  const AngleIcon = angle.icon

  async function handleUse() {
    const r = await useMut.mutateAsync(creative.id)
    router.push(`/lanzador/${r.draftId}`)
  }

  function copyText() {
    const text = `${creative.headline}\n\n${creative.primaryText}\n\n${creative.description ?? ''}\n\n${creative.hashtags.map((h) => `#${h}`).join(' ')}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl transition-all"
      style={{
        background: 'var(--vc-black-mid)',
        border: '1px solid rgba(198,255,60,0.15)',
      }}
    >
      {/* Imagen + badges */}
      <div
        className="relative aspect-square w-full overflow-hidden"
        style={{ background: 'var(--vc-black-soft)' }}
      >
        {creative.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={creative.imageUrl} alt={creative.headline} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon size={40} style={{ color: 'var(--vc-gray-mid)' }} />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold uppercase"
            style={{ background: angle.bg, color: angle.color, backdropFilter: 'blur(6px)' }}
          >
            <AngleIcon size={10} /> {angle.label}
          </span>
          <span
            className="rounded-md px-2 py-1 text-[10px] font-bold uppercase"
            style={{ background: 'rgba(0,0,0,0.6)', color: 'var(--vc-white-soft)', backdropFilter: 'blur(6px)' }}
          >
            {creative.platform} · {creative.ratio}
          </span>
        </div>
        <button
          onClick={() => updateMut.mutate({ id: creative.id, isFavorite: !creative.isFavorite })}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
        >
          <Heart size={14} fill={creative.isFavorite ? '#FF4757' : 'none'} color={creative.isFavorite ? '#FF4757' : 'var(--vc-white-soft)'} />
        </button>
        <div
          className="absolute bottom-3 right-3 rounded-md px-2 py-1 text-[10px] font-bold"
          style={{
            background: creative.score >= 80 ? 'var(--vc-lime-main)' : creative.score >= 70 ? '#FFB800' : 'var(--vc-gray-mid)',
            color: 'var(--vc-black)',
          }}
        >
          SCORE {creative.score}
        </div>
      </div>

      {/* Copy */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
          {creative.product?.name ?? 'Producto Vitalcom'}
        </div>
        <h3 className="text-sm font-bold leading-tight" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
          {creative.headline}
        </h3>
        <p className="line-clamp-3 whitespace-pre-line text-xs leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
          {creative.primaryText}
        </p>
        {creative.description && (
          <p className="text-[11px]" style={{ color: 'var(--vc-gray-mid)' }}>
            {creative.description}
          </p>
        )}
        {creative.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {creative.hashtags.slice(0, 4).map((h) => (
              <span key={h} className="text-[10px]" style={{ color: 'var(--vc-lime-main)' }}>
                #{h}
              </span>
            ))}
          </div>
        )}
        {creative.reasoning && (
          <div
            className="mt-2 rounded-lg p-2 text-[11px] italic leading-snug"
            style={{ background: 'rgba(198,255,60,0.05)', color: 'var(--vc-white-dim)' }}
          >
            💡 {creative.reasoning}
          </div>
        )}
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-1 border-t px-3 py-2"
        style={{ borderColor: 'var(--vc-gray-dark)' }}
      >
        <button
          onClick={handleUse}
          disabled={useMut.isPending}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold uppercase transition-all"
          style={{
            background: 'var(--vc-lime-main)',
            color: 'var(--vc-black)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          {useMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <Rocket size={12} />}
          Lanzar
        </button>
        <button
          onClick={copyText}
          className="flex items-center justify-center rounded-lg px-2 py-1.5"
          style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)' }}
          title="Copiar copy"
        >
          {copied ? <Check size={12} color="var(--vc-lime-main)" /> : <Copy size={12} />}
        </button>
        <button
          onClick={() => {
            if (confirm('¿Borrar este creativo?')) deleteMut.mutate(creative.id)
          }}
          className="flex items-center justify-center rounded-lg px-2 py-1.5"
          style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: '#FF4757' }}
          title="Borrar"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

// ── Wizard generador ─────────────────────────────────────
function GenerateWizard({ onClose }: { onClose: () => void }) {
  const [productId, setProductId] = useState('')
  const [platform, setPlatform] = useState<CreativePlatform>('META')
  const [ratios, setRatios] = useState<CreativeRatio[]>(['SQUARE'])
  const [angles, setAngles] = useState<CreativeAngle[]>(DEFAULT_ANGLES)
  const [query, setQuery] = useState('')

  const productsQ = useProducts({ limit: 50, search: query } as any)
  const generateMut = useGenerateCreatives()

  const products = productsQ.data?.products ?? []

  async function handleGenerate() {
    if (!productId || angles.length === 0) return
    await generateMut.mutateAsync({
      productId,
      platform,
      angles,
      ratios: ratios.length > 0 ? ratios : ['SQUARE'],
    })
    onClose()
  }

  function toggleAngle(a: CreativeAngle) {
    setAngles((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))
  }

  function toggleRatio(r: CreativeRatio) {
    setRatios((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]))
  }

  const estTotal = angles.length * Math.max(ratios.length, 1)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl"
        style={{ background: 'var(--vc-black-mid)', border: '1px solid rgba(198,255,60,0.3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4" style={{ borderColor: 'var(--vc-gray-dark)' }}>
          <div className="flex items-center gap-2">
            <Wand2 size={18} style={{ color: 'var(--vc-lime-main)' }} />
            <h2 className="text-base font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              Generar creativos
            </h2>
          </div>
          <button onClick={onClose} style={{ color: 'var(--vc-gray-mid)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Producto */}
          <section className="mb-5">
            <Label>Producto Vitalcom</Label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca un producto..."
              className="mb-2 w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{
                background: 'var(--vc-black-soft)',
                border: '1px solid var(--vc-gray-dark)',
                color: 'var(--vc-white-soft)',
              }}
            />
            <div className="grid max-h-52 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {products.slice(0, 20).map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => setProductId(p.id)}
                  className="flex items-center gap-2 rounded-lg p-2 text-left text-xs transition-all"
                  style={{
                    background: productId === p.id ? 'rgba(198,255,60,0.1)' : 'var(--vc-black-soft)',
                    border: `1px solid ${productId === p.id ? 'var(--vc-lime-main)' : 'var(--vc-gray-dark)'}`,
                    color: 'var(--vc-white-soft)',
                  }}
                >
                  {p.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt="" className="h-10 w-10 rounded object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{p.name}</div>
                    <div className="text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>
                      {p.sku}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Plataforma */}
          <section className="mb-5">
            <Label>Plataforma</Label>
            <div className="flex gap-2">
              {(['META', 'TIKTOK', 'GOOGLE'] as CreativePlatform[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className="flex-1 rounded-lg px-3 py-2 text-xs font-bold uppercase"
                  style={{
                    background: platform === p ? 'var(--vc-lime-main)' : 'var(--vc-black-soft)',
                    color: platform === p ? 'var(--vc-black)' : 'var(--vc-white-dim)',
                    border: `1px solid ${platform === p ? 'var(--vc-lime-main)' : 'var(--vc-gray-dark)'}`,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </section>

          {/* Ángulos */}
          <section className="mb-5">
            <Label>Ángulos (elige 1-8)</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(ANGLE_META) as CreativeAngle[]).map((a) => {
                const meta = ANGLE_META[a]
                const AngleIcon = meta.icon
                const active = angles.includes(a)
                return (
                  <button
                    key={a}
                    onClick={() => toggleAngle(a)}
                    className="flex flex-col items-start gap-1 rounded-lg p-2 text-left transition-all"
                    style={{
                      background: active ? meta.bg : 'var(--vc-black-soft)',
                      border: `1px solid ${active ? meta.color : 'var(--vc-gray-dark)'}`,
                      color: active ? meta.color : 'var(--vc-white-dim)',
                    }}
                  >
                    <AngleIcon size={12} />
                    <span className="text-[11px] font-bold">{meta.label}</span>
                    <span className="text-[9px] leading-tight opacity-75">{meta.desc}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Ratios */}
          <section className="mb-5">
            <Label>Formatos (elige 1-4)</Label>
            <div className="flex flex-wrap gap-2">
              {(['SQUARE', 'PORTRAIT', 'STORY', 'LANDSCAPE'] as CreativeRatio[]).map((r) => (
                <button
                  key={r}
                  onClick={() => toggleRatio(r)}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{
                    background: ratios.includes(r) ? 'var(--vc-lime-main)' : 'var(--vc-black-soft)',
                    color: ratios.includes(r) ? 'var(--vc-black)' : 'var(--vc-white-dim)',
                    border: `1px solid ${ratios.includes(r) ? 'var(--vc-lime-main)' : 'var(--vc-gray-dark)'}`,
                  }}
                >
                  {r === 'SQUARE' && '1:1'} {r === 'PORTRAIT' && '4:5'} {r === 'STORY' && '9:16'} {r === 'LANDSCAPE' && '16:9'} · {r}
                </button>
              ))}
            </div>
          </section>

          <div
            className="rounded-lg p-3 text-xs"
            style={{ background: 'rgba(198,255,60,0.05)', border: '1px solid rgba(198,255,60,0.15)' }}
          >
            <strong style={{ color: 'var(--vc-lime-main)' }}>{estTotal}</strong>
            <span style={{ color: 'var(--vc-white-dim)' }}> creativos se generarán ({angles.length} ángulos × {ratios.length || 1} formatos). Tiempo estimado: {Math.ceil(estTotal * 3)} seg.</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t p-4" style={{ borderColor: 'var(--vc-gray-dark)' }}>
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold"
            style={{ background: 'transparent', color: 'var(--vc-white-dim)', border: '1px solid var(--vc-gray-dark)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            disabled={!productId || angles.length === 0 || generateMut.isPending}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold uppercase"
            style={{
              background: productId && angles.length > 0 ? 'var(--vc-lime-main)' : 'var(--vc-gray-dark)',
              color: productId && angles.length > 0 ? 'var(--vc-black)' : 'var(--vc-gray-mid)',
              fontFamily: 'var(--font-heading)',
              boxShadow: productId && angles.length > 0 ? '0 0 20px var(--vc-glow-lime)' : 'none',
            }}
          >
            {generateMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Generar {estTotal}
          </button>
        </div>
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-2 text-[11px] font-bold uppercase tracking-wider"
      style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
    >
      {children}
    </div>
  )
}
