// V34 — Inline markdown parser (safe-by-design)
// ═══════════════════════════════════════════════════════════
// Soporta un subset minimal para mensajes del SoporteIA y similares.
// Diseño "escape-first": toda entrada se escapa antes de aplicar
// sustituciones, por lo que el output NUNCA puede ejecutar HTML
// que venga del usuario.
//
// Soporta:
//   **texto**  → <strong>
//   `código`   → <code>
//   /ruta      → <a href="/ruta"> (solo paths internos)
//
// NO soporta:
//   URLs externas (evita tabnabbing y protocolos peligrosos)
//   HTML crudo, tags, atributos, eventos

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => HTML_ESCAPE_MAP[c]!)
}

const BOLD_RE = /\*\*([^*\n]{1,200})\*\*/g
const CODE_RE = /`([^`\n]{1,200})`/g
const INTERNAL_PATH_RE = /(^|\s)(\/[a-z][a-z0-9\-]{0,40}(?:\/[a-z0-9\-]{1,40}){0,5})\b/g

export interface InlineMarkdownOptions {
  /** Estilos inline aplicados a strong/code/a. Null para solo semántica. */
  style?: {
    strong?: string
    code?: string
    link?: string
  }
}

export function formatInlineMarkdown(
  text: string,
  opts: InlineMarkdownOptions = {},
): string {
  if (!text) return ''

  const clipped = text.length > 10_000 ? text.slice(0, 10_000) + '…' : text
  const escaped = escapeHtml(clipped)

  const strongStyle = opts.style?.strong ?? ''
  const codeStyle = opts.style?.code ?? ''
  const linkStyle = opts.style?.link ?? ''

  return escaped
    .replace(
      BOLD_RE,
      strongStyle ? `<strong style="${strongStyle}">$1</strong>` : '<strong>$1</strong>',
    )
    .replace(
      CODE_RE,
      codeStyle ? `<code style="${codeStyle}">$1</code>` : '<code>$1</code>',
    )
    .replace(
      INTERNAL_PATH_RE,
      linkStyle ? `$1<a href="$2" style="${linkStyle}">$2</a>` : `$1<a href="$2">$2</a>`,
    )
}
