import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mockRequest } from './client'
import { db } from '@/mocks/db'
import type { TimesheetEntry, MonthlySummary } from '@/types'
import { isPaidDay } from '@/utils/timesheet-calc'

export interface TimesheetFilters { yearMonth?: string; siteId?: string; search?: string }

const ymOf = (e: TimesheetEntry) => e.workDate.slice(0, 7)

/** Các tháng có dữ liệu chấm công (mới nhất trước). */
export function availableMonths(): string[] {
  return [...new Set(db.timesheetEntries.map(ymOf))].sort().reverse()
}

/** Các bản ghi ngày công của 1 nhân viên trong tháng. */
export function entriesFor(workerId: string, yearMonth: string): TimesheetEntry[] {
  return db.timesheetEntries
    .filter((e) => e.workerId === workerId && ymOf(e) === yearMonth)
    .sort((a, b) => a.workDate.localeCompare(b.workDate))
}

/** Gộp ngày công thành bảng tổng hợp tháng theo từng nhân viên. */
export function monthlySummaries(f: TimesheetFilters): MonthlySummary[] {
  const ym = f.yearMonth ?? availableMonths()[0]
  const byWorker = new Map<string, TimesheetEntry[]>()
  for (const e of db.timesheetEntries) {
    if (ymOf(e) !== ym) continue
    const arr = byWorker.get(e.workerId) ?? []
    arr.push(e)
    byWorker.set(e.workerId, arr)
  }

  const rows: MonthlySummary[] = []
  for (const [workerId, entries] of byWorker) {
    const w = db.workers.find((x) => x.id === workerId)
    if (!w) continue
    if (f.siteId && w.siteId !== f.siteId) continue
    if (f.search && !w.fullName.toLowerCase().includes(f.search.toLowerCase()) && !w.code.toLowerCase().includes(f.search.toLowerCase())) continue

    const c = w.activeContract
    const anyPending = entries.some((e) => e.status === 'pending_approval' || e.status === 'draft')
    rows.push({
      workerId, yearMonth: ym,
      totalWorkdays: entries.filter((e) => e.dayType === 'workday').length,
      totalRegularHours: entries.reduce((s, e) => s + e.regularHours, 0),
      totalOtHours: entries.reduce((s, e) => s + e.overtimeHours, 0),
      totalLeaveDays: entries.filter((e) => e.dayType === 'leave_paid' || e.dayType === 'leave_unpaid').length,
      totalAbsentDays: entries.filter((e) => e.dayType === 'absent').length,
      totalPay: entries.reduce((s, e) => s + e.payAmount, 0),
      baseSalary: c?.baseSalary ?? null,
      allowance: c?.allowance ?? null,
      status: anyPending ? 'submitted' : 'approved',
      worker: { id: w.id, code: w.code, fullName: w.fullName },
    })
  }
  return rows.sort((a, b) => (a.worker?.code ?? '').localeCompare(b.worker?.code ?? ''))
}

/** Duyệt toàn bộ ngày công đang chờ của 1 nhân viên trong tháng. */
export function approveMonthInDb(workerId: string, yearMonth: string): void {
  db.timesheetEntries.forEach((e) => {
    if (e.workerId === workerId && e.workDate.slice(0, 7) === yearMonth && e.status !== 'approved') {
      e.status = 'approved'
      e.updatedAt = new Date().toISOString()
    }
  })
}

// ─── HOOKS ───────────────────────────────────────────────────────────────────

export function useAvailableMonths() {
  return useQuery<string[]>({ queryKey: ['timesheet', 'months'], queryFn: () => mockRequest(() => availableMonths()) })
}

export function useMonthlySummaries(filters: TimesheetFilters) {
  return useQuery<MonthlySummary[]>({
    queryKey: ['timesheet', 'summary', filters],
    queryFn: () => mockRequest(() => monthlySummaries(filters)),
  })
}

export function useTimesheetEntries(workerId: string | null, yearMonth: string) {
  return useQuery<TimesheetEntry[]>({
    queryKey: ['timesheet', 'entries', workerId, yearMonth],
    queryFn: () => mockRequest(() => entriesFor(workerId!, yearMonth)),
    enabled: !!workerId,
  })
}

export function useApproveMonth() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ workerId, yearMonth }: { workerId: string; yearMonth: string }) =>
      mockRequest(() => approveMonthInDb(workerId, yearMonth)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timesheet'] }),
  })
}

export { isPaidDay }
