import { useMemo } from 'react'
import {
  IconBuildingFactory2, IconUsers, IconBuildingWarehouse, IconCurrencyDong, IconChecklist,
} from '@tabler/icons-react'
import { useSites } from '@/api/sites'
import { useWorkers } from '@/api/workers'
import { useProjects } from '@/api/projects'
import { useQuotes } from '@/api/quotes'
import { useWorkerAllocation } from '@/api/tasks'
import { formatCurrency } from '@/utils/format'
import { PageShell } from '@/components/layout/PageShell'
import { KpiCard } from '@/components/ui/KpiCard'
import { RevenueBarChart } from '@/components/dashboard/RevenueBarChart'
import './Dashboard.css'

const RUNNING = ['in_progress', 'near_deadline']
const PAUSED = ['paused', 'planning']

export default function DashboardPage() {
  const { data: sites = [] } = useSites({})
  const { data: workers = [] } = useWorkers({})
  const { data: projects = [] } = useProjects()
  const { data: quotes = [] } = useQuotes({})
  const { data: allocation = [] } = useWorkerAllocation()

  const year = new Date().getFullYear()

  // ── Dự án: Nhà máy = tất cả; Công trường = dự án có lắp đặt ──
  const projectStats = useMemo(() => {
    const grp = (list: typeof projects) => ({
      total: list.length,
      running: list.filter((p) => RUNNING.includes(p.status)).length,
      paused: list.filter((p) => PAUSED.includes(p.status)).length,
    })
    return {
      factory: grp(projects),
      construction: grp(projects.filter((p) => p.hasInstallation)),
    }
  }, [projects])

  // ── Công nhân theo nơi làm / nghỉ ──
  const workerStats = useMemo(() => {
    const siteType = new Map(sites.map((s) => [s.id, s.type]))
    return {
      total: workers.filter((w) => w.status !== 'resigned').length,
      atConstruction: workers.filter((w) => w.status === 'working' && w.siteId && siteType.get(w.siteId) === 'construction').length,
      atFactory: workers.filter((w) => w.status === 'working' && w.siteId && siteType.get(w.siteId) === 'factory').length,
      off: workers.filter((w) => w.status === 'on_leave' || w.status === 'absent').length,
    }
  }, [workers, sites])

  // ── Doanh thu (báo giá đã duyệt) ──
  const revenue = useMemo(() => {
    const approved = quotes.filter((q) => q.status === 'approved' || q.status === 'po_received')
    const yearTotal = approved
      .filter((q) => new Date(q.quoteDate).getFullYear() === year)
      .reduce((s, q) => s + (q.totalAmount || 0), 0)

    const byMonth = Array.from({ length: 12 }, (_, m) => ({ label: `T${m + 1}`, value: 0 }))
    approved.forEach((q) => {
      const d = new Date(q.quoteDate)
      if (d.getFullYear() === year) byMonth[d.getMonth()].value += q.totalAmount || 0
    })

    const yMap = new Map<number, number>()
    approved.forEach((q) => {
      const y = new Date(q.quoteDate).getFullYear()
      yMap.set(y, (yMap.get(y) || 0) + (q.totalAmount || 0))
    })
    const byYear = [...yMap.entries()].sort((a, b) => a[0] - b[0]).map(([y, v]) => ({ label: String(y), value: v }))

    return { yearTotal, byMonth, byYear }
  }, [quotes, year])

  return (
    <PageShell title="Dashboard" subtitle="Tổng quan Kosumi Management Software">
      {/* KPI tổng */}
      <div className="kpi-row">
        <KpiCard label={`Doanh thu năm ${year}`} value={formatCurrency(revenue.yearTotal)} icon={<IconCurrencyDong size={16} />} iconColor="var(--color-purple)" change="Báo giá đã duyệt" />
        <KpiCard label="Dự án (nhà máy)" value={projectStats.factory.total} icon={<IconBuildingFactory2 size={16} />} iconColor="var(--color-blue)" change={`${projectStats.factory.running} đang triển khai`} />
        <KpiCard label="Dự án có lắp đặt (công trường)" value={projectStats.construction.total} icon={<IconBuildingWarehouse size={16} />} iconColor="var(--color-amber)" change={`${projectStats.construction.running} đang triển khai`} />
        <KpiCard label="Tổng công nhân" value={workerStats.total} icon={<IconUsers size={16} />} iconColor="var(--color-green)" change={`${workerStats.off} đang nghỉ`} />
      </div>

      {/* Công trường / Nhà máy / Công nhân */}
      <div className="dash-grid3">
        <div className="dash-card dash-card--pad">
          <div className="dash-mini-title"><IconBuildingWarehouse size={14} color="var(--color-amber)" /> Công trường (có lắp đặt)</div>
          <div className="dash-stat-grid">
            <div className="dash-stat"><div className="dash-stat__val">{projectStats.construction.total}</div><div className="dash-stat__label">Tổng dự án</div></div>
            <div className="dash-stat"><div className="dash-stat__val" style={{ color: 'var(--color-blue)' }}>{projectStats.construction.running}</div><div className="dash-stat__label">Đang triển khai</div></div>
            <div className="dash-stat"><div className="dash-stat__val" style={{ color: 'var(--color-text-3)' }}>{projectStats.construction.paused}</div><div className="dash-stat__label">Tạm dừng / chưa bắt đầu</div></div>
          </div>
        </div>
        <div className="dash-card dash-card--pad">
          <div className="dash-mini-title"><IconBuildingFactory2 size={14} color="var(--color-blue)" /> Nhà máy (tất cả dự án)</div>
          <div className="dash-stat-grid">
            <div className="dash-stat"><div className="dash-stat__val">{projectStats.factory.total}</div><div className="dash-stat__label">Tổng dự án</div></div>
            <div className="dash-stat"><div className="dash-stat__val" style={{ color: 'var(--color-blue)' }}>{projectStats.factory.running}</div><div className="dash-stat__label">Đang triển khai</div></div>
            <div className="dash-stat"><div className="dash-stat__val" style={{ color: 'var(--color-text-3)' }}>{projectStats.factory.paused}</div><div className="dash-stat__label">Tạm dừng / chưa bắt đầu</div></div>
          </div>
        </div>
        <div className="dash-card dash-card--pad">
          <div className="dash-mini-title"><IconUsers size={14} color="var(--color-green)" /> Công nhân</div>
          <div className="dash-stat-grid">
            <div className="dash-stat"><div className="dash-stat__val">{workerStats.total}</div><div className="dash-stat__label">Tổng</div></div>
            <div className="dash-stat"><div className="dash-stat__val" style={{ color: 'var(--color-amber)' }}>{workerStats.atConstruction}</div><div className="dash-stat__label">Tại công trường</div></div>
            <div className="dash-stat"><div className="dash-stat__val" style={{ color: 'var(--color-blue)' }}>{workerStats.atFactory}</div><div className="dash-stat__label">Tại nhà máy</div></div>
            <div className="dash-stat"><div className="dash-stat__val" style={{ color: 'var(--color-red)' }}>{workerStats.off}</div><div className="dash-stat__label">Đang nghỉ</div></div>
          </div>
        </div>
      </div>

      {/* Công nhân theo hạng mục */}
      <div className="dash-card dash-card--pad">
        <div className="dash-mini-title"><IconChecklist size={14} color="var(--color-purple)" /> Công nhân theo hạng mục</div>
        <ul className="dash-alloc">
          {allocation.map((a) => (
            <li key={a.taskId} className="dash-alloc__row">
              <span className="dash-alloc__path">
                {a.projectName}<span className="dash-alloc__sep"> / </span>{a.section || '—'}<span className="dash-alloc__sep"> / </span>{a.title}
              </span>
              <strong className="dash-alloc__count">{a.workerCount} người</strong>
            </li>
          ))}
          {allocation.length === 0 && <li className="dash-empty">Chưa có công nhân đang làm việc</li>}
        </ul>
      </div>

      {/* Biểu đồ doanh thu */}
      <div className="dash-split">
        <div className="dash-card dash-card--pad">
          <div className="dash-mini-title">Doanh thu theo tháng — năm {year}</div>
          <RevenueBarChart data={revenue.byMonth} color="var(--color-blue)" />
        </div>
        <div className="dash-card dash-card--pad">
          <div className="dash-mini-title">Doanh thu theo các năm</div>
          <RevenueBarChart data={revenue.byYear} color="var(--color-purple)" />
        </div>
      </div>
    </PageShell>
  )
}
