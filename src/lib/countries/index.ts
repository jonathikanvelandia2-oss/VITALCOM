// Configuración de los 4 países activos de Vitalcom
// Toda lógica de stock, pedidos, pagos y envíos pasa por aquí

export type CountryCode = 'CO' | 'EC' | 'GT' | 'CL'

export interface CountryConfig {
  code: CountryCode
  name: string
  currency: string
  currencySymbol: string
  flag: string
  phonePrefix: string
  defaultCarriers: string[]
  paymentMethods: string[]
  taxRate: number
  shippingBaseCost: number
  fulfillmentPartner: string
}

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  CO: {
    code: 'CO',
    name: 'Colombia',
    currency: 'COP',
    currencySymbol: '$',
    flag: '🇨🇴',
    phonePrefix: '+57',
    defaultCarriers: ['Servientrega', 'Coordinadora', 'Interrapidísimo'],
    paymentMethods: ['Wompi', 'PSE', 'Nequi', 'Daviplata', 'MercadoPago'],
    taxRate: 0.19,
    shippingBaseCost: 12000,
    fulfillmentPartner: 'Dropi',
  },
  EC: {
    code: 'EC',
    name: 'Ecuador',
    currency: 'USD',
    currencySymbol: '$',
    flag: '🇪🇨',
    phonePrefix: '+593',
    defaultCarriers: ['Servientrega EC', 'Laar Courier'],
    paymentMethods: ['MercadoPago', 'PayPhone', 'Datafast'],
    taxRate: 0.12,
    shippingBaseCost: 4,
    fulfillmentPartner: 'Dropi',
  },
  GT: {
    code: 'GT',
    name: 'Guatemala',
    currency: 'GTQ',
    currencySymbol: 'Q',
    flag: '🇬🇹',
    phonePrefix: '+502',
    defaultCarriers: ['Cargo Expreso', 'Guatex', 'Forza'],
    paymentMethods: ['Recurrente', 'Visanet', 'Transferencia'],
    taxRate: 0.12,
    shippingBaseCost: 35,
    fulfillmentPartner: 'Dropi',
  },
  CL: {
    code: 'CL',
    name: 'Chile',
    currency: 'CLP',
    currencySymbol: '$',
    flag: '🇨🇱',
    phonePrefix: '+56',
    defaultCarriers: ['Chilexpress', 'Starken', 'Correos Chile'],
    paymentMethods: ['Webpay', 'MercadoPago', 'Khipu'],
    taxRate: 0.19,
    shippingBaseCost: 3500,
    fulfillmentPartner: 'Dropi',
  },
}

export const COUNTRY_LIST = Object.values(COUNTRIES)
