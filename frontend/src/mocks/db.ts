// In-memory store cho prototype. Mutable: mutations trong src/api/* sửa thẳng vào đây.
import type { Site, Worker, Customer, Project } from '@/types'
import { seedSites } from './seed/sites'
import { seedWorkers } from './seed/workers'
import { seedCustomers } from './seed/customers'
import { seedProjects } from './seed/projects'

export const db = {
  sites:     structuredClone(seedSites)     as Site[],
  workers:   structuredClone(seedWorkers)   as Worker[],
  customers: structuredClone(seedCustomers) as Customer[],
  projects:  structuredClone(seedProjects)  as Project[],
  // Các module sau bổ sung: quotes,
  // quoteItems, quotePaymentSteps, tasks, taskAssignments, timesheetEntries
}

/** Sinh id giả tăng dần theo prefix (thay cho UUID DB). */
let counter = 1000
export function nextId(prefix: string): string {
  counter += 1
  return `${prefix}-${counter}`
}
