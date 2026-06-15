import { DAY_TYPE_LABELS, type DayType, type MonthlySummary } from '@/types'
import { DetailDrawer } from '@/components/ui/DetailDrawer'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useTimesheetEntries } from '@/api/timesheet'
import { formatCurrency, formatDate, formatHours } from '@/utils/format'
import './TimesheetDetailDrawer.css'

export const DAY_TYPE_VARIANT: Record<DayType, BadgeVariant> = {
  workday: 'green', leave_paid: 'amber', leave_unpaid: 'gray', holiday: 'blue', absent: 'red',
}

interface Props {
  summary: MonthlySummary | null
  open: boolean
  onClose: () => void
  onApprove?: (s: MonthlySummary) => void
}

export function TimesheetDetailDrawer({ summary, open, onClose, onApprove }: Props) {
  const { data: entries = [] } = useTimesheetEntries(summary?.workerId ?? null, summary?.yearMonth ?? '')
  if (!summary) return null

  return (
    <DetailDrawer
      open={open} onClose={onClose}
      title={`Chấm công · ${summary.worker?.fullName ?? ''}`}
      actions={summary.status === 'submitted' && onApprove
        ? <Button variant="primary" onClick={() => onApprove(summary)}>Duyệt bảng công</Button>
        : undefined}
    >
      <div className="tsd-grid">
        <div className="tsd-stat"><span>Ngày công</span><strong>{summary.totalWorkdays}</strong></div>
        <div className="tsd-stat"><span>Giờ thường</span><strong>{formatHours(summary.totalRegularHours)}</strong></div>
        <div className="tsd-stat"><span>Giờ OT</span><strong>{formatHours(summary.totalOtHours)}</strong></div>
        <div className="tsd-stat"><span>Nghỉ / Vắng</span><strong>{summary.totalLeaveDays} / {summary.totalAbsentDays}</strong></div>
      </div>
      <div className="tsd-total">
        <span>Thực lĩnh tháng</span>
        <strong>{formatCurrency(summary.totalPay)}</strong>
      </div>

      <div className="tsd-section">Chi tiết theo ngày</div>
      <div className="tsd-rows">
        {entries.map((e) => (
          <div key={e.id} className="tsd-row">
            <span className="tsd-row__date">{formatDate(e.workDate)}</span>
            <Badge variant={DAY_TYPE_VARIANT[e.dayType]} dot>{DAY_TYPE_LABELS[e.dayType]}</Badge>
            <span className="tsd-row__hours">{e.regularHours}h{e.overtimeHours ? ` +${e.overtimeHours}h OT` : ''}</span>
            <span className="tsd-row__pay">{formatCurrency(e.payAmount)}</span>
          </div>
        ))}
      </div>
    </DetailDrawer>
  )
}
