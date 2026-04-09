import { Workflow, Plus, MessageSquare, ShoppingCart, RefreshCw, HeartHandshake } from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'

// Generador de flujos Luzitbot — plantillas + builder visual (mock)
const TEMPLATES = [
  {
    icon: MessageSquare,
    title: 'Bienvenida + cualificación',
    desc: 'Saluda al lead, pide nombre, ciudad y producto de interés. Ideal para WhatsApp.',
    uses: 312,
    category: 'ventas',
  },
  {
    icon: ShoppingCart,
    title: 'Recuperación de carritos',
    desc: 'Envía recordatorios automáticos a 2h, 24h y 72h con descuento progresivo.',
    uses: 187,
    category: 'ventas',
  },
  {
    icon: RefreshCw,
    title: 'Seguimiento postventa',
    desc: 'Pregunta cómo le fue al cliente y solicita reseña 7 días después de la entrega.',
    uses: 245,
    category: 'postventa',
  },
  {
    icon: HeartHandshake,
    title: 'Soporte automatizado N1',
    desc: 'Responde dudas frecuentes de envíos, devoluciones y formas de pago.',
    uses: 198,
    category: 'soporte',
  },
]

export default function FlujosPage() {
  return (
    <>
      <CommunityTopbar
        title="Flujos Luzitbot"
        subtitle="Plantillas listas + builder visual · Ahorra horas a tu chatbot"
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: 'var(--vc-white-dim)' }}>
            Empieza con una plantilla oficial o crea tu flujo desde cero.
          </p>
          <button className="vc-btn-primary flex items-center gap-2">
            <Plus size={16} /> Nuevo flujo
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {TEMPLATES.map((t) => {
            const Icon = t.icon
            return (
              <article
                key={t.title}
                className="vc-card group flex gap-4"
              >
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: 'rgba(198, 255, 60, 0.12)',
                    border: '1px solid rgba(198, 255, 60, 0.3)',
                  }}
                >
                  <Icon size={22} color="var(--vc-lime-main)" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h3
                      className="text-base font-bold"
                      style={{
                        color: 'var(--vc-white-soft)',
                        fontFamily: 'var(--font-heading)',
                      }}
                    >
                      {t.title}
                    </h3>
                    <span
                      className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                      style={{
                        background: 'var(--vc-black-soft)',
                        color: 'var(--vc-lime-main)',
                        border: '1px solid rgba(198, 255, 60, 0.3)',
                      }}
                    >
                      {t.category}
                    </span>
                  </div>
                  <p
                    className="mb-3 text-xs leading-relaxed"
                    style={{ color: 'var(--vc-white-dim)' }}
                  >
                    {t.desc}
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px]"
                      style={{
                        color: 'var(--vc-gray-mid)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {t.uses} miembros usaron esta plantilla
                    </span>
                    <button
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{
                        color: 'var(--vc-lime-main)',
                        fontFamily: 'var(--font-heading)',
                      }}
                    >
                      Usar →
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        {/* Mock visual del builder */}
        <div className="vc-card">
          <div className="mb-4 flex items-center gap-3">
            <Workflow size={20} color="var(--vc-lime-main)" />
            <h2
              className="text-base font-bold"
              style={{
                color: 'var(--vc-white-soft)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Builder visual (preview)
            </h2>
          </div>
          <div
            className="flex min-h-[200px] items-center justify-center rounded-xl border-2 border-dashed p-8 text-center"
            style={{ borderColor: 'rgba(198, 255, 60, 0.25)' }}
          >
            <div>
              <p
                className="mb-2 text-sm"
                style={{ color: 'var(--vc-white-dim)' }}
              >
                Aquí irá el lienzo drag & drop para armar tu flujo
              </p>
              <p
                className="text-[11px]"
                style={{
                  color: 'var(--vc-gray-mid)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Disponible cuando conectemos la API de Luzitbot · fase 3
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
