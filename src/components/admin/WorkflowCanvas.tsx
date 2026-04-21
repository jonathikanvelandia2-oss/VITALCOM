'use client'

// V30 — Visual workflow canvas
// ═══════════════════════════════════════════════════════════
// Renderiza workflow como grafo dirigido: nodos draggables + SVG paths.
// Auto-layout vertical si el step no tiene position. Clicks emiten
// onStepSelect para abrir el inspector en el padre.

import { useState, useRef, useMemo } from 'react'
import {
  Send, MessageSquare, MousePointer, Image as ImageIcon,
  Clock, MessageCircle, GitBranch, Tag, Brain, Bot,
  UserCheck, Link2, Webhook, AlertTriangle, Flag,
} from 'lucide-react'

export interface CanvasStep {
  id: string
  type: string
  config: Record<string, unknown>
  nextOnSuccess?: string
  nextOnFail?: string
  nextOnBranch?: Record<string, string>
  position?: { x: number; y: number }
}

interface Props {
  steps: CanvasStep[]
  selectedStepId: string | null
  onStepSelect: (stepId: string | null) => void
  onPositionsChange: (positions: Record<string, { x: number; y: number }>) => void
}

const NODE_WIDTH = 200
const NODE_HEIGHT = 64
const COL_X = 240 // separación horizontal
const ROW_Y = 120 // separación vertical

const STEP_META: Record<string, { color: string; Icon: typeof Send; label: string }> = {
  send_template:      { color: '#C6FF3C', Icon: Send,            label: 'Enviar plantilla' },
  send_text:          { color: '#A8FF00', Icon: MessageSquare,   label: 'Enviar texto' },
  send_interactive:   { color: '#9C27B0', Icon: MousePointer,    label: 'Botones interactivos' },
  send_media:         { color: '#FFB800', Icon: ImageIcon,       label: 'Enviar media' },
  wait:               { color: '#8B9BA8', Icon: Clock,           label: 'Esperar' },
  wait_for_reply:     { color: '#3CC6FF', Icon: MessageCircle,   label: 'Esperar respuesta' },
  branch:             { color: '#FFB800', Icon: GitBranch,       label: 'Ramificar' },
  tag:                { color: '#9C27B0', Icon: Tag,             label: 'Etiquetar' },
  ai_decision:        { color: '#E91E63', Icon: Brain,           label: 'IA decide' },
  ai_respond:         { color: '#E91E63', Icon: Bot,             label: 'IA responde' },
  update_contact:     { color: '#4CAF50', Icon: UserCheck,       label: 'Actualizar contacto' },
  create_order_link:  { color: '#FF9800', Icon: Link2,           label: 'Crear pedido' },
  call_webhook:       { color: '#2196F3', Icon: Webhook,         label: 'Llamar webhook' },
  escalate:           { color: '#FF4757', Icon: AlertTriangle,   label: 'Escalar a humano' },
  end:                { color: '#8B9BA8', Icon: Flag,            label: 'Fin' },
}

// Auto-layout topológico simple: BFS desde el primer step, asigna columna según profundidad
function autoLayout(steps: CanvasStep[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}
  if (steps.length === 0) return positions

  const stepMap = new Map(steps.map(s => [s.id, s]))
  const depth = new Map<string, number>()
  const order = new Map<string, number>() // posición en su fila

  // BFS para profundidad
  const queue: Array<{ id: string; d: number }> = [{ id: steps[0].id, d: 0 }]
  depth.set(steps[0].id, 0)
  const seen = new Set<string>([steps[0].id])

  while (queue.length > 0) {
    const { id, d } = queue.shift()!
    const step = stepMap.get(id)
    if (!step) continue

    const children: string[] = []
    if (step.nextOnSuccess) children.push(step.nextOnSuccess)
    if (step.nextOnFail) children.push(step.nextOnFail)
    if (step.nextOnBranch) {
      for (const target of Object.values(step.nextOnBranch)) children.push(target)
    }

    for (const child of children) {
      if (!stepMap.has(child)) continue
      if (!seen.has(child)) {
        seen.add(child)
        depth.set(child, d + 1)
        queue.push({ id: child, d: d + 1 })
      }
    }
  }

  // Steps no alcanzables desde el inicio → los ponemos a profundidad por índice
  for (const s of steps) {
    if (!depth.has(s.id)) depth.set(s.id, steps.indexOf(s))
  }

  // Agrupar por profundidad y asignar orden dentro de la fila
  const byDepth = new Map<number, string[]>()
  for (const [id, d] of depth) {
    if (!byDepth.has(d)) byDepth.set(d, [])
    byDepth.get(d)!.push(id)
  }
  for (const [, ids] of byDepth) {
    ids.forEach((id, idx) => order.set(id, idx))
  }

  for (const s of steps) {
    if (s.position) {
      positions[s.id] = s.position
    } else {
      const d = depth.get(s.id) ?? 0
      const row = order.get(s.id) ?? 0
      positions[s.id] = {
        x: 40 + row * COL_X,
        y: 40 + d * ROW_Y,
      }
    }
  }

  return positions
}

