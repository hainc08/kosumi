import { isOvertimeTime, computeOtEndAt, parseHm, otMinutesOf } from './shift'

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
  it('parseHm: hợp lệ và fallback khi sai định dạng', () => {
    expect(parseHm('18:30', 17, 0)).toEqual({ hour: 18, min: 30 })
    expect(parseHm('bậy', 17, 0)).toEqual({ hour: 17, min: 0 })
    expect(parseHm(undefined, 17, 15)).toEqual({ hour: 17, min: 15 })
    expect(parseHm('25:00', 17, 0)).toEqual({ hour: 17, min: 0 })
  })
  it('otMinutesOf: kẹp mốc 17:15 (thả 17:05 -> 19:15 = 120 phút)', () => {
    expect(otMinutesOf(new Date('2026-07-14T17:05:00'), new Date('2026-07-14T19:15:00'))).toBe(120)
  })
  it('otMinutesOf: thả sau 17:15 tính từ giờ thả', () => {
    expect(otMinutesOf(new Date('2026-07-14T17:30:00'), new Date('2026-07-14T18:30:00'))).toBe(60)
  })
})
