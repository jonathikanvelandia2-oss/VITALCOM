'use client'

import { useState, useMemo } from 'react'
import { Calculator, Save, RotateCcw } from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'

// Calculadora de precios para dropshippers — solo Colombia (fase 1)
// IVA 19% · envío base 12.000 COP · Wompi 2.99% + 700 COP
export default function CalculadoraPage() {
  const [base, setBase] = useState(45000)
  const [margin, setMargin] = useState(60)
  const [shipping, setShipping] = useState(12000)

  const result = useMemo(() => {
    const marginValue = base * (margin / 100)
    const subtotal = base + marginValue
    const tax = subtotal * 0.19
    const gateway = subtotal * 0.0299 + 700
    const finalPrice = subtotal + tax + shipping
    const profit = marginValue - gateway
    return {
      marginValue: Math.round(marginValue),
      subtotal: Math.round(subtotal),
      tax: Math.round(tax),
      gateway: Math.round(gateway),
      shipping,
      finalPrice: Math.round(finalPrice),
      profit: Math.round(profit),
    }
  }, [base, margin, shipping])

  return (
    <>
      <CommunityTopbar
        title="Calculadora de precios"
        subtitle="Para dropshippers · 🇨🇴 Colombia · COP"
      />
      <div className="flex-1 p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          {/* Inputs */}
          <div className="vc-card">
            <div className="mb-5 flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{
                  background: 'rgba(198, 255, 60, 0.12)',
                  border: '1px solid rgba(198, 255, 60, 0.3)',
                }}
              >
                <Calculator size={20} color="var(--vc-lime-main)" />
              </div>
              <div>
                <h2
                  className="text-base font-bold"
                  style={{
                    color: 'var(--vc-white-soft)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  Configura tu venta
                </h2>
                <p className="text-xs" style={{ color: 'var(--vc-white-dim)' }}>
                  Ajusta los valores y mira tu ganancia en tiempo real
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <NumberField
                label="Precio base Vitalcom (COP)"
                value={base}
                onChange={setBase}
                step={1000}
              />

              <div>
                <label
                  className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider"
                  style={{
                    color: 'var(--vc-white-dim)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  Margen deseado
                  <span
                    className="font-mono text-base"
                    style={{ color: 'var(--vc-lime-main)' }}
                  >
                    {margin}%
                  </span>
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
              </div>

              <NumberField
                label="Costo de envío (COP)"
                value={shipping}
                onChange={setShipping}
                step={1000}
              />

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setBase(45000)
                    setMargin(60)
                    setShipping(12000)
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold uppercase"
                  style={{
                    background: 'var(--vc-black-soft)',
                    border: '1px solid var(--vc-gray-dark)',
                    color: 'var(--vc-white-dim)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  <RotateCcw size={14} /> Reiniciar
                </button>
                <button className="vc-btn-primary flex flex-1 items-center justify-center gap-2">
                  <Save size={14} /> Guardar
                </button>
              </div>
            </div>
          </div>

          {/* Resultado */}
          <div className="vc-card">
            <h2
              className="mb-5 text-base font-bold"
              style={{
                color: 'var(--vc-white-soft)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Desglose y resultado
            </h2>

            <div
              className="mb-5 rounded-xl p-5 text-center"
              style={{
                background:
                  'linear-gradient(135deg, rgba(198,255,60,0.1) 0%, rgba(168,255,0,0.18) 100%)',
                border: '1px solid rgba(198, 255, 60, 0.4)',
                boxShadow: '0 0 30px var(--vc-glow-lime)',
              }}
            >
              <p
                className="mb-1 text-[10px] uppercase tracking-[0.2em]"
                style={{
                  color: 'var(--vc-white-dim)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Precio final al cliente
              </p>
              <p
                className="vc-text-gradient text-4xl font-black"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                $ {result.finalPrice.toLocaleString('es-CO')}
              </p>
              <p
                className="mt-2 text-xs"
                style={{ color: 'var(--vc-lime-main)' }}
              >
                Tu ganancia neta:{' '}
                <strong className="font-mono">
                  $ {result.profit.toLocaleString('es-CO')}
                </strong>
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <Row label="Precio base" value={base} />
              <Row label={`Margen (${margin}%)`} value={result.marginValue} positive />
              <Row label="Subtotal" value={result.subtotal} />
              <Row label="IVA Colombia (19%)" value={result.tax} negative />
              <Row label="Comisión Wompi (2.99% + $700)" value={result.gateway} negative />
              <Row label="Envío" value={result.shipping} negative />
              <div
                className="mt-3 flex items-center justify-between pt-3"
                style={{ borderTop: '1px solid var(--vc-gray-dark)' }}
              >
                <span
                  className="text-xs uppercase tracking-wider"
                  style={{
                    color: 'var(--vc-white-dim)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  Total cliente
                </span>
                <span
                  className="font-mono text-base font-bold"
                  style={{ color: 'var(--vc-lime-main)' }}
                >
                  $ {result.finalPrice.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function NumberField({
  label,
  value,
  onChange,
  step,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step: number
}) {
  return (
    <div>
      <label
        className="mb-2 block text-xs font-semibold uppercase tracking-wider"
        style={{
          color: 'var(--vc-white-dim)',
          fontFamily: 'var(--font-heading)',
        }}
      >
        {label}
      </label>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-full rounded-lg px-4 py-3 text-base font-bold outline-none"
        style={{
          background: 'var(--vc-black-soft)',
          border: '1px solid var(--vc-gray-dark)',
          color: 'var(--vc-white-soft)',
          fontFamily: 'var(--font-mono)',
        }}
      />
    </div>
  )
}

function Row({
  label,
  value,
  positive,
  negative,
}: {
  label: string
  value: number
  positive?: boolean
  negative?: boolean
}) {
  return (
    <div
      className="flex items-center justify-between text-xs"
      style={{ color: 'var(--vc-white-dim)' }}
    >
      <span>{label}</span>
      <span
        className="font-mono"
        style={{
          color: positive
            ? 'var(--vc-lime-main)'
            : negative
              ? 'var(--vc-error)'
              : 'var(--vc-white-soft)',
        }}
      >
        {negative ? '-' : positive ? '+' : ''} $ {value.toLocaleString('es-CO')}
      </span>
    </div>
  )
}
