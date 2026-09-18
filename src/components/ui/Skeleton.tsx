interface SkeletonProps {
  className?: string
}

/** A pulsing placeholder block; `className` carries sizing/shape to match the real content it stands in for. */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse rounded-md bg-card-hover ${className}`} />
}
