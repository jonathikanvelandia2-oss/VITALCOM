import { CommunitySidebar } from '@/components/community/CommunitySidebar'

// Layout de la plataforma comunitaria Vitalcom
// Sidebar fijo + área de contenido principal (feed, herramientas, cursos, etc.)
export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--vc-black)' }}>
      <CommunitySidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
