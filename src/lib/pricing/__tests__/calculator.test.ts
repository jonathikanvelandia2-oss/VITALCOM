import { describe, it, expect } from 'vitest'
import { calculateSimple } from '../calculator'
import { PRICING_CONFIG } from '../constants'

describe('calculateSimple', () => {
  const wompiCO = PRICING_CONFIG.CO.gateways.find((g) => g.name === 'Wompi')!
  const noGatewayCO = PRICING_CONFIG.CO.gateways[0]!

  it('calcula un caso base Colombia sin pasarela ni impuestos', () => {
    const result = calculateSimple({
      basePrice: 100_000,
      marginPercent: 50,
      shippingCost: 0,
      gateway: noGatewayCO,
      taxRate: 0,
    })

    expect(result.marginValue).toBe(50_000)
    expect(result.subtotal).toBe(150_000)
    expect(result.tax).toBe(0)
    expect(result.gatewayFee).toBe(0)
    expect(result.finalPrice).toBe(150_000)
    expect(result.profit).toBe(50_000)
  })

  it('aplica IVA correctamente sobre el subtotal', () => {
    const result = calculateSimple({
      basePrice: 100_000,
      marginPercent: 50,
      shippingCost: 0,
      gateway: noGatewayCO,
      taxRate: 0.19,
    })

    expect(result.subtotal).toBe(150_000)
    expect(result.tax).toBe(28_500)
    expect(result.finalPrice).toBe(178_500)
  })

  it('resta la comisión de pasarela de la ganancia', () => {
    const result = calculateSimple({
      basePrice: 100_000,
      marginPercent: 50,
      shippingCost: 0,
      gateway: wompiCO,
      taxRate: 0,
    })

    // Subtotal 150.000 × 2.99% + 700 fijo = 4.485 + 700 = 5.185
    expect(result.gatewayFee).toBe(5_185)
    expect(result.profit).toBe(50_000 - 5_185)
  })

  it('suma el envío al precio final sin tocar la ganancia del margen', () => {
    const result = calculateSimple({
      basePrice: 100_000,
      marginPercent: 50,
      shippingCost: 12_000,
      gateway: noGatewayCO,
      taxRate: 0,
    })

    expect(result.shipping).toBe(12_000)
    expect(result.finalPrice).toBe(150_000 + 12_000)
    expect(result.profit).toBe(50_000)
  })

  it('maneja margen 0 correctamente', () => {
    const result = calculateSimple({
      basePrice: 50_000,
      marginPercent: 0,
      shippingCost: 0,
      gateway: noGatewayCO,
      taxRate: 0,
    })

    expect(result.marginValue).toBe(0)
    expect(result.subtotal).toBe(50_000)
    expect(result.profit).toBe(0)
    expect(result.profitPercent).toBe(0)
  })

  it('calcula profitPercent como fracción del finalPrice', () => {
    const result = calculateSimple({
      basePrice: 100_000,
      marginPercent: 100,
      shippingCost: 0,
      gateway: noGatewayCO,
      taxRate: 0,
    })

    // profit 100k / finalPrice 200k = 50.00%
    expect(result.profitPercent).toBe(50)
  })

  it('retorna 0% cuando finalPrice es 0', () => {
    const result = calculateSimple({
      basePrice: 0,
      marginPercent: 0,
      shippingCost: 0,
      gateway: noGatewayCO,
      taxRate: 0,
    })

    expect(result.finalPrice).toBe(0)
    expect(result.profitPercent).toBe(0)
  })
})

describe('PRICING_CONFIG integridad', () => {
  it('los 4 países están configurados', () => {
    expect(Object.keys(PRICING_CONFIG).sort()).toEqual(['CL', 'CO', 'EC', 'GT'])
  })

  it('cada país tiene al menos una pasarela', () => {
    for (const country of Object.values(PRICING_CONFIG)) {
      expect(country.gateways.length).toBeGreaterThan(0)
    }
  })

  it('tasas de impuesto están entre 0 y 0.25', () => {
    for (const country of Object.values(PRICING_CONFIG)) {
      expect(country.taxRate).toBeGreaterThanOrEqual(0)
      expect(country.taxRate).toBeLessThanOrEqual(0.25)
    }
  })

  it('tasas de despacho están entre 0 y 100', () => {
    for (const country of Object.values(PRICING_CONFIG)) {
      expect(country.avgDispatchRate).toBeGreaterThan(0)
      expect(country.avgDispatchRate).toBeLessThanOrEqual(100)
    }
  })
})
