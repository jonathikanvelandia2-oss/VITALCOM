import { SHOPIFY_API_VERSION } from './scopes'
import { isValidShopDomain } from './hmac'
import { decryptToken } from './crypto'

// ── Cliente REST mínimo para Shopify Admin API ─────────
// Sin SDK externo: usamos fetch nativo. Rate limit: 2 req/seg en plan básico.
// Si se necesita GraphQL, extender con graphqlRequest() en el futuro.

export class ShopifyClient {
  constructor(
    private shop: string,
    private accessToken: string
  ) {
    if (!isValidShopDomain(shop)) throw new Error('SHOPIFY_INVALID_SHOP')
    if (!accessToken) throw new Error('SHOPIFY_MISSING_TOKEN')
  }

  /** Factoría segura: recibe el ciphertext de BD y lo descifra. */
  static fromStoredToken(shop: string, encryptedToken: string | null): ShopifyClient {
    if (!encryptedToken) throw new Error('SHOPIFY_NO_TOKEN_STORED')
    const plain = decryptToken(encryptedToken)
    return new ShopifyClient(shop, plain)
  }

  private baseUrl(): string {
    return `https://${this.shop}/admin/api/${SHOPIFY_API_VERSION}`
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown
  ): Promise<T> {
    // Timeout manual para evitar requests colgados que bloquean la
    // función serverless. 15s es suficiente para Shopify incluso bajo carga.
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15_000)

    try {
      const res = await fetch(`${this.baseUrl()}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Shopify-Access-Token': this.accessToken,
        },
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
        signal: controller.signal,
      })

      if (res.status === 429) {
        throw new Error('SHOPIFY_RATE_LIMITED')
      }

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`SHOPIFY_${method}_FAILED: ${res.status} ${text.slice(0, 200)}`)
      }

      if (res.status === 204) return {} as T
      return (await res.json()) as T
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('SHOPIFY_TIMEOUT')
      }
      throw err
    } finally {
      clearTimeout(timeoutId)
    }
  }

  // ── Helpers de alto nivel ─────────────────────────────

  async getShop(): Promise<ShopifyShopInfo> {
    const { shop } = await this.request<{ shop: ShopifyShopInfo }>('GET', '/shop.json')
    return shop
  }

  async listProducts(limit = 50): Promise<ShopifyProduct[]> {
    const { products } = await this.request<{ products: ShopifyProduct[] }>(
      'GET',
      `/products.json?limit=${limit}`
    )
    return products
  }

  async createProduct(input: ShopifyProductInput): Promise<ShopifyProduct> {
    const { product } = await this.request<{ product: ShopifyProduct }>('POST', '/products.json', {
      product: input,
    })
    return product
  }

  async updateProduct(id: string, input: Partial<ShopifyProductInput>): Promise<ShopifyProduct> {
    const { product } = await this.request<{ product: ShopifyProduct }>(
      'PUT',
      `/products/${id}.json`,
      { product: input }
    )
    return product
  }

  async registerWebhook(topic: string, address: string): Promise<ShopifyWebhook> {
    const { webhook } = await this.request<{ webhook: ShopifyWebhook }>(
      'POST',
      '/webhooks.json',
      {
        webhook: { topic, address, format: 'json' },
      }
    )
    return webhook
  }

  async listWebhooks(): Promise<ShopifyWebhook[]> {
    const { webhooks } = await this.request<{ webhooks: ShopifyWebhook[] }>(
      'GET',
      '/webhooks.json'
    )
    return webhooks
  }
}

// ── Tipos mínimos ──────────────────────────────────────
// Shopify devuelve mucho más; aquí solo lo que usamos.

export type ShopifyShopInfo = {
  id: number
  name: string
  email: string
  domain: string
  myshopify_domain: string
  currency: string
  country_code: string
  plan_name: string
  plan_display_name: string
  created_at: string
}

export type ShopifyVariantInput = {
  price: string
  sku?: string
  inventory_management?: string
  inventory_quantity?: number
  weight?: number
  weight_unit?: 'g' | 'kg' | 'lb' | 'oz'
}

export type ShopifyVariant = ShopifyVariantInput & {
  id: number
  product_id: number
}

export type ShopifyProductInput = {
  title: string
  body_html?: string
  vendor?: string
  product_type?: string
  tags?: string
  status?: 'active' | 'draft' | 'archived'
  images?: { src: string }[]
  variants?: ShopifyVariantInput[]
}

export type ShopifyProduct = Omit<ShopifyProductInput, 'variants'> & {
  id: number
  handle: string
  created_at: string
  updated_at: string
  variants: ShopifyVariant[]
}

export type ShopifyWebhook = {
  id: number
  topic: string
  address: string
  format: string
  created_at: string
  updated_at: string
}
