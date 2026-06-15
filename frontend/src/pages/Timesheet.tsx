import { useEffect, useMemo, useState } from 'react'
import { IconClock, IconCalendarCheck, IconCalendarX, IconClockBolt, IconDownload } from '@tabler/icons-react'
import { CONTRACT_TYPE_LABELS, type MonthlySummary, type Worker } from '@/types'
import { useMonthlySummaries, useAvailableMonths, useApproveMonth } from '@/api/timesheet'
import { useWorkers } from '@/api/workers'
import { useSites } from '@/api/sites'
import { formatCurrency, formatHours } from '@/utils/format'
import { exportTimesheetXlsx } from '@/utils/excel'
import { PageShell } from '@/components/layout/PageShell'
import { KpiCard } from '@/components/ui/KpiCard'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { SearchBox } from '@/components/ui/SearchBox'
import { FilterSelect } from '@/components/ui/FilterSelect'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { TimesheetDetailDrawer } from '@/components/timesheet/TimesheetDetailDrawer'
import { useToastStore } from '@/stores/toastStore'
import './Timesheet.css'

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-')
  return `Tháng ${parseInt(m, 10)}/${y}`
}

function rateDisplay(w?: Worker): string {
  const c = w?.activeContract
  if (!c) return '—'
  switch (c.contractType) {
    case 'official':
    case 'probation': {
      const total = (c.baseSalary ?? 0) + (c.allowanceResponsibility ?? 0) + (c.allowanceAttendance ?? 0)
      return `${formatCurrency(total)}/tháng`
    }
    case 'piece_rate':   return `${formatCurrency(c.ratePerUnit ?? 0)}/${c.unitName ?? 'sp'}`
  }
}

export default function TimesheetPage() {
  const [yearMonth, setYearMonth] = useState('')
  const [siteId, setSiteId] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<MonthlySummary | null>(null)

  const toast = useToastStore((s) => s.show)
  const { data: months = [] } = useAvailableMonths()
  const { data: sites = [] } = useSites()
  const { data: workers = [] } = useWorkers({})
  const approve = useApproveMonth()

  // Mặc định chọn tháng mới nhất
  useEffect(() => { if (!yearMonth && months.length) setYearMonth(months[0]) }, [months, yearMonth])

  const { data: rows = [], isLoading } = useMonthlySummaries({ yearMonth, siteId, search })
  const workerMap = useMemo(() => new Map(workers.map((w) => [w.id, w])), [workers])

  const kpis = useMemo(() => {
    const totalHours = rows.reduce((s, r) => s + r.totalRegularHours + r.totalOtHours, 0)
    const avgDays = rows.length ? rows.reduce((s, r) => s + r.totalWorkdays, 0) / rows.length : 0
    const absent = rows.reduce((s, r) => s + r.totalAbsentDays, 0)
    const ot = rows.reduce((s, r) => s + r.totalOtHours, 0)
    return { totalHours, avgDays, absent, ot, headcount: rows.length }
  }, [rows])

  const handleApprove = async (s: MonthlySummary) => {
    await approve.mutateAsync({ workerId: s.workerId, yearMonth: s.yearMonth })
    toast(`✓ Đã duyệt bảng công ${s.worker?.fullName ?? ''}`)
    setSelected(null)
  }

  const handleExport = async () => {
    await exportTimesheetXlsx(rows, yearMonth, (id) => workerMap.get(id)?.activeContract?.contractType ?? 'official')
    toast('✓ Đã xuất bảng chấm công ra Excel')
  }

  const columns: Column<MonthlySummary>[] = [
    {
      key: 'worker', header: 'Công nhân',
      render: (r) => {
        const w = workerMap.get(r.workerId)
        return (
          <div className="cell-ts__worker">
            <span className="cell-ts__av" style={{ background: w?.avatarColor }}>{w?.initials}</span>
            <div><div className="cell-ts__name">{r.worker?.fullName}</div><div className="cell-ts__code">{r.worker?.code}</div></div>
          </div>
        )
      },
    },
    { key: 'contract', header: 'Loại HĐ', render: (r) => CONTRACT_TYPE_LABELS[workerMap.get(r.workerId)?.activeContract?.contractType ?? 'official'] },
    { key: 'workdays', header: 'Ngày công', render: (r) => <strong>{r.totalWorkdays}</strong> },
    { key: 'regular', header: 'Giờ thường', render: (r) => formatHours(r.totalRegularHours) },
    { key: 'ot', header: 'Giờ OT', render: (r) => r.totalOtHours ? <span className="cell-ts__ot">{formatHours(r.totalOtHours)}</span> : '—' },
    { key: 'rate', header: 'Thu nhập / tháng', render: (r) => <span className="cell-ts__rate">{rateDisplay(workerMap.get(r.workerId))}</span> },
    { key: 'pay', header: 'Thực lĩnh', render: (r) => <span className="cell-ts__pay">{formatCurrency(r.totalPay)}</span> },
    { key: 'status', header: 'Trạng thái', render: (r) => r.status === 'approved'
        ? <Badge variant="green" dot>Đã duyệt</Badge>
        : <Badge variant="amber" dot>Chờ duyệt</Badge> },
  ]

  return (
    <PageShell title="Chấm công" subtitle="Theo dõi giờ công & lương tháng">
      <div className="kpi-row">
        <KpiCard label="Tổng giờ tháng" value={formatHours(kpis.totalHours)} icon={<IconClock size={16} />} iconColor="var(--color-blue)" change={`${kpis.headcount} công nhân`} />
        <KpiCard label="Ngày công TB" value={kpis.avgDays.toFixed(1)} icon={<IconCalendarCheck size={16} />} iconColor="var(--color-green)" />
        <KpiCard label="Ngày vắng" value={kpis.absent} icon={<IconCalendarX size={16} />} iconColor="var(--color-red)" />
        <KpiCard label="Giờ OT" value={formatHours(kpis.ot)} icon={<IconClockBolt size={16} />} iconColor="var(--color-amber)" />
      </div>

      <div className="toolbar">
        <FilterSelect value={yearMonth} onChange={setYearMonth} placeholder="Chọn tháng"
          options={months.map((m) => ({ value: m, label: monthLabel(m) }))} />
        <FilterSelect value={siteId} onChange={setSiteId} placeholder="Tất cả xưởng"
          options={sites.map((s) => ({ value: s.id, label: s.name }))} />
        <SearchBox value={search} onChange={setSearch} placeholder="Tìm tên, mã CN..." width="220px" />
        <div className="toolbar__spacer" />
        <Button variant="default" icon={<IconDownload size={15} />} onClick={handleExport} disabled={rows.length === 0}>Xuất Excel</Button>
      </div>

      <DataTable
        columns={columns} data={rows} loading={isLoading} rowKey={(r) => r.workerId}
        onRowClick={(r) => setSelected(r)} emptyText="Không có dữ liệu chấm công"
      />

      <TimesheetDetailDrawer summary={selected} open={!!selected} onClose={() => setSelected(null)} onApprove={handleApprove} />
    </PageShell>
  )
}
