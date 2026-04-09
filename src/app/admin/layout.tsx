import { AdminSidebar } from '@/components/admin/AdminSidebar'

// Layout del SaaS administrativo Vitalcom
// Sidebar fijo + área de contenido con scroll independiente
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--vc-black)' }}>
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
