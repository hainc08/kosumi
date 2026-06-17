import { useMemo } from 'react'
import { format } from 'date-fns'
import {
  IconBuildingFactory2, IconUsers, IconBuilding, IconFileInvoice, IconActivity,
} from '@tabler/icons-react'
import { useSites } from '@/api/sites'
import { useWorkers } from '@/api/workers'
import { useProjects } from '@/api/projects'
import { useQuotes } from '@/api/quotes'
import { useActiveTasks } from '@/api/tasks'
import { deadlineState } from '@/utils/deadline'
import { PageShell } from '@/components/layout/PageShell'
import { KpiCard } from '@/components/ui/KpiCard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import './Dashboard.css'

type Activity = { time: string; title: string; tone: 'done' | 'pending' | 'open' }

function relTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const yest = new Date(now); yest.setDate(now.getDate() - 1)
  const hm = format(d, 'HH:mm')
  if (d.toDateString() === now.toDateString()) return `${hm} hôm nay`
  if (d.toDateString() === yest.toDateString()) return `Hôm qua ${hm}`
  return format(d, 'dd/MM/yyyy')
}

export default function DashboardPage() {
  const { data: sites = [] } = useSites({})
  const { data: workers = [] } = useWorkers({})
  const { data: projects = [] } = useProjects()
  const { data: quotes = [] } = useQuotes({})
  const { data: tasks = [] } = useActiveTasks()

  const kpis = useMemo(() => {
    const ym = new Date().toISOString().slice(0, 7)
    return {
      sites: sites.length,
      sitesActive: sites.filter((s) => s.status === 'active').length,
      workers: workers.length,
      working: workers.filter((w) => w.status === 'working').length,
      running: projects.filter((p) => p.status === 'in_progress' || p.status === 'near_deadline').length,
      nearDue: projects.filter((p) => p.status !== 'completed' && p.status !== 'cancelled' && deadlineState(p.deadline) !== 'ok').length,
      quotesMonth: quotes.filter((q) => q.quoteDate?.slice(0, 7) === ym).length,
    }
  }, [sites, workers, projects, quotes])

  // Hoạt động gần đây — tổng hợp từ giao việc, báo giá, dự án
  const activities = useMemo<Activity[]>(() => {
    const out: Activity[] = []
    tasks.forEach((t) => (t.assignments ?? []).forEach((a) => {
      if (a.worker) out.push({ time: a.assignedAt, tone: 'done', title: `${a.worker.fullName} được giao: ${t.title}` })
    }))
    quotes.forEach((q) => out.push({ time: q.createdAt, tone: 'open', title: `Tạo báo giá ${q.code} · ${q.project?.name ?? q.customer?.name ?? ''}` }))
    projects.forEach((p) => out.push({ time: p.updatedAt, tone: 'pending', title: `Cập nhật tiến độ ${p.name} (${p.progressPct}%)` }))
    return out.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6)
  }, [tasks, quotes, projects])

  const byStatus = useMemo(() => ({
    inProgress: projects.filter((p) => p.status === 'in_progress').length,
    nearDeadline: projects.filter((p) => p.status === 'near_deadline').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    paused: projects.filter((p) => p.status === 'paused').length,
  }), [projects])

  const totalWorkers = workers.length || 1

  return (
    <PageShell title="Dashboard" subtitle="Tổng quan hôm nay">
      <div className="kpi-row">
        <KpiCard label="Công trường" value={kpis.sites} icon={<IconBuildingFactory2 size={16} />} iconColor="var(--color-blue)" change={`${kpis.sitesActive} đang hoạt động`} changeType="up" />
        <KpiCard label="Nhân viên hôm nay" value={kpis.workers} icon={<IconUsers size={16} />} iconColor="var(--color-green)" change={`${kpis.working} đang làm việc`} changeType="up" />
        <KpiCard label="Dự án đang chạy" value={kpis.running} icon={<IconBuilding size={16} />} iconColor="var(--color-amber)" change={`${kpis.nearDue} sắp đến hạn`} />
        <KpiCard label="Báo giá tháng này" value={kpis.quotesMonth} icon={<IconFileInvoice size={16} />} iconColor="var(--color-purple)" />
      </div>

      <div className="dash-split">
        {/* Hoạt động gần đây */}
        <div className="dash-card">
          <div className="dash-card__title"><IconActivity size={15} color="var(--color-blue)" /> Hoạt động gần đây</div>
          <ul className="dash-timeline">
            {activities.map((a, i) => (
              <li key={i} className="dash-tl">
                <span className={`dash-tl__dot dash-tl__dot--${a.tone}`} />
                <div>
                  <div className="dash-tl__title">{a.title}</div>
                  <div className="dash-tl__time">{relTime(a.time)}</div>
                </div>
              </li>
            ))}
            {activities.length === 0 && <li className="dash-empty">Chưa có hoạt động</li>}
          </ul>
        </div>

        <div className="dash-col">
          {/* Công nhân theo xưởng */}
          <div className="dash-card dash-card--pad">
            <div className="dash-mini-title">Nhân viên theo xưởng</div>
            {sites.map((s, i) => (
              <div key={s.id} className="dash-bar">
                <div className="dash-bar__top"><span>{s.name}</span><strong>{s.workerCount ?? 0} người</strong></div>
                <ProgressBar value={Math.round(((s.workerCount ?? 0) / totalWorkers) * 100)}
                  color={i % 2 === 0 ? 'var(--color-blue)' : 'var(--color-purple)'} size="sm" />
              </div>
            ))}
            {sites.length === 0 && <div className="dash-empty">Chưa có xưởng</div>}
          </div>

          {/* Trạng thái dự án */}
          <div className="dash-card dash-card--pad">
            <div className="dash-mini-title">Trạng thái dự án</div>
            <div className="dash-stat-grid">
              <div className="dash-stat"><div className="dash-stat__val" style={{ color: 'var(--color-blue)' }}>{byStatus.inProgress}</div><div className="dash-stat__label">Đang thi công</div></div>
              <div className="dash-stat"><div className="dash-stat__val" style={{ color: 'var(--color-amber)' }}>{byStatus.nearDeadline}</div><div className="dash-stat__label">Sắp bàn giao</div></div>
              <div className="dash-stat"><div className="dash-stat__val" style={{ color: 'var(--color-green)' }}>{byStatus.completed}</div><div className="dash-stat__label">Hoàn thành</div></div>
              <div className="dash-stat"><div className="dash-stat__val" style={{ color: 'var(--color-text-3)' }}>{byStatus.paused}</div><div className="dash-stat__label">Tạm dừng</div></div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
