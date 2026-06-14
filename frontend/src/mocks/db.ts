// In-memory store cho prototype. Mutable: mutations trong src/api/* sửa thẳng vào đây.
import type { Site, Worker } from '@/types'
import { seedSites } from './seed/sites'
import { seedWorkers } from './seed/workers'

export const db = {
  sites:   structuredClone(seedSites)   as Site[],
  workers: structuredClone(seedWorkers) as Worker[],
  // Các module sau bổ sung: customers, customerContacts, projects, quotes,
  // quoteItems, quotePaymentSteps, tasks, taskAssignments, timesheetEntries
}

/** Sinh id giả tăng dần theo prefix (thay cho UUID DB). */
let counter = 1000
export function nextId(prefix: string): string {
  counter += 1
  return `${prefix}-${counter}`
}
