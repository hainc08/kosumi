import { useMemo, useState } from 'react'
import { IconUsers, IconUserCheck, IconUserOff, IconTrendingUp, IconUserPlus } from '@tabler/icons-react'
import {
  POSITION_LABELS, WORKER_STATUS_LABELS, CONTRACT_TYPE_LABELS,
  type Worker, type WorkerStatus,
} from '@/types'
import { useWorkers } from '@/api/workers'
import { formatCurrency } from '@/utils/format'
import { PageShell } from '@/components/layout/PageShell'
import { KpiCard } from '@/components/ui/KpiCard'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { SearchBox } from '@/components/ui/SearchBox'
import { FilterSelect } from '@/components/ui/FilterSelect'
import { Button } from '@/components/ui/Button'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { WorkerForm } from '@/components/workers/WorkerForm'
import { WorkerDetailDrawer } from '@/components/workers/WorkerDetailDrawer'
import './Workers.css'

const STATUS_VARIANT: Record<WorkerStatus, BadgeVariant> = {
  working: 'green', on_leave: 'amber', absent: 'red', resigned: 'gray',
}

function rateLabel(w: Worker): string {
  const c = w.activeContract
  if (!c) return '—'
  if (c.contractType === 'piece_rate') return c.ratePerUnit ? `${formatCurrency(c.ratePerUnit)}/${c.unitName ?? 'đv'}` : '—'
  return c.baseSalary ? `${formatCurrency(c.baseSalary)}/tháng` : '—'
}

export default function WorkersPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [position, setPosition] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Worker | null>(null)
  const [selected, setSelected] = useState<Worker | null>(null)

  const { data: all = [] } = useWorkers({})
  const { data: workers = [], isLoading } = useWorkers({ search, status, position })

  const kpis = useMemo(() => ({
    total: all.length,
    working: all.filter((w) => w.status === 'working').length,
    off: all.filter((w) => w.status === 'on_leave' || w.status === 'absent').length,
  }), [all])

  const columns: Column<Worker>[] = [
    {
      key: 'fullName', header: 'Công nhân',
      render: (w) => (
        <div className="cell-worker">
          <span className="cell-worker__avatar" style={{ background: w.avatarColor }}>{w.initials}</span>
          <div>
            <div className="cell-worker__name">{w.fullName}</div>
            <div className="cell-worker__code">{w.code}</div>
          </div>
        </div>
      ),
    },
    { key: 'position', header: 'Chức vụ', render: (w) => POSITION_LABELS[w.position] },
    { key: 'exp', header: 'KN', render: (w) => `${w.experienceYears} năm` },
    { key: 'contract', header: 'Loại HĐ', render: (w) => w.activeContract ? <Badge variant="blue">{CONTRACT_TYPE_LABELS[w.activeContract.contractType]}</Badge> : '—' },
    { key: 'rate', header: 'Lương/tháng', render: rateLabel },
    { key: 'status', header: 'Trạng thái', render: (w) => <Badge variant={STATUS_VARIANT[w.status]} dot>{WORKER_STATUS_LABELS[w.status]}</Badge> },
  ]

  const openAdd = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (w: Worker) => { setSelected(null); setEditing(w); setFormOpen(true) }

  return (
    <PageShell
      title="Công nhân" subtitle="Nhân sự xưởng"
      actions={<Button variant="primary" icon={<IconUserPlus size={15} />} onClick={openAdd}>Thêm công nhân</Button>}
    >
      <div className="kpi-row">
        <KpiCard label="Tổng công nhân" value={kpis.total} icon={<IconUsers size={16} />} iconColor="var(--color-blue)" />
        <KpiCard label="Đang làm việc" value={kpis.working} icon={<IconUserCheck size={16} />} iconColor="var(--color-green)" />
        <KpiCard label="Nghỉ / Vắng" value={kpis.off} icon={<IconUserOff size={16} />} iconColor="var(--color-amber)" />
        <KpiCard label="Hiệu suất TB" value="—" icon={<IconTrendingUp size={16} />} iconColor="var(--color-purple)" />
      </div>

      <div className="toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Tìm theo tên, mã..." width="240px" />
        <FilterSelect value={status} onChange={setStatus} placeholder="Tất cả trạng thái"
          options={(Object.keys(WORKER_STATUS_LABELS) as WorkerStatus[]).map((k) => ({ value: k, label: WORKER_STATUS_LABELS[k] }))} />
        <FilterSelect value={position} onChange={setPosition} placeholder="Tất cả chức vụ"
          options={Object.entries(POSITION_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
      </div>

      <DataTable
        columns={columns} data={workers} loading={isLoading} rowKey={(w) => w.id}
        onRowClick={(w) => setSelected(w)} emptyText="Không tìm thấy công nhân"
      />

      <WorkerForm open={formOpen} worker={editing} onClose={() => setFormOpen(false)} />
      <WorkerDetailDrawer worker={selected} open={!!selected} onClose={() => setSelected(null)} onEdit={openEdit} />
    </PageShell>
  )
}
