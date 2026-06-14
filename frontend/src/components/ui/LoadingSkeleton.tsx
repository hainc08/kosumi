import './LoadingSkeleton.css'

interface LoadingSkeletonProps { rows?: number; columns?: number }

export function LoadingSkeleton({ rows = 3, columns = 4 }: LoadingSkeletonProps) {
  return (
    <div className="skeleton">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="skeleton__row">
          {Array.from({ length: columns }).map((_, c) => <div key={c} className="skeleton__cell" />)}
        </div>
      ))}
    </div>
  )
}
