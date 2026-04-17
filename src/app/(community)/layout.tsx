import { CommunitySidebar } from '@/components/community/CommunitySidebar'
import { CommunityMobileNav } from '@/components/community/CommunityMobileNav'
import { VitaWidget } from '@/components/assistant/VitaWidget'

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--vc-black)' }}>
      <CommunitySidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-16 lg:pb-0">{children}</div>
      <CommunityMobileNav />
      <VitaWidget />
    </div>
  )
}
