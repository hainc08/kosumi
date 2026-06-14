// In-memory store cho prototype. Mutable: mutations trong src/api/* sửa thẳng vào đây.
import type { Site, Worker, Customer } from '@/types'
import { seedSites } from './seed/sites'
import { seedWorkers } from './seed/workers'
import { seedCustomers } from './seed/customers'

export const db = {
  sites:     structuredClone(seedSites)     as Site[],
  workers:   structuredClone(seedWorkers)   as Worker[],
  customers: structuredClone(seedCustomers) as Customer[],
  // Các module sau bổ sung: projects, quotes,
  // quoteItems, quotePaymentSteps, tasks, taskAssignments, timesheetEntries
}

/** Sinh id giả tăng dần theo prefix (thay cho UUID DB). */
let counter = 1000
export function nextId(prefix: string): string {
  counter += 1
  return `${prefix}-${counter}`
}
