// ── Layout HTML base para emails Vitalcom ──────────────
// Dark-first con verde lima neón + tipografía segura (fallbacks).
// Inline styles: muchos clientes email ignoran <style>.
// Compatible con Gmail/Outlook/Apple Mail/iOS/Android.

export type BaseLayoutInput = {
  title: string
  preheader?: string
  content: string
  footerNote?: string
}

const BRAND_LIME = '#C6FF3C'
const BRAND_BLACK = '#0A0A0A'
const BRAND_BLACK_MID = '#141414'
const BRAND_BORDER = 'rgba(198, 255, 60, 0.2)'
const TEXT_PRIMARY = '#F5F5F5'
const TEXT_DIM = '#B8B8B8'

export function renderBaseLayout({ title, preheader, content, footerNote }: BaseLayoutInput): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vitalcom.vercel.app'
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND_BLACK};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:${TEXT_PRIMARY};">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND_BLACK};padding:32px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:${BRAND_BLACK_MID};border:1px solid ${BRAND_BORDER};border-radius:14px;overflow:hidden;">
        <tr>
          <td style="padding:28px 32px;border-bottom:1px solid ${BRAND_BORDER};background:linear-gradient(180deg,${BRAND_BLACK} 0%,${BRAND_BLACK_MID} 100%);">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="left">
                  <span style="font-size:22px;font-weight:900;letter-spacing:0.04em;color:${BRAND_LIME};text-transform:uppercase;">Vitalcom</span>
                </td>
                <td align="right">
                  <span style="font-size:10px;font-weight:600;letter-spacing:0.12em;color:${TEXT_DIM};text-transform:uppercase;">Bienestar que conecta</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;border-top:1px solid ${BRAND_BORDER};">
            ${footerNote ? `<p style="margin:0 0 12px 0;font-size:12px;color:${TEXT_DIM};line-height:1.6;">${footerNote}</p>` : ''}
            <p style="margin:0;font-size:11px;color:${TEXT_DIM};line-height:1.6;">
              © ${year} Vitalcom · <a href="${appUrl}" style="color:${BRAND_LIME};text-decoration:none;">vitalcom.co</a><br>
              Presencia en Colombia · Ecuador · Guatemala · Chile
            </p>
          </td>
        </tr>
      </table>
      <p style="margin:24px 0 0 0;font-size:10px;color:#666;text-align:center;">
        Este correo fue enviado a tu cuenta Vitalcom. Si no lo esperabas, ignóralo.
      </p>
    </td>
  </tr>
</table>
</body>
</html>`
}

// ── Componentes reutilizables ───────────────────────────

export function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr>
    <td style="border-radius:10px;background:${BRAND_LIME};">
      <a href="${escapeAttr(href)}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;letter-spacing:0.05em;color:${BRAND_BLACK};text-decoration:none;text-transform:uppercase;border-radius:10px;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`
}

export function heading(text: string): string {
  return `<h1 style="margin:0 0 16px 0;font-size:26px;font-weight:700;color:${TEXT_PRIMARY};line-height:1.25;letter-spacing:-0.01em;">${escapeHtml(text)}</h1>`
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 16px 0;font-size:15px;color:${TEXT_PRIMARY};line-height:1.65;">${escapeHtml(text)}</p>`
}

export function muted(text: string): string {
  return `<p style="margin:0 0 12px 0;font-size:13px;color:${TEXT_DIM};line-height:1.6;">${escapeHtml(text)}</p>`
}

export function codeBlock(text: string): string {
  return `<div style="margin:16px 0;padding:14px 18px;background:${BRAND_BLACK};border:1px solid ${BRAND_BORDER};border-radius:10px;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:14px;color:${BRAND_LIME};word-break:break-all;">${escapeHtml(text)}</div>`
}

export function divider(): string {
  return `<div style="height:1px;margin:24px 0;background:${BRAND_BORDER};"></div>`
}

// ── Helpers de escape ──────────────────────────────────
// CRÍTICO: usar siempre en contenido dinámico para evitar inyección HTML.

export function escapeHtml(str: string): string {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function escapeAttr(str: string): string {
  return escapeHtml(str)
}
