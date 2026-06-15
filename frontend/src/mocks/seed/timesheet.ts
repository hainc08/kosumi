import type { TimesheetEntry, DayType, TimesheetStatus } from '@/types'
import { computeDayPay } from '@/utils/timesheet-calc'
import { seedWorkers } from './workers'

const YEAR_MONTH = '2026-06'
// Ngày làm việc trong tháng (đã trừ cuối tuần), tính tới giữa tháng.
const WORKDAYS = ['01', '02', '03', '04', '05', '08', '09', '10', '11', '12'].map((d) => `${YEAR_MONTH}-${d}`)

const iso = (d: string) => `${d}T17:30:00.000Z`

// Kịch bản chấm công riêng cho từng công nhân (ngày nghỉ/vắng).
const SCENARIOS: Record<string, { days: Record<number, DayType> }> = {
  'w-1': { days: {} },
  'w-2': { days: { 5: 'leave_paid' } },
  'w-3': { days: { 0: 'leave_paid', 1: 'leave_paid', 2: 'leave_paid', 3: 'leave_paid', 4: 'leave_paid', 5: 'leave_paid', 6: 'leave_paid', 7: 'leave_paid', 8: 'leave_paid', 9: 'leave_paid' } },
  'w-4': { days: {} },
  'w-5': { days: {} },
  'w-6': { days: {} },
  'w-7': { days: { 9: 'holiday' } },
  'w-8': { days: { 6: 'absent', 7: 'absent' } },
}

function buildEntries(): TimesheetEntry[] {
  const entries: TimesheetEntry[] = []
  let n = 0
  for (const w of seedWorkers) {
    if (w.status === 'resigned') continue
    const c = w.activeContract
    if (!c) continue
    const sc = SCENARIOS[w.id] ?? { days: {} }
    // 2 người gần nhất chưa duyệt để minh hoạ workflow
    const status: TimesheetStatus = w.id === 'w-6' || w.id === 'w-8' ? 'pending_approval' : 'approved'

    WORKDAYS.forEach((date, idx) => {
      const dayType: DayType = sc.days[idx] ?? 'workday'
      const isWork = dayType === 'workday'
      const regularHours = isWork ? 8 : dayType === 'leave_paid' || dayType === 'holiday' ? 8 : 0
      const overtimeHours = 0
      const payAmount = computeDayPay({
        contractType: c.contractType, dayType, regularHours: isWork ? 8 : 0, overtimeHours,
        baseSalary: c.baseSalary,
        allowanceResponsibility: c.allowanceResponsibility,
        allowanceAttendance: c.allowanceAttendance,
      })
      n += 1
      entries.push({
        id: `ts-${n}`, workerId: w.id, workDate: date, siteId: null,
        regularHours, overtimeHours, dayType, contractType: c.contractType,
        rateNormal: null, rateOvertime: null, payAmount, status,
        createdAt: iso(date), updatedAt: iso(date),
      })
    })
  }
  return entries
}

export const seedTimesheetEntries: TimesheetEntry[] = buildEntries()
