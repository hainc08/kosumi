import { IconX } from '@tabler/icons-react'
import './DetailDrawer.css'

interface DetailDrawerProps {
  open: boolean; onClose: () => void; title: string
  children: React.ReactNode; actions?: React.ReactNode; width?: 'sm' | 'md'
}

export function DetailDrawer({ open, onClose, title, children, actions, width = 'md' }: DetailDrawerProps) {
  if (!open) return null
  return (
    <div className="drawer__overlay" onClick={onClose}>
      <aside className={`drawer drawer--${width}`} onClick={(e) => e.stopPropagation()}>
        <header className="drawer__header">
          <span className="drawer__title">{title}</span>
          <button className="drawer__close" onClick={onClose} aria-label="Đóng"><IconX size={18} /></button>
        </header>
        <div className="drawer__body">{children}</div>
        {actions && <footer className="drawer__footer">{actions}</footer>}
      </aside>
    </div>
  )
}
