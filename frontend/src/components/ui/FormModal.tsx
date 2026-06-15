import { IconX } from '@tabler/icons-react'
import './FormModal.css'

interface FormModalProps {
  open: boolean; onClose: () => void; title: string; icon?: React.ReactNode
  size?: 'md' | 'lg' | 'xl'; children: React.ReactNode; footer?: React.ReactNode
}

export function FormModal({ open, onClose, title, icon, size = 'md', children, footer }: FormModalProps) {
  if (!open) return null
  return (
    <div className="modal__overlay" onClick={onClose}>
      <div className={`modal modal--${size}`} onClick={(e) => e.stopPropagation()}>
        <header className="modal__header">
          <span className="modal__title">{icon}{title}</span>
          <button className="modal__close" onClick={onClose} aria-label="Đóng"><IconX size={18} /></button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>
  )
}
