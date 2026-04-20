import { cn } from '@/lib/utils/cn'

type SkeletonProps = {
  className?: string
  variant?: 'rect' | 'circle' | 'text' | 'pill'
}

export function Skeleton({ className, variant = 'rect' }: SkeletonProps) {
  const base =
    'relative overflow-hidden isolate bg-[var(--vc-black-soft)] border border-[rgba(198,255,60,0.08)]'

  const shapes: Record<NonNullable<SkeletonProps['variant']>, string> = {
    rect: 'rounded-lg',
    circle: 'rounded-full aspect-square',
    text: 'rounded-md h-4',
    pill: 'rounded-full h-8',
  }

  return (
    <div className={cn(base, shapes[variant], 'vc-skeleton-shimmer', className)} aria-hidden>
      <span className="sr-only">Cargando…</span>
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl p-6 bg-[var(--vc-black-mid)] border border-[rgba(198,255,60,0.15)] space-y-4',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="w-10 h-10" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-1/2" />
          <Skeleton variant="text" className="w-1/4 h-3" />
        </div>
      </div>
      <Skeleton className="w-full h-32" />
      <div className="space-y-2">
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-5/6" />
        <Skeleton variant="text" className="w-2/3" />
      </div>
    </div>
  )
}

export function SkeletonGrid({
  count = 6,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonStat() {
  return (
    <div className="rounded-xl p-5 bg-[var(--vc-black-mid)] border border-[rgba(198,255,60,0.15)] space-y-3">
      <Skeleton variant="text" className="w-1/3 h-3" />
      <Skeleton variant="text" className="w-2/3 h-8" />
      <Skeleton variant="text" className="w-1/2 h-3" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-[rgba(198,255,60,0.08)]">
      <Skeleton variant="circle" className="w-9 h-9 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-2/3" />
        <Skeleton variant="text" className="w-1/3 h-3" />
      </div>
      <Skeleton variant="pill" className="w-20" />
    </div>
  )
}
