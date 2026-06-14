import './AvatarStack.css'

interface AvatarItem { initials: string; color: string; name?: string }
interface AvatarStackProps { items: AvatarItem[]; max?: number; size?: 'sm' | 'md' }

export function AvatarStack({ items, max = 3, size = 'md' }: AvatarStackProps) {
  const shown = items.slice(0, max)
  const rest = items.length - shown.length
  return (
    <div className={`avatars avatars--${size}`}>
      {shown.map((a, i) => (
        <span key={i} className="avatars__item" style={{ background: a.color }} title={a.name}>{a.initials}</span>
      ))}
      {rest > 0 && <span className="avatars__item avatars__more">+{rest}</span>}
    </div>
  )
}
