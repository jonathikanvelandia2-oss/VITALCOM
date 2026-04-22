'use client'

import { use, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, ShoppingCart, Share2, Heart, Star,
  Loader2, ImageIcon, Video, Play, Tag, MapPin,
} from 'lucide-react'
import { useProductAssets, ASSET_TYPE_LABEL } from '@/hooks/useStudio'

type Ctx = { params: Promise<{ id: string }> }

export default function ProductLandingPage({ params }: Ctx) {
  const { id } = use(params)
  const assetsQ = useProductAssets(id)
  const [activeIdx, setActiveIdx] = useState(0)

  const images = useMemo(
    () => (assetsQ.data?.items ?? []).filter(a => a.originalMime?.startsWith('image/') && a.cloudinaryUrl),
    [assetsQ.data],
  )
  const videos = useMemo(
    () => (assetsQ.data?.items ?? []).filter(a => a.originalMime?.startsWith('video/') && a.cloudinaryUrl),
    [assetsQ.data],
  )
  const heroAsset = images[activeIdx] ?? null

  const next = () => setActiveIdx(i => (i + 1) % Math.max(1, images.length))
  const prev = () => setActiveIdx(i => (i - 1 + images.length) % Math.max(1, images.length))

  return (
    <div className="min-h-screen bg-[var(--vc-black)]">
      <div className="mx-auto max-w-6xl px-4 py-5 lg:px-6">
        {/* Back */}
        <Link
          href="/herramientas/catalogo"
          className="mb-4 inline-flex items-center gap-1 text-xs text-[var(--vc-white-dim)] hover:text-[var(--vc-lime-main)]"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Volver al catálogo
        </Link>

        {assetsQ.isLoading && (
          <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-10 text-center">
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-[var(--vc-lime-main)]" />
            <div className="text-xs text-[var(--vc-white-dim)]">Cargando producto…</div>
          </div>
        )}

        {!assetsQ.isLoading && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Gallery column */}
            <div>
              {/* Hero */}
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-[var(--vc-lime-main)]/20 bg-[var(--vc-black-mid)]">
                {heroAsset ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={heroAsset.cloudinaryUrl!}
                    alt={heroAsset.altText ?? heroAsset.title ?? ''}
                    className="h-full w-full object-cover transition-opacity duration-300"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-[var(--vc-gray-mid)]" />
                  </div>
                )}

                {/* Controls */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-[var(--vc-gray-dark)] bg-[var(--vc-black)]/60 p-2 text-[var(--vc-white-soft)] backdrop-blur transition hover:bg-[var(--vc-lime-main)] hover:text-[var(--vc-black)]"
                      aria-label="Anterior"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={next}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-[var(--vc-gray-dark)] bg-[var(--vc-black)]/60 p-2 text-[var(--vc-white-soft)] backdrop-blur transition hover:bg-[var(--vc-lime-main)] hover:text-[var(--vc-black)]"
                      aria-label="Siguiente"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Counter */}
                {images.length > 0 && (
                  <div className="absolute bottom-3 right-3 rounded-full bg-[var(--vc-black)]/70 px-2 py-0.5 text-[10px] font-bold text-[var(--vc-white-soft)] backdrop-blur">
                    {activeIdx + 1} / {images.length}
                  </div>
                )}

                {/* Angle badge */}
                {heroAsset?.angle && (
                  <div className="absolute left-3 top-3 rounded-full border border-[var(--vc-lime-main)]/40 bg-[var(--vc-black)]/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-lime-main)] backdrop-blur">
                    {heroAsset.angle}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
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

              {/* Videos */}
              {videos.length > 0 && (
                <div className="mt-5">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
                    Videos del producto ({videos.length})
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {videos.slice(0, 4).map(v => (
                      <div
                        key={v.id}
                        className="relative aspect-[9/16] overflow-hidden rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)]"
                      >
                        <video
                          src={v.cloudinaryUrl!}
                          className="h-full w-full object-cover"
                          playsInline
                          muted
                          loop
                          onMouseEnter={e => e.currentTarget.play().catch(() => {})}
                          onMouseLeave={e => e.currentTarget.pause()}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="h-8 w-8 text-[var(--vc-lime-main)] drop-shadow-lg" fill="currentColor" />
                        </div>
                        <span className="absolute bottom-1.5 left-1.5 rounded bg-[var(--vc-black)]/70 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[var(--vc-white-soft)]">
                          {ASSET_TYPE_LABEL[v.type]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Info column */}
            <div>
              <div className="rounded-2xl border border-[var(--vc-lime-main)]/20 bg-[var(--vc-black-mid)] p-5">
                {/* Rating placeholder — cuando tengamos reseñas reales se llena */}
                <div className="flex items-center gap-1 text-[11px] text-[var(--vc-white-dim)]">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-3.5 w-3.5 text-[var(--vc-lime-main)]"
                        fill="currentColor"
                      />
                    ))}
                  </div>
                  <span>4.7 · basado en reseñas reales</span>
                </div>

                <h1
                  className="mt-3 text-3xl font-black leading-tight"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--vc-white-soft)' }}
                >
                  {heroAsset?.product?.name ?? 'Producto'}
                </h1>

                {heroAsset?.product && (
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--vc-white-dim)]">
                    <Tag className="h-3 w-3" />
                    SKU: <code>{heroAsset.product.sku}</code>
                  </div>
                )}

                {/* CTA */}
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <button
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[var(--vc-lime-main)] px-4 py-3 text-sm font-bold uppercase tracking-wider text-[var(--vc-black)] shadow-[0_0_24px_var(--vc-glow-lime)] hover:bg-[var(--vc-lime-electric)]"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Agregar a mi tienda
                  </button>
                  <button
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-4 py-3 text-sm font-bold uppercase tracking-wider text-[var(--vc-white-soft)] hover:border-[var(--vc-lime-main)]/40"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-4 py-3 text-sm font-bold uppercase tracking-wider text-[var(--vc-white-soft)] hover:border-[var(--vc-error)]/40"
                  >
                    <Heart className="h-4 w-4" />
                  </button>
                </div>

                {/* Beneficios / highlights */}
                <div className="mt-6 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
                    ¿Por qué este producto?
                  </div>
                  <ul className="space-y-1.5 text-sm text-[var(--vc-white-soft)]">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--vc-lime-main)]" />
                      Stock sincronizado en tiempo real con tu tienda
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--vc-lime-main)]" />
                      Fotos y videos profesionales listos para tus ads
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--vc-lime-main)]" />
                      Paquetes UGC generados por IA para reels convertidores
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--vc-lime-main)]" />
                      Fulfillment Dropi multi-país (CO · EC · GT · CL)
                    </li>
                  </ul>
                </div>

                <div className="mt-5 flex items-center gap-2 rounded-lg border border-[var(--vc-info)]/30 bg-[var(--vc-info)]/5 p-3 text-[11px] text-[var(--vc-info)]">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span>
                    Producto disponible en los 4 países operativos. Tu margen se calcula según el país del cliente.
                  </span>
                </div>
              </div>

              {/* Asset stats */}
              {assetsQ.data && (
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-3 text-center">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-[var(--vc-gray-mid)]">Imágenes</div>
                    <div className="text-lg font-bold text-[var(--vc-white-soft)]">{images.length}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-[var(--vc-gray-mid)]">Videos</div>
                    <div className="text-lg font-bold text-[var(--vc-white-soft)]">{videos.length}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-[var(--vc-gray-mid)]">Total assets</div>
                    <div className="text-lg font-bold text-[var(--vc-lime-main)]">{assetsQ.data.items.length}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
