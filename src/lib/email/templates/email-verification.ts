import { renderBaseLayout, heading, paragraph, muted, button, escapeHtml } from './base'

// ── Email de verificación de correo ────────────────────
// Opcional hoy: registro ya retorna 201 sin verificación obligatoria,
// pero el template queda listo para activar doble opt-in.

export type EmailVerificationInput = {
  name: string
  verifyUrl: string
  expiresInMinutes: number
}

export function renderEmailVerification({ name, verifyUrl, expiresInMinutes }: EmailVerificationInput) {
  const firstName = (name || 'Vitalcommer').split(' ')[0]

  const content = `
${heading('Confirma tu correo')}
${paragraph(`Hola ${escapeHtml(firstName)}, solo nos falta un paso: confirmar que este correo es tuyo.`)}
${paragraph(`El enlace expira en ${expiresInMinutes} minutos.`)}

${button('Confirmar mi correo', verifyUrl)}

${muted('Si no creaste esta cuenta, ignora este correo y no pasará nada.')}
`

  return {
    subject: 'Confirma tu correo · Vitalcom',
    html: renderBaseLayout({
      title: 'Confirma tu correo',
      preheader: 'Un clic y activas tu cuenta Vitalcom.',
      content,
    }),
    text: `Hola ${firstName},\n\nConfirma tu correo para activar tu cuenta Vitalcom:\n${verifyUrl}\n\n(Enlace válido ${expiresInMinutes} minutos)\n\n— Vitalcom`,
  }
}
