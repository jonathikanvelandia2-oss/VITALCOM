'use client'

import { useState } from 'react'
import { Folder, FileText, Upload, Calendar, Trash2, Loader2, X, Search } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useDocuments, useUploadDocument, useDeleteDocument } from '@/hooks/useDocuments'

// ── Documentos internos Vitalcom ─────────────────────────
// Archivos administrativos (contratos, procesos, plantillas, legal).
// Conectado a modelo Document en BD.

const FOLDER_COLORS: Record<string, string> = {
  Contratos: 'var(--vc-lime-main)',
  Procesos: 'var(--vc-info)',
  Plantillas: 'var(--vc-warning)',
  Legal: '#c084fc',
  general: 'var(--vc-gray-mid)',
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function DocumentosPage() {
  const [folder, setFolder] = useState<string | undefined>()
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)

  const { data, isLoading } = useDocuments(folder)
  const del = useDeleteDocument()

  const items = data?.items ?? []
  const folders = data?.folders ?? []

  const filtered = search
    ? items.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
    : items

  return (
    <>
      <AdminTopbar title="Documentos" subtitle="Archivos internos y plantillas" />
      <div className="flex-1 space-y-6 p-6">
        {/* Carpetas */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {folders.length === 0 && !isLoading ? (
            <div
              className="col-span-full py-8 text-center text-sm"
              style={{ color: 'var(--vc-gray-mid)' }}
            >
              No hay documentos aún. Sube uno con el botón de arriba.
            </div>
          ) : (
            folders.map((f) => {
              const color = FOLDER_COLORS[f.name] ?? 'var(--vc-lime-main)'
              const isActive = folder === f.name
              return (
                <button
                  key={f.name}
                  onClick={() => setFolder(isActive ? undefined : f.name)}
                  className="vc-card flex items-center gap-3 p-4 text-left transition-all"
                  style={{
                    borderColor: isActive ? color : `${color}33`,
                    boxShadow: isActive ? `0 0 16px ${color}33` : 'none',
                  }}
                >
                  <Folder size={22} color={color} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--vc-white-soft)' }}>
                      {f.name}
                    </p>
                    <p
                      className="text-[10px]"
                      style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
                    >
                      {f.count} archivo{f.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Barra de acciones */}
        <div className="flex flex-wrap gap-3">
          <div
            className="relative flex-1 min-w-[240px] flex items-center gap-2 rounded-lg px-3"
            style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}
          >
            <Search size={14} color="var(--vc-gray-mid)" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar documento por nombre..."
              className="w-full bg-transparent py-2 text-xs outline-none"
              style={{ color: 'var(--vc-white-soft)' }}
            />
          </div>
          {folder && (
            <button
              onClick={() => setFolder(undefined)}
              className="rounded-lg px-3 py-2 text-[11px] font-semibold"
              style={{
                background: 'var(--vc-black-soft)',
                border: '1px solid var(--vc-gray-dark)',
                color: 'var(--vc-white-dim)',
              }}
            >
              Ver todos
            </button>
          )}
          <button
            onClick={() => setShowUpload(true)}
            className="vc-btn-primary flex items-center gap-2"
          >
            <Upload size={16} /> Subir documento
          </button>
        </div>

        {/* Documentos */}
        <div className="vc-card p-5">
          <h2
            className="mb-4 text-sm font-bold"
            style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
          >
            {folder ? `Carpeta: ${folder}` : 'Todos los documentos'}
            <span className="ml-2 text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>
              ({filtered.length})
            </span>
          </h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
              {search ? 'Sin resultados' : 'No hay documentos en esta vista'}
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((d) => {
                const color = FOLDER_COLORS[d.folder] ?? 'var(--vc-lime-main)'
                return (
                  <div
                    key={d.id}
                    className="flex items-center gap-4 rounded-lg p-3"
                    style={{ background: 'var(--vc-black-soft)' }}
                  >
                    <FileText size={18} color={color} className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-xs font-semibold hover:brightness-125"
                        style={{ color: 'var(--vc-white-soft)' }}
                      >
                        {d.name}
                      </a>
                      <p
                        className="text-[10px]"
                        style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
                      >
                        {d.folder} · {formatSize(d.size)} · {d.type.toUpperCase()}
                        {d.uploader?.name ? ` · ${d.uploader.name}` : ''}
                      </p>
                    </div>
                    <span
                      className="hidden sm:flex shrink-0 items-center gap-1 text-[10px]"
                      style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
                    >
                      <Calendar size={10} /> {formatDate(d.createdAt)}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar "${d.name}"?`)) del.mutate(d.id)
                      }}
                      disabled={del.isPending}
                      aria-label="Eliminar"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:brightness-125 disabled:opacity-50"
                      style={{ border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-gray-mid)' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </>
  )
}

// ── Modal subir documento ──────────────────────────────
function UploadModal({ onClose }: { onClose: () => void }) {
  const upload = useUploadDocument()
  const [form, setForm] = useState({
    name: '',
    folder: 'Contratos',
    type: 'pdf',
    url: '',
    size: 0,
  })

  const inputStyle = {
    background: 'var(--vc-black-soft)',
    border: '1px solid var(--vc-gray-dark)',
    color: 'var(--vc-white-soft)',
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    upload.mutate(form, { onSuccess: onClose })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="vc-card w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
        style={{ borderColor: 'rgba(198,255,60,0.3)' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3
            className="text-sm font-bold"
            style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
          >
            Registrar documento
          </h3>
          <button onClick={onClose} aria-label="Cerrar">
            <X size={16} color="var(--vc-gray-mid)" />
          </button>
        </div>
        <p className="mb-4 text-[11px]" style={{ color: 'var(--vc-gray-mid)' }}>
          Sube el archivo a tu storage (Supabase, S3, Drive) y pega la URL pública aquí.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            required
            placeholder="Nombre del archivo (ej: Contrato dropshipper v4.pdf)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg px-3 py-2 text-xs outline-none"
            style={inputStyle}
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.folder}
              onChange={(e) => setForm({ ...form, folder: e.target.value })}
              className="rounded-lg px-3 py-2 text-xs outline-none"
              style={inputStyle}
            >
              <option>Contratos</option>
              <option>Procesos</option>
              <option>Plantillas</option>
              <option>Legal</option>
            </select>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="rounded-lg px-3 py-2 text-xs outline-none"
              style={inputStyle}
            >
              <option value="pdf">PDF</option>
              <option value="doc">DOC/DOCX</option>
              <option value="excel">Excel</option>
              <option value="imagen">Imagen</option>
            </select>
          </div>
          <input
            required
            type="url"
            placeholder="URL pública del archivo"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            className="w-full rounded-lg px-3 py-2 text-xs outline-none"
            style={inputStyle}
          />
          <input
            type="number"
            placeholder="Tamaño en bytes (opcional)"
            value={form.size || ''}
            onChange={(e) => setForm({ ...form, size: parseInt(e.target.value) || 0 })}
            className="w-full rounded-lg px-3 py-2 text-xs outline-none"
            style={inputStyle}
          />
          {upload.isError && (
            <p className="text-[11px]" style={{ color: 'var(--vc-error)' }}>
              {(upload.error as Error).message}
            </p>
          )}
          <button
            type="submit"
            disabled={upload.isPending}
            className="vc-btn-primary flex w-full items-center justify-center gap-2 py-2 disabled:opacity-50"
          >
            {upload.isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Registrar documento
          </button>
        </form>
      </div>
    </div>
  )
}
