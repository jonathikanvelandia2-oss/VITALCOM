'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Store, Plus, ExternalLink, RefreshCw, Package, ShoppingCart,
  ArrowRight, CheckCircle2, Circle, Sparkles, Globe,
  CreditCard, Upload, Link2, Rocket, TrendingUp, Clock, AlertCircle,
  Loader2, X, Trash2,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import {
  useMyStores, useStoreDetail, useStoreSyncs, useStoreOrders,
  useStoreMetrics, useConnectStore, useSyncProducts, useDisconnectStore,
} from '@/hooks/useShopify'
import {
  STORE_CREATION_GUIDE, STORE_TEMPLATES,
  getStatusColor, getStatusLabel,
  type StoreTemplate,
} from '@/lib/integrations/shopify'
import { WinningProductsCard } from '@/components/community/WinningProductsCard'

// ── Mi Tienda — Hub de gestión Shopify para VITALCOMMERS ─

type ViewMode = 'dashboard' | 'create' | 'products' | 'orders'

function formatCOP(value: number): string {
  return `$ ${value.toLocaleString('es-CO')}`
}

export default function MiTiendaPage() {
  const [view, setView] = useState<ViewMode>('dashboard')
  const { data, isLoading } = useMyStores()
  const stores = data?.stores ?? []
  const activeStore = stores[0] ?? null

  if (isLoading) {
    return (
      <>
        <CommunityTopbar title="Mi Tienda" subtitle="Cargando..." />
        <div className="flex flex-1 items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
        </div>
      </>
    )
  }

  if (!activeStore) {
    return <CreateStoreView />
  }

  return (
    <>
      <CommunityTopbar
        title="Mi Tienda"
        subtitle={`${activeStore.storeName} · ${activeStore.shopDomain}`}
      />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {([
            { key: 'dashboard', label: 'Resumen', icon: Store },
            { key: 'products', label: 'Productos sincronizados', icon: Package },
            { key: 'orders', label: 'Pedidos recientes', icon: ShoppingCart },
            { key: 'create', label: 'Nueva tienda', icon: Plus },
          ] as { key: ViewMode; label: string; icon: typeof Store }[]).map((tab) => {
            const Icon = tab.icon
            return (
              <button key={tab.key} onClick={() => setView(tab.key)}
                className="flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all"
                style={{
                  background: view === tab.key ? 'var(--vc-lime-main)' : 'var(--vc-black-mid)',
                  color: view === tab.key ? 'var(--vc-black)' : 'var(--vc-white-dim)',
                  border: view === tab.key ? 'none' : '1px solid var(--vc-gray-dark)',
                  fontFamily: 'var(--font-heading)',
                }}>
                <Icon size={14} /> {tab.label}
              </button>
            )
          })}
        </div>

        {view === 'dashboard' && <StoreDashboard storeId={activeStore.id} />}
        {view === 'products' && <SyncedProducts storeId={activeStore.id} />}
        {view === 'orders' && <RecentOrders storeId={activeStore.id} />}
        {view === 'create' && <CreateStoreView />}
      </div>
    </>
  )
}

