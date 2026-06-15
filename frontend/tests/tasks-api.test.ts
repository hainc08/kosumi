import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/mocks/db'
import { seedTasks, seedTaskAssignments } from '@/mocks/seed/tasks'
import {
  tasksForQuote, availableWorkersAtSite, assignWorkerInDb,
  unassignWorkerInDb, transferWorkerInDb, saveAssignmentsInDb, enrichTask,
} from '@/api/tasks'

beforeEach(() => {
  db.tasks = structuredClone(seedTasks)
  db.taskAssignments = structuredClone(seedTaskAssignments)
})

describe('tasks mock logic', () => {
  it('tasksForQuote trả task theo quoteItem + gắn activeWorkers', () => {
    const tasks = tasksForQuote('quote-1') // qi-1, qi-2 -> task-1..task-4
    expect(tasks.map((t) => t.id)).toEqual(['task-1', 'task-2', 'task-3', 'task-4'])
    const t1 = tasks.find((t) => t.id === 'task-1')!
    expect(t1.activeWorkers?.length).toBe(1) // w-6
  })

  it('availableWorkersAtSite loại trừ người đang bận và không thuộc xưởng', () => {
    // site-1: w-1(busy task-8), w-3(on_leave), w-4(working free)
    const free = availableWorkersAtSite('site-1')
    expect(free.map((w) => w.id)).toContain('w-4')
    expect(free.map((w) => w.id)).not.toContain('w-1') // đang làm task-8
    expect(free.map((w) => w.id)).not.toContain('w-3') // on_leave
  })

  it('assignWorkerInDb tạo assignment active + chuyển task sang in_progress', () => {
    const before = db.taskAssignments.length
    assignWorkerInDb('task-3', 'w-7')
    expect(db.taskAssignments.length).toBe(before + 1)
    expect(db.tasks.find((t) => t.id === 'task-3')!.status).toBe('in_progress')
    expect(enrichTask(db.tasks.find((t) => t.id === 'task-3')!).activeWorkers?.length).toBe(1)
  })

  it('unassignWorkerInDb đóng assignment, task về unassigned khi hết người', () => {
    unassignWorkerInDb('task-8', 'w-1') // task-8 chỉ có 1 người
    expect(db.taskAssignments.find((a) => a.taskId === 'task-8' && a.isActive)).toBeUndefined()
    expect(db.tasks.find((t) => t.id === 'task-8')!.status).toBe('unassigned')
  })

  it('transferWorkerInDb kết thúc việc cũ và mở việc mới', () => {
    transferWorkerInDb('w-1', 'task-8', 'task-9')
    expect(db.taskAssignments.find((a) => a.taskId === 'task-8' && a.workerId === 'w-1' && a.isActive)).toBeUndefined()
    const newA = db.taskAssignments.find((a) => a.taskId === 'task-9' && a.workerId === 'w-1' && a.isActive)
    expect(newA?.transferredFromTaskId).toBe('task-8')
  })

  it('saveAssignmentsInDb lưu nhiều lượt giao và trả về tổng', () => {
    const n = saveAssignmentsInDb({ 'task-3': ['w-7'], 'task-4': ['w-2', 'w-5'] })
    expect(n).toBe(3)
    expect(db.taskAssignments.filter((a) => a.isActive && ['task-3', 'task-4'].includes(a.taskId)).length).toBe(3)
  })
})
