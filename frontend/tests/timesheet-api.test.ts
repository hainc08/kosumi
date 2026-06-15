import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/mocks/db'
import { seedTimesheetEntries } from '@/mocks/seed/timesheet'
import { monthlySummaries, entriesFor, approveMonthInDb, availableMonths } from '@/api/timesheet'
import { computeDayPay } from '@/utils/timesheet-calc'

beforeEach(() => { db.timesheetEntries = structuredClone(seedTimesheetEntries) })

describe('timesheet mock logic', () => {
  it('availableMonths trả tháng có dữ liệu', () => {
    expect(availableMonths()).toContain('2026-06')
  })

  it('monthlySummaries gộp đúng ngày công & giờ cho công nhân theo giờ', () => {
    const rows = monthlySummaries({ yearMonth: '2026-06' })
    const w1 = rows.find((r) => r.workerId === 'w-1')!
    expect(w1.totalWorkdays).toBe(10)       // 10 ngày làm
    expect(w1.totalRegularHours).toBe(80)   // 10 * 8h
    expect(w1.totalOtHours).toBe(6)         // OT 2+2+2
    // hourly: 80*45000 + 6*67500 = 3.600.000 + 405.000
    expect(w1.totalPay).toBe(80 * 45000 + 6 * 67500)
  })

  it('công nhân nghỉ phép cả tháng -> 0 ngày công, có ngày nghỉ', () => {
    const rows = monthlySummaries({ yearMonth: '2026-06' })
    const w3 = rows.find((r) => r.workerId === 'w-3')!
    expect(w3.totalWorkdays).toBe(0)
    expect(w3.totalLeaveDays).toBe(10)
  })

  it('filter theo siteId và search', () => {
    expect(monthlySummaries({ yearMonth: '2026-06', siteId: 'site-3' }).every((r) => ['w-6', 'w-7'].includes(r.workerId))).toBe(true)
    expect(monthlySummaries({ yearMonth: '2026-06', search: 'CN001' })).toHaveLength(1)
  })

  it('status submitted khi còn ngày chờ duyệt, approve xong -> approved', () => {
    const before = monthlySummaries({ yearMonth: '2026-06' }).find((r) => r.workerId === 'w-6')!
    expect(before.status).toBe('submitted')
    approveMonthInDb('w-6', '2026-06')
    const after = monthlySummaries({ yearMonth: '2026-06' }).find((r) => r.workerId === 'w-6')!
    expect(after.status).toBe('approved')
    expect(entriesFor('w-6', '2026-06').every((e) => e.status === 'approved')).toBe(true)
  })

  it('computeDayPay: HĐ tháng prorate theo 26 công, ngày vắng = 0', () => {
    const paid = computeDayPay({ contractType: 'monthly', dayType: 'workday', regularHours: 8, overtimeHours: 0, baseSalary: 9000000, allowance: 800000 })
    expect(paid).toBe(Math.round(9800000 / 26))
    const absent = computeDayPay({ contractType: 'monthly', dayType: 'absent', regularHours: 0, overtimeHours: 0, baseSalary: 9000000, allowance: 800000 })
    expect(absent).toBe(0)
  })
})
