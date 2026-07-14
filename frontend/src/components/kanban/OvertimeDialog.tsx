import { useState } from 'react'
import { FormModal } from '@/components/ui/FormModal'
import { Button } from '@/components/ui/Button'

export interface OtWorker { id: string; fullName: string; initials: string; avatarColor: string }

interface Props {
  open: boolean
  workers: OtWorker[]
  onCancel: () => void
  onConfirm: (otHoursByWorker: Record<string, number>) => void
}

/** Dialog nhập số giờ tăng ca RIÊNG từng NV (giao việc sau giờ tan ca). OT tính từ 17:15. */
export function OvertimeDialog({ open, workers, onCancel, onConfirm }: Props) {
  const [hours, setHours] = useState<Record<string, string>>({})
  const valueOf = (id: string) => hours[id] ?? '2'
  const parsed = (id: string) => Number(valueOf(id))
  const validOne = (id: string) => { const n = parsed(id); return !Number.isNaN(n) && n >= 0.5 && n <= 6 }
  const allValid = workers.length > 0 && workers.every((w) => validOne(w.id))
  const confirm = () => {
    const map: Record<string, number> = {}
    for (const w of workers) map[w.id] = parsed(w.id)
    onConfirm(map)
  }
  return (
    <FormModal open={open} onClose={onCancel} size="md" title="Xin tăng ca"
      footer={<>
        <Button onClick={onCancel}>Hủy</Button>
        <Button variant="primary" disabled={!allValid} onClick={confirm}>Xác nhận tăng ca</Button>
      </>}>
      <p style={{ marginBottom: 12, color: 'var(--color-text-2)' }}>
        Đang giao việc sau giờ tan ca. Giờ tăng ca tính từ <strong>17:15</strong>; nhập số giờ cho từng nhân viên — hết giờ họ tự về trạng thái chờ.
      </p>
      <div className="ot-list">
        {workers.map((w) => (
          <div key={w.id} className="ot-row">
            <span className="ot-row__av" style={{ background: w.avatarColor }}>{w.initials}</span>
            <span className="ot-row__name">{w.fullName}</span>
            <input className="ot-row__input" inputMode="decimal" value={valueOf(w.id)}
              onChange={(e) => setHours((prev) => ({ ...prev, [w.id]: e.target.value }))}
              aria-invalid={!validOne(w.id)} />
            <span className="ot-row__unit">giờ</span>
          </div>
        ))}
      </div>
    </FormModal>
  )
}
