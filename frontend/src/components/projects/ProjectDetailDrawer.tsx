import { IconEdit } from '@tabler/icons-react'
import {
  PROJECT_TYPE_LABELS, PROJECT_STATUS_LABELS, type Project, type ProjectStatus,
} from '@/types'
import { formatCurrency, formatDate } from '@/utils/format'
import { deadlineState } from '@/utils/deadline'
import { DetailDrawer } from '@/components/ui/DetailDrawer'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import './ProjectDetailDrawer.css'

export const PROJECT_STATUS_VARIANT: Record<ProjectStatus, BadgeVariant> = {
  planning: 'gray', in_progress: 'blue', near_deadline: 'amber',
  completed: 'green', paused: 'purple', cancelled: 'red',
}

interface Props { project: Project | null; open: boolean; onClose: () => void; onEdit: (p: Project) => void }

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="pd-row"><span className="pd-row__label">{label}</span><span className="pd-row__value">{value || '—'}</span></div>
}

export function ProjectDetailDrawer({ project, open, onClose, onEdit }: Props) {
  if (!project) return null
  const dl = deadlineState(project.deadline)
  const dlBadge = project.status === 'completed' ? null
    : dl === 'overdue' ? <Badge variant="red">Quá hạn</Badge>
    : dl === 'near' ? <Badge variant="amber">Sắp đến hạn</Badge> : null

  return (
    <DetailDrawer
      open={open} onClose={onClose} title="Chi tiết dự án"
      actions={<Button variant="primary" icon={<IconEdit size={15} />} onClick={() => onEdit(project)}>Chỉnh sửa</Button>}
    >
      <div className="pd-head">
        <div>
          <div className="pd-name">{project.name}</div>
          <div className="pd-code">{project.code} · {PROJECT_TYPE_LABELS[project.projectType]}</div>
        </div>
        <Badge variant={PROJECT_STATUS_VARIANT[project.status]} dot>{PROJECT_STATUS_LABELS[project.status]}</Badge>
      </div>

      <div className="pd-progress">
        <div className="pd-progress__top"><span>Tiến độ</span><strong>{project.progressPct}%</strong></div>
        <ProgressBar value={project.progressPct} color={project.progressPct >= 85 ? 'var(--color-green)' : 'var(--color-blue)'} />
      </div>

      <div className="pd-section">Thông tin</div>
      <Row label="Chủ đầu tư" value={project.customer?.name} />
      <Row label="Công trường" value={project.site?.name} />
      <Row label="Giá trị hợp đồng" value={project.contractValue ? formatCurrency(project.contractValue) : '—'} />
      <Row label="Ngày khởi công" value={formatDate(project.startDate)} />
      <Row label="Ngày bàn giao" value={<span>{formatDate(project.deadline)} {dlBadge}</span>} />
      {project.actualEndDate && <Row label="Hoàn thành thực tế" value={formatDate(project.actualEndDate)} />}
      <Row label="Số báo giá" value={project.quoteCount ?? 0} />
      {project.description && <Row label="Mô tả" value={project.description} />}

      <p className="pd-note">Danh sách báo giá & công nhân giao việc sẽ hiển thị khi các module đó hoàn thành.</p>
    </DetailDrawer>
  )
}
