'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Calculator, Save, RotateCcw, AlertTriangle,
  Package, Truck, Megaphone, ClipboardList, CreditCard,
  Receipt, ChevronDown, Lightbulb, BarChart3, ArrowRight,
  Globe, ShieldCheck, RefreshCw, Info,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import {
  PRICING_CONFIG, isConfigOutdated,
  EXCHANGE_RATES, convertToAll, formatCurrency,
  COUNTRY_LIST,
} from '@/lib/pricing/constants'
import type { CountryCode } from '@/lib/pricing/constants'
import { calculateSimple, calculateSimulator } from '@/lib/pricing/calculator'
import { CountryFlag } from '@/components/shared/CountryFlag'

type Tab = 'simple' | 'simulator'

// ── Valores por defecto por país (en moneda local) ──────
const DEFAULTS: Record<CountryCode, { base: number; sale: number; product: number; step: number }> = {
  CO: { base: 45_000, sale: 95_000, product: 35_000, step: 1_000 },
  EC: { base: 15, sale: 35, product: 12, step: 1 },
  GT: { base: 120, sale: 280, product: 90, step: 5 },
  CL: { base: 12_000, sale: 28_000, product: 9_000, step: 500 },
}

export default function CalculadoraPage() {
  const [tab, setTab] = useState<Tab>('simple')
  const [country, setCountry] = useState<CountryCode>('CO')
  const config = PRICING_CONFIG[country]
  const outdated = isConfigOutdated(country)

  return (
    <>
      <CommunityTopbar
        title="Calculadora de precios"
        subtitle="Dropshipping multi-país · Cálculos en tiempo real"
      />
      <div className="flex-1 p-4 md:p-6">
        {/* ── Selector de país + indicador de confianza ────── */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CountrySelector country={country} onChange={setCountry} />
          <TrustBadge config={config} />
        </div>

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
              Verifica si hay cambios en impuestos o comisiones de tu país.
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl p-1" style={{ background: 'var(--vc-black-mid)' }}>
          <TabButton active={tab === 'simple'} onClick={() => setTab('simple')} icon={<Calculator size={16} />} label="Calculadora" sublabel="Precio + margen" />
          <TabButton active={tab === 'simulator'} onClick={() => setTab('simulator')} icon={<BarChart3 size={16} />} label="Simulador" sublabel="Operación completa" />
        </div>

        {tab === 'simple' ? (
          <SimpleTab country={country} />
        ) : (
          <SimulatorTab country={country} />
        )}
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════
// SELECTOR DE PAÍS
// ═══════════════════════════════════════════════════════════

function CountrySelector({ country, onChange }: { country: CountryCode; onChange: (c: CountryCode) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Globe size={16} style={{ color: 'var(--vc-lime-main)' }} />
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-heading)' }}>
        Mercado:
      </span>
      <div className="flex gap-1">
        {COUNTRY_LIST.map((c) => (
          <button
            key={c.code}
            onClick={() => onChange(c.code)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all"
            style={{
              background: country === c.code ? 'rgba(198,255,60,0.12)' : 'var(--vc-black-soft)',
              border: country === c.code ? '1px solid rgba(198,255,60,0.4)' : '1px solid var(--vc-gray-dark)',
              color: country === c.code ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)',
              boxShadow: country === c.code ? '0 0 12px rgba(198,255,60,0.1)' : 'none',
              fontFamily: 'var(--font-heading)',
            }}
          >
            <CountryFlag country={c.code} size={18} />
            <span>{c.code}</span>
            <span className="hidden sm:inline" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem' }}>
              {c.currency}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// BADGE DE CONFIANZA
// ═══════════════════════════════════════════════════════════

function TrustBadge({ config }: { config: typeof PRICING_CONFIG.CO }) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg px-3 py-2"
      style={{ background: 'rgba(198,255,60,0.05)', border: '1px solid rgba(198,255,60,0.12)' }}
    >
      <ShieldCheck size={14} style={{ color: 'var(--vc-lime-main)' }} />
      <span className="text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>
        {config.taxName} {config.name}: <strong style={{ color: 'var(--vc-white-soft)' }}>{config.taxRate * 100}%</strong>
        {' · '}Tasas: <strong style={{ color: 'var(--vc-white-soft)' }}>{EXCHANGE_RATES.updatedAt}</strong>
        {' · '}{EXCHANGE_RATES.source.split('—')[0].trim()}
      </span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// PANEL DE CONVERSIÓN MULTI-MONEDA
// ═══════════════════════════════════════════════════════════

function CurrencyConversion({ amount, fromCurrency, label }: { amount: number; fromCurrency: string; label: string }) {
  const conversions = useMemo(() => convertToAll(amount, fromCurrency), [amount, fromCurrency])

  const currencies = ['COP', 'USD', 'GTQ', 'CLP'].filter((c) => c !== fromCurrency)

  return (
    <div
      className="mt-4 rounded-lg p-3"
      style={{ background: 'rgba(60, 198, 255, 0.04)', border: '1px solid rgba(60, 198, 255, 0.12)' }}
    >
      <div className="mb-2 flex items-center gap-2">
        <RefreshCw size={12} style={{ color: 'var(--vc-info)' }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--vc-info)', fontFamily: 'var(--font-heading)' }}>
          {label} en otros mercados
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {currencies.map((cur) => {
          const code = Object.entries(PRICING_CONFIG).find(([, v]) => v.currency === cur)?.[0] as CountryCode | undefined
          return (
            <div key={cur} className="rounded-md p-2 text-center" style={{ background: 'var(--vc-black-soft)' }}>
              <div className="mb-1 flex items-center justify-center gap-1">
                {code && <CountryFlag country={code} size={14} />}
                <span className="text-[10px] font-bold" style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-mono)' }}>{cur}</span>
              </div>
              <p className="font-mono text-xs font-bold" style={{ color: 'var(--vc-white-soft)' }}>
                {formatCurrency(conversions[cur], cur)}
              </p>
            </div>
          )
        })}
      </div>
      <p className="mt-2 flex items-center gap-1 text-[9px]" style={{ color: 'var(--vc-gray-mid)' }}>
        <Info size={10} />
        Tasas referenciales al {EXCHANGE_RATES.updatedAt} · No incluyen comisiones bancarias
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// TAB 1: CALCULADORA SIMPLE
// ═══════════════════════════════════════════════════════════

function SimpleTab({ country }: { country: CountryCode }) {
  const config = PRICING_CONFIG[country]
  const def = DEFAULTS[country]

  const [base, setBase] = useState(def.base)
  const [margin, setMargin] = useState(60)
  const [shipping, setShipping] = useState(config.shippingBase)
  const [gatewayIdx, setGatewayIdx] = useState(0)

  // Resetear valores al cambiar de país
  const prevCountry = usePrevious(country)
  if (prevCountry && prevCountry !== country) {
    // Resets se hacen en el render para sincronizar con el país
    setTimeout(() => {
      setBase(def.base)
      setShipping(config.shippingBase)
      setGatewayIdx(0)
    }, 0)
  }

  const gateway = config.gateways[gatewayIdx] || config.gateways[0]

  const result = useMemo(
    () => calculateSimple({ basePrice: base, marginPercent: margin, shippingCost: shipping, gateway, taxRate: config.taxRate }),
    [base, margin, shipping, gateway, config.taxRate]
  )

  const reset = useCallback(() => {
    setBase(def.base)
    setMargin(60)
    setShipping(config.shippingBase)
    setGatewayIdx(0)
  }, [def.base, config.shippingBase])

  const fmt = (n: number) => formatCurrency(n, config.currency)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      {/* Inputs */}
      <div className="vc-card space-y-5">
        <SectionHeader icon={<Calculator size={20} />} title="Configura tu venta" subtitle={`Valores en ${config.currency} · ${config.name}`} />

        <NumberField label={`Precio base Vitalcom (${config.currency})`} value={base} onChange={setBase} step={def.step} symbol={config.currencySymbol} />

        <div>
          <label className="label-sm mb-2 flex items-center justify-between">
            Margen deseado
            <span className="font-mono text-base" style={{ color: 'var(--vc-lime-main)' }}>{margin}%</span>
          </label>
          <input type="range" min={10} max={150} step={5} value={margin} onChange={(e) => setMargin(parseInt(e.target.value))} className="w-full accent-[--vc-lime-main]" />
          <div className="mt-1 flex justify-between text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>
            <span>10%</span><span>80%</span><span>150%</span>
          </div>
        </div>

        <NumberField label={`Costo de envío (${config.currency})`} value={shipping} onChange={setShipping} step={def.step} symbol={config.currencySymbol} />

        <GatewaySelect gateways={config.gateways} value={gatewayIdx} onChange={setGatewayIdx} symbol={config.currencySymbol} />

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

        <div className="space-y-2 text-sm">
          <CostRow label="Precio base" value={fmt(base)} />
          <CostRow label={`Margen (${margin}%)`} value={`+ ${fmt(result.marginValue)}`} color="var(--vc-lime-main)" />
          <CostRow label="Subtotal" value={fmt(result.subtotal)} />
          <CostRow label={`${config.taxName} ${config.name} (${config.taxRate * 100}%)`} value={`- ${fmt(result.tax)}`} color="var(--vc-error)" />
          <CostRow
            label={`Comisión ${gateway.name}${gateway.rate > 0 ? ` (${(gateway.rate * 100).toFixed(2)}%${gateway.fixed > 0 ? ` + ${config.currencySymbol}${gateway.fixed}` : ''})` : ''}`}
            value={result.gatewayFee > 0 ? `- ${fmt(result.gatewayFee)}` : `${config.currencySymbol} 0`}
            color={result.gatewayFee > 0 ? 'var(--vc-error)' : 'var(--vc-lime-main)'}
          />
          <CostRow label="Envío" value={`- ${fmt(result.shipping)}`} color="var(--vc-error)" />
          <div className="mt-3 flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--vc-gray-dark)' }}>
            <span className="label-sm">Total cliente</span>
            <span className="font-mono text-base font-bold" style={{ color: 'var(--vc-lime-main)' }}>{fmt(result.finalPrice)}</span>
          </div>
        </div>

        {/* Conversión multi-moneda */}
        <CurrencyConversion amount={result.finalPrice} fromCurrency={config.currency} label="Precio final" />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// TAB 2: SIMULADOR COMPLETO (OPTIMUX)
// ═══════════════════════════════════════════════════════════

function SimulatorTab({ country }: { country: CountryCode }) {
  const config = PRICING_CONFIG[country]
  const def = DEFAULTS[country]

  const [salePrice, setSalePrice] = useState(def.sale)
  const [productCost, setProductCost] = useState(def.product)
  const [orders, setOrders] = useState(100)
  const [dispatchRate, setDispatchRate] = useState(config.avgDispatchRate)
  const [returnRate, setReturnRate] = useState(config.avgReturnRate)
  const [freight, setFreight] = useState(config.avgFreight)
  const [admin, setAdmin] = useState(config.avgAdmin)
  const [cpa, setCpa] = useState(config.avgCPA)
  const [adPercent, setAdPercent] = useState(10)
  const [expectedMargin, setExpectedMargin] = useState(20)
  const [gatewayIdx, setGatewayIdx] = useState(0)

  const prevCountry = usePrevious(country)
  if (prevCountry && prevCountry !== country) {
    setTimeout(() => {
      setSalePrice(def.sale)
      setProductCost(def.product)
      setDispatchRate(config.avgDispatchRate)
      setReturnRate(config.avgReturnRate)
      setFreight(config.avgFreight)
      setAdmin(config.avgAdmin)
      setCpa(config.avgCPA)
      setGatewayIdx(0)
    }, 0)
  }

  const gateway = config.gateways[gatewayIdx] || config.gateways[0]

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
    setSalePrice(def.sale)
    setProductCost(def.product)
    setOrders(100)
    setDispatchRate(config.avgDispatchRate)
    setReturnRate(config.avgReturnRate)
    setFreight(config.avgFreight)
    setAdmin(config.avgAdmin)
    setCpa(config.avgCPA)
    setAdPercent(10)
    setExpectedMargin(20)
    setGatewayIdx(0)
  }, [config, def])

  const fmt = (n: number) => formatCurrency(n, config.currency)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      {/* Inputs */}
      <div className="space-y-4">
        <div className="vc-card space-y-4">
          <SectionHeader icon={<Package size={18} />} title="Producto y precio" subtitle={`En ${config.currency} · ${config.name}`} />
          <NumberField label={`Precio de venta (${config.currency})`} value={salePrice} onChange={setSalePrice} step={def.step} symbol={config.currencySymbol} />
          <NumberField label={`Costo del producto (${config.currency})`} value={productCost} onChange={setProductCost} step={def.step} symbol={config.currencySymbol} />
          <NumberField label="Pedidos facturados" value={orders} onChange={setOrders} step={10} symbol="#" />
        </div>

        <div className="vc-card space-y-4">
          <SectionHeader icon={<Truck size={18} />} title="Tasas operativas" subtitle="Despacho y devoluciones" />
          <PercentSlider label="Tasa de despacho" value={dispatchRate} onChange={setDispatchRate} min={30} max={100} hint="% que se despachan" />
          <PercentSlider label="Tasa de devolución" value={returnRate} onChange={setReturnRate} min={0} max={50} hint="% que vuelven" />
        </div>

        <div className="vc-card space-y-4">
          <SectionHeader icon={<ClipboardList size={18} />} title="Costos por pedido" subtitle={`Flete, admin, pasarela · ${config.currency}`} />
          <NumberField label={`Flete promedio (${config.currency})`} value={freight} onChange={setFreight} step={def.step} symbol={config.currencySymbol} />
          <NumberField label={`Administrativos (${config.currency})`} value={admin} onChange={setAdmin} step={def.step} symbol={config.currencySymbol} />
          <GatewaySelect gateways={config.gateways} value={gatewayIdx} onChange={setGatewayIdx} symbol={config.currencySymbol} />
        </div>

        <div className="vc-card space-y-4">
          <SectionHeader icon={<Megaphone size={18} />} title="Publicidad" subtitle="CPA o porcentaje" />
          <NumberField label={`CPA estimado (${config.currency})`} value={cpa} onChange={setCpa} step={def.step} symbol={config.currencySymbol} />
          <PercentSlider label="% publicidad sobre precio" value={adPercent} onChange={setAdPercent} min={0} max={40} hint="Si CPA = 0" />
          <PercentSlider label="Utilidad esperada" value={expectedMargin} onChange={setExpectedMargin} min={5} max={50} hint="Tu meta" />
        </div>

        <div className="flex gap-2">
          <button onClick={reset} className="btn-secondary flex flex-1 items-center justify-center gap-2">
            <RotateCcw size={14} /> Reiniciar
          </button>
          <button className="vc-btn-primary flex flex-1 items-center justify-center gap-2">
            <Save size={14} /> Guardar
          </button>
        </div>
      </div>

      {/* Resultados */}
      <div className="space-y-4">
        <div className="vc-card">
          <div className="hero-result">
            <p className="label-mono mb-1">Ganancia neta del período</p>
            <p className="text-4xl font-black" style={{ fontFamily: 'var(--font-display)', color: result.profit >= 0 ? 'var(--vc-lime-main)' : 'var(--vc-error)' }}>
              {fmt(result.profit)}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <MiniStat label="Utilidad neta" value={`${result.profitPercent}%`} ok={result.meetsExpectation} />
              <MiniStat label="Por pedido" value={fmt(result.profitPerOrder)} ok={result.profitPerOrder > 0} />
              <MiniStat label="ROAS" value={`${result.roas}x`} ok={result.roas >= 2} />
            </div>
          </div>

          {/* Conversión multi-moneda de la ganancia */}
          <CurrencyConversion amount={result.profit} fromCurrency={config.currency} label="Ganancia" />
        </div>

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
          <div className="mt-4 space-y-1">
            <FunnelBar label="Facturado" percent={100} />
            <FunnelBar label="Despachado" percent={dispatchRate} />
            <FunnelBar label="Entregado" percent={orders > 0 ? (result.orders.delivered.orders / orders) * 100 : 0} />
          </div>
        </div>

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
            <CostRow label="💳 Comisión Pasarela" value={fmt(result.costs.gatewayFee)} color={result.costs.gatewayFee > 0 ? 'var(--vc-error)' : 'var(--vc-lime-main)'} />
            <CostRow label={`🏛️ ${config.taxName} (${config.taxRate * 100}%)`} value={fmt(result.costs.taxCost)} color="var(--vc-error)" />
            <div className="mt-3 flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--vc-gray-dark)' }}>
              <span className="label-sm">Total costos</span>
              <span className="font-mono text-base font-bold" style={{ color: 'var(--vc-error)' }}>{fmt(result.costs.totalCosts)}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="label-sm">Ingresos entregados</span>
              <span className="font-mono text-base font-bold" style={{ color: 'var(--vc-white-soft)' }}>{fmt(result.orders.delivered.value)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg p-3" style={{ background: result.profit >= 0 ? 'rgba(198,255,60,0.08)' : 'rgba(255,71,87,0.08)' }}>
              <span className="text-sm font-bold" style={{ color: 'var(--vc-white)', fontFamily: 'var(--font-heading)' }}>🌱 GANANCIA NETA</span>
              <span className="font-mono text-lg font-black" style={{ color: result.profit >= 0 ? 'var(--vc-lime-main)' : 'var(--vc-error)' }}>{fmt(result.profit)}</span>
            </div>
          </div>
        </div>

        {result.suggestions.length > 0 && (
          <div className="vc-card">
            <h3 className="heading-sm mb-3 flex items-center gap-2">
              <Lightbulb size={16} color="var(--vc-warning)" /> Análisis y sugerencias
            </h3>
            <div className="space-y-2">
              {result.suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg p-3 text-sm" style={{ background: 'rgba(255, 184, 0, 0.06)', border: '1px solid rgba(255, 184, 0, 0.15)', color: 'var(--vc-white-soft)' }}>
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

/** Hook para trackear el valor anterior de un estado */
function usePrevious<T>(value: T): T | undefined {
  const [prev, setPrev] = useState<T | undefined>(undefined)
  const [current, setCurrent] = useState(value)
  if (value !== current) {
    setPrev(current)
    setCurrent(value)
  }
  return prev
}

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
        <div className="text-[10px] font-normal" style={{ color: active ? 'var(--vc-lime-glow)' : 'var(--vc-gray-mid)' }}>{sublabel}</div>
      </div>
    </button>
  )
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(198,255,60,0.12)', border: '1px solid rgba(198,255,60,0.3)' }}>
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
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: 'var(--vc-gray-mid)' }}>{symbol}</span>
        )}
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full rounded-lg py-3 text-base font-bold outline-none"
          style={{ paddingLeft: symbol ? '2rem' : '1rem', paddingRight: '1rem', background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)', fontFamily: 'var(--font-mono)' }}
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
        <span>{label}{hint && <span className="ml-1 font-normal" style={{ color: 'var(--vc-gray-mid)' }}>({hint})</span>}</span>
        <span className="font-mono text-base" style={{ color: 'var(--vc-lime-main)' }}>{value}%</span>
      </label>
      <input type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="w-full accent-[--vc-lime-main]" />
    </div>
  )
}

function GatewaySelect({ gateways, value, onChange, symbol }: {
  gateways: { name: string; rate: number; fixed: number }[]; value: number; onChange: (v: number) => void; symbol: string
}) {
  return (
    <div>
      <label className="label-sm mb-2 block">Pasarela de pago</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full appearance-none rounded-lg px-4 py-3 pr-10 text-sm font-medium outline-none"
          style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
        >
          {gateways.map((gw, i) => (
            <option key={gw.name} value={i}>
              {gw.name}{gw.rate > 0 ? ` — ${(gw.rate * 100).toFixed(2)}%${gw.fixed > 0 ? ` + ${symbol}${gw.fixed.toLocaleString('es-CO')}` : ''}` : ''}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--vc-white-dim)' }} />
      </div>
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
    <div className="flex items-center gap-3 rounded-lg p-3 text-sm" style={{
      background: highlight ? 'rgba(198,255,60,0.06)' : negative ? 'rgba(255,71,87,0.04)' : 'var(--vc-black-soft)',
      border: `1px solid ${highlight ? 'rgba(198,255,60,0.2)' : negative ? 'rgba(255,71,87,0.15)' : 'var(--vc-gray-dark)'}`,
    }}>
      <span className="text-lg">{emoji}</span>
      <span className="flex-1 font-medium" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>{label}</span>
      <span className="font-mono text-xs" style={{ color: 'var(--vc-white-dim)' }}>{orders} ped.</span>
      <span className="min-w-[100px] text-right font-mono text-sm font-bold" style={{ color: highlight ? 'var(--vc-lime-main)' : negative ? 'var(--vc-error)' : 'var(--vc-white-soft)' }}>{value}</span>
    </div>
  )
}

function FunnelBar({ label, percent }: { label: string; percent: number }) {
  const rounded = Math.round(percent)
  return (
    <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>
      <span className="w-20 text-right">{label}</span>
      <div className="flex-1 overflow-hidden rounded-full" style={{ background: 'var(--vc-black-soft)', height: 6 }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${rounded}%`, background: rounded > 50 ? 'var(--vc-lime-main)' : 'var(--vc-warning)' }} />
      </div>
      <span className="w-10 font-mono">{rounded}%</span>
    </div>
  )
}

function MiniStat({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="rounded-lg p-2 text-center" style={{ background: 'var(--vc-black-soft)' }}>
      <p className="text-[10px] uppercase" style={{ color: 'var(--vc-white-dim)' }}>{label}</p>
      <p className="mt-1 font-mono text-sm font-bold" style={{ color: ok ? 'var(--vc-lime-main)' : 'var(--vc-warning)' }}>{value}</p>
    </div>
  )
}
