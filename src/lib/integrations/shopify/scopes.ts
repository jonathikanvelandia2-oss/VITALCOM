// ── Shopify scopes y versión de API ────────────────────

// 2026-04 es la versión activa en el dashboard de Vitalcom platform.
// Shopify soporta versiones por 12 meses — revisar anualmente.
export const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-04'

// Permisos mínimos que Vitalcom necesita para operar una tienda dropshipper:
// - read/write_products: crear y actualizar productos Vitalcom en la tienda
// - read/write_orders: recibir pedidos y marcarlos como fulfilled
// - read_customers: ver datos del cliente final (necesario para Dropi)
// - read/write_inventory: reportar stock real desde Vitalcom
// - read/write_fulfillments: crear tracking cuando Dropi despacha
//
// NO pedimos scopes innecesarios (analytics, themes, discounts) para
// reducir fricción en la instalación y cumplir principio de mínimo privilegio.

export const SHOPIFY_SCOPES = [
  'read_products',
  'write_products',
  'read_orders',
  'write_orders',
  'read_customers',
  'read_inventory',
  'write_inventory',
  'read_fulfillments',
  'write_fulfillments',
].join(',')
