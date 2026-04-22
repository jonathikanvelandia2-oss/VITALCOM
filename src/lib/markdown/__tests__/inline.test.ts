// V34 — tests del inline markdown parser (safety-critical)
import { describe, it, expect } from 'vitest'
import { escapeHtml, formatInlineMarkdown } from '../inline'

describe('escapeHtml', () => {
  it('escapa los 5 metacaracteres HTML', () => {
    expect(escapeHtml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#39;')
  })

  it('no toca texto inerte', () => {
    expect(escapeHtml('hola mundo 123')).toBe('hola mundo 123')
  })

  it('escapa scripts completos', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    )
  })
})

describe('formatInlineMarkdown — XSS safety', () => {
  it('no produce <script> crudo aunque venga en el input', () => {
    const malicious = '<script>alert("xss")</script>'
    const out = formatInlineMarkdown(malicious)
    expect(out).not.toContain('<script>')
    expect(out).toContain('&lt;script&gt;')
  })

  it('no produce tags <img> ejecutables', () => {
    const malicious = '<img src=x onerror=alert(1)>'
    const out = formatInlineMarkdown(malicious)
    // El contenido queda como entidades escapadas — el browser NO lo parsea como tag
    expect(out).not.toMatch(/<img[^&]*>/) // ningún <img real
    expect(out).toContain('&lt;img')
  })

  it('javascript: protocol dentro de path-markdown NO es interpretado', () => {
    // El regex de paths solo matchea /algo, no javascript:algo
    const evil = '/../etc/passwd javascript:alert(1)'
    const out = formatInlineMarkdown(evil)
    // No debe haber atributo href con javascript:
    expect(out).not.toMatch(/href="\s*javascript:/i)
  })

  it('atributos con comillas quedan escapados', () => {
    const crafted = '"><img src=x onerror=alert(1)>'
    const out = formatInlineMarkdown(crafted)
    expect(out).not.toContain('<img')
    expect(out).toContain('&quot;')
  })

  it('backticks NO ejecutan HTML — solo quedan en code', () => {
    const crafted = '`<script>alert(1)</script>`'
    const out = formatInlineMarkdown(crafted)
    expect(out).not.toContain('<script>')
    expect(out).toContain('<code>')
    expect(out).toContain('&lt;script&gt;')
  })

  it('bold NO permite HTML en el contenido', () => {
    const crafted = '**<img onerror=x>**'
    const out = formatInlineMarkdown(crafted)
    expect(out).not.toContain('<img')
    expect(out).toContain('<strong>&lt;img onerror=x&gt;</strong>')
  })
})

describe('formatInlineMarkdown — features', () => {
  it('render **bold**', () => {
    expect(formatInlineMarkdown('esto es **importante**'))
      .toBe('esto es <strong>importante</strong>')
  })

  it('render `code`', () => {
    expect(formatInlineMarkdown('usa `npm run build`'))
      .toBe('usa <code>npm run build</code>')
  })

  it('render /ruta interna', () => {
    const out = formatInlineMarkdown('ve a /mi-tienda')
    expect(out).toContain('<a href="/mi-tienda">/mi-tienda</a>')
  })

  it('path anidado funciona', () => {
    const out = formatInlineMarkdown('abre /admin/workflows')
    expect(out).toContain('<a href="/admin/workflows">/admin/workflows</a>')
  })

  it('path al inicio de string', () => {
    const out = formatInlineMarkdown('/feed es el muro')
    expect(out).toContain('<a href="/feed">/feed</a>')
  })

  it('mezcla bold + code + path', () => {
    const out = formatInlineMarkdown('**VITA** corre en `gpt-4o-mini` y vive en /vita')
    expect(out).toContain('<strong>VITA</strong>')
    expect(out).toContain('<code>gpt-4o-mini</code>')
    expect(out).toContain('<a href="/vita">/vita</a>')
  })

  it('aplica styles custom si se pasan', () => {
    const out = formatInlineMarkdown('**hola**', {
      style: { strong: 'color:red', code: '', link: '' },
    })
    expect(out).toBe('<strong style="color:red">hola</strong>')
  })
})

describe('formatInlineMarkdown — edge cases', () => {
  it('string vacío devuelve ""', () => {
    expect(formatInlineMarkdown('')).toBe('')
  })

  it('clipea textos enormes a 10k chars + …', () => {
    const huge = 'a'.repeat(15000)
    const out = formatInlineMarkdown(huge)
    expect(out.length).toBeLessThanOrEqual(10001)
    expect(out.endsWith('…')).toBe(true)
  })

  it('bold sin cierre no rompe el output', () => {
    const out = formatInlineMarkdown('esto **no cierra')
    expect(out).toBe('esto **no cierra')
  })

  it('code que abarca newline no matchea (regex restrictiva)', () => {
    const out = formatInlineMarkdown('`linea1\nlinea2`')
    expect(out).not.toContain('<code>')
  })

  it('path que empieza con dígito no matchea (whitelist a-z)', () => {
    const out = formatInlineMarkdown('/123 no es path')
    expect(out).not.toContain('<a href="/123"')
  })
})
