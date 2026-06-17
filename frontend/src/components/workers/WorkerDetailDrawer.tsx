import { IconEdit } from '@tabler/icons-react'
import {
  WORKER_STATUS_LABELS, POSITION_LABELS, CONTRACT_TYPE_LABELS, type Worker, type WorkerStatus,
} from '@/types'
import { formatCurrency, formatDate } from '@/utils/format'
import { DetailDrawer } from '@/components/ui/DetailDrawer'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import './WorkerDetailDrawer.css'

const STATUS_VARIANT: Record<WorkerStatus, BadgeVariant> = {
  working: 'green', on_leave: 'amber', absent: 'red', resigned: 'gray',
}

interface Props { worker: Worker | null; open: boolean; onClose: () => void; onEdit: (w: Worker) => void }

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="wd-row">
      <span className="wd-row__label">{label}</span>
      <span className="wd-row__value">{value || '—'}</span>
    </div>
  )
}

export function WorkerDetailDrawer({ worker, open, onClose, onEdit }: Props) {
  if (!worker) return null
  const c = worker.activeContract

  const totalMonthly = c
    ? (c.baseSalary ?? 0) + (c.allowanceResponsibility ?? 0) + (c.allowanceAttendance ?? 0)
    : 0

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title="Chi tiết nhân viên"
      actions={<Button variant="primary" icon={<IconEdit size={15} />} onClick={() => onEdit(worker)}>Chỉnh sửa</Button>}
    >
      <div className="wd-head">
        <span className="wd-avatar" style={{ background: worker.avatarColor }}>{worker.initials}</span>
        <div>
          <div className="wd-name">{worker.fullName}</div>
          <div className="wd-code">{worker.code}</div>
        </div>
        <Badge variant={STATUS_VARIANT[worker.status]} dot>{WORKER_STATUS_LABELS[worker.status]}</Badge>
      </div>

      <div className="wd-section">Thông tin cá nhân</div>
      <Row label="Chức vụ" value={POSITION_LABELS[worker.position]} />
      <Row label="Chuyên môn" value={worker.specialty} />
      <Row label="Giới tính" value={worker.gender === 'male' ? 'Nam' : 'Nữ'} />
      <Row label="Ngày sinh" value={formatDate(worker.dateOfBirth)} />
      <Row label="CCCD" value={worker.idNumber} />
      <Row label="Số điện thoại" value={worker.phone} />
      <Row label="Địa chỉ" value={worker.address} />

      <div className="wd-section">Hợp đồng &amp; Tiền lương</div>
      {c ? (
        <>
          <Row label="Loại hợp đồng" value={<Badge variant="blue">{CONTRACT_TYPE_LABELS[c.contractType]}</Badge>} />
          <Row label="Ngày bắt đầu" value={formatDate(c.startDate)} />

          {(c.contractType === 'official' || c.contractType === 'probation') && (
            <>
              <Row label="Lương cơ bản" value={c.baseSalary ? formatCurrency(c.baseSalary) : '—'} />
              <Row label="Phụ cấp trách nhiệm" value={c.allowanceResponsibility ? formatCurrency(c.allowanceResponsibility) : '—'} />
              <Row label="Phụ cấp chuyên cần" value={c.allowanceAttendance ? formatCurrency(c.allowanceAttendance) : '—'} />
              {totalMonthly > 0 && <Row label="Tổng thu nhập / tháng" value={<strong>{formatCurrency(totalMonthly)}</strong>} />}
            </>
          )}

          {c.contractType === 'piece_rate' && (
            <Row label="Đơn giá khoán" value={c.ratePerUnit ? `${formatCurrency(c.ratePerUnit)} / ${c.unitName}` : '—'} />
          )}
        </>
      ) : <p className="wd-empty">Chưa có hợp đồng.</p>}

      <p className="wd-note">Lịch sử chấm công sẽ hiển thị ở module Chấm công.</p>
    </DetailDrawer>
  )
}
