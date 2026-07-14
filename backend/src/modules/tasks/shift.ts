/** Hằng số ca làm + tiện ích tính giờ tăng ca. Mốc đọc từ env, fallback 17:00 / 17:15. */

/** Parse "HH:MM" -> {hour, min}; sai định dạng/ngoài khoảng -> fallback. */
export function parseHm(raw: string | undefined, fbH: number, fbM: number): { hour: number; min: number } {
  const m = /^(\d{1,2}):(\d{2})$/.exec((raw ?? '').trim())
  if (!m) return { hour: fbH, min: fbM }
  const hour = Number(m[1]), min = Number(m[2])
  if (hour < 0 || hour > 23 || min < 0 || min > 59) return { hour: fbH, min: fbM }
  return { hour, min }
}

const _shiftEnd = parseHm(process.env.SHIFT_END, 17, 0)
const _otStart = parseHm(process.env.OT_START, 17, 15)

export const SHIFT_END_HOUR = _shiftEnd.hour
export const SHIFT_END_MIN = _shiftEnd.min
export const OT_START_HOUR = _otStart.hour
export const OT_START_MIN = _otStart.min

/** "HH:MM" của một mốc (để trả cho FE). */
export function formatHm(hour: number, min: number): string {
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

/** Giao việc tại `now` có phải tăng ca không (>= SHIFT_END). */
export function isOvertimeTime(now: Date): boolean {
  const h = now.getHours(), m = now.getMinutes()
  return h > SHIFT_END_HOUR || (h === SHIFT_END_HOUR && m >= SHIFT_END_MIN)
}

/** Thời điểm kết thúc OT = OT_START (theo ngày của `base`) + `otHours` giờ. */
export function computeOtEndAt(base: Date, otHours: number): Date {
  const d = new Date(base)
  d.setHours(OT_START_HOUR, OT_START_MIN, 0, 0)
  d.setMinutes(d.getMinutes() + Math.round(otHours * 60))
  return d
}

/** Số phút OT của 1 assignment: mốc bắt đầu kẹp về OT_START cùng ngày ("OT tính từ 17:15"). */
export function otMinutesOf(startedAt: Date, endedAt: Date): number {
  const otStartOfDay = new Date(startedAt)
  otStartOfDay.setHours(OT_START_HOUR, OT_START_MIN, 0, 0)
  const from = startedAt > otStartOfDay ? startedAt : otStartOfDay
  return Math.max(0, Math.round((+endedAt - +from) / 60000))
}
