import { FileText, Download, Video, Image, Upload } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

// Biblioteca de contenido y material para la comunidad
const KPIS = [
  { label: 'Recursos', value: '15', icon: FileText, color: 'var(--vc-lime-main)' },
  { label: 'Descargas totales', value: '9.034', icon: Download, color: 'var(--vc-info)' },
  { label: 'Videos', value: '3', icon: Video, color: 'var(--vc-warning)' },
]

const CONTENT = [
  { name: 'Guia Dropshipping 2026', type: 'PDF', size: '2.4 MB', downloads: 1243, icon: FileText, date: '10 Abr' },
  { name: 'Plantilla Stories Instagram', type: 'PSD', size: '8.1 MB', downloads: 876, icon: Image, date: '08 Abr' },
  { name: 'Video: Como usar la calculadora', type: 'MP4', size: '45 MB', downloads: 2103, icon: Video, date: '05 Abr' },
  { name: 'Catalogo PDF Abril 2026', type: 'PDF', size: '5.7 MB', downloads: 654, icon: FileText, date: '01 Abr' },
  { name: 'Pack Banners Redes Sociales', type: 'ZIP', size: '12 MB', downloads: 1890, icon: Image, date: '28 Mar' },
  { name: 'Video: Flujos Luzitbot basicos', type: 'MP4', size: '38 MB', downloads: 987, icon: Video, date: '25 Mar' },
]

export default function ContenidoPage() {
  return (
    <>
      <AdminTopbar title="Contenido" subtitle="Biblioteca y material para la comunidad" />
      <div className="flex-1 space-y-6 p-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {KPIS.map((k) => (
            <div key={k.label} className="vc-card flex items-center gap-4 p-5">
              <k.icon size={20} color={k.color} />
              <div>
                <p className="text-2xl font-bold" style={{ color: k.color, fontFamily: 'var(--font-heading)' }}>{k.value}</p>
                <p className="text-[11px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{k.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Boton subir */}
        <div className="flex justify-end">
          <button className="vc-btn-primary flex items-center gap-2"><Upload size={16} /> Subir recurso</button>
        </div>

        {/* Grid de contenido */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CONTENT.map((c) => (
            <div key={c.name} className="vc-card p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'var(--vc-black-soft)' }}>
                  <c.icon size={18} color="var(--vc-lime-main)" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold" style={{ color: 'var(--vc-white-soft)' }}>{c.name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{c.type} &middot; {c.size}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>{c.date}</span>
                <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>
                  <Download size={10} /> {c.downloads.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
