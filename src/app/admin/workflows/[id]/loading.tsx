import { Skeleton } from '@/components/shared/Skeleton'

export default function WorkflowDetailLoading() {
  return (
    <div className="min-h-screen bg-[var(--vc-black)] px-4 md:px-6 py-6">
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Topbar */}
        <div className="flex items-center justify-between">
          <Skeleton variant="text" className="h-6 w-64" />
          <div className="flex gap-2">
            <Skeleton variant="pill" className="w-20" />
            <Skeleton variant="pill" className="w-24" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>

        {/* Canvas area */}
        <div className="rounded-xl border border-[rgba(198,255,60,0.15)] bg-[var(--vc-black-mid)] p-4">
          <Skeleton className="h-[500px] w-full" />
        </div>
      </div>
    </div>
  )
}
