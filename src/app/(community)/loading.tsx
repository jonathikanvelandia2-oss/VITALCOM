import { SkeletonStat, SkeletonCard } from '@/components/shared/Skeleton'

export default function CommunityLoading() {
  return (
    <div className="min-h-screen bg-[var(--vc-black)] px-4 md:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStat key={i} />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
