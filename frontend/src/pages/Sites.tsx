import { useMemo, useState } from 'react'
import { IconBuildingFactory2, IconUsers, IconBuilding, IconPlus } from '@tabler/icons-react'
import {
  SITE_TYPE_LABELS, SITE_STATUS_LABELS, type Site, type SiteStatus, type SiteType,
} from '@/types'
import { useSites } from '@/api/sites'
import { useWorkers } from '@/api/workers'
import { PageShell } from '@/components/layout/PageShell'
import { KpiCard } from '@/components/ui/KpiCard'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { SearchBox } from '@/components/ui/SearchBox'
import { FilterSelect } from '@/components/ui/FilterSelect'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AvatarStack } from '@/components/ui/AvatarStack'
import { SiteForm } from '@/components/sites/SiteForm'
import { SiteDetailDrawer, SITE_STATUS_VARIANT } from '@/components/sites/SiteDetailDrawer'
import './Sites.css'

const TYPE_VARIANT = 'blue' as const

export default function SitesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Site | null>(null)
  const [selected, setSelected] = useState<Site | null>(null)

  const { data: all = [] } = useSites({})
  const { data: sites = [], isLoading } = useSites({ search, status, type })
  const { data: workers = [] } = useWorkers({})

  const workersBySite = useMemo(() => {
    const map = new Map<string, typeof workers>()
    workers.forEach((w) => { const k = w.siteId ?? ''; const a = map.get(k) ?? []; a.push(w); map.set(k, a) })
    return map
  }, [workers])

  const kpis = useMemo(() => ({
    total: all.length,
    active: all.filter((s) => s.status === 'active').length,
    workers: all.reduce((sum, s) => sum + (s.workerCount ?? 0), 0),
    projects: all.reduce((sum, s) => sum + (s.projectCount ?? 0), 0),
  }), [all])

  const columns: Column<Site>[] = [
    {
      key: 'name', header: 'Tên công trường',
      render: (s) => (
        <div><div className="cell-site__name">{s.name}</div><div className="cell-site__code">{s.code} · {s.industrialZone || '—'}</div></div>
      ),
    },
    { key: 'location', header: 'Địa điểm', render: (s) => s.city || s.address },
    { key: 'type', header: 'Loại', render: (s) => <Badge variant={TYPE_VARIANT}>{SITE_TYPE_LABELS[s.type]}</Badge> },
    {
      key: 'workers', header: 'Nhân viên',
      render: (s) => {
        const list = workersBySite.get(s.id) ?? []
        return list.length
          ? <AvatarStack items={list.map((w) => ({ initials: w.initials, color: w.avatarColor, name: w.fullName }))} max={3} size="sm" />
          : <span className="cell-site__muted">—</span>
      },
    },
    { key: 'projects', header: 'Dự án', render: (s) => `${s.projectCount ?? 0} dự án` },
    { key: 'status', header: 'Trạng thái', render: (s) => <Badge variant={SITE_STATUS_VARIANT[s.status]} dot>{SITE_STATUS_LABELS[s.status]}</Badge> },
  ]

  const openAdd = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (s: Site) => { setSelected(null); setEditing(s); setFormOpen(true) }

  return (
    <PageShell
      title="Công trường / Xưởng" subtitle="Quản lý địa điểm sản xuất"
      actions={<Button variant="primary" icon={<IconPlus size={15} />} onClick={openAdd}>Thêm mới</Button>}
    >
      <div className="kpi-row kpi-row--3">
        <KpiCard label="Tổng công trường" value={kpis.total} icon={<IconBuildingFactory2 size={16} />} iconColor="var(--color-blue)" change={`${kpis.active} đang hoạt động`} />
        <KpiCard label="Tổng nhân viên" value={kpis.workers} icon={<IconUsers size={16} />} iconColor="var(--color-green)" change={`Phân bổ ${kpis.total} địa điểm`} />
        <KpiCard label="Dự án đang chạy" value={kpis.projects} icon={<IconBuilding size={16} />} iconColor="var(--color-amber)" />
      </div>

      <div className="toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Tìm tên, mã, địa điểm..." width="240px" />
        <FilterSelect value={type} onChange={setType} placeholder="Tất cả loại"
          options={(Object.keys(SITE_TYPE_LABELS) as SiteType[]).map((k) => ({ value: k, label: SITE_TYPE_LABELS[k] }))} />
        <FilterSelect value={status} onChange={setStatus} placeholder="Tất cả trạng thái"
          options={(Object.keys(SITE_STATUS_LABELS) as SiteStatus[]).map((k) => ({ value: k, label: SITE_STATUS_LABELS[k] }))} />
      </div>

      <DataTable
        columns={columns} data={sites} loading={isLoading} rowKey={(s) => s.id}
        onRowClick={(s) => setSelected(s)} emptyText="Không tìm thấy công trường"
      />

      <SiteForm open={formOpen} site={editing} onClose={() => setFormOpen(false)} />
      <SiteDetailDrawer site={selected} open={!!selected} onClose={() => setSelected(null)} onEdit={openEdit} />
    </PageShell>
  )
}
