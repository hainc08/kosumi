import { NotFoundException } from '@nestjs/common'
import { TasksService } from './tasks.service'
import { TaskAssignment } from './entities/task-assignment.entity'
import { SHIFT_END_HOUR, SHIFT_END_MIN } from './shift'

/** So khớp thô theo các khóa trong `where` (đủ cho find/findOne/count trong service). */
function whereMatch(a: Record<string, unknown>, where: Record<string, unknown> = {}): boolean {
  return Object.entries(where).every(([k, v]) => a[k] === v)
}

/** Repo TaskAssignment giả lập, lưu state trong bộ nhớ để phản ánh đúng hành vi find/save. */
function makeAssignmentRepo(seed: Partial<TaskAssignment>[] = []) {
  const store: Record<string, unknown>[] = [...seed] as Record<string, unknown>[]
  return {
    store,
    create: jest.fn((o: Record<string, unknown>) => ({ ...o })),
    save: jest.fn(async (v: Record<string, unknown> | Record<string, unknown>[]) => {
      const arr = Array.isArray(v) ? v : [v]
      for (const a of arr) if (!store.includes(a)) store.push(a)
      return v
    }),
    findOne: jest.fn(async ({ where }: { where?: Record<string, unknown> }) =>
      store.find((a) => whereMatch(a, where)) ?? null),
    find: jest.fn(async ({ where }: { where?: Record<string, unknown> }) =>
      store.filter((a) => whereMatch(a, where))),
    count: jest.fn(async ({ where }: { where?: Record<string, unknown> }) =>
      store.filter((a) => whereMatch(a, where)).length),
  }
}

/** Repo Task giả lập tối thiểu (findOne/save). */
function makeTaskRepo(tasks: Record<string, unknown>[] = []) {
  return {
    tasks,
    findOne: jest.fn(async ({ where }: { where?: Record<string, unknown> }) =>
      tasks.find((t) => whereMatch(t, where)) ?? null),
    save: jest.fn(async (t: Record<string, unknown>) => t),
  }
}

function makeService(taskRepo: ReturnType<typeof makeTaskRepo>, aRepo: ReturnType<typeof makeAssignmentRepo>) {
  return new TasksService(taskRepo as never, aRepo as never, {} as never, {} as never, {} as never)
}

const at = (iso: string) => new Date(iso) // parse local time (không có 'Z')

