import './Badge.css'

export type BadgeVariant = 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'gray'
interface BadgeProps { variant: BadgeVariant; children: React.ReactNode; dot?: boolean }

export function Badge({ variant, children, dot }: BadgeProps) {
  return (
    <span className={`badge badge--${variant}`}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  )
}
