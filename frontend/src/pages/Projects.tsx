import { useMemo, useState } from 'react'
import { IconBuilding, IconHammer, IconAlertTriangle, IconCircleCheck, IconPlus } from '@tabler/icons-react'
import {
  PROJECT_TYPE_LABELS, PROJECT_STATUS_LABELS, type Project, type ProjectStatus,
} from '@/types'
import { useProjects } from '@/api/projects'
import { useSites } from '@/api/sites'
import { useQuotes } from '@/api/quotes'
import { formatDate } from '@/utils/format'
import { deadlineState } from '@/utils/deadline'
import { PageShell } from '@/components/layout/PageShell'
import { KpiCard } from '@/components/ui/KpiCard'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { SearchBox } from '@/components/ui/SearchBox'
import { FilterSelect } from '@/components/ui/FilterSelect'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { ProjectDetailDrawer, PROJECT_STATUS_VARIANT } from '@/components/projects/ProjectDetailDrawer'
import './Projects.css'

const isActiveStatus = (s: ProjectStatus) => s !== 'completed' && s !== 'cancelled'

export default function ProjectsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [siteId, setSiteId] = useState('')
  const [quoteCode, setQuoteCode] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [selected, setSelected] = useState<Project | null>(null)

  const { data: sites = [] } = useSites()
  const { data: quotes = [] } = useQuotes({})
  const { data: all = [] } = useProjects({})
  const { data: projects = [], isLoading } = useProjects({ search, status, siteId, quoteCode })

  const kpis = useMemo(() => ({
    total: all.length,
    running: all.filter((p) => p.status === 'in_progress' || p.status === 'near_deadline').length,
    nearDue: all.filter((p) => isActiveStatus(p.status) && deadlineState(p.deadline) !== 'ok').length,
    done: all.filter((p) => p.status === 'completed').length,
  }), [all])

  const columns: Column<Project>[] = [
    {
      key: 'name', header: 'Dự án',
      render: (p) => (
        <div><div className="cell-prj__name">{p.name}</div><div className="cell-prj__code">{p.code}</div></div>
      ),
    },
    { key: 'customer', header: 'Khách hàng', render: (p) => p.customer?.name ?? '—' },
    {
      key: 'quotes', header: 'Báo giá',
      render: (p) => (p.quotes && p.quotes.length)
        ? <div className="cell-prj__quotes">{p.quotes.map((q) => <span key={q.id} title={q.title}><Badge variant="gray">{q.code}</Badge></span>)}</div>
        : <span className="cell-prj__muted">—</span>,
    },
    { key: 'type', header: 'Loại', render: (p) => PROJECT_TYPE_LABELS[p.projectType] },
    { key: 'site', header: 'Xưởng', render: (p) => p.site?.name ?? '—' },
    {
      key: 'progress', header: 'Tiến độ', width: '140px',
      render: (p) => <ProgressBar value={p.progressPct} showLabel size="sm"
        color={p.progressPct >= 85 ? 'var(--color-green)' : 'var(--color-blue)'} />,
    },
    {
      key: 'deadline', header: 'Ngày bàn giao',
      render: (p) => {
        const dl = isActiveStatus(p.status) ? deadlineState(p.deadline) : 'ok'
        return (
          <span className="cell-prj__deadline">
            {formatDate(p.deadline)}
            {dl === 'overdue' && <Badge variant="red">Quá hạn</Badge>}
            {dl === 'near' && <Badge variant="amber">Sắp hạn</Badge>}
          </span>
        )
      },
    },
    { key: 'status', header: 'Trạng thái', render: (p) => <Badge variant={PROJECT_STATUS_VARIANT[p.status]} dot>{PROJECT_STATUS_LABELS[p.status]}</Badge> },
  ]

  const openAdd = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (p: Project) => { setSelected(null); setEditing(p); setFormOpen(true) }

  return (
    <PageShell
      title="Dự án" subtitle="Theo dõi tiến độ"
      actions={<Button variant="primary" icon={<IconPlus size={15} />} onClick={openAdd}>Thêm dự án</Button>}
    >
      <div className="kpi-row">
        <KpiCard label="Tổng dự án" value={kpis.total} icon={<IconBuilding size={16} />} iconColor="var(--color-blue)" />
        <KpiCard label="Đang thi công" value={kpis.running} icon={<IconHammer size={16} />} iconColor="var(--color-green)" />
        <KpiCard label="Sắp đến hạn" value={kpis.nearDue} icon={<IconAlertTriangle size={16} />} iconColor="var(--color-amber)" />
        <KpiCard label="Hoàn thành" value={kpis.done} icon={<IconCircleCheck size={16} />} iconColor="var(--color-purple)" />
      </div>

      <div className="toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Tìm tên, mã dự án..." width="240px" />
        <FilterSelect value={status} onChange={setStatus} placeholder="Tất cả trạng thái"
          options={(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((k) => ({ value: k, label: PROJECT_STATUS_LABELS[k] }))} />
        <FilterSelect value={siteId} onChange={setSiteId} placeholder="Tất cả xưởng"
          options={sites.map((s) => ({ value: s.id, label: s.name }))} />
        <FilterSelect value={quoteCode} onChange={setQuoteCode} placeholder="Tất cả báo giá"
          options={quotes.map((q) => ({ value: q.code, label: q.code }))} />
      </div>

      <DataTable
        columns={columns} data={projects} loading={isLoading} rowKey={(p) => p.id}
        onRowClick={(p) => setSelected(p)} emptyText="Không tìm thấy dự án"
      />

      <ProjectForm open={formOpen} project={editing} onClose={() => setFormOpen(false)} />
      <ProjectDetailDrawer project={selected} open={!!selected} onClose={() => setSelected(null)} onEdit={openEdit} />
    </PageShell>
  )
}
