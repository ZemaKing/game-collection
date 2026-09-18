import { Skeleton } from '@/components/ui/Skeleton'

interface ItemCardSkeletonProps {
  view: 'grid' | 'list'
}

/** Placeholder matching `ItemCard`'s dimensions, so a loading grid/list doesn't jump when real cards arrive. */
export function ItemCardSkeleton({ view }: ItemCardSkeletonProps) {
  if (view === 'list') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5">
        <Skeleton className="aspect-[4/5] w-14 shrink-0 rounded-md md:w-16" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-2 h-3 w-1/3" />
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Skeleton className="aspect-[4/5] w-full rounded-none" />
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}