// ── Dashboard ───────────────────────────────────────────
function StoreDashboard({ storeId }: { storeId: string }) {
  const { data, isLoading } = useStoreDetail(storeId)
  const { data: metricsData } = useStoreMetrics(storeId, 30)

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
      </div>
    )
  }

  const { store, products, metrics } = data
  const summary = metricsData?.summary

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Ingresos totales" value={formatCOP(summary?.totalRevenue ?? metrics.totalRevenue)} icon={TrendingUp} highlight />
        <KpiCard label="Productos Vitalcom" value={`${metrics.syncedCount} sync`} icon={Package} />
        <KpiCard label="Ganancia neta" value={formatCOP(summary?.totalProfit ?? metrics.totalProfit)} icon={Sparkles} />
        <KpiCard label="Última sync" value={store.lastSyncAt ? new Date(store.lastSyncAt).toLocaleDateString('es-CO') : 'Nunca'} icon={RefreshCw} />
      </div>

      {/* Estado de la tienda */}
      <div className="vc-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
            Estado de tu tienda
          </h3>
          <span className="flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase"
            style={{ background: store.status === 'active' ? 'rgba(198,255,60,0.15)' : 'rgba(255,71,87,0.15)', color: store.status === 'active' ? 'var(--vc-lime-main)' : 'var(--vc-error)' }}>
            <span className="h-2 w-2 rounded-full" style={{ background: store.status === 'active' ? 'var(--vc-lime-main)' : 'var(--vc-error)' }} />
            {store.status === 'active' ? 'Activa' : store.status}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <InfoBlock label="Dominio" value={store.shopDomain} icon={<Globe size={13} color="var(--vc-lime-main)" />} />
          <InfoBlock label="Plan" value={`Shopify ${store.plan || 'Basic'}`} />
          <InfoBlock label="Conectada desde" value={store.connectedAt ? new Date(store.connectedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
        </div>
      </div>

      {/* Productos ganadores de la comunidad — arriba de "top en tu tienda" */}
      <WinningProductsCard
        limit={5}
        subtitle="Qué está vendiendo mejor la comunidad VITALCOMMERS — importa estos para maximizar conversión"
      />

      {/* Top productos */}
      {products.length > 0 && (
        <div className="vc-card">
          <h3 className="mb-4 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
            Top productos en tu tienda
          </h3>
          <div className="space-y-3">
            {products.slice(0, 5).map((p: any, i: number) => (
              <div key={p.id} className="flex items-center gap-4 rounded-lg p-3"
                style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black"
                  style={{ background: i === 0 ? 'var(--vc-lime-main)' : 'var(--vc-black-mid)', color: i === 0 ? 'var(--vc-black)' : 'var(--vc-lime-main)', border: i !== 0 ? '1px solid var(--vc-gray-dark)' : 'none' }}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold" style={{ color: 'var(--vc-white-soft)' }}>{p.name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                    {p.sku} · {p.soldTotal} vendidos
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>
                    {formatCOP(p.sellingPrice)}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--vc-lime-deep)' }}>
                    {p.margin}% margen
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="grid gap-4 md:grid-cols-3">
        <QuickAction icon={Upload} title="Importar productos" description="Agrega más productos Vitalcom a tu tienda" />
        <QuickAction icon={RefreshCw} title="Sincronizar ahora" description="Actualiza precios e inventario" />
        <QuickAction icon={ExternalLink} title="Abrir Shopify" description="Ir al admin de tu tienda" />
      </div>
    </div>
  )
}

// ── Productos sincronizados ─────────────────────────────
function SyncedProducts({ storeId }: { storeId: string }) {
  const { data, isLoading } = useStoreSyncs(storeId)
  const products = data?.products ?? []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
          {products.length} productos sincronizados con tu Shopify
        </p>
        <button className="vc-btn-primary flex items-center gap-2 text-xs">
          <Plus size={14} /> Importar más
        </button>
      </div>

      {products.length === 0 ? (
        <div className="vc-card py-12 text-center">
          <Package size={40} color="var(--vc-gray-dark)" className="mx-auto mb-3" />
          <p className="text-sm" style={{ color: 'var(--vc-gray-mid)' }}>No hay productos sincronizados</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--vc-white-dim)' }}>Importa productos del catálogo Vitalcom</p>
        </div>
      ) : (
        <div className="vc-card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                <th className="py-3">Producto</th>
                <th className="py-3">Precio venta</th>
                <th className="py-3">Costo Vitalcom</th>
                <th className="py-3">Margen</th>
                <th className="py-3">Vendidos</th>
                <th className="py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: any) => (
                <tr key={p.id} className="text-xs" style={{ borderTop: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)' }}>
                  <td className="py-4">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--vc-white-soft)' }}>{p.name}</p>
                      <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{p.sku}</p>
                    </div>
                  </td>
                  <td className="py-4 font-mono" style={{ color: 'var(--vc-white-soft)' }}>{formatCOP(p.sellingPrice)}</td>
                  <td className="py-4 font-mono" style={{ color: 'var(--vc-lime-main)' }}>{formatCOP(p.costPrice)}</td>
                  <td className="py-4"><span className="font-mono font-bold" style={{ color: 'var(--vc-lime-main)' }}>{p.margin}%</span></td>
                  <td className="py-4 font-mono">{p.soldTotal}</td>
                  <td className="py-4">
                    <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                      style={{ background: 'rgba(198,255,60,0.15)', color: 'var(--vc-lime-main)' }}>
                      {p.status === 'active' ? 'Activo' : p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Pedidos recientes ───────────────────────────────────
function RecentOrders({ storeId }: { storeId: string }) {
  const { data, isLoading } = useStoreOrders(storeId)
  const orders = data?.orders ?? []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
        {orders.length} pedidos recientes de tu tienda Shopify
      </p>

      {orders.length === 0 ? (
        <div className="vc-card py-12 text-center">
          <ShoppingCart size={40} color="var(--vc-gray-dark)" className="mx-auto mb-3" />
          <p className="text-sm" style={{ color: 'var(--vc-gray-mid)' }}>No hay pedidos aún</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => (
            <div key={order.id} className="vc-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-1 flex items-center gap-3">
                    <span className="text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-mono)' }}>
                      {order.number}
                    </span>
                    <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                      style={{ background: `${getStatusColor(order.status.toLowerCase())}22`, color: getStatusColor(order.status.toLowerCase()) }}>
                      {getStatusLabel(order.status.toLowerCase())}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--vc-white-dim)' }}>
                    {order.customerName} · {order.customerCity}
                  </p>
                  <p className="mt-1 text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>
                    {order.items.map((i: any) => `${i.name} x${i.qty}`).join(', ')}
                  </p>
                  {order.trackingCode && (
                    <p className="mt-1 text-[10px]" style={{ color: 'var(--vc-info)', fontFamily: 'var(--font-mono)' }}>
                      Tracking: {order.trackingCode}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-mono)' }}>
                    {formatCOP(order.total)}
                  </p>
                  <p className="text-[10px] font-bold" style={{ color: 'var(--vc-lime-main)' }}>
                    Ganancia: {formatCOP(order.profit)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Vista de creación de tienda ─────────────────────────
function CreateStoreView() {
  const [activeStep, setActiveStep] = useState(0)
  const [showTemplates, setShowTemplates] = useState(false)
  const [domain, setDomain] = useState('')
  const [storeName, setStoreName] = useState('')
  const connectStore = useConnectStore()

  function handleConnect() {
    if (!domain.includes('.myshopify.com')) return
    connectStore.mutate(
      { shopDomain: domain, storeName: storeName || domain.split('.')[0] },
      { onSuccess: () => window.location.reload() }
    )
  }

  return (
    <>
      <CommunityTopbar
        title="Crear tu tienda"
        subtitle="Te ayudamos a montar tu Shopify en menos de 1 hora"
      />
      <div className="flex-1 space-y-8 p-4 md:p-6">
        {/* Hero */}
        <div className="vc-card relative overflow-hidden" style={{ padding: '2rem' }}>
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, var(--vc-lime-main) 0%, transparent 70%)' }} />
          <div className="relative">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>
              Empieza a vender hoy
            </p>
            <h2 className="mb-2 text-2xl font-black" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              Tu tienda Shopify + Vitalcom
            </h2>
            <p className="max-w-xl text-sm leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
              Monta tu tienda online con nuestro catálogo de productos. Tú vendes, nosotros despachamos con Dropi.
              Sin inventario, sin riesgo. Solo necesitas ganas de vender.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => setShowTemplates(!showTemplates)}
                className="vc-btn-primary flex items-center gap-2 text-xs">
                <Rocket size={14} /> {showTemplates ? 'Ver pasos' : 'Usar plantilla lista'}
              </button>
              <button className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold"
                style={{ border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)', fontFamily: 'var(--font-heading)' }}>
                <Link2 size={14} /> Ya tengo tienda — conectar
              </button>
            </div>
          </div>
        </div>

        {/* Productos ganadores — ayuda al nuevo a elegir con qué empezar */}
        <WinningProductsCard
          limit={5}
          title="Con qué empezar — ya probado por la comunidad"
          subtitle="Los productos Vitalcom que mejor están funcionando. Importa estos a tu tienda apenas la tengas lista."
        />

        {showTemplates ? (
          <div>
            <h3 className="mb-4 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              Elige una plantilla para empezar
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              {STORE_TEMPLATES.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h3 className="mb-4 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              6 pasos para tu tienda
            </h3>
            <div className="space-y-3">
              {STORE_CREATION_GUIDE.map((step, i) => {
                const StepIcon = i <= activeStep ? CheckCircle2 : Circle
                const isActive = i === activeStep
                const isDone = i < activeStep
                return (
                  <div key={step.step} className="vc-card cursor-pointer transition-all"
                    onClick={() => setActiveStep(i)}
                    style={{
                      borderColor: isActive ? 'rgba(198,255,60,0.5)' : undefined,
                      boxShadow: isActive ? '0 0 20px var(--vc-glow-lime)' : 'none',
                      opacity: isDone ? 0.6 : 1,
                    }}>
                    <div className="flex items-start gap-4">
                      <StepIcon size={22}
                        style={{ color: isDone ? 'var(--vc-lime-deep)' : isActive ? 'var(--vc-lime-main)' : 'var(--vc-gray-mid)' }}
                        className="mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>
                            PASO {step.step}
                          </span>
                          <h4 className="text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                            {step.title}
                          </h4>
                        </div>
                        {isActive && (
                          <div className="mt-2">
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
                              {step.description}
                            </p>
                            <button className="vc-btn-primary mt-3 flex items-center gap-2 text-xs" style={{ padding: '0.5rem 1rem' }}>
                              {step.action} <ArrowRight size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Conectar tienda: OAuth real (recomendado) */}
        <div className="vc-card" style={{ borderColor: 'rgba(198, 255, 60, 0.3)' }}>
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style={{ background: 'var(--vc-lime-main)', color: 'var(--vc-black)', fontFamily: 'var(--font-heading)' }}>
              Recomendado
            </span>
            <h3 className="text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              Conectar con Shopify (OAuth seguro)
            </h3>
          </div>
          <p className="mb-4 text-xs" style={{ color: 'var(--vc-white-dim)' }}>
            Autoriza a Vitalcom dentro de tu admin de Shopify. Sincronización automática de productos y pedidos.
          </p>
          <div className="flex gap-3">
            <input value={domain} onChange={(e) => setDomain(e.target.value)}
              placeholder="mi-tienda.myshopify.com"
              className="flex-1 rounded-lg px-4 py-2.5 text-xs outline-none"
              style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }} />
            <a
              href={domain.includes('.myshopify.com') ? `/api/shopify/install?shop=${encodeURIComponent(domain)}` : '#'}
              aria-disabled={!domain.includes('.myshopify.com')}
              onClick={(e) => { if (!domain.includes('.myshopify.com')) e.preventDefault() }}
              className="vc-btn-primary flex items-center gap-2 text-xs"
              style={{ opacity: domain.includes('.myshopify.com') ? 1 : 0.5, pointerEvents: domain.includes('.myshopify.com') ? 'auto' : 'none' }}
            >
              <Rocket size={14} />
              Autorizar
            </a>
          </div>
          <p className="mt-2 text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
            Serás redirigido a Shopify para autorizar permisos de productos, pedidos e inventario.
          </p>
        </div>

        {/* Alternativa manual (modo QA / testing sin OAuth) */}
        <details className="vc-card" style={{ padding: '1rem' }}>
          <summary className="cursor-pointer text-xs font-semibold" style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-heading)' }}>
            Conectar manualmente (avanzado)
          </summary>
          <div className="mt-4 space-y-3">
            <p className="text-[11px]" style={{ color: 'var(--vc-gray-mid)' }}>
              Solo úsalo si tu tienda ya está autorizada o para pruebas internas.
            </p>
            <input value={storeName} onChange={(e) => setStoreName(e.target.value)}
              placeholder="Nombre de tu tienda"
              className="w-full rounded-lg px-4 py-2.5 text-xs outline-none"
              style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }} />
            <div className="flex gap-3">
              <input value={domain} onChange={(e) => setDomain(e.target.value)}
                placeholder="mi-tienda.myshopify.com"
                className="flex-1 rounded-lg px-4 py-2.5 text-xs outline-none"
                style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }} />
              <button onClick={handleConnect} disabled={connectStore.isPending || !domain.includes('.myshopify.com')}
                className="vc-btn-primary flex items-center gap-2 text-xs">
                {connectStore.isPending ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                Conectar manual
              </button>
            </div>
            {connectStore.isError && (
              <p className="text-xs" style={{ color: 'var(--vc-error)' }}>{(connectStore.error as Error).message}</p>
            )}
          </div>
        </details>
      </div>
    </>
  )
}

// ── Componentes auxiliares ───────────────────────────────

function KpiCard({ label, value, icon: Icon, highlight, warning }: {
  label: string; value: string | number; icon: typeof TrendingUp; highlight?: boolean; warning?: boolean
}) {
  return (
    <div className="vc-card" style={{ padding: '1rem' }}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{label}</p>
        <Icon size={14} style={{ color: warning ? 'var(--vc-warning)' : highlight ? 'var(--vc-lime-main)' : 'var(--vc-gray-mid)' }} />
      </div>
      <p className="text-lg font-black"
        style={{ color: warning ? 'var(--vc-warning)' : highlight ? 'var(--vc-lime-main)' : 'var(--vc-white-soft)', fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
    </div>
  )
}

function InfoBlock({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg p-4" style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
      <p className="mb-1 text-[10px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{label}</p>
      <p className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--vc-white-soft)' }}>
        {icon} {value}
      </p>
    </div>
  )
}

function QuickAction({ icon: Icon, title, description }: { icon: typeof Upload; title: string; description: string }) {
  return (
    <button className="vc-card flex items-center gap-4 text-left transition-all hover:border-[rgba(198,255,60,0.5)]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ background: 'rgba(198,255,60,0.1)', border: '1px solid rgba(198,255,60,0.25)' }}>
        <Icon size={18} color="var(--vc-lime-main)" />
      </div>
      <div>
        <p className="text-xs font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>{title}</p>
        <p className="text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>{description}</p>
      </div>
    </button>
  )
}

function TemplateCard({ template }: { template: StoreTemplate }) {
  return (
    <article className="vc-card group flex flex-col">
      <div className="relative mb-4 h-40 overflow-hidden rounded-xl"
        style={{ background: 'linear-gradient(135deg, rgba(198,255,60,0.08) 0%, rgba(168,255,0,0.15) 100%)', border: '1px solid rgba(198,255,60,0.15)' }}>
        <Image src={template.previewImage} alt={template.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="(max-width: 640px) 100vw, 50vw" />
        <span className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-bold"
          style={{ background: 'rgba(10,10,10,0.8)', color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>
          {template.estimatedSetupTime}
        </span>
      </div>
      <p className="mb-1 text-[10px] uppercase tracking-wider" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>
        {template.niche}
      </p>
      <h4 className="mb-1 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
        {template.name}
      </h4>
      <p className="mb-3 text-[11px] leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
        {template.description}
      </p>
      <div className="mb-3 flex flex-wrap gap-1">
        {template.features.map((f) => (
          <span key={f} className="rounded-full px-2 py-0.5 text-[9px]" style={{ background: 'var(--vc-black-soft)', color: 'var(--vc-white-dim)' }}>
            {f}
          </span>
        ))}
      </div>
      <button className="vc-btn-primary mt-auto flex w-full items-center justify-center gap-2 text-xs">
        <Sparkles size={14} /> Usar esta plantilla
      </button>
    </article>
  )
}
