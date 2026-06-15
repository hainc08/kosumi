// In-memory store cho prototype. Mutable: mutations trong src/api/* sửa thẳng vào đây.
import type { Site, Worker, Customer, Project, Quote, QuoteItem, QuotePaymentStep, Task, TaskAssignment, TimesheetEntry } from '@/types'
import { seedSites } from './seed/sites'
import { seedWorkers } from './seed/workers'
import { seedCustomers } from './seed/customers'
import { seedProjects } from './seed/projects'
import { seedQuotes, seedQuoteItems, seedQuotePaymentSteps } from './seed/quotes'
import { seedTasks, seedTaskAssignments } from './seed/tasks'
import { seedTimesheetEntries } from './seed/timesheet'

export const db = {
  sites:     structuredClone(seedSites)     as Site[],
  workers:   structuredClone(seedWorkers)   as Worker[],
  customers: structuredClone(seedCustomers) as Customer[],
  projects:  structuredClone(seedProjects)  as Project[],
  quotes:    structuredClone(seedQuotes)    as Quote[],
  quoteItems: structuredClone(seedQuoteItems) as (QuoteItem & { quoteId: string })[],
  quotePaymentSteps: structuredClone(seedQuotePaymentSteps) as (QuotePaymentStep & { quoteId: string })[],
  tasks:     structuredClone(seedTasks)     as Task[],
  taskAssignments: structuredClone(seedTaskAssignments) as TaskAssignment[],
  timesheetEntries: structuredClone(seedTimesheetEntries) as TimesheetEntry[],
}

/** Sinh id giả tăng dần theo prefix (thay cho UUID DB). */
let counter = 1000
export function nextId(prefix: string): string {
  counter += 1
  return `${prefix}-${counter}`
}
