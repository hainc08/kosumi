export type ContractType = 'piece_rate' | 'official' | 'probation';
export type DayType = 'workday' | 'leave_paid' | 'leave_unpaid' | 'holiday' | 'absent';
export declare const STANDARD_WORKDAYS = 26;
export declare function isPaidDay(dayType: DayType): boolean;
export interface DayPayInput {
    contractType: ContractType;
    dayType: DayType;
    regularHours: number;
    overtimeHours: number;
    baseSalary?: number | null;
    allowanceResponsibility?: number | null;
    allowanceAttendance?: number | null;
}
export declare function computeDayPay(i: DayPayInput): number;
