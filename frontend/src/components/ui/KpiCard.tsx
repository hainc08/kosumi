import './KpiCard.css'

interface KpiCardProps {
  label: string; value: string | number; icon?: React.ReactNode
  iconColor?: string; change?: string; changeType?: 'up' | 'down' | 'neutral'
}

export function KpiCard({ label, value, icon, iconColor, change, changeType = 'neutral' }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <div className="kpi-card__top">
        <span className="kpi-card__label">{label}</span>
        {icon && <span className="kpi-card__icon" style={{ color: iconColor }}>{icon}</span>}
      </div>
      <div className="kpi-card__value">{value}</div>
      {change && <div className={`kpi-card__change kpi-card__change--${changeType}`}>{change}</div>}
    </div>
  )
}
