import { isOvertimeTime, computeOtEndAt } from './shift'

describe('shift util', () => {
  it('isOvertimeTime: >= 17:00 là tăng ca', () => {
    expect(isOvertimeTime(new Date('2026-06-18T16:59:00'))).toBe(false)
    expect(isOvertimeTime(new Date('2026-06-18T17:00:00'))).toBe(true)
    expect(isOvertimeTime(new Date('2026-06-18T18:30:00'))).toBe(true)
  })
  it('computeOtEndAt: neo 17:15 + N giờ (2h -> 19:15) bất kể giờ giao', () => {
    const end = computeOtEndAt(new Date('2026-06-18T18:00:00'), 2)
    expect(end.getHours()).toBe(19)
    expect(end.getMinutes()).toBe(15)
  })
})
