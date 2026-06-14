import './ProgressBar.css'

interface ProgressBarProps { value: number; color?: string; showLabel?: boolean; size?: 'sm' | 'md' }

export function ProgressBar({ value, color = 'var(--color-blue)', showLabel, size = 'md' }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={`progress progress--${size}`}>
      <div className="progress__track">
        <div className="progress__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      {showLabel && <span className="progress__label">{pct}%</span>}
    </div>
  )
}
