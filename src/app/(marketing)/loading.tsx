import { Skeleton } from '@/components/shared/Skeleton'

export default function MarketingLoading() {
  return (
    <main className="min-h-screen bg-[var(--vc-black)] px-6 py-24">
      <div className="max-w-5xl mx-auto space-y-10">
        <Skeleton className="h-16 w-3/4" />
        <Skeleton className="h-8 w-1/2" />
        <div className="flex gap-4 pt-4">
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-12 w-40" />
        </div>
        <div className="grid gap-6 md:grid-cols-3 pt-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    </main>
  )
}
