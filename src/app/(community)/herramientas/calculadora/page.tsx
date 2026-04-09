'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Calculator, TrendingUp, Save, RotateCcw, AlertTriangle,
  Package, Truck, Megaphone, ClipboardList, CreditCard,
  Receipt, ChevronDown, Lightbulb, BarChart3, ArrowRight,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { PRICING_CONFIG, isConfigOutdated } from '@/lib/pricing/constants'
import type { CountryCode, GatewayFee } from '@/lib/pricing/constants'
import { calculateSimple, calculateSimulator } from '@/lib/pricing/calculator'

type Tab = 'simple' | 'simulator'

export default function CalculadoraPage() {
  const [tab, setTab] = useState<Tab>('simple')
  const [country] = useState<CountryCode>('CO')
  const config = PRICING_CONFIG[country]
  const outdated = isConfigOutdated(country)

  return (
    <>
      <CommunityTopbar
        title="Calculadora de precios"
        subtitle={`Dropshipping · ${config.name} · ${config.currency}`}
      />
      <div className="flex-1 p-4 md:p-6">
        {/* Aviso de constantes desactualizadas */}
        {outdated && (
          <div
            className="mb-4 flex items-center gap-3 rounded-lg p-3 text-sm"
            style={{
              background: 'rgba(255, 184, 0, 0.1)',
              border: '1px solid rgba(255, 184, 0, 0.3)',
              color: 'var(--vc-warning)',
            }}
          >
            <AlertTriangle size={18} />
            <span>
              Las tasas de {config.name} fueron actualizadas en {config.updatedYear}.
              Es posible que haya cambios en impuestos o comisiones.
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl p-1" style={{ background: 'var(--vc-black-mid)' }}>
          <TabButton
            active={tab === 'simple'}
            onClick={() => setTab('simple')}
            icon={<Calculator size={16} />}
            label="Calculadora"
            sublabel="Precio + margen"
          />
          <TabButton
            active={tab === 'simulator'}
            onClick={() => setTab('simulator')}
            icon={<BarChart3 size={16} />}
            label="Simulador"
            sublabel="Operación completa"
          />
        </div>

        {tab === 'simple' ? (
          <SimpleTab config={config} />
        ) : (
          <SimulatorTab config={config} />
        )}
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════
// TAB 1: CALCULADORA SIMPLE
// ═══════════════════════════════════════════════════════════

function SimpleTab({ config }: { config: typeof PRICING_CONFIG.CO }) {
  const [base, setBase] = useState(45_000)
  const [margin, setMargin] = useState(60)
  const [shipping, setShipping] = useState(config.shippingBase)
  const [gatewayIdx, setGatewayIdx] = useState(0)

  const gateway = config.gateways[gatewayIdx]

  const result = useMemo(
    () => calculateSimple({ basePrice: base, marginPercent: margin, shippingCost: shipping, gateway, taxRate: config.taxRate }),
    [base, margin, shipping, gateway, config.taxRate]
  )

  const reset = useCallback(() => {
    setBase(45_000)
    setMargin(60)
    setShipping(config.shippingBase)
    setGatewayIdx(0)
  }, [config.shippingBase])

  const fmt = (n: number) => `${config.currencySymbol} ${n.toLocaleString('es-CO')}`

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      {/* Inputs */}
      <div className="vc-card space-y-5">
        <SectionHeader icon={<Calculator size={20} />} title="Configura tu venta" subtitle="Ajusta los valores y mira tu ganancia en tiempo real" />

        <NumberField label={`Precio base Vitalcom (${config.currency})`} value={base} onChange={setBase} step={1000} symbol={config.currencySymbol} />

        <div>
          <label className="label-sm mb-2 flex items-center justify-between">
            Margen deseado
            <span className="font-mono text-base" style={{ color: 'var(--vc-lime-main)' }}>{margin}%</span>
          </label>
          <input
            type="range"
            min={10}
            max={150}
            step={5}
            value={margin}
            onChange={(e) => setMargin(parseInt(e.target.value))}
            className="w-full accent-[--vc-lime-main]"
          />
          <div className="mt-1 flex justify-between text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>
            <span>10%</span><span>80%</span><span>150%</span>
          </div>
        </div>

        <NumberField label={`Costo de envío (${config.currency})`} value={shipping} onChange={setShipping} step={1000} symbol={config.currencySymbol} />

        {/* Selector de pasarela */}
        <div>
          <label className="label-sm mb-2 block">Pasarela de pago</label>
          <div className="relative">
            <select
              value={gatewayIdx}
              onChange={(e) => setGatewayIdx(parseInt(e.target.value))}
              className="w-full appearance-none rounded-lg px-4 py-3 pr-10 text-sm font-medium outline-none"
              style={{
                background: 'var(--vc-black-soft)',
                border: '1px solid var(--vc-gray-dark)',
                color: 'var(--vc-white-soft)',
              }}
            >
              {config.gateways.map((gw, i) => (
                <option key={gw.name} value={i}>
                  {gw.name} — {(gw.rate * 100).toFixed(2)}%{gw.fixed > 0 ? ` + ${config.currencySymbol}${gw.fixed.toLocaleString('es-CO')}` : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--vc-white-dim)' }} />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={reset} className="btn-secondary flex flex-1 items-center justify-center gap-2">
            <RotateCcw size={14} /> Reiniciar
          </button>
          <button className="vc-btn-primary flex flex-1 items-center justify-center gap-2">
            <Save size={14} /> Guardar
          </button>
        </div>
      </div>

      {/* Resultado */}
      <div className="vc-card">
        <h2 className="heading-sm mb-5">Desglose y resultado</h2>

        {/* Hero precio */}
        <div className="hero-result mb-5">
          <p className="label-mono mb-1">Precio final al cliente</p>
          <p className="vc-text-gradient text-4xl font-black" style={{ fontFamily: 'var(--font-display)' }}>
            {fmt(result.finalPrice)}
          </p>
          <div className="mt-3 flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-[10px] uppercase" style={{ color: 'var(--vc-white-dim)' }}>Ganancia neta</p>
              <p className="font-mono text-lg font-bold" style={{ color: result.profit >= 0 ? 'var(--vc-lime-main)' : 'var(--vc-error)' }}>
                {fmt(result.profit)}
              </p>
            </div>
            <div className="h-8 w-px" style={{ background: 'var(--vc-gray-dark)' }} />
            <div className="text-center">
              <p className="text-[10px] uppercase" style={{ color: 'var(--vc-white-dim)' }}>Margen real</p>
              <p className="font-mono text-lg font-bold" style={{ color: result.profitPercent >= 15 ? 'var(--vc-lime-main)' : 'var(--vc-warning)' }}>
                {result.profitPercent}%
              </p>
            </div>
          </div>
        </div>

        {/* Desglose */}
        <div className="space-y-2 text-sm">
          <CostRow label="Precio base" value={fmt(base)} />
          <CostRow label={`Margen (${margin}%)`} value={`+ ${fmt(result.marginValue)}`} color="var(--vc-lime-main)" />
          <CostRow label="Subtotal" value={fmt(result.subtotal)} />
          <CostRow label={`${config.taxName} ${config.name} (${config.taxRate * 100}%)`} value={`- ${fmt(result.tax)}`} color="var(--vc-error)" />
          <CostRow label={`Comisión ${gateway.name} (${(gateway.rate * 100).toFixed(2)}%${gateway.fixed > 0 ? ` + ${config.currencySymbol}${gateway.fixed}` : ''})`} value={`- ${fmt(result.gatewayFee)}`} color="var(--vc-error)" />
          <CostRow label="Envío" value={`- ${fmt(result.shipping)}`} color="var(--vc-error)" />
          <div className="mt-3 flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--vc-gray-dark)' }}>
            <span className="label-sm">Total cliente</span>
            <span className="font-mono text-base font-bold" style={{ color: 'var(--vc-lime-main)' }}>
              {fmt(result.finalPrice)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// TAB 2: SIMULADOR COMPLETO (OPTIMUX)
// ═══════════════════════════════════════════════════════════

function SimulatorTab({ config }: { config: typeof PRICING_CONFIG.CO }) {
  const [salePrice, setSalePrice] = useState(95_000)
  const [productCost, setProductCost] = useState(35_000)
  const [orders, setOrders] = useState(100)
  const [dispatchRate, setDispatchRate] = useState(config.avgDispatchRate)
  const [returnRate, setReturnRate] = useState(config.avgReturnRate)
  const [freight, setFreight] = useState(config.avgFreight)
  const [admin, setAdmin] = useState(config.avgAdmin)
  const [cpa, setCpa] = useState(config.avgCPA)
  const [adPercent, setAdPercent] = useState(10)
  const [expectedMargin, setExpectedMargin] = useState(20)
  const [gatewayIdx, setGatewayIdx] = useState(0)

  const gateway = config.gateways[gatewayIdx]

  const result = useMemo(
    () => calculateSimulator({
      salePrice, productCost, invoicedOrders: orders,
      dispatchRate, returnRate,
      freightCost: freight, adminCost: admin,
      cpaCost: cpa, adPercent,
      gateway, taxRate: config.taxRate,
      expectedMargin,
    }),
    [salePrice, productCost, orders, dispatchRate, returnRate, freight, admin, cpa, adPercent, gateway, config.taxRate, expectedMargin]
  )

  const reset = useCallback(() => {
    setSalePrice(95_000)
    setProductCost(35_000)
    setOrders(100)
    setDispatchRate(config.avgDispatchRate)
    setReturnRate(config.avgReturnRate)
    setFreight(config.avgFreight)
    setAdmin(config.avgAdmin)
    setCpa(config.avgCPA)
    setAdPercent(10)
    setExpectedMargin(20)
    setGatewayIdx(0)
  }, [config])

  const fmt = (n: number) => `${config.currencySymbol} ${n.toLocaleString('es-CO')}`

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      {/* Inputs */}
      <div className="space-y-4">
        {/* Sección: Producto y precio */}
        <div className="vc-card space-y-4">
          <SectionHeader icon={<Package size={18} />} title="Producto y precio" subtitle="Valores unitarios por pedido" />
          <NumberField label={`Precio de venta al cliente (${config.currency})`} value={salePrice} onChange={setSalePrice} step={1000} symbol={config.currencySymbol} />
          <NumberField label={`Costo del producto (${config.currency})`} value={productCost} onChange={setProductCost} step={1000} symbol={config.currencySymbol} />
          <NumberField label="Pedidos facturados en el período" value={orders} onChange={setOrders} step={10} symbol="#" />
        </div>

        {/* Sección: Tasas operativas */}
        <div className="vc-card space-y-4">
          <SectionHeader icon={<Truck size={18} />} title="Tasas operativas" subtitle="Despacho y devoluciones" />
          <PercentSlider label="Tasa de despacho" value={dispatchRate} onChange={setDispatchRate} min={30} max={100} hint="% de pedidos que se despachan" />
          <PercentSlider label="Tasa de devolución" value={returnRate} onChange={setReturnRate} min={0} max={50} hint="% de despachados que vuelven" />
        </div>

        {/* Sección: Costos operativos */}
        <div className="vc-card space-y-4">
          <SectionHeader icon={<ClipboardList size={18} />} title="Costos por pedido" subtitle="Flete, admin y pasarela" />
          <NumberField label={`Flete promedio (${config.currency})`} value={freight} onChange={setFreight} step={500} symbol={config.currencySymbol} />
          <NumberField label={`Costos administrativos (${config.currency})`} value={admin} onChange={setAdmin} step={500} symbol={config.currencySymbol} />
          <div>
            <label className="label-sm mb-2 block">Pasarela de pago</label>
            <div className="relative">
              <select
                value={gatewayIdx}
                onChange={(e) => setGatewayIdx(parseInt(e.target.value))}
                className="w-full appearance-none rounded-lg px-4 py-3 pr-10 text-sm font-medium outline-none"
                style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
              >
                {config.gateways.map((gw, i) => (
                  <option key={gw.name} value={i}>
                    {gw.name} — {(gw.rate * 100).toFixed(2)}%{gw.fixed > 0 ? ` + ${config.currencySymbol}${gw.fixed}` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--vc-white-dim)' }} />
            </div>
          </div>
        </div>

        {/* Sección: Publicidad */}
        <div className="vc-card space-y-4">
          <SectionHeader icon={<Megaphone size={18} />} title="Publicidad" subtitle="CPA o porcentaje sobre ventas" />
          <NumberField label={`CPA estimado (${config.currency})`} value={cpa} onChange={setCpa} step={500} symbol={config.currencySymbol} />
          <PercentSlider label="% publicidad sobre precio" value={adPercent} onChange={setAdPercent} min={0} max={40} hint="Se usa si CPA = 0" />
          <PercentSlider label="Utilidad esperada" value={expectedMargin} onChange={setExpectedMargin} min={5} max={50} hint="Tu meta de margen" />
        </div>

        <div className="flex gap-2">
          <button onClick={reset} className="btn-secondary flex flex-1 items-center justify-center gap-2">
            <RotateCcw size={14} /> Reiniciar
          </button>
          <button className="vc-btn-primary flex flex-1 items-center justify-center gap-2">
            <Save size={14} /> Guardar simulación
          </button>
        </div>
      </div>

      {/* Resultados */}
      <div className="space-y-4">
        {/* Hero ganancia */}
        <div className="vc-card">
          <div className="hero-result">
            <p className="label-mono mb-1">Ganancia neta del período</p>
            <p
              className="text-4xl font-black"
              style={{
                fontFamily: 'var(--font-display)',
                color: result.profit >= 0 ? 'var(--vc-lime-main)' : 'var(--vc-error)',
              }}
            >
              {fmt(result.profit)}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <MiniStat label="Utilidad neta" value={`${result.profitPercent}%`} ok={result.meetsExpectation} />
              <MiniStat label="Por pedido" value={fmt(result.profitPerOrder)} ok={result.profitPerOrder > 0} />
              <MiniStat label="ROAS" value={`${result.roas}x`} ok={result.roas >= 2} />
            </div>
          </div>
        </div>

        {/* Tabla de pedidos */}
        <div className="vc-card">
          <h3 className="heading-sm mb-4 flex items-center gap-2">
            <Receipt size={16} color="var(--vc-lime-main)" /> Flujo de pedidos
          </h3>
          <div className="space-y-2">
            <OrderRow emoji="📄" label="Facturado" orders={result.orders.invoiced.orders} value={fmt(result.orders.invoiced.value)} />
            <OrderRow emoji="🚚" label="Despachado" orders={result.orders.dispatched.orders} value={fmt(result.orders.dispatched.value)} />
            <OrderRow emoji="✅" label="Entregado" orders={result.orders.delivered.orders} value={fmt(result.orders.delivered.value)} highlight />
            <OrderRow emoji="🔄" label="Devolución" orders={result.orders.returned.orders} value={fmt(result.orders.returned.value)} negative />
          </div>

          {/* Barra visual del funnel */}
          <div className="mt-4 space-y-1">
            <FunnelBar label="Facturado" percent={100} />
            <FunnelBar label="Despachado" percent={dispatchRate} />
            <FunnelBar label="Entregado" percent={orders > 0 ? (result.orders.delivered.orders / orders) * 100 : 0} />
          </div>
        </div>

        {/* Desglose de costos */}
        <div className="vc-card">
          <h3 className="heading-sm mb-4 flex items-center gap-2">
            <CreditCard size={16} color="var(--vc-lime-main)" /> Desglose de costos
          </h3>
          <div className="space-y-2 text-sm">
            <CostRow label="🎫 Ticket Promedio" value={fmt(result.costs.ticketAvg)} />
            <CostRow label="📦 Costo de Producto" value={fmt(result.costs.productCost)} color="var(--vc-error)" />
            <CostRow label="🚛 Flete Entregados" value={fmt(result.costs.freightCost)} color="var(--vc-error)" />
            <CostRow label="📣 Gasto Publicitario" value={fmt(result.costs.adSpend)} color="var(--vc-error)" />
            <CostRow label="📋 Gasto Administrativo" value={fmt(result.costs.adminCost)} color="var(--vc-error)" />
            <CostRow label="💳 Comisión Pasarela" value={fmt(result.costs.gatewayFee)} color="var(--vc-error)" />
            <CostRow label={`🏛️ ${config.taxName} (${config.taxRate * 100}%)`} value={fmt(result.costs.taxCost)} color="var(--vc-error)" />
            <div className="mt-3 flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--vc-gray-dark)' }}>
              <span className="label-sm">Total costos</span>
              <span className="font-mono text-base font-bold" style={{ color: 'var(--vc-error)' }}>
                {fmt(result.costs.totalCosts)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="label-sm">Ingresos entregados</span>
              <span className="font-mono text-base font-bold" style={{ color: 'var(--vc-white-soft)' }}>
                {fmt(result.orders.delivered.value)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg p-3" style={{ background: result.profit >= 0 ? 'rgba(198,255,60,0.08)' : 'rgba(255,71,87,0.08)' }}>
              <span className="text-sm font-bold" style={{ color: 'var(--vc-white)', fontFamily: 'var(--font-heading)' }}>
                🌱 GANANCIA NETA
              </span>
              <span
                className="font-mono text-lg font-black"
                style={{ color: result.profit >= 0 ? 'var(--vc-lime-main)' : 'var(--vc-error)' }}
              >
                {fmt(result.profit)}
              </span>
            </div>
          </div>
        </div>

        {/* Sugerencias */}
        {result.suggestions.length > 0 && (
          <div className="vc-card">
            <h3 className="heading-sm mb-3 flex items-center gap-2">
              <Lightbulb size={16} color="var(--vc-warning)" /> Análisis y sugerencias
            </h3>
            <div className="space-y-2">
              {result.suggestions.map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-lg p-3 text-sm"
                  style={{
                    background: 'rgba(255, 184, 0, 0.06)',
                    border: '1px solid rgba(255, 184, 0, 0.15)',
                    color: 'var(--vc-white-soft)',
                  }}
                >
                  <ArrowRight size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--vc-warning)' }} />
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// COMPONENTES REUTILIZABLES
// ═══════════════════════════════════════════════════════════

function TabButton({ active, onClick, icon, label, sublabel }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; sublabel: string
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition-all"
      style={{
        background: active ? 'var(--vc-black-soft)' : 'transparent',
        color: active ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)',
        border: active ? '1px solid rgba(198,255,60,0.3)' : '1px solid transparent',
        boxShadow: active ? '0 0 20px rgba(198,255,60,0.08)' : 'none',
        fontFamily: 'var(--font-heading)',
      }}
    >
      {icon}
      <div className="text-left">
        <div>{label}</div>
        <div className="text-[10px] font-normal" style={{ color: active ? 'var(--vc-lime-glow)' : 'var(--vc-gray-mid)' }}>
          {sublabel}
        </div>
      </div>
    </button>
  )
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: 'rgba(198,255,60,0.12)', border: '1px solid rgba(198,255,60,0.3)' }}
      >
        <span style={{ color: 'var(--vc-lime-main)' }}>{icon}</span>
      </div>
      <div>
        <h2 className="heading-sm">{title}</h2>
        <p className="text-xs" style={{ color: 'var(--vc-white-dim)' }}>{subtitle}</p>
      </div>
    </div>
  )
}

function NumberField({ label, value, onChange, step, symbol }: {
  label: string; value: number; onChange: (v: number) => void; step: number; symbol?: string
}) {
  return (
    <div>
      <label className="label-sm mb-2 block">{label}</label>
      <div className="relative">
        {symbol && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: 'var(--vc-gray-mid)' }}>
            {symbol}
          </span>
        )}
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="w-full rounded-lg py-3 text-base font-bold outline-none"
          style={{
            paddingLeft: symbol ? '2rem' : '1rem',
            paddingRight: '1rem',
            background: 'var(--vc-black-soft)',
            border: '1px solid var(--vc-gray-dark)',
            color: 'var(--vc-white-soft)',
            fontFamily: 'var(--font-mono)',
          }}
        />
      </div>
    </div>
  )
}

function PercentSlider({ label, value, onChange, min, max, hint }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; hint?: string
}) {
  return (
    <div>
      <label className="label-sm mb-2 flex items-center justify-between">
        <span>
          {label}
          {hint && <span className="ml-1 font-normal" style={{ color: 'var(--vc-gray-mid)' }}>({hint})</span>}
        </span>
        <span className="font-mono text-base" style={{ color: 'var(--vc-lime-main)' }}>{value}%</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-[--vc-lime-main]"
      />
    </div>
  )
}

function CostRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between text-xs" style={{ color: 'var(--vc-white-dim)' }}>
      <span>{label}</span>
      <span className="font-mono" style={{ color: color || 'var(--vc-white-soft)' }}>{value}</span>
    </div>
  )
}

function OrderRow({ emoji, label, orders, value, highlight, negative }: {
  emoji: string; label: string; orders: number; value: string; highlight?: boolean; negative?: boolean
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg p-3 text-sm"
      style={{
        background: highlight ? 'rgba(198,255,60,0.06)' : negative ? 'rgba(255,71,87,0.04)' : 'var(--vc-black-soft)',
        border: `1px solid ${highlight ? 'rgba(198,255,60,0.2)' : negative ? 'rgba(255,71,87,0.15)' : 'var(--vc-gray-dark)'}`,
      }}
    >
      <span className="text-lg">{emoji}</span>
      <span className="flex-1 font-medium" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>{label}</span>
      <span className="font-mono text-xs" style={{ color: 'var(--vc-white-dim)' }}>{orders} pedidos</span>
      <span
        className="min-w-[100px] text-right font-mono text-sm font-bold"
        style={{ color: highlight ? 'var(--vc-lime-main)' : negative ? 'var(--vc-error)' : 'var(--vc-white-soft)' }}
      >
        {value}
      </span>
    </div>
  )
}

function FunnelBar({ label, percent }: { label: string; percent: number }) {
  const rounded = Math.round(percent)
  return (
    <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>
      <span className="w-20 text-right">{label}</span>
      <div className="flex-1 overflow-hidden rounded-full" style={{ background: 'var(--vc-black-soft)', height: 6 }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${rounded}%`,
            background: rounded > 50 ? 'var(--vc-lime-main)' : 'var(--vc-warning)',
          }}
        />
      </div>
      <span className="w-10 font-mono">{rounded}%</span>
    </div>
  )
}

function MiniStat({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="rounded-lg p-2 text-center" style={{ background: 'var(--vc-black-soft)' }}>
      <p className="text-[10px] uppercase" style={{ color: 'var(--vc-white-dim)' }}>{label}</p>
      <p className="mt-1 font-mono text-sm font-bold" style={{ color: ok ? 'var(--vc-lime-main)' : 'var(--vc-warning)' }}>
        {value}
      </p>
    </div>
  )
}
