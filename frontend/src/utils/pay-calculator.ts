import type { ContractType } from '@/types'

const WORKDAYS = 26

export interface EstimateInput {
  contractType: ContractType
  baseSalary?: number
  allowanceResponsibility?: number
  allowanceAttendance?: number
  ratePerUnit?: number
}

/** Ước tính lương tháng để preview trong form hợp đồng. */
export function estimateMonthlyPay(i: EstimateInput): number {
  switch (i.contractType) {
    case 'official':
    case 'probation':
      return (i.baseSalary ?? 0) + (i.allowanceResponsibility ?? 0) + (i.allowanceAttendance ?? 0)
    case 'piece_rate':
      return 0 // phụ thuộc sản lượng — không ước tính
  }
}

export interface DayPayInput {
  contractType: ContractType
  baseSalary?: number
  allowanceResponsibility?: number
  allowanceAttendance?: number
}

/** Tính lương 1 ngày từ lương tháng (dùng ở Chấm công). */
export function calculateDayPay(i: DayPayInput): number {
  const total = (i.baseSalary ?? 0) + (i.allowanceResponsibility ?? 0) + (i.allowanceAttendance ?? 0)
  if (i.contractType === 'official' || i.contractType === 'probation') {
    return Math.round(total / WORKDAYS)
  }
  return 0
}
