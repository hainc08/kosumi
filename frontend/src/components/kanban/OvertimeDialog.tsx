import { useState } from 'react'
import { FormModal } from '@/components/ui/FormModal'
import { FormField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'

interface Props { open: boolean; onCancel: () => void; onConfirm: (otHours: number) => void }

/** Dialog nhập số giờ tăng ca (giao việc sau 17:00). OT tính từ 17:15. */
export function OvertimeDialog({ open, onCancel, onConfirm }: Props) {
  const [hours, setHours] = useState('2')
  const n = Number(hours)
  const valid = !Number.isNaN(n) && n > 0 && n <= 6
  return (
    <FormModal open={open} onClose={onCancel} size="md" title="Xin tăng ca"
      footer={<>
        <Button onClick={onCancel}>Hủy</Button>
        <Button variant="primary" disabled={!valid} onClick={() => onConfirm(n)}>Xác nhận tăng ca</Button>
      </>}>
      <p style={{ marginBottom: 12, color: 'var(--color-text-2)' }}>
        Đang giao việc sau 17:00. Giờ tăng ca tính từ <strong>17:15</strong>; nhập số giờ, nhân viên sẽ tự về trạng thái chờ sau khi hết giờ.
      </p>
      <FormField label="Số giờ tăng ca">
        <input inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} />
      </FormField>
    </FormModal>
  )
}
