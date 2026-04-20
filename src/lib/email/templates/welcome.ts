import { renderBaseLayout, heading, paragraph, muted, button, divider, escapeHtml } from './base'

// ── Email de bienvenida al registrarse ─────────────────
// Se envía post-creación de usuario COMMUNITY.

export type WelcomeInput = {
  name: string
}

export function renderWelcome({ name }: WelcomeInput) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vitalcom.vercel.app'
  const firstName = (name || 'Vitalcommer').split(' ')[0]

  const content = `
${heading(`Bienvenido a Vitalcom, ${escapeHtml(firstName)}`)}
${paragraph('Acabas de entrar al ecosistema de bienestar más grande de LATAM. Aquí tienes todo lo que necesitas para emprender con productos reales, comunidad activa y herramientas que solo nosotros ofrecemos.')}

${divider()}

<p style="margin:0 0 8px 0;font-size:13px;font-weight:700;letter-spacing:0.08em;color:#C6FF3C;text-transform:uppercase;">Qué puedes hacer ahora</p>
<ul style="margin:0 0 16px 0;padding-left:20px;color:#F5F5F5;font-size:15px;line-height:1.8;">
  <li>Explora el <strong>catálogo</strong> con más de 200 productos Vitalcom</li>
  <li>Usa la <strong>calculadora de precios</strong> para definir tu margen por país</li>
  <li>Conecta tu <strong>tienda Shopify</strong> y empieza a vender hoy mismo</li>
  <li>Pregúntale a <strong>VITA</strong>, tu mentor financiero IA 24/7</li>
  <li>Acumula puntos y sube de nivel en la comunidad</li>
</ul>

${button('Entrar a mi cuenta', `${appUrl}/feed`)}

${muted('Si tienes cualquier duda, respóndenos a este correo. Estamos para crecer contigo.')}
`

  return {
    subject: `Bienvenido a Vitalcom, ${firstName} 🌿`,
    html: renderBaseLayout({
      title: 'Bienvenido a Vitalcom',
      preheader: `Tu cuenta está lista. Empieza a vender productos de bienestar en LATAM.`,
      content,
      footerNote: 'Este correo confirma que tu cuenta Vitalcom está activa. Guárdalo por si necesitas referencias.',
    }),
    text: `Bienvenido a Vitalcom, ${firstName}.\n\nAcabas de entrar al ecosistema de bienestar más grande de LATAM. Entra a tu cuenta: ${appUrl}/feed\n\nSi necesitas ayuda, responde a este correo.\n\n— El equipo Vitalcom`,
  }
}
