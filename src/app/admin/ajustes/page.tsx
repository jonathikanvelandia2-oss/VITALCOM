import { Settings, Globe, Bell, Users, Shield, Palette } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

// Configuración general del panel admin Vitalcom
const SECTIONS = [
  {
    icon: Globe,
    title: 'País y región',
    desc: 'Operación activa: 🇨🇴 Colombia. Próximamente: EC · GT · CL.',
  },
  {
    icon: Users,
    title: 'Equipo y permisos',
    desc: 'Gestiona usuarios staff por área y asigna roles (CEO, ADMIN, MANAGER, EMPLOYEE).',
  },
  {
    icon: Shield,
    title: 'Seguridad',
    desc: 'Autenticación 2FA, sesiones activas, registros de auditoría.',
  },
  {
    icon: Bell,
    title: 'Notificaciones',
    desc: 'Configura alertas de stock bajo, pedidos pendientes, mensajes urgentes.',
  },
  {
    icon: Palette,
    title: 'Marca y apariencia',
    desc: 'Logo, colores y plantillas de comunicación. Lima neón sobre negro siempre.',
  },
  {
    icon: Settings,
    title: 'Integraciones',
    desc: 'Dropi, Wompi, MercadoPago, Resend, OpenAI y Zendu Marketplace.',
  },
]

export default function AjustesPage() {
  return (
    <>
      <AdminTopbar
        title="Ajustes"
        subtitle="Configuración general · Vitalcom Platform"
      />
      <div className="flex-1 p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {SECTIONS.map((s) => {
            const Icon = s.icon
            return (
              <button
                key={s.title}
                className="vc-card group text-left"
              >
                <div
                  className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{
                    background: 'rgba(198, 255, 60, 0.12)',
                    border: '1px solid rgba(198, 255, 60, 0.3)',
                  }}
                >
                  <Icon size={20} color="var(--vc-lime-main)" />
                </div>
                <h3
                  className="mb-1 text-base font-bold"
                  style={{
                    color: 'var(--vc-white-soft)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {s.title}
                </h3>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--vc-white-dim)' }}
                >
                  {s.desc}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
