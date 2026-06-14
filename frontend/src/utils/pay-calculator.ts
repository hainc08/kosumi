import type { ContractType } from '@/types'

const WORKDAYS = 26
const HOURS_PER_DAY = 8

export interface EstimateInput {
  contractType: ContractType
  rateNormal?: number
  baseSalary?: number
  allowance?: number
  ratePerUnit?: number
}

/** Ước tính lương tháng để preview trong form hợp đồng. */
export function estimateMonthlyPay(i: EstimateInput): number {
  switch (i.contractType) {
    case 'hourly': return (i.rateNormal ?? 0) * HOURS_PER_DAY * WORKDAYS
    case 'daily':  return (i.rateNormal ?? 0) * WORKDAYS
    case 'monthly': return (i.baseSalary ?? 0) + (i.allowance ?? 0)
    case 'piece':  return 0 // phụ thuộc sản lượng — không ước tính
  }
}

export interface DayPayInput {
  contractType: ContractType
  regularHours: number
  overtimeHours: number
  rateNormal?: number
  rateOvertime?: number
}

/** Tính lương 1 ngày từ giờ công (dùng ở Chấm công). */
export function calculateDayPay(i: DayPayInput): number {
  switch (i.contractType) {
    case 'hourly':
      return i.regularHours * (i.rateNormal ?? 0) + i.overtimeHours * (i.rateOvertime ?? 0)
    case 'daily':
      return Math.ceil(i.regularHours / HOURS_PER_DAY) * (i.rateNormal ?? 0)
    default:
      return 0
  }
}
