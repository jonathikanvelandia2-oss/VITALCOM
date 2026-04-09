'use client'

import { useState } from 'react'
import {
  Zap, Play, Pause, Clock, CheckCircle, XCircle,
  MessageCircle, ShoppingCart, Star, Users, Send,
  BarChart3, ChevronDown, ChevronUp, RotateCcw,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'

// ── Automatizaciones para dropshippers Vitalcom ─────────
// Flujos prearmados para WhatsApp, seguimiento, postventa.
// Adaptado de Zendu workflows para comunidad de bienestar.

type WorkflowStatus = 'active' | 'paused' | 'draft'

const TEMPLATES = [
  {
    id: 'confirm-order',
    name: 'Confirmar pedido',
    emoji: '📦',
    description: 'Envía confirmación automática por WhatsApp cuando recibes un pedido nuevo',
    target: 'Nuevos pedidos',
    impact: '↑ 35% satisfacción',
    steps: [
      { type: 'auto', text: 'Detectar nuevo pedido en Dropi' },
      { type: 'auto', text: 'Enviar mensaje de confirmación por WhatsApp' },
      { type: 'auto', text: 'Compartir link de seguimiento' },
      { type: 'manual', text: 'Verificar datos de envío si hay dudas' },
    ],
  },
  {
    id: 'cart-recovery',
    name: 'Recuperar carrito',
    emoji: '🛒',
    description: 'Recontacta clientes que preguntaron pero no compraron. Espera 2 horas y envía recordatorio',
    target: 'Leads sin compra',
    impact: '↑ 22% conversión',
    steps: [
      { type: 'auto', text: 'Detectar lead sin compra en 2 horas' },
      { type: 'auto', text: 'Enviar recordatorio por WhatsApp con oferta' },
      { type: 'auto', text: 'Si no responde en 24h, segundo mensaje' },
      { type: 'manual', text: 'Llamar si el lead es de alto valor' },
    ],
  },
  {
    id: 'post-sale',
    name: 'Seguimiento postventa',
    emoji: '⭐',
    description: 'Pide reseña y feedback 48 horas después de la entrega. Genera confianza y repetición',
    target: 'Pedidos entregados',
    impact: '↑ 40% recompra',
    steps: [
      { type: 'auto', text: 'Esperar 48h después de entrega confirmada' },
      { type: 'auto', text: 'Enviar mensaje pidiendo experiencia' },
      { type: 'auto', text: 'Si positiva: pedir reseña en redes' },
      { type: 'auto', text: 'Si negativa: escalar a soporte Vitalcom' },
    ],
  },
  {
    id: 'welcome-lead',
    name: 'Bienvenida a leads',
    emoji: '👋',
    description: 'Cualifica y da bienvenida a nuevos contactos que llegan por redes o WhatsApp',
    target: 'Leads nuevos',
    impact: '↑ 28% calificación',
    steps: [
      { type: 'auto', text: 'Detectar nuevo contacto en WhatsApp' },
      { type: 'auto', text: 'Enviar saludo + catálogo de productos' },
      { type: 'auto', text: 'Preguntar qué producto le interesa' },
      { type: 'manual', text: 'Asesorar según respuesta del lead' },
    ],
  },
  {
    id: 'reactivate',
    name: 'Reactivar inactivos',
    emoji: '💌',
    description: 'Envía oferta especial a clientes que no compran hace 30 días',
    target: 'Clientes inactivos 30d',
    impact: '↑ 15% reactivación',
    steps: [
      { type: 'auto', text: 'Identificar clientes sin compra en 30 días' },
      { type: 'auto', text: 'Enviar mensaje con descuento exclusivo' },
      { type: 'auto', text: 'Si responde: generar pedido rápido' },
      { type: 'manual', text: 'Seguimiento personalizado si es VIP' },
    ],
  },
  {
    id: 'weekly-report',
    name: 'Reporte semanal',
    emoji: '📊',
    description: 'Recibe cada lunes un resumen de tu semana: ventas, pedidos, devoluciones, ganancia',
    target: 'Tu negocio',
    impact: 'Control total',
    steps: [
      { type: 'auto', text: 'Calcular métricas de la semana' },
      { type: 'auto', text: 'Generar reporte con gráficos' },
      { type: 'auto', text: 'Enviar por WhatsApp cada lunes 8am' },
      { type: 'auto', text: 'Incluir comparación vs semana anterior' },
    ],
  },
]

// Flujos activos del usuario (demo)
const INITIAL_WORKFLOWS = [
  { id: '1', templateId: 'confirm-order', name: 'Confirmar pedido', emoji: '📦', status: 'active' as WorkflowStatus, executions: 47, successRate: 94, lastRun: 'Hace 2 horas' },
  { id: '2', templateId: 'post-sale', name: 'Seguimiento postventa', emoji: '⭐', status: 'active' as WorkflowStatus, executions: 23, successRate: 87, lastRun: 'Hace 5 horas' },
  { id: '3', templateId: 'cart-recovery', name: 'Recuperar carrito', emoji: '🛒', status: 'paused' as WorkflowStatus, executions: 12, successRate: 66, lastRun: 'Hace 2 días' },
]

export default function AutomatizacionesPage() {
  const [workflows, setWorkflows] = useState(INITIAL_WORKFLOWS)
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)

  function toggleWorkflow(id: string) {
    setWorkflows(wfs => wfs.map(w =>
      w.id === id ? { ...w, status: w.status === 'active' ? 'paused' as const : 'active' as const } : w
    ))
  }

  function activateTemplate(templateId: string) {
    const tpl = TEMPLATES.find(t => t.id === templateId)
    if (!tpl || workflows.some(w => w.templateId === templateId)) return
    setWorkflows(wfs => [...wfs, {
      id: Date.now().toString(),
      templateId,
      name: tpl.name,
      emoji: tpl.emoji,
      status: 'active' as const,
      executions: 0,
      successRate: 0,
      lastRun: 'Nunca',
    }])
  }

  return (
    <>
      <CommunityTopbar title="Automatizaciones" subtitle="Flujos automáticos para tu negocio de dropshipping" />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Flujos activos */}
        <div className="vc-card">
          <h2 className="heading-sm mb-4 flex items-center gap-2">
            <Zap size={16} color="var(--vc-lime-main)" /> Mis flujos activos
          </h2>
          {workflows.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: 'var(--vc-white-dim)' }}>
              Aún no tienes flujos activos. Activa una plantilla abajo para empezar.
            </p>
          ) : (
            <div className="space-y-3">
              {workflows.map((w) => (
                <div key={w.id} className="flex items-center gap-4 rounded-xl p-4" style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
                  <span className="text-2xl">{w.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>{w.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>
                      <span className="flex items-center gap-1"><Play size={10} /> {w.executions} ejecuciones</span>
                      <span className="flex items-center gap-1">
                        <CheckCircle size={10} style={{ color: w.successRate >= 80 ? 'var(--vc-lime-main)' : 'var(--vc-warning)' }} />
                        {w.successRate}% éxito
                      </span>
                      <span className="flex items-center gap-1"><Clock size={10} /> {w.lastRun}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleWorkflow(w.id)}
                      className="rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase transition-all"
                      style={{
                        background: w.status === 'active' ? 'rgba(198,255,60,0.1)' : 'rgba(255,184,0,0.1)',
                        border: `1px solid ${w.status === 'active' ? 'rgba(198,255,60,0.3)' : 'rgba(255,184,0,0.3)'}`,
                        color: w.status === 'active' ? 'var(--vc-lime-main)' : 'var(--vc-warning)',
                        fontFamily: 'var(--font-heading)',
                      }}
                    >
                      {w.status === 'active' ? '● Activo' : '■ Pausado'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plantillas disponibles */}
        <div>
          <h2 className="heading-sm mb-4 flex items-center gap-2 px-1">
            <BarChart3 size={16} color="var(--vc-lime-main)" /> Plantillas disponibles
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((tpl) => {
              const isActive = workflows.some(w => w.templateId === tpl.id)
              const isExpanded = expandedTemplate === tpl.id
              return (
                <div key={tpl.id} className="vc-card flex flex-col">
                  <div className="mb-3 flex items-start justify-between">
                    <span className="text-3xl">{tpl.emoji}</span>
                    <span className="rounded-full px-2.5 py-1 text-[9px] font-bold" style={{ background: 'rgba(198,255,60,0.08)', color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>
                      {tpl.impact}
                    </span>
                  </div>
                  <h3 className="mb-1 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>{tpl.name}</h3>
                  <p className="mb-3 flex-1 text-xs leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>{tpl.description}</p>

                  {/* Pasos expandibles */}
                  <button
                    onClick={() => setExpandedTemplate(isExpanded ? null : tpl.id)}
                    className="mb-3 flex items-center gap-1 text-[10px] font-semibold"
                    style={{ color: 'var(--vc-lime-deep)', fontFamily: 'var(--font-heading)' }}
                  >
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {isExpanded ? 'Ocultar pasos' : 'Ver 4 pasos'}
                  </button>
                  {isExpanded && (
                    <div className="mb-3 space-y-2">
                      {tpl.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-2 text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>
                          <span className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold" style={{
                            background: step.type === 'auto' ? 'rgba(198,255,60,0.1)' : 'rgba(60,198,255,0.1)',
                            color: step.type === 'auto' ? 'var(--vc-lime-main)' : 'var(--vc-info)',
                          }}>
                            {step.type === 'auto' ? 'AUTO' : 'MANUAL'}
                          </span>
                          {step.text}
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => activateTemplate(tpl.id)}
                    disabled={isActive}
                    className="vc-btn-primary w-full py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isActive ? '✓ Activado' : 'Activar flujo'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
