'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Trophy, TrendingUp, Users, Package, Flame, ArrowRight, Sparkles, Loader2 } from 'lucide-react'
import { useWinningProducts, type Period } from '@/hooks/useInsights'

// ── WinningProductsCard ──────────────────────────────────
// Ranking data-driven de productos Vitalcom con mejor tracción
// en la comunidad (ventas reales, # dropshippers, margen, trend).
// Objetivo: que el dropshipper sepa con qué producto empezar o escalar.

type Variant = 'full' | 'compact'

type Props = {
  variant?: Variant
  defaultPeriod?: Period
  limit?: number
  title?: string
  subtitle?: string
  className?: string
}

const PERIOD_LABELS: Record<Period, string> = {
  '7d': '7 días',
  '30d': '30 días',
  '90d': '90 días',
  month: 'Este mes',
  year: 'Este año',
}

function formatCOP(value: number): string {
  return `$ ${value.toLocaleString('es-CO')}`
}

export function WinningProductsCard({
  variant = 'full',
  defaultPeriod = '30d',
  limit = 5,
  title = 'Productos ganadores de la comunidad',
  subtitle = 'Lo que mejor está vendiendo entre los VITALCOMMERS — empieza por acá',
  className = '',
}: Props) {
  const [period, setPeriod] = useState<Period>(defaultPeriod)
  const { data, isLoading, isError } = useWinningProducts(period, limit)

  const products = data?.products ?? []
  const stats = data?.stats

  return (
    <div className={`vc-card ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'rgba(198,255,60,0.12)', border: '1px solid rgba(198,255,60,0.3)' }}>
            <Trophy size={18} color="var(--vc-lime-main)" />
          </div>
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold"
              style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              {title}
              <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                style={{ background: 'rgba(198,255,60,0.15)', color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>
                Data comunidad
              </span>
            </h3>
            <p className="mt-0.5 text-[11px] leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
              {subtitle}
            </p>
          </div>
        </div>

        {variant === 'full' && (
          <div className="flex gap-1">
            {(['7d', '30d', '90d'] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className="rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all"
                style={{
                  background: period === p ? 'var(--vc-lime-main)' : 'var(--vc-black-soft)',
                  color: period === p ? 'var(--vc-black)' : 'var(--vc-white-dim)',
                  border: period === p ? 'none' : '1px solid var(--vc-gray-dark)',
                  fontFamily: 'var(--font-mono)',
                }}>
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        )}
      </div>

      {variant === 'full' && stats && (
        <div className="mb-4 grid grid-cols-3 gap-2">
          <MiniStat icon={<Package size={12} />} label="Órdenes" value={stats.totalOrders.toLocaleString('es-CO')} />
          <MiniStat icon={<Users size={12} />} label="Dropshippers" value={stats.activeDropshippers.toString()} />
          <MiniStat icon={<TrendingUp size={12} />} label="GMV comunidad" value={formatCOP(stats.totalRevenue)} />
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={18} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
        </div>
      ) : isError ? (
        <div className="py-6 text-center">
          <p className="text-xs" style={{ color: 'var(--vc-error)' }}>No pudimos cargar los productos ganadores.</p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-8 text-center">
          <Sparkles size={28} className="mx-auto mb-2" color="var(--vc-gray-dark)" />
          <p className="text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
            Aún no hay ventas registradas en este periodo.
          </p>
          <p className="mt-1 text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>
            El ranking se construye automáticamente cuando la comunidad empieza a entregar pedidos.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p: any, i: number) => (
            <ProductRow key={p.productId} product={p} rank={i + 1} />
          ))}

          {variant === 'full' && (
            <Link href="/herramientas/catalogo"
              className="mt-4 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all"
              style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}>
              Ver catálogo completo <ArrowRight size={12} />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function ProductRow({ product, rank }: { product: any; rank: number }) {
  const isPodium = rank <= 3

  return (
    <Link href={`/herramientas/catalogo/${product.productId}`}
      className="group flex items-center gap-3 rounded-lg p-2.5 transition-all"
      style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
      {/* Ranking badge */}
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black"
        style={{
          background: rank === 1 ? 'var(--vc-lime-main)' : 'var(--vc-black-mid)',
          color: rank === 1 ? 'var(--vc-black)' : 'var(--vc-lime-main)',
          border: rank !== 1 ? '1px solid var(--vc-gray-dark)' : 'none',
          fontFamily: 'var(--font-mono)',
        }}>
        {rank}
      </span>

      {/* Imagen */}
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md"
        style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)' }}>
        {product.image ? (
          <Image src={product.image} alt={product.name} fill className="object-cover" sizes="44px" />
        ) : (
          <Package size={16} color="var(--vc-gray-mid)" className="absolute inset-0 m-auto" />
        )}
      </div>

      {/* Nombre + SKU + badges */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold" style={{ color: 'var(--vc-white-soft)' }}>
          {product.name}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-[9px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
            {product.sku}
          </span>
          {product.isTrending && (
            <span className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
              style={{ background: 'rgba(255,184,0,0.15)', color: 'var(--vc-warning)' }}>
              <Flame size={9} /> Trending
            </span>
          )}
          {isPodium && !product.isTrending && (
            <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
              style={{ background: 'rgba(198,255,60,0.12)', color: 'var(--vc-lime-main)' }}>
              Top {rank}
            </span>
          )}
        </div>
      </div>

      {/* Métricas */}
      <div className="hidden shrink-0 flex-col items-end gap-0.5 sm:flex">
        <p className="text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>
          <span className="font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>
            {product.unitsSold}
          </span>{' '}
          unidades
        </p>
        <p className="text-[9px]" style={{ color: 'var(--vc-gray-mid)' }}>
          {product.dropshippersCount} vendiéndolo · {product.suggestedMargin}% margen
        </p>
      </div>

      <ArrowRight size={14} className="shrink-0 opacity-40 transition-all group-hover:opacity-100"
        style={{ color: 'var(--vc-lime-main)' }} />
    </Link>
  )
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg px-3 py-2"
      style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
      <div className="mb-1 flex items-center gap-1.5" style={{ color: 'var(--vc-gray-mid)' }}>
        {icon}
        <span className="text-[9px] uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>{label}</span>
      </div>
      <p className="text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-mono)' }}>
        {value}
      </p>
    </div>
  )
}
