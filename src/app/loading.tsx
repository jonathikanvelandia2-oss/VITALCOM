import { Skeleton } from '@/components/shared/Skeleton'

export default function RootLoading() {
  return (
    <main className="min-h-screen bg-[var(--vc-black)] px-6 py-16">
      <div className="max-w-6xl mx-auto space-y-8">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-6 w-2/3" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pt-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    </main>
  )
}
