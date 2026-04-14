'use client'

import { useState } from 'react'
import {
  Plus, Trash2, ChevronRight, Calendar,
  CheckCircle, Clock, AlertCircle, X, Loader2,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks'

// ── Kanban de tareas — datos reales de BD ──────────────

type Priority = 'low' | 'medium' | 'high'
type Status = 'pending' | 'in_progress' | 'completed'

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: 'Baja', color: 'var(--vc-info)', bg: 'rgba(60,198,255,0.1)' },
  medium: { label: 'Media', color: 'var(--vc-warning)', bg: 'rgba(255,184,0,0.1)' },
  high: { label: 'Alta', color: 'var(--vc-error)', bg: 'rgba(255,71,87,0.1)' },
}

const COLUMN_CONFIG: Record<Status, { title: string; icon: any; color: string }> = {
  pending: { title: 'Por hacer', icon: Clock, color: 'var(--vc-white-dim)' },
  in_progress: { title: 'En progreso', icon: AlertCircle, color: 'var(--vc-warning)' },
  completed: { title: 'Completado', icon: CheckCircle, color: 'var(--vc-lime-main)' },
}

const STATUS_NEXT: Record<Status, Status> = {
  pending: 'in_progress',
  in_progress: 'completed',
  completed: 'completed',
}

export default function TareasPage() {
  const { data, isLoading } = useTasks()
  const tasks = data?.tasks ?? []
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const [showModal, setShowModal] = useState(false)

  function moveTask(id: string, currentStatus: Status) {
    updateTask.mutate({ id, status: STATUS_NEXT[currentStatus] })
  }

  function handleDelete(id: string) {
    deleteTask.mutate(id)
  }

  function handleAdd(task: { title: string; description?: string; priority: string; dueDate?: string }) {
    createTask.mutate(task, { onSuccess: () => setShowModal(false) })
  }

  return (
    <>
      <CommunityTopbar title="Tareas" subtitle="Organiza y prioriza las tareas de tu negocio" />
      <div className="flex-1 p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--vc-white-dim)' }}>
                <span>{tasks.filter((t: any) => t.status === 'completed').length}/{tasks.length} completadas</span>
              </div>
              <button onClick={() => setShowModal(true)} className="vc-btn-primary flex items-center gap-2 px-4 py-2 text-xs">
                <Plus size={14} /> Nueva tarea
              </button>
            </div>

            {/* Kanban columns */}
            <div className="grid gap-4 md:grid-cols-3">
              {(['pending', 'in_progress', 'completed'] as const).map((status) => {
                const col = COLUMN_CONFIG[status]
                const Icon = col.icon
                const columnTasks = tasks.filter((t: any) => t.status === status)
                return (
                  <div key={status}>
                    <div className="mb-3 flex items-center gap-2 px-1">
                      <Icon size={16} style={{ color: col.color }} />
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: col.color, fontFamily: 'var(--font-heading)' }}>
                        {col.title}
                      </span>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--vc-black-mid)', color: 'var(--vc-white-dim)' }}>
                        {columnTasks.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {columnTasks.map((task: any) => (
                        <TaskCard key={task.id} task={task} onMove={() => moveTask(task.id, status)} onDelete={() => handleDelete(task.id)} />
                      ))}
                      {columnTasks.length === 0 && (
                        <div className="rounded-xl border border-dashed p-6 text-center text-xs" style={{ borderColor: 'var(--vc-gray-dark)', color: 'var(--vc-gray-mid)' }}>
                          Sin tareas
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {showModal && <NewTaskModal onClose={() => setShowModal(false)} onAdd={handleAdd} isLoading={createTask.isPending} />}
    </>
  )
}

function TaskCard({ task, onMove, onDelete }: {
  task: any; onMove: () => void; onDelete: () => void
}) {
  const pri = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium
  return (
    <div className="group rounded-xl p-3 transition-all" style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)' }}>
      <div className="mb-2 flex items-start justify-between">
        <p className="flex-1 text-sm font-medium leading-snug" style={{ color: 'var(--vc-white-soft)' }}>{task.title}</p>
        <button onClick={onDelete} className="ml-2 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: 'var(--vc-gray-mid)' }}>
          <Trash2 size={14} />
        </button>
      </div>
      {task.description && (
        <p className="mb-2 text-[11px] leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>{task.description}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded px-2 py-0.5 text-[9px] font-bold uppercase" style={{ background: pri.bg, color: pri.color, fontFamily: 'var(--font-heading)' }}>
            {pri.label}
          </span>
          {task.dueDate && (
            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>
              <Calendar size={10} />
              {new Date(task.dueDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
        {task.status !== 'completed' && (
          <button
            onClick={onMove}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold transition-all"
            style={{ background: 'rgba(198,255,60,0.08)', color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}
          >
            <ChevronRight size={12} />
            {task.status === 'pending' ? 'Iniciar' : 'Completar'}
          </button>
        )}
      </div>
    </div>
  )
}

function NewTaskModal({ onClose, onAdd, isLoading }: {
  onClose: () => void; onAdd: (task: any) => void; isLoading: boolean
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({ title: title.trim(), description: description.trim() || undefined, priority, dueDate: dueDate || undefined })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="vc-card w-full max-w-md" style={{ padding: '2rem' }}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="heading-sm">Nueva tarea</h3>
          <button onClick={onClose} style={{ color: 'var(--vc-gray-mid)' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-sm mb-2 block">Título</label>
            <input
              value={title} onChange={(e) => setTitle(e.target.value)} placeholder="¿Qué necesitas hacer?"
              required maxLength={200}
              className="w-full rounded-lg px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
            />
          </div>
          <div>
            <label className="label-sm mb-2 block">Descripción (opcional)</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles adicionales..."
              rows={3} maxLength={500}
              className="w-full resize-none rounded-lg px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-sm mb-2 block">Prioridad</label>
              <select
                value={priority} onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full rounded-lg px-3 py-3 text-sm outline-none"
                style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
              >
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-sm mb-2 block">Fecha límite</label>
              <input
                type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg px-3 py-3 text-sm outline-none"
                style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancelar</button>
            <button type="submit" disabled={isLoading} className="vc-btn-primary flex-1 py-2.5 text-sm">
              {isLoading ? 'Creando...' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
