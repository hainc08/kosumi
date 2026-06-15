import type { ContractType, DayType } from '@/types'

export const STANDARD_WORKDAYS = 26

/** Ngày được tính là "có công" (trả lương cho HĐ tháng). */
export function isPaidDay(dayType: DayType): boolean {
  return dayType === 'workday' || dayType === 'leave_paid' || dayType === 'holiday'
}

export interface DayPayInput {
  contractType: ContractType
  dayType:       DayType
  regularHours:  number
  overtimeHours: number
  rateNormal?:   number | null
  rateOvertime?: number | null
  baseSalary?:   number | null
  allowance?:    number | null
}

/** Lương 1 ngày theo loại hợp đồng + loại ngày công. */
export function computeDayPay(i: DayPayInput): number {
  const ot = i.overtimeHours * (i.rateOvertime ?? 0)
  switch (i.contractType) {
    case 'hourly':
      return Math.round(i.regularHours * (i.rateNormal ?? 0) + ot)
    case 'daily':
      return Math.round((i.dayType === 'workday' ? (i.rateNormal ?? 0) : 0) + ot)
    case 'monthly':
      return isPaidDay(i.dayType) ? Math.round(((i.baseSalary ?? 0) + (i.allowance ?? 0)) / STANDARD_WORKDAYS) : 0
    case 'piece':
      return 0 // Lương khoán tính theo sản lượng, không theo giờ công
  }
}
