import { renderBaseLayout, heading, paragraph, muted, button, divider, escapeHtml } from './base'

// ── Email de confirmación de pedido ────────────────────
// Se envía al cliente final tras POST /api/orders exitoso.

export type OrderConfirmationInput = {
  orderNumber: string
  customerName: string
  country: string
  items: { name: string; quantity: number; total: number }[]
  subtotal: number
  shipping: number
  total: number
  currency?: string
  trackingUrl?: string
}

const CURRENCY_BY_COUNTRY: Record<string, string> = {
  CO: 'COP',
  EC: 'USD',
  GT: 'GTQ',
  CL: 'CLP',
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(0)}`
  }
}

export function renderOrderConfirmation(input: OrderConfirmationInput) {
  const currency = input.currency || CURRENCY_BY_COUNTRY[input.country] || 'COP'
  const firstName = (input.customerName || 'Cliente').split(' ')[0]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vitalcom.vercel.app'
  const trackingHref = input.trackingUrl || `${appUrl}/rastreo/${encodeURIComponent(input.orderNumber)}`

  const itemsRows = input.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid rgba(198,255,60,0.1);font-size:14px;color:#F5F5F5;">
          ${escapeHtml(item.name)}
          <br><span style="font-size:12px;color:#B8B8B8;">× ${item.quantity}</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid rgba(198,255,60,0.1);font-size:14px;color:#F5F5F5;text-align:right;font-variant-numeric:tabular-nums;">
          ${escapeHtml(formatMoney(item.total, currency))}
        </td>
      </tr>`
    )
    .join('')

  const content = `
${heading(`¡Gracias por tu compra, ${escapeHtml(firstName)}!`)}
${paragraph(`Recibimos tu pedido <strong>${escapeHtml(input.orderNumber)}</strong>. Estamos preparándolo y te avisaremos cuando salga a despacho.`)}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 8px 0;">
  <thead>
    <tr>
      <th style="padding:10px 0;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#C6FF3C;text-transform:uppercase;border-bottom:1px solid rgba(198,255,60,0.3);">Producto</th>
      <th style="padding:10px 0;text-align:right;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#C6FF3C;text-transform:uppercase;border-bottom:1px solid rgba(198,255,60,0.3);">Total</th>
    </tr>
  </thead>
  <tbody>
    ${itemsRows}
  </tbody>
  <tfoot>
    <tr>
      <td style="padding:14px 0 6px 0;font-size:13px;color:#B8B8B8;">Subtotal</td>
      <td style="padding:14px 0 6px 0;font-size:13px;color:#B8B8B8;text-align:right;font-variant-numeric:tabular-nums;">${escapeHtml(formatMoney(input.subtotal, currency))}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;font-size:13px;color:#B8B8B8;">Envío</td>
      <td style="padding:6px 0;font-size:13px;color:#B8B8B8;text-align:right;font-variant-numeric:tabular-nums;">${escapeHtml(formatMoney(input.shipping, currency))}</td>
    </tr>
    <tr>
      <td style="padding:12px 0 0 0;font-size:16px;font-weight:700;color:#F5F5F5;border-top:1px solid rgba(198,255,60,0.3);">Total</td>
      <td style="padding:12px 0 0 0;font-size:16px;font-weight:700;color:#C6FF3C;text-align:right;font-variant-numeric:tabular-nums;border-top:1px solid rgba(198,255,60,0.3);">${escapeHtml(formatMoney(input.total, currency))}</td>
    </tr>
  </tfoot>
</table>

${button('Seguir mi pedido', trackingHref)}

${divider()}

${muted('Si tienes dudas sobre tu pedido, responde a este correo y alguien del equipo Vitalcom te contestará.')}
`

  return {
    subject: `Pedido confirmado ${input.orderNumber} · Vitalcom`,
    html: renderBaseLayout({
      title: 'Pedido confirmado',
      preheader: `Recibimos tu pedido ${input.orderNumber}. Total ${formatMoney(input.total, currency)}.`,
      content,
      footerNote: `Guarda este correo como comprobante de tu pedido ${input.orderNumber}.`,
    }),
    text: `Hola ${firstName},\n\nRecibimos tu pedido ${input.orderNumber}.\nTotal: ${formatMoney(input.total, currency)}\n\nSigue tu pedido: ${trackingHref}\n\n— Vitalcom`,
  }
}
