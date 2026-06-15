// Ported verbatim from frontend/src/utils/timesheet-calc.ts để FE/BE tính lương ngày công giống nhau.
export type ContractType = 'piece_rate' | 'official' | 'probation'
export type DayType = 'workday' | 'leave_paid' | 'leave_unpaid' | 'holiday' | 'absent'

export const STANDARD_WORKDAYS = 26

/** Ngày được tính là "có công" (trả lương cho HĐ tháng/chính thức). */
export function isPaidDay(dayType: DayType): boolean {
  return dayType === 'workday' || dayType === 'leave_paid' || dayType === 'holiday'
}

export interface DayPayInput {
  contractType: ContractType
  dayType: DayType
  regularHours: number
  overtimeHours: number
  baseSalary?: number | null
  allowanceResponsibility?: number | null
  allowanceAttendance?: number | null
}

/** Lương 1 ngày theo loại hợp đồng + loại ngày công. */
export function computeDayPay(i: DayPayInput): number {
  const totalMonthly = (i.baseSalary ?? 0) + (i.allowanceResponsibility ?? 0) + (i.allowanceAttendance ?? 0)
  switch (i.contractType) {
    case 'official':
    case 'probation':
      return isPaidDay(i.dayType) ? Math.round(totalMonthly / STANDARD_WORKDAYS) : 0
    case 'piece_rate':
      return 0 // Lương khoán tính theo sản lượng, không theo giờ công
  }
}