describe('TasksService — giao việc (assign)', () => {
  it('giao trong giờ (không OT): isOvertime=false, otEndAt=null, đang active', async () => {
    const taskRepo = makeTaskRepo([{ id: 't1', status: 'unassigned' }])
    const aRepo = makeAssignmentRepo()
    const svc = makeService(taskRepo, aRepo)

    const a = await svc.assign('t1', 'w1')

    expect(a.isOvertime).toBe(false)
    expect(a.otEndAt).toBeNull()
    expect(a.isActive).toBe(true)
    // task chuyển unassigned -> in_progress
    expect(taskRepo.tasks[0].status).toBe('in_progress')
  })

  it('giao tăng ca 2h: isOvertime=true, otEndAt neo 17:15 + 2h = 19:15', async () => {
    const taskRepo = makeTaskRepo([{ id: 't1', status: 'unassigned' }])
    const svc = makeService(taskRepo, makeAssignmentRepo())

    const a = await svc.assign('t1', 'w1', 2)

    expect(a.isOvertime).toBe(true)
    expect(a.otEndAt).not.toBeNull()
    expect(a.otEndAt!.getHours()).toBe(19)
    expect(a.otEndAt!.getMinutes()).toBe(15)
  })

  it('đã có assignment active của cùng NV -> trả về bản cũ (idempotent), không tạo mới', async () => {
    const existing = { id: 'a0', taskId: 't1', workerId: 'w1', isActive: true }
    const aRepo = makeAssignmentRepo([existing])
    const svc = makeService(makeTaskRepo([{ id: 't1', status: 'in_progress' }]), aRepo)

    const a = await svc.assign('t1', 'w1', 3)

    expect(a).toBe(existing)
    expect(aRepo.create).not.toHaveBeenCalled()
  })

  it('không tìm thấy task -> NotFoundException', async () => {
    const svc = makeService(makeTaskRepo([]), makeAssignmentRepo())
    await expect(svc.assign('nope', 'w1')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('saveAssignments: OT theo TỪNG NV (w1 tăng ca, w2 không)', async () => {
    const taskRepo = makeTaskRepo([{ id: 't1', status: 'unassigned' }])
    const aRepo = makeAssignmentRepo()
    const svc = makeService(taskRepo, aRepo)

    const count = await svc.saveAssignments({ t1: ['w1', 'w2'] }, { w1: 3 })

    expect(count).toBe(2)
    const w1 = aRepo.store.find((a) => a.workerId === 'w1')!
    const w2 = aRepo.store.find((a) => a.workerId === 'w2')!
    expect(w1.isOvertime).toBe(true)
    expect(w2.isOvertime).toBe(false)
  })
})

describe('TasksService — kết thúc cuối ngày lúc 17:00', () => {
  const shiftEndOf = (iso: string) => {
    const d = at(iso)
    d.setHours(SHIFT_END_HOUR, SHIFT_END_MIN, 0, 0)
    return d
  }

  it('endOfShiftClockOut sau 17:00: đóng assignment, kẹp endedAt về đúng 17:00', async () => {
    const active = { id: 'a1', taskId: 't1', workerId: 'w1', isActive: true, isOvertime: false, startedAt: at('2026-07-15T09:00:00'), endedAt: null }
    const aRepo = makeAssignmentRepo([active])
    const svc = makeService(makeTaskRepo([{ id: 't1', status: 'in_progress' }]), aRepo)

    const r = await svc.endOfShiftClockOut(at('2026-07-15T18:30:00'))

    expect(r.ended).toBe(1)
    expect(active.isActive).toBe(false)
    expect(active.endedAt).toEqual(shiftEndOf('2026-07-15T09:00:00'))
  })

  it('endOfShiftClockOut trước 17:00: endedAt = thời điểm gọi (không kẹp)', async () => {
    const now = at('2026-07-15T16:00:00')
    const active = { id: 'a1', taskId: 't1', workerId: 'w1', isActive: true, isOvertime: false, startedAt: at('2026-07-15T09:00:00'), endedAt: null }
    const svc = makeService(makeTaskRepo([{ id: 't1', status: 'in_progress' }]), makeAssignmentRepo([active]))

    const r = await svc.endOfShiftClockOut(now)

    expect(r.ended).toBe(1)
    expect(active.endedAt).toEqual(now)
  })

  it('endOfShiftClockOut bỏ qua OT: không đóng assignment tăng ca', async () => {
    const ot = { id: 'a2', taskId: 't1', workerId: 'w2', isActive: true, isOvertime: true, startedAt: at('2026-07-15T09:00:00'), endedAt: null }
    const svc = makeService(makeTaskRepo([{ id: 't1', status: 'in_progress' }]), makeAssignmentRepo([ot]))

    const r = await svc.endOfShiftClockOut(at('2026-07-15T18:30:00'))

    expect(r.ended).toBe(0)
    expect(ot.isActive).toBe(true)
  })

  it('sweepStaleAssignments: đã qua 17:00 -> đóng và kẹp endedAt về 17:00', async () => {
    const active = { id: 'a1', taskId: 't1', workerId: 'w1', isActive: true, isOvertime: false, startedAt: at('2026-07-15T09:00:00'), endedAt: null }
    const svc = makeService(makeTaskRepo([{ id: 't1', status: 'in_progress' }]), makeAssignmentRepo([active]))

    const r = await svc.sweepStaleAssignments(at('2026-07-15T18:30:00'))

    expect(r.ended).toBe(1)
    expect(active.isActive).toBe(false)
    expect(active.endedAt).toEqual(shiftEndOf('2026-07-15T09:00:00'))
  })

  it('sweepStaleAssignments: chưa tới 17:00 -> không đóng', async () => {
    const active = { id: 'a1', taskId: 't1', workerId: 'w1', isActive: true, isOvertime: false, startedAt: at('2026-07-15T09:00:00'), endedAt: null }
    const svc = makeService(makeTaskRepo([{ id: 't1', status: 'in_progress' }]), makeAssignmentRepo([active]))

    const r = await svc.sweepStaleAssignments(at('2026-07-15T16:30:00'))

    expect(r.ended).toBe(0)
    expect(active.isActive).toBe(true)
  })
})
