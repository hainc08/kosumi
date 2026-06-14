// WorkShop Pro — Skill: Pay Calculator
// File: skills/pay-calculator.skill.ts
// Reusable utility — import anywhere in the codebase

export type ContractType = 'hourly' | 'daily' | 'monthly' | 'piece'

export interface PayInput {
  contractType:    ContractType
  regularHours?:   number    // hourly: total hours ≤ 8/day; daily: total hours
  overtimeHours?:  number    // hours beyond 8h/day
  workDays?:       number    // daily contract: number of days
  rateNormal?:     number    // VNĐ/giờ (hourly) or VNĐ/ngày (daily)
  rateOvertime?:   number    // VNĐ/giờ OT (default = rateNormal × 1.5)
  baseSalary?:     number    // monthly
  allowance?:      number    // monthly
  ratePerUnit?:    number    // piece
  unitsCompleted?: number    // piece
}

export interface PayResult {
  gross:          number    // trước khi khấu trừ
  regularPay:     number    // tiền giờ/ngày thường
  overtimePay:    number    // tiền OT
  breakdown:      string    // mô tả cách tính
}

export function calculatePay(input: PayInput): PayResult {
  const {
    contractType,
    regularHours  = 0,
    overtimeHours = 0,
    workDays      = 0,
    rateNormal    = 0,
    rateOvertime,
    baseSalary    = 0,
    allowance     = 0,
    ratePerUnit   = 0,
    unitsCompleted = 0,
  } = input

  const effectiveOT = rateOvertime ?? rateNormal * 1.5

  switch (contractType) {
    case 'hourly': {
      const reg = regularHours * rateNormal
      const ot  = overtimeHours * effectiveOT
      return {
        gross:      reg + ot,
        regularPay: reg,
        overtimePay: ot,
        breakdown: `${regularHours}h × ${fmt(rateNormal)} + ${overtimeHours}h OT × ${fmt(effectiveOT)}`,
      }
    }
    case 'daily': {
      const reg = workDays * rateNormal
      const otHourly = rateNormal / 8 * 1.5
      const ot  = overtimeHours * otHourly
      return {
        gross:      reg + ot,
        regularPay: reg,
        overtimePay: ot,
        breakdown: `${workDays} ngày × ${fmt(rateNormal)} + ${overtimeHours}h OT × ${fmt(otHourly)}`,
      }
    }
    case 'monthly': {
      const gross = baseSalary + allowance
      return {
        gross,
        regularPay: baseSalary,
        overtimePay: 0,
        breakdown: `Lương CB ${fmt(baseSalary)} + Phụ cấp ${fmt(allowance)}`,
      }
    }
    case 'piece': {
      const gross = unitsCompleted * ratePerUnit
      return {
        gross,
        regularPay: gross,
        overtimePay: 0,
        breakdown: `${unitsCompleted} SP × ${fmt(ratePerUnit)}`,
      }
    }
    default:
      return { gross: 0, regularPay: 0, overtimePay: 0, breakdown: '—' }
  }
}

/** Ước tính lương tháng (26 ngày, 8h/ngày, không OT) */
export function estimateMonthly(
  contractType: ContractType,
  rateNormal: number,
  workDaysPerMonth = 26,
  hoursPerDay = 8,
): number {
  const result = calculatePay({
    contractType,
    regularHours: workDaysPerMonth * hoursPerDay,
    workDays: workDaysPerMonth,
    rateNormal,
    overtimeHours: 0,
  })
  return result.gross
}

/** Format số tiền theo locale VN */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Format số gọn (không ký hiệu tiền) */
export function fmt(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(n)) + 'đ'
}

/** Avatar color từ worker ID (deterministic) */
const AVATAR_COLORS = [
  '#6366F1','#3B82F6','#10B981','#F59E0B',
  '#EF4444','#8B5CF6','#EC4899','#14B8A6',
]
export function getAvatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

/** Initials từ full name */
export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Format date DD/MM/YYYY */
export function formatDate(isoDate: string): string {
  if (!isoDate) return '—'
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}

/** Parse date từ DD/MM/YYYY về YYYY-MM-DD */
export function parseDate(vnDate: string): string {
  const [d, m, y] = vnDate.split('/')
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
}

/** Current month as YYYY-MM */
export function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}`
}
