import { IconEdit } from '@tabler/icons-react'
import {
  WORKER_STATUS_LABELS, PRIMARY_SKILL_LABELS, CONTRACT_TYPE_LABELS, type Worker, type WorkerStatus,
} from '@/types'
import { estimateMonthlyPay } from '@/utils/pay-calculator'
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
  const estimate = c ? estimateMonthlyPay({
    contractType: c.contractType, rateNormal: c.rateNormal ?? undefined,
    baseSalary: c.baseSalary ?? undefined, allowance: c.allowance ?? undefined,
  }) : 0

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title="Chi tiết công nhân"
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
      <Row label="Kỹ năng chính" value={PRIMARY_SKILL_LABELS[worker.primarySkill]} />
      <Row label="Số năm kinh nghiệm" value={`${worker.experienceYears} năm`} />
      <Row label="Xưởng" value={worker.site?.name} />
      <Row label="Giới tính" value={worker.gender === 'male' ? 'Nam' : 'Nữ'} />
      <Row label="Ngày sinh" value={formatDate(worker.dateOfBirth)} />
      <Row label="CCCD" value={worker.idNumber} />
      <Row label="Số điện thoại" value={worker.phone} />
      <Row label="Địa chỉ" value={worker.address} />

      <div className="wd-section">Hợp đồng & Tiền công</div>
      {c ? (
        <>
          <Row label="Loại hợp đồng" value={<Badge variant="blue">{CONTRACT_TYPE_LABELS[c.contractType]}</Badge>} />
          <Row label="Ngày bắt đầu" value={formatDate(c.startDate)} />
          {(c.contractType === 'hourly' || c.contractType === 'daily') && (
            <>
              <Row label="Đơn giá thường" value={c.rateNormal ? formatCurrency(c.rateNormal) : '—'} />
              <Row label="Đơn giá OT" value={c.rateOvertime ? formatCurrency(c.rateOvertime) : '—'} />
            </>
          )}
          {c.contractType === 'monthly' && (
            <>
              <Row label="Lương cơ bản" value={c.baseSalary ? formatCurrency(c.baseSalary) : '—'} />
              <Row label="Phụ cấp" value={c.allowance ? formatCurrency(c.allowance) : '—'} />
            </>
          )}
          {c.contractType === 'piece' && (
            <Row label="Đơn giá khoán" value={c.ratePerUnit ? `${formatCurrency(c.ratePerUnit)} / ${c.unitName}` : '—'} />
          )}
          {estimate > 0 && <Row label="Ước tính lương tháng" value={<strong>{formatCurrency(estimate)}</strong>} />}
        </>
      ) : <p className="wd-empty">Chưa có hợp đồng.</p>}

      <p className="wd-note">Lịch sử chấm công sẽ hiển thị ở module Chấm công.</p>
    </DetailDrawer>
  )
}