export function WorkflowCanvas({ steps, selectedStepId, onStepSelect, onPositionsChange }: Props) {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(
    () => autoLayout(steps),
  )
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  // Calcular tamaño del canvas
  const { width, height } = useMemo(() => {
    let maxX = 400, maxY = 300
    for (const p of Object.values(positions)) {
      if (p.x + NODE_WIDTH + 40 > maxX) maxX = p.x + NODE_WIDTH + 40
      if (p.y + NODE_HEIGHT + 40 > maxY) maxY = p.y + NODE_HEIGHT + 40
    }
    return { width: maxX, height: maxY }
  }, [positions])

  const getPos = (id: string) => positions[id] ?? { x: 40, y: 40 }

  const handleMouseDown = (e: React.MouseEvent, stepId: string) => {
    e.stopPropagation()
    const pos = getPos(stepId)
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    setDragging({
      id: stepId,
      offsetX: e.clientX - rect.left - pos.x,
      offsetY: e.clientY - rect.top - pos.y,
    })
    onStepSelect(stepId)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const newX = Math.max(10, e.clientX - rect.left - dragging.offsetX)
    const newY = Math.max(10, e.clientY - rect.top - dragging.offsetY)
    setPositions(prev => ({ ...prev, [dragging.id]: { x: newX, y: newY } }))
  }

  const handleMouseUp = () => {
    if (dragging) {
      onPositionsChange(positions)
    }
    setDragging(null)
  }

  // Render edges (connections)
  const edges = useMemo(() => {
    const list: Array<{ from: string; to: string; label?: string; color: string }> = []
    for (const s of steps) {
      if (s.nextOnSuccess) list.push({ from: s.id, to: s.nextOnSuccess, color: '#C6FF3C' })
      if (s.nextOnFail)    list.push({ from: s.id, to: s.nextOnFail, label: 'fail', color: '#FF4757' })
      if (s.nextOnBranch) {
        for (const [key, target] of Object.entries(s.nextOnBranch)) {
          list.push({ from: s.id, to: target, label: key, color: '#3CC6FF' })
        }
      }
    }
    return list
  }, [steps])

  return (
    <div className="relative h-[560px] overflow-auto rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black)]">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => onStepSelect(null)}
        className="cursor-default"
        style={{ minWidth: '100%', minHeight: '100%' }}
      >
        {/* Grid pattern */}
        <defs>
          <pattern id="vc-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#1F1F1F" />
          </pattern>
          <marker
            id="arrow-lime"
            viewBox="0 0 10 10"
            refX="9" refY="5"
            markerWidth="6" markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#C6FF3C" />
          </marker>
          <marker
            id="arrow-red"
            viewBox="0 0 10 10"
            refX="9" refY="5"
            markerWidth="6" markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#FF4757" />
          </marker>
          <marker
            id="arrow-info"
            viewBox="0 0 10 10"
            refX="9" refY="5"
            markerWidth="6" markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#3CC6FF" />
          </marker>
        </defs>
        <rect width={width} height={height} fill="url(#vc-grid)" />

        {/* Edges */}
        {edges.map((e, i) => {
          const from = getPos(e.from)
          const to = getPos(e.to)
          const x1 = from.x + NODE_WIDTH / 2
          const y1 = from.y + NODE_HEIGHT
          const x2 = to.x + NODE_WIDTH / 2
          const y2 = to.y
          const midY = (y1 + y2) / 2
          const pathD = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
          const markerId =
            e.color === '#FF4757' ? 'arrow-red' :
            e.color === '#3CC6FF' ? 'arrow-info' : 'arrow-lime'

          return (
            <g key={`edge-${i}`} className="pointer-events-none">
              <path
                d={pathD}
                fill="none"
                stroke={e.color}
                strokeWidth={1.5}
                opacity={0.7}
                markerEnd={`url(#${markerId})`}
              />
              {e.label && (
                <text
                  x={(x1 + x2) / 2 + 6}
                  y={midY}
                  fontSize={10}
                  fill={e.color}
                  className="font-mono"
                >
                  {e.label}
                </text>
              )}
            </g>
          )
        })}

        {/* Nodes */}
        {steps.map(step => {
          const pos = getPos(step.id)
          const meta = STEP_META[step.type] ?? STEP_META.end
          const selected = selectedStepId === step.id
          const Icon = meta.Icon
          return (
            <g
              key={step.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              onMouseDown={e => handleMouseDown(e, step.id)}
              className="cursor-move"
            >
              <rect
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx={10}
                fill="#141414"
                stroke={selected ? meta.color : '#2A2A2A'}
                strokeWidth={selected ? 2 : 1}
                style={{
                  filter: selected ? `drop-shadow(0 0 8px ${meta.color})` : 'none',
                }}
              />
              <rect
                x={0}
                y={0}
                width={4}
                height={NODE_HEIGHT}
                rx={10}
                fill={meta.color}
              />
              <foreignObject x={14} y={8} width={NODE_WIDTH - 20} height={NODE_HEIGHT - 16}>
                <div
                  // Foreign HTML inside SVG for fonts + icons
                  className="flex h-full items-center gap-2 font-sans"
                  style={{ color: '#F5F5F5' }}
                >
                  <div
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded"
                    style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-semibold">
                      {step.id}
                    </div>
                    <div className="truncate text-[9px] text-[#B8B8B8]">
                      {meta.label}
                    </div>
                  </div>
                </div>
              </foreignObject>
            </g>
          )
        })}

        {steps.length === 0 && (
          <text
            x={width / 2}
            y={height / 2}
            textAnchor="middle"
            fill="#4A4A4A"
            fontSize={13}
          >
            Workflow vacío — agrega pasos en JSON
          </text>
        )}
      </svg>
    </div>
  )
}

export { STEP_META as WORKFLOW_STEP_META }
