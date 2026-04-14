import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminMobileNav } from '@/components/admin/AdminMobileNav'

// Layout del SaaS administrativo Vitalcom
// Sidebar fijo (desktop) + barra inferior (mobile) + contenido scrolleable
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--vc-black)' }}>
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-16 lg:pb-0">{children}</div>
      <AdminMobileNav />
    </div>
  )
}
