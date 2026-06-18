/** Hằng số ca làm + tiện ích tính giờ tăng ca. */
export const SHIFT_END_HOUR = 17
export const SHIFT_END_MIN = 0
export const OT_START_HOUR = 17
export const OT_START_MIN = 15

/** Giao việc tại thời điểm `now` có phải tăng ca không (>= 17:00). */
export function isOvertimeTime(now: Date): boolean {
  const h = now.getHours(), m = now.getMinutes()
  return h > SHIFT_END_HOUR || (h === SHIFT_END_HOUR && m >= SHIFT_END_MIN)
}

/** Thời điểm kết thúc OT = 17:15 (theo ngày của `base`) + `otHours` giờ. */
export function computeOtEndAt(base: Date, otHours: number): Date {
  const d = new Date(base)
  d.setHours(OT_START_HOUR, OT_START_MIN, 0, 0)
  d.setMinutes(d.getMinutes() + Math.round(otHours * 60))
  return d
}
