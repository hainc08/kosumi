import './ConfirmDialog.css'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean; title: string; message: string; confirmLabel?: string
  variant?: 'danger' | 'default'; onConfirm: () => void; onCancel: () => void
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Xác nhận', variant = 'default', onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null
  return (
    <div className="confirm__overlay" onClick={onCancel}>
      <div className="confirm" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm__title">{title}</h3>
        <p className="confirm__msg">{message}</p>
        <div className="confirm__actions">
          <Button onClick={onCancel}>Hủy</Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
