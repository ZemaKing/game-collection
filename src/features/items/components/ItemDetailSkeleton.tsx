import { Skeleton } from '@/components/ui/Skeleton'

/** Matches `ItemDetailPage`'s two-column cover+fields layout to avoid layout shift on load. */
export function ItemDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex flex-col gap-3 lg:w-72 lg:shrink-0 xl:w-80">
        <Skeleton className="aspect-[4/5] w-full rounded-xl" />
        <div className="grid grid-cols-4 gap-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="aspect-[4/5] w-full" />
          ))}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <Skeleton className="h-8 w-2/3" />
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}
