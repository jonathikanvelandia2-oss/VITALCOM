import { renderBaseLayout, heading, paragraph, muted, button, divider, escapeHtml } from './base'

// ── Email de reset de contraseña ───────────────────────
// Contiene link con token de un solo uso, válido 60 min.

export type PasswordResetInput = {
  name: string
  resetUrl: string
  expiresInMinutes: number
  requestIp?: string
}

export function renderPasswordReset({ name, resetUrl, expiresInMinutes, requestIp }: PasswordResetInput) {
  const firstName = (name || 'Vitalcommer').split(' ')[0]

  const ipLine = requestIp
    ? muted(`Solicitud registrada desde IP ${escapeHtml(requestIp)}. Si no fuiste tú, ignora este correo y tu contraseña seguirá intacta.`)
    : muted('Si no solicitaste este cambio, ignora este correo y tu contraseña seguirá intacta.')

  const content = `
${heading('Restablece tu contraseña')}
${paragraph(`Hola ${escapeHtml(firstName)}, recibimos una solicitud para restablecer tu contraseña de Vitalcom.`)}
${paragraph(`Haz clic en el botón para crear una nueva. El enlace expira en ${expiresInMinutes} minutos y solo se puede usar una vez.`)}

${button('Restablecer contraseña', resetUrl)}

${divider()}

<p style="margin:0 0 10px 0;font-size:13px;color:#B8B8B8;line-height:1.6;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
<p style="margin:0 0 16px 0;font-size:12px;color:#C6FF3C;word-break:break-all;">
  <a href="${escapeHtml(resetUrl)}" style="color:#C6FF3C;text-decoration:underline;">${escapeHtml(resetUrl)}</a>
</p>

${ipLine}
`

  return {
    subject: 'Restablece tu contraseña de Vitalcom',
    html: renderBaseLayout({
      title: 'Restablece tu contraseña',
      preheader: `Enlace seguro para crear una nueva contraseña. Válido ${expiresInMinutes} minutos.`,
      content,
      footerNote: 'Por tu seguridad, nunca compartimos tu contraseña. Si alguien más solicitó este correo en tu nombre, cambia tu contraseña de inmediato.',
    }),
    text: `Hola ${firstName},\n\nRecibimos una solicitud para restablecer tu contraseña.\n\nAbre este enlace (válido ${expiresInMinutes} min, un solo uso):\n${resetUrl}\n\nSi no fuiste tú, ignora este correo.\n\n— Vitalcom`,
  }
}
