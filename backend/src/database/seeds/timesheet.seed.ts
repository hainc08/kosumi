import { DataSource, In } from 'typeorm'
import { TimesheetEntry } from '../../modules/timesheet/entities/timesheet-entry.entity'
import { Worker } from '../../modules/workers/entities/worker.entity'
import { WorkerContract } from '../../modules/workers/entities/worker-contract.entity'
import { computeDayPay } from '../../common/utils/pay-calculator.util'

type DayType = 'workday' | 'leave_paid' | 'leave_unpaid' | 'holiday' | 'absent'
type TimesheetStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected'

const YEAR_MONTH = '2026-06'
// Ngày làm việc trong tháng (đã trừ cuối tuần), tính tới giữa tháng.
const WORKDAYS = ['01', '02', '03', '04', '05', '08', '09', '10', '11', '12'].map((d) => `${YEAR_MONTH}-${d}`)

// Kịch bản chấm công riêng cho từng công nhân (ngày nghỉ/vắng), theo chỉ số ngày trong WORKDAYS (0..9).
// Mapping theo thứ tự worker seed gốc: CN001..CN008 ↔ w-1..w-8 (frontend/src/mocks/seed/timesheet.ts)
const SCENARIOS: Record<string, { days: Record<number, DayType> }> = {
  CN001: { days: {} },
  CN002: { days: { 5: 'leave_paid' } },
  CN003: { days: { 0: 'leave_paid', 1: 'leave_paid', 2: 'leave_paid', 3: 'leave_paid', 4: 'leave_paid', 5: 'leave_paid', 6: 'leave_paid', 7: 'leave_paid', 8: 'leave_paid', 9: 'leave_paid' } },
  CN004: { days: {} },
  CN005: { days: {} },
  CN006: { days: {} },
  CN007: { days: { 9: 'holiday' } },
  CN008: { days: { 6: 'absent', 7: 'absent' } },
}

/**
 * Ported from frontend/src/mocks/seed/timesheet.ts (buildEntries).
 * Sinh ngày công tháng 6/2026 cho 8 công nhân gốc (CN001..CN008), dùng hợp đồng active thật
 * để tính payAmount qua pay-calculator.util (port verbatim từ FE timesheet-calc.ts).
 */
export async function seedTimesheet(ds: DataSource): Promise<void> {
  const entryRepo = ds.getRepository(TimesheetEntry)
  if (await entryRepo.count() > 0) return

  const workerRepo = ds.getRepository(Worker)
  const contractRepo = ds.getRepository(WorkerContract)

  const codes = Object.keys(SCENARIOS)
  const workers = await workerRepo.find({ where: { code: In(codes) } })
  const workersByCode = new Map(workers.map((w) => [w.code, w]))

  const entries: Partial<TimesheetEntry>[] = []

  for (const code of codes) {
    const w = workersByCode.get(code)
    if (!w) continue
    if (w.status === 'resigned') continue

    const c = await contractRepo.findOne({ where: { workerId: w.id, isActive: true } })
    if (!c) continue

    const sc = SCENARIOS[code] ?? { days: {} }
    // 2 người gần nhất chưa duyệt để minh hoạ workflow
    const status: TimesheetStatus = code === 'CN006' || code === 'CN008' ? 'pending_approval' : 'approved'

    WORKDAYS.forEach((date, idx) => {
      const dayType: DayType = sc.days[idx] ?? 'workday'
      const isWork = dayType === 'workday'
      const regularHours = isWork ? 8 : dayType === 'leave_paid' || dayType === 'holiday' ? 8 : 0
      const overtimeHours = 0
      const payAmount = computeDayPay({
        contractType: c.contractType as 'piece_rate' | 'official' | 'probation',
        dayType,
        regularHours: isWork ? 8 : 0,
        overtimeHours,
        baseSalary: c.baseSalary,
        allowanceResponsibility: c.allowanceResponsibility,
        allowanceAttendance: c.allowanceAttendance,
      })

      entries.push({
        workerId: w.id,
        workDate: date,
        siteId: w.siteId ?? null,
        regularHours,
        overtimeHours,
        dayType,
        contractType: c.contractType,
        rateNormal: null,
        rateOvertime: null,
        payAmount,
        status,
        approvedBy: null,
        approvedAt: status === 'approved' ? new Date() : null,
        notes: null,
      })
    })
  }

  if (entries.length) {
    await entryRepo.save(entries.map((e) => entryRepo.create(e)))
  }
}
