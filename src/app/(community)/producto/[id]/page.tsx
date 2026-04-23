'use client'

// V36 — Detalle de producto community-facing (el ecosistema Vitalcom en
// una pantalla). Agrupa galería real + info del producto + recursos
// descargables + acciones IA + contenido pregrabado + solicitud de acceso.
// Diseño premium, dark-first, siguiendo branding verde lima neón.

import { use, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ChevronLeft, ChevronRight, Share2, Heart, Star, Loader2, ImageIcon, Play,
  Tag, MapPin, Download, Sparkles, Wand2, MessageSquare, Check, Copy as CopyIcon,
  Package, Zap, Film, FileText, X, TrendingUp,
} from 'lucide-react'
import { useProductAssets, ASSET_TYPE_LABEL } from '@/hooks/useStudio'
import { useProduct } from '@/hooks/useProducts'
import {
  useSuggestAngles,
  useGenerateCopy,
  useRequestAccess,
  useDownloadPack,
  type CopyVariant,
  type RequestAccessInput,
} from '@/hooks/useProductActions'
import {
  groupAssetsByCategory,
  calculateMargin,
  type AssetLike,
} from '@/lib/catalog/product-detail'

type Ctx = { params: Promise<{ id: string }> }

export default function ProductDetailPage({ params }: Ctx) {
  const { id } = use(params)
  const productQ = useProduct(id)
  const assetsQ = useProductAssets(id)

  const product = productQ.data
  const assets = useMemo<AssetLike[]>(
    () => (assetsQ.data?.items ?? []) as AssetLike[],
    [assetsQ.data],
  )

  const images = useMemo(
    () => assets.filter((a) => a.originalMime?.startsWith('image/') && a.cloudinaryUrl),
    [assets],
  )
  const videos = useMemo(
    () => assets.filter((a) => a.originalMime?.startsWith('video/') && a.cloudinaryUrl),
    [assets],
  )
  const [activeIdx, setActiveIdx] = useState(0)
  const heroAsset = images[activeIdx] ?? null
  const heroUrl = heroAsset?.cloudinaryUrl ?? product?.images?.[0] ?? null

  const next = () => setActiveIdx((i) => (i + 1) % Math.max(1, images.length))
  const prev = () => setActiveIdx((i) => (i - 1 + images.length) % Math.max(1, images.length))

  const margin = product
    ? calculateMargin(product.precioPublico, product.precioComunidad)
    : { ganancia: 0, marginPercent: 0 }

  const groups = useMemo(() => groupAssetsByCategory(assets), [assets])

  if (productQ.isLoading || assetsQ.isLoading) {
    return <LoadingState />
  }

  if (productQ.error || !product) {
    return <ErrorState message="No se pudo cargar el producto" />
  }

  return (
    <div className="min-h-screen bg-[var(--vc-black)]">
      <div className="mx-auto max-w-6xl px-4 py-5 lg:px-6">
        <Link
          href="/herramientas/catalogo"
          className="mb-5 inline-flex items-center gap-1.5 text-xs text-[var(--vc-white-dim)] transition hover:text-[var(--vc-lime-main)]"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Volver al catálogo
        </Link>

        {/* ═══ HERO: Gallery + Info ═══ */}
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* Columna izquierda — Galería */}
          <div>
            <div
              className="relative aspect-square overflow-hidden rounded-2xl"
              style={{
                background: 'var(--vc-black-mid)',
                border: '1px solid rgba(198,255,60,0.20)',
                boxShadow: '0 0 40px rgba(198,255,60,0.08)',
              }}
            >
              {heroUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroUrl}
                  alt={heroAsset?.altText ?? product.name}
                  className="h-full w-full object-cover transition-opacity duration-300"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-[var(--vc-gray-mid)]" />
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    aria-label="Imagen anterior"
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-[var(--vc-gray-dark)] bg-[var(--vc-black)]/60 p-2 text-[var(--vc-white-soft)] backdrop-blur transition hover:bg-[var(--vc-lime-main)] hover:text-[var(--vc-black)]"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={next}
                    aria-label="Imagen siguiente"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-[var(--vc-gray-dark)] bg-[var(--vc-black)]/60 p-2 text-[var(--vc-white-soft)] backdrop-blur transition hover:bg-[var(--vc-lime-main)] hover:text-[var(--vc-black)]"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {images.length > 0 && (
                <div className="absolute bottom-3 right-3 rounded-full bg-[var(--vc-black)]/70 px-2.5 py-1 text-[10px] font-bold text-[var(--vc-white-soft)] backdrop-blur">
                  {activeIdx + 1} / {images.length}
                </div>
              )}

              {product.bestseller && (
                <div
                  className="absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider"
                  style={{ background: 'var(--vc-lime-main)', color: 'var(--vc-black)' }}
                >
                  Bestseller
                </div>
              )}

              {heroAsset?.angle && (
                <div className="absolute right-3 top-3 rounded-full border border-[var(--vc-lime-main)]/40 bg-[var(--vc-black)]/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-lime-main)] backdrop-blur">
                  {heroAsset.angle}
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-6 gap-2">
                {images.slice(0, 6).map((a, idx) => (
                  <button
                    key={a.id}
                    onClick={() => setActiveIdx(idx)}
                    className={`aspect-square overflow-hidden rounded-lg border transition ${
                      idx === activeIdx
                        ? 'border-[var(--vc-lime-main)] shadow-[0_0_12px_var(--vc-glow-lime)]'
                        : 'border-[var(--vc-gray-dark)] opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.cloudinaryUrl!} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Columna derecha — Info + CTA + Prices */}
          <div className="space-y-4">
            <div
              className="rounded-2xl p-5 lg:p-6"
              style={{
                background: 'var(--vc-black-mid)',
                border: '1px solid rgba(198,255,60,0.18)',
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: 'rgba(198,255,60,0.1)', color: 'var(--vc-lime-main)' }}
                >
                  {product.category ?? 'Producto'}
                </span>
                <span
                  className="rounded-full border border-[var(--vc-gray-dark)] px-2.5 py-1 text-[10px] font-mono font-bold text-[var(--vc-white-dim)]"
                >
                  {product.sku}
                </span>
              </div>

              <h1
                className="mt-3 text-3xl font-black leading-tight lg:text-4xl"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--vc-white-soft)' }}
              >
                {product.name}
              </h1>

              <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--vc-white-dim)]">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 text-[var(--vc-lime-main)]" fill="currentColor" />
                  ))}
                </div>
                <span>4.7 · comunidad Vitalcom</span>
              </div>

              {product.description && (
                <p className="mt-4 text-sm leading-relaxed text-[var(--vc-white-dim)]">
                  {product.description}
                </p>
              )}

              {/* ═ 3 niveles de precio */}
              <div
                className="mt-5 grid grid-cols-3 gap-2 rounded-xl p-3"
                style={{ background: 'var(--vc-black-soft)' }}
              >
                <PriceTier label="Comunidad" value={product.precioComunidad} highlight />
                <PriceTier label="Privado" value={product.precioPrivado} />
                <PriceTier label="Público" value={product.precioPublico} muted />
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-[var(--vc-lime-main)]/30 bg-[var(--vc-lime-main)]/5 px-3 py-2">
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--vc-white-soft)]">
                  <TrendingUp className="h-3.5 w-3.5 text-[var(--vc-lime-main)]" /> Tu ganancia por unidad
                </span>
                <span className="font-mono text-sm font-black text-[var(--vc-lime-main)]">
                  ${margin.ganancia.toLocaleString('es-CO')} · {margin.marginPercent}%
                </span>
              </div>

              {/* ═ CTAs */}
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <RequestAccessButton productId={id} productName={product.name} />
                <button
                  className="flex items-center justify-center rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-4 py-3 text-sm font-bold uppercase tracking-wider text-[var(--vc-white-soft)] transition hover:border-[var(--vc-lime-main)]/40"
                  aria-label="Compartir"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  className="flex items-center justify-center rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-4 py-3 text-sm font-bold uppercase tracking-wider text-[var(--vc-white-soft)] transition hover:border-[var(--vc-error)]/40"
                  aria-label="Guardar"
                >
                  <Heart className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Asset stats */}
            <div className="grid grid-cols-3 gap-2">
              <StatMini icon={<ImageIcon className="h-3.5 w-3.5" />} label="Fotos" value={images.length} />
              <StatMini icon={<Film className="h-3.5 w-3.5" />} label="Videos" value={videos.length} />
              <StatMini icon={<Package className="h-3.5 w-3.5" />} label="Total assets" value={assets.length} highlight />
            </div>

            <div
              className="flex items-start gap-2 rounded-lg border border-[var(--vc-info)]/30 bg-[var(--vc-info)]/5 p-3 text-[11px] text-[var(--vc-info)]"
            >
              <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" />
              <span>
                Disponible en los 4 países operativos Vitalcom (CO · EC · GT · CL). Tu margen se
                calcula según el país del cliente.
              </span>
            </div>
          </div>
        </div>

        {/* ═══ RECURSOS PARA TU SHOPIFY ═══ */}
        <SectionHeader
          icon={<Download className="h-4 w-4" />}
          title="Recursos para tu Shopify"
          subtitle="Todo el material sincronizado desde Drive, listo para publicar en tu tienda"
        />
        <DownloadSection productId={id} />

        {/* ═══ HERRAMIENTAS IA ═══ */}
        <SectionHeader
          icon={<Sparkles className="h-4 w-4" />}
          title="Herramientas IA"
          subtitle="Genera copy, encuentra ángulos de venta, mejora tus imágenes — todo con un clic"
        />
        <AIToolsSection productId={id} />

        {/* ═══ CONTENIDO PREGRABADO VITALCOM ═══ */}
        {videos.length > 0 && (
          <>
            <SectionHeader
              icon={<Film className="h-4 w-4" />}
              title="Contenido pregrabado Vitalcom"
              subtitle="Videos UGC, reels y cortes listos para Meta Ads, TikTok y Shorts"
            />
            <PrerecordedSection videos={videos} />
          </>
        )}

        {/* ═══ INFO ADICIONAL (ingredientes, cómo usar, testimonios) ═══ */}
        {(product.ingredients || product.benefits || product.howToUse) && (
          <>
            <SectionHeader
              icon={<Zap className="h-4 w-4" />}
              title="Información del producto"
              subtitle="Todo lo que necesitas saber para venderlo con confianza"
            />
            <ProductInfoSection product={product} />
          </>
        )}

        {/* ═══ BIBLIOTECA ORGANIZADA ═══ */}
        {groups.length > 0 && (
          <>
            <SectionHeader
              icon={<FileText className="h-4 w-4" />}
              title="Biblioteca organizada"
              subtitle="Assets agrupados por tipo para encontrar lo que buscas"
            />
            <LibrarySection groups={groups} />
          </>
        )}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════
// SUBCOMPONENTES
// ═════════════════════════════════════════════════════

function LoadingState() {
  return (
    <div className="min-h-screen bg-[var(--vc-black)]">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--vc-lime-main)]" />
          <p className="text-sm text-[var(--vc-white-dim)]">Cargando producto…</p>
        </div>
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[var(--vc-black)]">
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--vc-error)]/30 bg-[var(--vc-error)]/5 px-4 py-3 text-sm text-[var(--vc-error)]">
          <X className="h-4 w-4" />
          {message}
        </div>
        <Link
          href="/herramientas/catalogo"
          className="mt-4 inline-block text-xs text-[var(--vc-lime-main)] underline"
        >
          Volver al catálogo
        </Link>
      </div>
    </div>
  )
}

function PriceTier({
  label,
  value,
  highlight,
  muted,
}: {
  label: string
  value: number
  highlight?: boolean
  muted?: boolean
}) {
  return (
    <div className="text-center">
      <p className="text-[9px] uppercase tracking-wider text-[var(--vc-gray-mid)]">{label}</p>
      <p
        className="mt-0.5 font-mono text-base font-black"
        style={{
          color: highlight
            ? 'var(--vc-lime-main)'
            : muted
              ? 'var(--vc-white-dim)'
              : 'var(--vc-white-soft)',
          textShadow: highlight ? '0 0 20px rgba(198,255,60,0.4)' : undefined,
        }}
      >
        ${value.toLocaleString('es-CO')}
      </p>
    </div>
  )
}

function StatMini({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div
      className="flex flex-col items-center gap-1 rounded-xl p-3"
      style={{
        background: 'var(--vc-black-mid)',
        border: `1px solid ${highlight ? 'rgba(198,255,60,0.4)' : 'var(--vc-gray-dark)'}`,
      }}
    >
      <span className="text-[var(--vc-lime-main)]">{icon}</span>
      <span
        className="text-lg font-black"
        style={{ color: highlight ? 'var(--vc-lime-main)' : 'var(--vc-white-soft)' }}
      >
        {value}
      </span>
      <span className="text-[9px] uppercase tracking-wider text-[var(--vc-gray-mid)]">{label}</span>
    </div>
  )
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="mt-10 mb-4 flex items-start gap-3 border-b border-[var(--vc-gray-dark)] pb-3">
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
        style={{
          background: 'rgba(198,255,60,0.1)',
          color: 'var(--vc-lime-main)',
          border: '1px solid rgba(198,255,60,0.3)',
        }}
      >
        {icon}
      </div>
      <div>
        <h2
          className="text-lg font-black leading-tight"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--vc-white-soft)' }}
        >
          {title}
        </h2>
        <p className="text-[11px] text-[var(--vc-white-dim)]">{subtitle}</p>
      </div>
    </div>
  )
}

function DownloadSection({ productId }: { productId: string }) {
  const pack = useDownloadPack(productId)

  if (pack.isLoading) {
    return (
      <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-6 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-[var(--vc-lime-main)]" />
        <p className="mt-2 text-xs text-[var(--vc-white-dim)]">Preparando recursos…</p>
      </div>
    )
  }

  if (pack.error || !pack.data) {
    return (
      <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-6 text-center text-xs text-[var(--vc-white-dim)]">
        Aún no hay recursos aprobados en Drive. El equipo de contenido está trabajando en ellos.
      </div>
    )
  }

  const manifest = pack.data
  const totalItems = manifest.sections.reduce((sum, s) => sum + s.items.length, 0)

  if (totalItems === 0) {
    return (
      <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-6 text-center text-xs text-[var(--vc-white-dim)]">
        Sin recursos disponibles todavía. El equipo de contenido los publicará pronto.
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {manifest.sections.map((section) => (
        <div
          key={section.name}
          className="flex flex-col gap-2 rounded-xl p-4"
          style={{
            background: 'var(--vc-black-mid)',
            border: '1px solid rgba(198,255,60,0.15)',
          }}
        >
          <div className="flex items-center justify-between">
            <h3
              className="text-xs font-black uppercase tracking-wider"
              style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
            >
              {section.name}
            </h3>
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-bold"
              style={{ background: 'rgba(198,255,60,0.1)', color: 'var(--vc-lime-main)' }}
            >
              {section.items.length}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {section.items.slice(0, 5).map((item) => (
              <a
                key={item.filename}
                href={item.url}
                download={item.filename}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-2 text-[11px] text-[var(--vc-white-dim)] transition hover:border-[var(--vc-lime-main)]/40 hover:text-[var(--vc-white-soft)]"
              >
                <span className="truncate">{item.filename}</span>
                <Download className="h-3.5 w-3.5 flex-shrink-0 text-[var(--vc-lime-main)]" />
              </a>
            ))}
            {section.items.length > 5 && (
              <p className="text-center text-[10px] text-[var(--vc-gray-mid)]">
                +{section.items.length - 5} más
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function AIToolsSection({ productId }: { productId: string }) {
  const [anglesOpen, setAnglesOpen] = useState(false)
  const [copyOpen, setCopyOpen] = useState(false)
  const suggestM = useSuggestAngles(productId)
  const copyM = useGenerateCopy(productId)

  const handleSuggest = () => {
    setAnglesOpen(true)
    suggestM.mutate()
  }

  const handleCopy = (angle: string) => {
    setCopyOpen(true)
    copyM.mutate({ angle })
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <AIToolCard
        icon={<Wand2 className="h-4 w-4" />}
        title="Sugerir ángulos"
        description="3 ángulos psicológicos ideales para vender este producto"
        cta="Ver ángulos"
        onClick={handleSuggest}
        loading={suggestM.isPending}
      />
      <AIToolCard
        icon={<Sparkles className="h-4 w-4" />}
        title="Generar copy IA"
        description="Headlines, body y CTA listos para Meta Ads, TikTok, Shopify"
        cta="Generar"
        onClick={() => handleCopy('BENEFIT')}
        loading={copyM.isPending}
      />
      <AIToolCard
        icon={<ImageIcon className="h-4 w-4" />}
        title="Mejorar imagen"
        description="Upscale, remover fondo, overlay — próximamente desde Studio"
        cta="Abrir Studio"
        href="/admin/catalogo/assets"
      />
      <AIToolCard
        icon={<Film className="h-4 w-4" />}
        title="Generar UGC"
        description="Scripts para reels con IA, persona + ángulo + duración"
        cta="Crear script"
        href="/admin/catalogo/assets"
      />

      {anglesOpen && (
        <AnglesModal
          data={suggestM.data}
          loading={suggestM.isPending}
          error={suggestM.error}
          onClose={() => setAnglesOpen(false)}
          onPickAngle={(angle) => {
            setAnglesOpen(false)
            handleCopy(angle)
          }}
        />
      )}

      {copyOpen && (
        <CopyModal
          data={copyM.data}
          loading={copyM.isPending}
          error={copyM.error}
          onClose={() => setCopyOpen(false)}
        />
      )}
    </div>
  )
}

function AIToolCard({
  icon,
  title,
  description,
  cta,
  onClick,
  href,
  loading,
}: {
  icon: React.ReactNode
  title: string
  description: string
  cta: string
  onClick?: () => void
  href?: string
  loading?: boolean
}) {
  const inner = (
    <>
      <div
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg"
        style={{
          background: 'rgba(198,255,60,0.1)',
          color: 'var(--vc-lime-main)',
          border: '1px solid rgba(198,255,60,0.3)',
        }}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      </div>
      <h3
        className="text-sm font-black"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--vc-white-soft)' }}
      >
        {title}
      </h3>
      <p className="mt-1 text-[11px] leading-relaxed text-[var(--vc-white-dim)]">{description}</p>
      <div className="mt-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-lime-main)]">
        {cta} <ChevronRight className="h-3 w-3" />
      </div>
    </>
  )

  const className =
    'group flex flex-col rounded-xl p-4 text-left transition hover:shadow-[0_0_24px_rgba(198,255,60,0.15)]'
  const style = {
    background: 'var(--vc-black-mid)',
    border: '1px solid rgba(198,255,60,0.15)',
  }

  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {inner}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`${className} disabled:opacity-60`}
      style={style}
    >
      {inner}
    </button>
  )
}

function AnglesModal({
  data,
  loading,
  error,
  onClose,
  onPickAngle,
}: {
  data: { angles: Array<{ key: string; title: string; hook: string; whenToUse: string }> } | undefined
  loading: boolean
  error: Error | null
  onClose: () => void
  onPickAngle: (angle: string) => void
}) {
  return (
    <ModalShell title="3 ángulos sugeridos para este producto" onClose={onClose}>
      {loading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--vc-lime-main)]" />
        </div>
      )}
      {error && <p className="text-xs text-[var(--vc-error)]">{error.message}</p>}
      {data && (
        <div className="space-y-3">
          {data.angles.map((a) => (
            <div
              key={a.key}
              className="flex items-start justify-between gap-3 rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] p-3"
            >
              <div className="flex-1">
                <p className="mb-0.5 text-[10px] uppercase tracking-wider text-[var(--vc-lime-main)]">
                  {a.key}
                </p>
                <p className="text-sm font-bold text-[var(--vc-white-soft)]">{a.title}</p>
                <p className="mt-1 text-[11px] text-[var(--vc-white-dim)]">{a.hook}</p>
                <p className="mt-1 text-[10px] italic text-[var(--vc-gray-mid)]">
                  Cuándo usarlo: {a.whenToUse}
                </p>
              </div>
              <button
                onClick={() => onPickAngle(a.key)}
                className="rounded-lg bg-[var(--vc-lime-main)] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--vc-black)] transition hover:bg-[var(--vc-lime-electric)]"
              >
                Usar
              </button>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  )
}

function CopyModal({
  data,
  loading,
  error,
  onClose,
}: {
  data: { variants: CopyVariant[]; angle: string; generatedWithLlm: boolean } | undefined
  loading: boolean
  error: Error | null
  onClose: () => void
}) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const handleCopyToClipboard = async (variant: CopyVariant, idx: number) => {
    const text = `${variant.headline}\n\n${variant.body}\n\nCTA: ${variant.cta}\n\n${variant.hashtags.map((h) => `#${h}`).join(' ')}`
    await navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <ModalShell
      title={`Copy generado${data ? ` · Ángulo ${data.angle}` : ''}`}
      onClose={onClose}
      subtitle={data?.generatedWithLlm === false ? 'Modo offline — variantes de plantilla' : undefined}
    >
      {loading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--vc-lime-main)]" />
          <p className="ml-3 text-xs text-[var(--vc-white-dim)]">Generando copy con IA…</p>
        </div>
      )}
      {error && <p className="text-xs text-[var(--vc-error)]">{error.message}</p>}
      {data && (
        <div className="space-y-3">
          {data.variants.map((v, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-black text-[var(--vc-white-soft)]">{v.headline}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[var(--vc-white-dim)]">{v.body}</p>
                  <div className="mt-2 flex items-center gap-2 text-[10px]">
                    <span className="rounded-full bg-[var(--vc-lime-main)]/10 px-2 py-0.5 font-bold text-[var(--vc-lime-main)]">
                      CTA: {v.cta}
                    </span>
                    <span className="text-[var(--vc-gray-mid)]">{v.hashtags.length} hashtags</span>
                  </div>
                </div>
                <button
                  onClick={() => handleCopyToClipboard(v, idx)}
                  className="flex items-center gap-1 rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-soft)] transition hover:border-[var(--vc-lime-main)]/40"
                >
                  {copiedIdx === idx ? (
                    <>
                      <Check className="h-3 w-3 text-[var(--vc-lime-main)]" /> Copiado
                    </>
                  ) : (
                    <>
                      <CopyIcon className="h-3 w-3" /> Copiar
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  )
}

function RequestAccessButton({
  productId,
  productName,
}: {
  productId: string
  productName: string
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<RequestAccessInput['reason']>('INFO')
  const [message, setMessage] = useState('')
  const m = useRequestAccess(productId)

  const handleSubmit = () => {
    m.mutate({ reason, message: message.trim() || undefined })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex-1 rounded-lg px-4 py-3 text-sm font-black uppercase tracking-wider transition"
        style={{
          background: 'var(--vc-lime-main)',
          color: 'var(--vc-black)',
          boxShadow: '0 0 24px var(--vc-glow-lime)',
        }}
      >
        <span className="flex items-center justify-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Consultar producto
        </span>
      </button>

      {open && (
        <ModalShell
          title={`Consultar ${productName}`}
          onClose={() => {
            setOpen(false)
            m.reset()
          }}
          subtitle="Tu solicitud llega al área Comercial de Vitalcom (respuesta en 24h hábiles)"
        >
          {m.isSuccess ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: 'rgba(198,255,60,0.15)' }}
              >
                <Check className="h-6 w-6 text-[var(--vc-lime-main)]" />
              </div>
              <p className="text-sm font-bold text-[var(--vc-white-soft)]">Solicitud enviada</p>
              <p className="text-xs text-[var(--vc-white-dim)]">
                Hilo creado en tu inbox. Respuesta estimada en {m.data.estimatedResponseHours}h.
              </p>
              <button
                onClick={() => {
                  setOpen(false)
                  m.reset()
                }}
                className="mt-2 rounded-lg bg-[var(--vc-lime-main)] px-4 py-2 text-xs font-black uppercase tracking-wider text-[var(--vc-black)]"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[var(--vc-white-dim)]">
                    Motivo de la consulta
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as RequestAccessInput['reason'])}
                    className="mt-1 w-full rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-2 text-xs text-[var(--vc-white-soft)] outline-none focus:border-[var(--vc-lime-main)]/40"
                  >
                    <option value="INFO">Información general</option>
                    <option value="PRICING">Consulta de precios</option>
                    <option value="SAMPLE">Solicitar muestra</option>
                    <option value="EXCLUSIVE">Acuerdo de exclusividad</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[var(--vc-white-dim)]">
                    Mensaje (opcional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="Cuéntanos sobre tu tienda, volumen esperado, timing…"
                    className="mt-1 w-full resize-none rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-2 text-xs text-[var(--vc-white-soft)] outline-none focus:border-[var(--vc-lime-main)]/40"
                  />
                </div>
                {m.error && <p className="text-xs text-[var(--vc-error)]">{m.error.message}</p>}
              </div>
              <button
                onClick={handleSubmit}
                disabled={m.isPending}
                className="mt-4 w-full rounded-lg bg-[var(--vc-lime-main)] px-4 py-3 text-xs font-black uppercase tracking-wider text-[var(--vc-black)] transition hover:bg-[var(--vc-lime-electric)] disabled:opacity-60"
              >
                {m.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando…
                  </span>
                ) : (
                  'Enviar solicitud'
                )}
              </button>
            </>
          )}
        </ModalShell>
      )}
    </>
  )
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl p-5 lg:p-6"
        style={{
          background: 'var(--vc-black-mid)',
          border: '1px solid rgba(198,255,60,0.25)',
          boxShadow: '0 0 48px rgba(198,255,60,0.1)',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-[var(--vc-gray-dark)] pb-3">
          <div>
            <h3
              className="text-base font-black"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--vc-white-soft)' }}
            >
              {title}
            </h3>
            {subtitle && <p className="mt-0.5 text-[11px] text-[var(--vc-white-dim)]">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] p-1.5 text-[var(--vc-white-dim)] hover:border-[var(--vc-lime-main)]/40"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function PrerecordedSection({ videos }: { videos: AssetLike[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {videos.slice(0, 8).map((v) => (
        <div
          key={v.id}
          className="group relative aspect-[9/16] overflow-hidden rounded-xl"
          style={{
            background: 'var(--vc-black-mid)',
            border: '1px solid rgba(198,255,60,0.15)',
          }}
        >
          <video
            src={v.cloudinaryUrl!}
            className="h-full w-full object-cover"
            playsInline
            muted
            loop
            onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
            onMouseLeave={(e) => e.currentTarget.pause()}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-60 transition group-hover:opacity-0">
            <Play className="h-10 w-10 text-[var(--vc-lime-main)] drop-shadow-lg" fill="currentColor" />
          </div>
          <span
            className="absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{ background: 'var(--vc-black)/70', color: 'var(--vc-lime-main)' }}
          >
            {ASSET_TYPE_LABEL[v.type as keyof typeof ASSET_TYPE_LABEL] ?? v.type}
          </span>
          {v.cloudinaryUrl && (
            <a
              href={v.cloudinaryUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="absolute right-2 top-2 rounded-full bg-[var(--vc-black)]/70 p-1.5 text-[var(--vc-lime-main)] backdrop-blur transition hover:bg-[var(--vc-lime-main)] hover:text-[var(--vc-black)]"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      ))}
    </div>
  )
}

function ProductInfoSection({
  product,
}: {
  product: {
    ingredients: unknown
    benefits: unknown
    howToUse: string | null
    testimonials: unknown
  }
}) {
  const ingredients = Array.isArray(product.ingredients) ? product.ingredients : []
  const benefits = Array.isArray(product.benefits) ? product.benefits : []
  const testimonials = Array.isArray(product.testimonials) ? product.testimonials : []

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {benefits.length > 0 && (
        <InfoCard title="Beneficios">
          <ul className="space-y-2">
            {benefits.slice(0, 6).map((b: any, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[var(--vc-white-dim)]">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--vc-lime-main)]" />
                <span>
                  <strong className="text-[var(--vc-white-soft)]">{b.title ?? 'Beneficio'}:</strong>{' '}
                  {b.description ?? b}
                </span>
              </li>
            ))}
          </ul>
        </InfoCard>
      )}

      {ingredients.length > 0 && (
        <InfoCard title="Ingredientes">
          <ul className="space-y-2">
            {ingredients.slice(0, 6).map((ing: any, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[var(--vc-white-dim)]">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--vc-info)]" />
                <span>
                  <strong className="text-[var(--vc-white-soft)]">{ing.name ?? 'Ingrediente'}:</strong>{' '}
                  {ing.description ?? ing}
                </span>
              </li>
            ))}
          </ul>
        </InfoCard>
      )}

      {product.howToUse && (
        <InfoCard title="Cómo usar">
          <p className="text-xs leading-relaxed text-[var(--vc-white-dim)]">{product.howToUse}</p>
        </InfoCard>
      )}

      {testimonials.length > 0 && (
        <InfoCard title="Testimonios">
          <div className="space-y-3">
            {testimonials.slice(0, 3).map((t: any, i: number) => (
              <div key={i} className="rounded-lg bg-[var(--vc-black-soft)] p-3">
                <p className="text-xs italic text-[var(--vc-white-dim)]">
                  &ldquo;{t.text ?? t}&rdquo;
                </p>
                <p className="mt-1 text-[10px] font-bold text-[var(--vc-lime-main)]">— {t.name ?? 'Cliente Vitalcom'}</p>
              </div>
            ))}
          </div>
        </InfoCard>
      )}
    </div>
  )
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--vc-black-mid)',
        border: '1px solid rgba(198,255,60,0.15)',
      }}
    >
      <h3
        className="mb-3 text-xs font-black uppercase tracking-wider"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--vc-lime-main)' }}
      >
        {title}
      </h3>
      {children}
    </div>
  )
}

function LibrarySection({ groups }: { groups: ReturnType<typeof groupAssetsByCategory> }) {
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.label}>
          <div className="mb-2 flex items-center justify-between">
            <h3
              className="text-xs font-black uppercase tracking-wider"
              style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
            >
              {g.label}
              <span className="ml-2 text-[var(--vc-gray-mid)]">· {g.assets.length}</span>
            </h3>
            <p className="text-[10px] text-[var(--vc-white-dim)]">{g.description}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {g.assets.slice(0, 16).map((a) => (
              <div
                key={a.id}
                className="relative aspect-square overflow-hidden rounded-lg"
                style={{
                  background: 'var(--vc-black-mid)',
                  border: '1px solid var(--vc-gray-dark)',
                }}
              >
                {a.originalMime.startsWith('image/') && a.cloudinaryUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.cloudinaryUrl} alt={a.altText ?? ''} className="h-full w-full object-cover" />
                ) : a.originalMime.startsWith('video/') && a.cloudinaryUrl ? (
                  <video src={a.cloudinaryUrl} className="h-full w-full object-cover" muted />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <FileText className="h-5 w-5 text-[var(--vc-gray-mid)]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
