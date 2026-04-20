import { SkeletonStat, SkeletonRow } from '@/components/shared/Skeleton'

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[var(--vc-black)] px-4 md:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStat key={i} />
          ))}
        </div>
        <div className="rounded-xl bg-[var(--vc-black-mid)] border border-[rgba(198,255,60,0.15)] p-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
