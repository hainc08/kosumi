# Agent: Timesheet & Pay Calculator
# File: agents/06-timesheet-agent.md
# Role: Generate timesheet logic, pay calculation, and export

## Pay Calculation Logic

```typescript
// src/utils/pay-calculator.ts

export type ContractType = 'hourly' | 'daily' | 'monthly' | 'piece'

export interface PayInput {
  contractType: ContractType
  regularHours?: number       // for hourly/daily
  overtimeHours?: number      // for hourly
  workDays?: number           // for daily
  rateNormal?: number         // hourly rate OR daily rate
  rateOvertime?: number       // hourly OT rate (default = rateNormal * 1.5)
  baseSalary?: number         // for monthly
  allowance?: number          // for monthly
  ratePerUnit?: number        // for piece
  unitsCompleted?: number     // for piece
}

export function calculatePay(input: PayInput): number {
  const { contractType, regularHours = 0, overtimeHours = 0,
          workDays = 0, rateNormal = 0, rateOvertime, baseSalary = 0,
          allowance = 0, ratePerUnit = 0, unitsCompleted = 0 } = input

  const effectiveOTRate = rateOvertime ?? rateNormal * 1.5

  switch (contractType) {
    case 'hourly':
      return regularHours * rateNormal + overtimeHours * effectiveOTRate

    case 'daily':
      // OT calculated as hourly equivalent on top of daily rate
      const hourlyEquivalent = rateNormal / 8
      return workDays * rateNormal + overtimeHours * hourlyEquivalent * 1.5

    case 'monthly':
      // Fixed regardless of hours (deduct for unpaid leave separately)
      return baseSalary + allowance

    case 'piece':
      return unitsCompleted * ratePerUnit

    default:
      return 0
  }
}

export function estimateMonthlyPay(
  contractType: ContractType,
  rateNormal: number,
  workDaysPerMonth = 26,
  hoursPerDay = 8
): number {
  return calculatePay({
    contractType,
    regularHours: workDaysPerMonth * hoursPerDay,
    overtimeHours: 0,
    workDays: workDaysPerMonth,
    rateNormal,
  })
}

export function formatPay(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}
```

## Timesheet Generation (from task_assignments)
```typescript
// src/modules/timesheet/timesheet.service.ts

async generateFromAssignments(date: string, siteId?: string): Promise<void> {
  // 1. Find all assignments for the date
  const assignments = await this.assignmentRepo
    .createQueryBuilder('a')
    .innerJoinAndSelect('a.worker', 'w')
    .innerJoinAndSelect('w.contracts', 'c', 'c.isActive = true')
    .innerJoinAndSelect('a.task', 't')
    .where('DATE(a.started_at) = :date', { date })
    .andWhere(siteId ? 't.siteId = :siteId' : '1=1', { siteId })
    .getMany()

  // 2. Group by worker
  const byWorker = groupBy(assignments, a => a.workerId)

  // 3. Create/update timesheet entries
  for (const [workerId, workerAssignments] of Object.entries(byWorker)) {
    const contract = workerAssignments[0].worker.contracts[0]
    const totalMinutes = workerAssignments.reduce((sum, a) => {
      if (!a.startedAt) return sum
      const end = a.endedAt ?? new Date()
      return sum + differenceInMinutes(end, a.startedAt)
    }, 0)
    const regularHours = Math.min(totalMinutes / 60, 8)
    const overtimeHours = Math.max(totalMinutes / 60 - 8, 0)

    await this.timesheetRepo.upsert({
      workerId,
      workDate: date,
      siteId: workerAssignments[0].task.siteId,
      regularHours,
      overtimeHours,
      contractType: contract.contractType,
      rateNormal: contract.rateNormal,
      rateOvertime: contract.rateOvertime,
    }, ['workerId', 'workDate'])
  }
}
```

## Excel Export Structure
```typescript
// Monthly timesheet export columns:
// A: Mã CN | B: Họ tên | C: Xưởng | D: Loại HĐ
// E: Ngày công | F: Giờ thường | G: Giờ OT
// H: Đơn giá/giờ (hoặc /ngày) | I: Thành tiền | J: Trạng thái

// Row coloring:
// approved → bg #DCFCE7 (green-light)
// pending  → bg #FEF3C7 (amber-light)
// absent   → bg #FEE2E2 (red-light)

// Footer row: SUM(E), SUM(F), SUM(G), SUM(I) in bold
```
