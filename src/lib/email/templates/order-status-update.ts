import { renderBaseLayout, heading, paragraph, muted, button, divider, escapeHtml } from './base'

// ── Email de cambio de estado de pedido ────────────────
// Se envía al cliente cuando su pedido pasa a DISPATCHED,
// DELIVERED, CANCELLED o RETURNED. Copy cambia según estado.

export type OrderStatusUpdateInput = {
  orderNumber: string
  customerName: string
  status: 'DISPATCHED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED'
  trackingCode?: string | null
  carrier?: string | null
  total?: number
  country?: string
}

const STATUS_COPY: Record<OrderStatusUpdateInput['status'], { subject: string; title: string; body: string; emoji: string }> = {
  DISPATCHED: {
    subject: 'Tu pedido está en camino',
    title: 'Tu pedido salió a ruta',
    body: 'Acabamos de despachar tu pedido. En las próximas horas la transportadora lo tendrá en movimiento.',
    emoji: '🚚',
  },
  DELIVERED: {
    subject: '¡Tu pedido llegó!',
    title: 'Pedido entregado',
    body: 'Tu pedido fue entregado con éxito. Esperamos que disfrutes tus productos Vitalcom.',
    emoji: '✅',
  },
  CANCELLED: {
    subject: 'Tu pedido fue cancelado',
    title: 'Pedido cancelado',
    body: 'Tu pedido fue cancelado. Si no reconoces esta acción o necesitas ayuda, responde a este correo.',
    emoji: '⚠️',
  },
  RETURNED: {
    subject: 'Recibimos tu devolución',
    title: 'Devolución registrada',
    body: 'Registramos la devolución de tu pedido. Revisaremos el contenido y procederemos con el reembolso o reposición.',
    emoji: '↩️',
  },
}

export function renderOrderStatusUpdate(input: OrderStatusUpdateInput) {
  const copy = STATUS_COPY[input.status]
  const firstName = (input.customerName || 'Cliente').split(' ')[0]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vitalcom.vercel.app'
  const orderLink = `${appUrl}/pedidos`

  const trackingBlock = input.trackingCode
    ? `
    <div style="margin:24px 0;padding:16px;border-radius:10px;background:#0F0F0F;border:1px solid rgba(198,255,60,0.2)">
      ${muted('Número de guía')}
      <div style="font-family:'Courier New',monospace;color:#C6FF3C;font-size:18px;letter-spacing:1px;margin-top:4px">
        ${escapeHtml(input.trackingCode)}
      </div>
      ${input.carrier ? muted(`Transportadora: ${escapeHtml(input.carrier)}`) : ''}
    </div>`
    : ''

  const content = `
    ${heading(`${copy.emoji} ${copy.title}`)}
    ${paragraph(`Hola ${escapeHtml(firstName)},`)}
    ${paragraph(copy.body)}

    <div style="margin:16px 0;padding:12px 16px;border-radius:8px;background:rgba(198,255,60,0.08);border:1px solid rgba(198,255,60,0.2)">
      ${muted('Pedido')}
      <div style="font-family:'Courier New',monospace;color:#F5F5F5;font-size:14px;font-weight:bold">
        ${escapeHtml(input.orderNumber)}
      </div>
    </div>

    ${trackingBlock}

    ${divider()}

    ${button('Ver detalles del pedido', orderLink)}

    ${paragraph('Si tienes alguna duda, responde a este correo y te ayudamos.')}
  `

  return {
    subject: `${copy.subject} · ${input.orderNumber}`,
    html: renderBaseLayout({
      title: copy.subject,
      preheader: `${copy.title} · Vitalcom`,
      content,
      footerNote: 'Estás recibiendo este correo porque realizaste un pedido en Vitalcom.',
    }),
    text: `${copy.title}\n\n${copy.body}\n\nPedido: ${input.orderNumber}${input.trackingCode ? `\nGuía: ${input.trackingCode}` : ''}\n\n${orderLink}`,
  }
}
