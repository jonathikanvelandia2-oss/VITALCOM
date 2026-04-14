import { Folder, FileText, Upload, Calendar } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

// Archivos internos y plantillas del equipo
const FOLDERS = [
  { name: 'Contratos', count: 8, color: 'var(--vc-lime-main)' },
  { name: 'Procesos', count: 12, color: 'var(--vc-info)' },
  { name: 'Plantillas', count: 6, color: 'var(--vc-warning)' },
  { name: 'Legal', count: 4, color: '#c084fc' },
]

const RECENT_DOCS = [
  { name: 'Contrato dropshipper v3.docx', folder: 'Contratos', date: '12 Abr 2026', size: '245 KB' },
  { name: 'Proceso despacho Dropi.pdf', folder: 'Procesos', date: '10 Abr 2026', size: '1.2 MB' },
  { name: 'Plantilla factura COP.xlsx', folder: 'Plantillas', date: '08 Abr 2026', size: '89 KB' },
  { name: 'Politica privacidad CO.pdf', folder: 'Legal', date: '05 Abr 2026', size: '340 KB' },
  { name: 'Manual onboarding comunidad.pdf', folder: 'Procesos', date: '03 Abr 2026', size: '2.1 MB' },
  { name: 'Acuerdo proveedor Ecuador.docx', folder: 'Contratos', date: '01 Abr 2026', size: '198 KB' },
]

const FOLDER_COLORS: Record<string, string> = {
  Contratos: 'var(--vc-lime-main)',
  Procesos: 'var(--vc-info)',
  Plantillas: 'var(--vc-warning)',
  Legal: '#c084fc',
}

export default function DocumentosPage() {
  return (
    <>
      <AdminTopbar title="Documentos" subtitle="Archivos internos y plantillas" />
      <div className="flex-1 space-y-6 p-6">
        {/* Carpetas */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {FOLDERS.map((f) => (
            <div key={f.name} className="vc-card flex items-center gap-3 p-4 cursor-pointer" style={{ borderColor: `${f.color}33` }}>
              <Folder size={22} color={f.color} />
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--vc-white-soft)' }}>{f.name}</p>
                <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{f.count} archivos</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button className="vc-btn-primary flex items-center gap-2"><Upload size={16} /> Subir documento</button>
        </div>

        {/* Documentos recientes */}
        <div className="vc-card p-5">
          <h2 className="mb-4 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>Documentos recientes</h2>
          <div className="space-y-2">
            {RECENT_DOCS.map((d) => (
              <div key={d.name} className="flex items-center gap-4 rounded-lg p-3" style={{ background: 'var(--vc-black-soft)' }}>
                <FileText size={18} color={FOLDER_COLORS[d.folder] || 'var(--vc-lime-main)'} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold" style={{ color: 'var(--vc-white-soft)' }}>{d.name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{d.folder} &middot; {d.size}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                  <Calendar size={10} /> {d.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
