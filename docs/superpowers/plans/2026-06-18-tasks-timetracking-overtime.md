# Gói 4 — Giao việc: tính giờ + tăng ca Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tính giờ làm theo ca với tự tan ca 17:00, tăng ca có dialog nhập giờ (OT từ 17:15, tự trả NV lúc 17:15+N), nút hoàn thành hạng mục, và danh sách hạng mục đã hoàn thành (ai làm/tổng giờ/OT).

**Architecture:** Thêm 2 cột OT vào `task_assignments`. Logic giờ/OT là các method thuần trong `TasksService` (nhận `now` để test). Scheduler native `setInterval` gọi các method (không thêm dependency). FE thêm dialog OT, nút hoàn thành, panel danh sách.

**Tech Stack:** NestJS + TypeORM + MariaDB (BE), React + Vitest (FE). Spec: `docs/superpowers/specs/2026-06-18-tasks-timetracking-overtime-design.md`.

## Global Constraints

- DB MariaDB native localhost, KHÔNG docker. Migration raw `ALTER TABLE`. Bool = `tinyint(1)`.
- Mốc giờ: ca thường hết **17:00**; OT từ **17:15**; OT end = `17:15 + otHours`. KHÔNG thêm thư viện `@nestjs/schedule` — dùng `setInterval` trong provider.
- BE e2e: `cd backend && npm run migration:run` rồi `npx jest --config ./test/jest-e2e.json tasks`. BE unit: `cd backend && npx jest <file>`. FE gate: `cd frontend && npm run build`. FE test: `npx vitest run`.
- 10 lỗi vitest pre-existing — bỏ qua.
- Commit prefix `feat(tasks)`, tiếng Việt. Branch `poc`, commit trực tiếp, KHÔNG tạo branch.
- KHÔNG đổi wizard chọn site/project/quote. Tái dùng field sẵn có `assignedAt/startedAt/endedAt/isActive`.

---

### Task 1: BE — hằng số ca + 2 cột OT (shift util + migration + entity + schema.sql)

**Files:**
- Create: `backend/src/modules/tasks/shift.ts`
- Create: `backend/src/modules/tasks/shift.spec.ts`
- Create: `backend/src/database/migrations/1718000017000-AlterTaskAssignmentsOvertime.ts`
- Modify: `backend/src/modules/tasks/entities/task-assignment.entity.ts`
- Modify: `backend/database/schema.sql`

**Interfaces:**
- Produces: `SHIFT_END_HOUR/MIN`, `OT_START_HOUR/MIN`, `isOvertimeTime(now): boolean`, `computeOtEndAt(base, otHours): Date`; `TaskAssignment.isOvertime: boolean`, `TaskAssignment.otEndAt: Date | null`.

- [ ] **Step 1: Viết unit test (RED)** — `backend/src/modules/tasks/shift.spec.ts`:
```ts
import { isOvertimeTime, computeOtEndAt } from './shift'

describe('shift util', () => {
  it('isOvertimeTime: >= 17:00 là tăng ca', () => {
    expect(isOvertimeTime(new Date('2026-06-18T16:59:00'))).toBe(false)
    expect(isOvertimeTime(new Date('2026-06-18T17:00:00'))).toBe(true)
    expect(isOvertimeTime(new Date('2026-06-18T18:30:00'))).toBe(true)
  })
  it('computeOtEndAt: neo 17:15 + N giờ (2h -> 19:15) bất kể giờ giao', () => {
    const end = computeOtEndAt(new Date('2026-06-18T18:00:00'), 2)
    expect(end.getHours()).toBe(19)
    expect(end.getMinutes()).toBe(15)
  })
})
```

- [ ] **Step 2: Chạy test xác nhận FAIL**

Run: `cd backend && npx jest shift`
Expected: FAIL (module `./shift` chưa có).

- [ ] **Step 3: Viết `shift.ts`**:
```ts
/** Hằng số ca làm + tiện ích tính giờ tăng ca. */
export const SHIFT_END_HOUR = 17
export const SHIFT_END_MIN = 0
export const OT_START_HOUR = 17
export const OT_START_MIN = 15

/** Giao việc tại thời điểm `now` có phải tăng ca không (>= 17:00). */
export function isOvertimeTime(now: Date): boolean {
  const h = now.getHours(), m = now.getMinutes()
  return h > SHIFT_END_HOUR || (h === SHIFT_END_HOUR && m >= SHIFT_END_MIN)
}

/** Thời điểm kết thúc OT = 17:15 (theo ngày của `base`) + `otHours` giờ. */
export function computeOtEndAt(base: Date, otHours: number): Date {
  const d = new Date(base)
  d.setHours(OT_START_HOUR, OT_START_MIN, 0, 0)
  d.setMinutes(d.getMinutes() + Math.round(otHours * 60))
  return d
}
```

- [ ] **Step 4: Chạy test PASS**

Run: `cd backend && npx jest shift`
Expected: PASS (2/2).

- [ ] **Step 5: Migration** — `1718000017000-AlterTaskAssignmentsOvertime.ts`:
```ts
import { MigrationInterface, QueryRunner } from 'typeorm'

/** Thêm cờ tăng ca + mốc tự kết thúc OT cho task_assignments. */
export class AlterTaskAssignmentsOvertime1718000017000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query("ALTER TABLE `task_assignments` ADD `is_overtime` tinyint(1) NOT NULL DEFAULT 0 AFTER `is_active`")
    await q.query("ALTER TABLE `task_assignments` ADD `ot_end_at` datetime NULL AFTER `is_overtime`")
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.query("ALTER TABLE `task_assignments` DROP COLUMN `ot_end_at`")
    await q.query("ALTER TABLE `task_assignments` DROP COLUMN `is_overtime`")
  }
}
```

- [ ] **Step 6: Entity** — `task-assignment.entity.ts`, thêm sau dòng `isActive`:
```ts
  @Column({ name: 'is_overtime', type: 'boolean', default: false }) isOvertime: boolean
  @Column({ name: 'ot_end_at', type: 'datetime', nullable: true }) otEndAt: Date | null
```

- [ ] **Step 7: schema.sql** — trong `CREATE TABLE \`task_assignments\``, thêm sau dòng `` `is_active` tinyint(1) NOT NULL DEFAULT 1, ``:
```sql
  `is_overtime` tinyint(1) NOT NULL DEFAULT 0,
  `ot_end_at` datetime DEFAULT NULL,
```

- [ ] **Step 8: migration:run**

Run: `cd backend && npm run migration:run`
Expected: migration 1718000017000 applied, no error.

- [ ] **Step 9: Commit**

```bash
git add backend/src/modules/tasks/shift.ts backend/src/modules/tasks/shift.spec.ts backend/src/database/migrations/1718000017000-AlterTaskAssignmentsOvertime.ts backend/src/modules/tasks/entities/task-assignment.entity.ts backend/database/schema.sql
git commit -m "feat(tasks): cột tăng ca (is_overtime, ot_end_at) + hằng số ca làm"
```

---

### Task 2: BE — `assign` nhận `otHours` (đánh dấu tăng ca)

**Files:**
- Modify: `backend/src/modules/tasks/tasks.service.ts` (`assign`)
- Modify: `backend/src/modules/tasks/dto/assign-worker.dto.ts`
- Modify: `backend/src/modules/tasks/tasks.controller.ts` (`assign` route)
- Test: `backend/test/tasks.e2e-spec.ts`

**Interfaces:**
- Consumes: `computeOtEndAt` (Task 1).
- Produces: `assign(taskId, workerId, otHours?)` — khi có `otHours`: `isOvertime=true`, `otEndAt=computeOtEndAt(now, otHours)`. `AssignWorkerDto.otHours?: number`. `POST /tasks/:id/assign` body nhận `otHours`.

- [ ] **Step 1: Viết e2e (RED)** — thêm vào `tasks.e2e-spec.ts` (sau test assign hiện có; dùng `anotherUnassignedTaskId` + `freeWorkerId` từ setup — nếu freeWorker đã bận do test trước, tạo path riêng: dùng `unassignedTaskId` mới. Để an toàn, test tự `unassign` trước):
```ts
  it('POST /assign với otHours -> assignment is_overtime + ot_end_at', async () => {
    // đảm bảo worker rảnh
    await request(app.getHttpServer()).post(`/api/tasks/${anotherUnassignedTaskId}/assign`)
      .send({ workerId: freeWorkerId, otHours: 2 }).expect(201)
    const active = await request(app.getHttpServer()).get('/api/tasks/active').expect(200)
    const t = active.body.data.find((x: { id: string }) => x.id === anotherUnassignedTaskId)
    const a = t.assignments.find((x: { workerId: string }) => x.workerId === freeWorkerId)
    expect(a.isOvertime).toBe(true)
    expect(a.otEndAt).toBeTruthy()
    // dọn dẹp
    await request(app.getHttpServer()).post(`/api/tasks/${anotherUnassignedTaskId}/unassign`).send({ workerId: freeWorkerId }).expect(201)
  })
```

- [ ] **Step 2: Chạy test xác nhận FAIL**

Run: `cd backend && npx jest --config ./test/jest-e2e.json -t "otHours"`
Expected: FAIL (`isOvertime` undefined / DTO bỏ qua otHours).

- [ ] **Step 3: DTO** — `assign-worker.dto.ts`:
```ts
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'

export class AssignWorkerDto {
  @IsString() @IsNotEmpty() workerId: string
  @IsOptional() @IsNumber() otHours?: number
}
```

- [ ] **Step 4: Service `assign`** — `tasks.service.ts`: thêm import `import { computeOtEndAt } from './shift'`. Đổi chữ ký + thân `assign`:
```ts
  async assign(taskId: string, workerId: string, otHours?: number): Promise<TaskAssignment> {
    const task = await this.repo.findOne({ where: { id: taskId } })
    if (!task) throw new NotFoundException('Không tìm thấy công việc')

    const existing = await this.assignmentRepo.findOne({ where: { taskId, workerId, isActive: true } })
    if (existing) return existing

    const now = new Date()
    const overtime = typeof otHours === 'number' && otHours > 0
    const assignment = this.assignmentRepo.create({
      taskId, workerId,
      assignedAt: now, startedAt: now, endedAt: null, isActive: true,
      transferredFromTaskId: null,
      isOvertime: overtime,
      otEndAt: overtime ? computeOtEndAt(now, otHours as number) : null,
    })
    const saved = await this.assignmentRepo.save(assignment)
    if (task.status === 'unassigned') { task.status = 'in_progress'; await this.repo.save(task) }
    return saved
  }
```

- [ ] **Step 5: Controller** — `tasks.controller.ts`, route assign:
```ts
  @Post(':id/assign') assign(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignWorkerDto) {
    return this.svc.assign(id, dto.workerId, dto.otHours)
  }
```

- [ ] **Step 6: Chạy test PASS**

Run: `cd backend && npx jest --config ./test/jest-e2e.json -t "otHours"`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/src/modules/tasks/tasks.service.ts backend/src/modules/tasks/dto/assign-worker.dto.ts backend/src/modules/tasks/tasks.controller.ts backend/test/tasks.e2e-spec.ts
git commit -m "feat(tasks): assign nhận otHours, đánh dấu tăng ca + mốc kết thúc OT"
```

---

### Task 3: BE — tan ca 17:00 + quét OT hết hạn (+ endpoint clock-out)

**Files:**
- Modify: `backend/src/modules/tasks/tasks.service.ts`
- Modify: `backend/src/modules/tasks/tasks.controller.ts`
- Test: `backend/test/tasks.e2e-spec.ts`

**Interfaces:**
- Consumes: assignment fields (Task 1/2).
- Produces: `endOfShiftClockOut(now): Promise<number>` (kết thúc assignment active KHÔNG OT); `sweepExpiredOvertime(now): Promise<number>` (kết thúc OT có `otEndAt <= now`); `POST /tasks/clock-out`.

- [ ] **Step 1: Viết e2e (RED)** — thêm vào `tasks.e2e-spec.ts`:
```ts
  it('POST /clock-out kết thúc assignment ca thường, NV về chờ', async () => {
    await request(app.getHttpServer()).post(`/api/tasks/${unassignedTaskId}/assign`).send({ workerId: freeWorkerId }).expect(201)
    const r = await request(app.getHttpServer()).post('/api/tasks/clock-out').expect(201)
    expect(typeof r.body.data.ended).toBe('number')
    const active = await request(app.getHttpServer()).get('/api/tasks/active').expect(200)
    const t = active.body.data.find((x: { id: string }) => x.id === unassignedTaskId)
    expect((t.assignments ?? []).some((a: { workerId: string }) => a.workerId === freeWorkerId)).toBe(false)
    expect(t.status).toBe('unassigned')
  })
```

- [ ] **Step 2: Chạy test xác nhận FAIL**

Run: `cd backend && npx jest --config ./test/jest-e2e.json -t "clock-out"`
Expected: FAIL (route 404).

- [ ] **Step 3: Service methods** — `tasks.service.ts`, thêm:
```ts
  /** Tan ca: kết thúc mọi assignment active KHÔNG phải OT. Trả số lượt đã đóng. */
  async endOfShiftClockOut(now: Date = new Date()): Promise<{ ended: number }> {
    const actives = await this.assignmentRepo.find({ where: { isActive: true, isOvertime: false } })
    if (actives.length === 0) return { ended: 0 }
    for (const a of actives) { a.isActive = false; a.endedAt = now }
    await this.assignmentRepo.save(actives)
    await this.recomputeTaskStatuses([...new Set(actives.map((a) => a.taskId))])
    return { ended: actives.length }
  }

  /** Đóng các block OT đã tới hạn (otEndAt <= now). */
  async sweepExpiredOvertime(now: Date = new Date()): Promise<{ ended: number }> {
    const actives = await this.assignmentRepo.find({ where: { isActive: true, isOvertime: true } })
    const due = actives.filter((a) => a.otEndAt && a.otEndAt <= now)
    if (due.length === 0) return { ended: 0 }
    for (const a of due) { a.isActive = false; a.endedAt = now }
    await this.assignmentRepo.save(due)
    await this.recomputeTaskStatuses([...new Set(due.map((a) => a.taskId))])
    return { ended: due.length }
  }

  /** Task không còn assignment active -> 'unassigned' (giữ task đã completed/cancelled). */
  private async recomputeTaskStatuses(taskIds: string[]): Promise<void> {
    for (const id of taskIds) {
      const task = await this.repo.findOne({ where: { id } })
      if (!task || task.status === 'completed' || task.status === 'cancelled') continue
      const stillActive = await this.assignmentRepo.count({ where: { taskId: id, isActive: true } })
      if (stillActive === 0 && task.status !== 'unassigned') { task.status = 'unassigned'; await this.repo.save(task) }
    }
  }
```

- [ ] **Step 4: Controller** — `tasks.controller.ts`, thêm route TĨNH (đặt cạnh `@Get('active')`, TRƯỚC các route `:id`):
```ts
  @Post('clock-out') clockOut() { return this.svc.endOfShiftClockOut(new Date()) }
```

- [ ] **Step 5: Chạy test PASS**

Run: `cd backend && npx jest --config ./test/jest-e2e.json -t "clock-out"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/tasks/tasks.service.ts backend/src/modules/tasks/tasks.controller.ts backend/test/tasks.e2e-spec.ts
git commit -m "feat(tasks): tan ca 17:00 + quét OT hết hạn + endpoint clock-out"
```

---

### Task 4: BE — hoàn thành hạng mục + danh sách đã hoàn thành

**Files:**
- Modify: `backend/src/modules/tasks/tasks.service.ts`
- Modify: `backend/src/modules/tasks/tasks.controller.ts`
- Test: `backend/test/tasks.e2e-spec.ts`

**Interfaces:**
- Produces: `completeTask(taskId)` (đóng assignment active + `status='completed'`); `completedTasks()` trả `Array<Task & { workers: WorkerMini[]; totalMinutes: number; overtimeMinutes: number }>`; `POST /tasks/:id/complete`; `GET /tasks/completed`.

- [ ] **Step 1: Viết e2e (RED)** — thêm vào `tasks.e2e-spec.ts`:
```ts
  it('POST /:id/complete -> task completed; GET /completed trả worker + phút', async () => {
    await request(app.getHttpServer()).post(`/api/tasks/${unassignedTaskId}/assign`).send({ workerId: freeWorkerId }).expect(201)
    const c = await request(app.getHttpServer()).post(`/api/tasks/${unassignedTaskId}/complete`).expect(201)
    expect(c.body.data.status).toBe('completed')
    const done = await request(app.getHttpServer()).get('/api/tasks/completed').expect(200)
    const row = done.body.data.find((x: { id: string }) => x.id === unassignedTaskId)
    expect(row).toBeTruthy()
    expect(Array.isArray(row.workers)).toBe(true)
    expect(typeof row.totalMinutes).toBe('number')
    expect(typeof row.overtimeMinutes).toBe('number')
  })
```

- [ ] **Step 2: Chạy test xác nhận FAIL**

Run: `cd backend && npx jest --config ./test/jest-e2e.json -t "complete"`
Expected: FAIL (route 404).

- [ ] **Step 3: Service** — `tasks.service.ts`, thêm:
```ts
  /** Đánh dấu hoàn thành hạng mục: đóng assignment active + status='completed'. */
  async completeTask(taskId: string): Promise<Task> {
    const task = await this.repo.findOne({ where: { id: taskId } })
    if (!task) throw new NotFoundException('Không tìm thấy công việc')
    const actives = await this.assignmentRepo.find({ where: { taskId, isActive: true } })
    const now = new Date()
    for (const a of actives) { a.isActive = false; a.endedAt = now }
    if (actives.length) await this.assignmentRepo.save(actives)
    task.status = 'completed'
    return this.repo.save(task)
  }

  /** Danh sách hạng mục đã hoàn thành + ai làm + tổng phút + phút OT. */
  async completedTasks(): Promise<Array<TaskWithRelations & { workers: WorkerMini[]; totalMinutes: number; overtimeMinutes: number }>> {
    const tasks = await this.repo.find({ where: { status: 'completed' }, order: { updatedAt: 'DESC' } })
    if (tasks.length === 0) return []
    const taskIds = tasks.map((t) => t.id)
    const all = await this.assignmentRepo.find({ where: { taskId: In(taskIds) } })
    const workerIds = [...new Set(all.map((a) => a.workerId))]
    const workers = workerIds.length ? await this.workerRepo.find({ where: { id: In(workerIds) } }) : []
    const workerById = new Map(workers.map((w) => [w.id, w]))
    const minutesOf = (a: TaskAssignment) =>
      a.endedAt && a.startedAt ? Math.max(0, Math.round((+a.endedAt - +a.startedAt) / 60000)) : 0

    return tasks.map((t) => {
      const list = all.filter((a) => a.taskId === t.id)
      const wids = [...new Set(list.map((a) => a.workerId))]
      const totalMinutes = list.reduce((s, a) => s + minutesOf(a), 0)
      const overtimeMinutes = list.filter((a) => a.isOvertime).reduce((s, a) => s + minutesOf(a), 0)
      return {
        ...t, assignments: [], activeWorkers: [],
        workers: wids.map((id) => workerById.get(id)).filter((w): w is Worker => !!w).map((w) => this.toMini(w)),
        totalMinutes, overtimeMinutes,
      }
    })
  }
```

- [ ] **Step 4: Controller** — `tasks.controller.ts`: thêm route tĩnh `@Get('completed')` (cạnh `@Get('active')`) và route `:id/complete`:
```ts
  @Get('completed') completed() { return this.svc.completedTasks() }
```
```ts
  @Post(':id/complete') complete(@Param('id', ParseUUIDPipe) id: string) { return this.svc.completeTask(id) }
```

- [ ] **Step 5: Chạy test PASS**

Run: `cd backend && npx jest --config ./test/jest-e2e.json -t "complete"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/tasks/tasks.service.ts backend/src/modules/tasks/tasks.controller.ts backend/test/tasks.e2e-spec.ts
git commit -m "feat(tasks): hoàn thành hạng mục + API danh sách đã hoàn thành (ai làm/giờ/OT)"
```

---

### Task 5: BE — scheduler tự động (setInterval, không thêm dependency)

**Files:**
- Create: `backend/src/modules/tasks/shift.scheduler.ts`
- Create: `backend/src/modules/tasks/shift.scheduler.spec.ts`
- Modify: `backend/src/modules/tasks/tasks.module.ts`

**Interfaces:**
- Consumes: `TasksService.endOfShiftClockOut`, `sweepExpiredOvertime` (Task 3).
- Produces: provider `ShiftScheduler` chạy nền, tick mỗi 60s.

- [ ] **Step 1: Viết unit test (RED)** — `shift.scheduler.spec.ts` (jest fake timers):
```ts
import { ShiftScheduler } from './shift.scheduler'

describe('ShiftScheduler', () => {
  it('tick gọi sweepExpiredOvertime mỗi phút', () => {
    jest.useFakeTimers()
    const svc = { sweepExpiredOvertime: jest.fn().mockResolvedValue({ ended: 0 }), endOfShiftClockOut: jest.fn().mockResolvedValue({ ended: 0 }) }
    const s = new ShiftScheduler(svc as never)
    s.onModuleInit()
    jest.advanceTimersByTime(60_000)
    expect(svc.sweepExpiredOvertime).toHaveBeenCalled()
    s.onModuleDestroy()
    jest.useRealTimers()
  })
})
```

- [ ] **Step 2: Chạy test xác nhận FAIL**

Run: `cd backend && npx jest shift.scheduler`
Expected: FAIL (module chưa có).

- [ ] **Step 3: Viết scheduler** — `shift.scheduler.ts`:
```ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { TasksService } from './tasks.service'
import { SHIFT_END_HOUR, SHIFT_END_MIN } from './shift'

/**
 * Scheduler nền (không dùng @nestjs/schedule): mỗi 60s quét OT hết hạn;
 * khi vừa qua mốc 17:00 thì tự tan ca. Logic thật nằm trong TasksService.
 */
@Injectable()
export class ShiftScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ShiftScheduler.name)
  private timer: ReturnType<typeof setInterval> | null = null
  private lastClockOutDay = ''

  constructor(private readonly svc: TasksService) {}

  onModuleInit(): void {
    this.timer = setInterval(() => { void this.tick(new Date()) }, 60_000)
  }
  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  async tick(now: Date): Promise<void> {
    try {
      await this.svc.sweepExpiredOvertime(now)
      const today = now.toISOString().slice(0, 10)
      const pastShiftEnd = now.getHours() > SHIFT_END_HOUR || (now.getHours() === SHIFT_END_HOUR && now.getMinutes() >= SHIFT_END_MIN)
      if (pastShiftEnd && this.lastClockOutDay !== today) {
        this.lastClockOutDay = today
        const r = await this.svc.endOfShiftClockOut(now)
        if (r.ended > 0) this.logger.log(`Tan ca 17:00: đóng ${r.ended} lượt giao việc`)
      }
    } catch (e) {
      this.logger.error('Lỗi scheduler ca làm', e as Error)
    }
  }
}
```

- [ ] **Step 4: Đăng ký provider** — `tasks.module.ts`: thêm import `ShiftScheduler` và đưa vào `providers: [TasksService, ShiftScheduler]`.

- [ ] **Step 5: Chạy test PASS + build**

Run: `cd backend && npx jest shift.scheduler && npm run build`
Expected: PASS + build OK.

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/tasks/shift.scheduler.ts backend/src/modules/tasks/shift.scheduler.spec.ts backend/src/modules/tasks/tasks.module.ts
git commit -m "feat(tasks): scheduler nền tự tan ca 17:00 + quét OT (setInterval, không thêm lib)"
```

---

### Task 6: FE — types + api (otHours, complete, completed, clock-out) + mock

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/api/tasks.ts`

**Interfaces:**
- Produces: `TaskAssignment += isOvertime: boolean; otEndAt?: string | null`; `CompletedTask` type; hooks `useCompleteTask`, `useCompletedTasks`, `useClockOut`; `assign` nhận `otHours`.

- [ ] **Step 1: types** — `frontend/src/types/index.ts`:
  a. Trong `interface TaskAssignment`, thêm:
```ts
  isOvertime:   boolean
  otEndAt?:     string | null
```
  b. Thêm type (gần Task):
```ts
export interface CompletedTask extends Task {
  workers: { id: string; fullName: string; initials: string; avatarColor: string }[]
  totalMinutes: number
  overtimeMinutes: number
}
```
  (Nếu `TaskAssignment` ở FE thiếu field nào để khớp BE — chỉ thêm 2 field trên.)

- [ ] **Step 2: api/tasks.ts** — đọc file để khớp tên helper hiện có, rồi:
  a. `assignWorkerInDb(taskId, workerId, otHours?)`: set `isOvertime: !!otHours && otHours>0`, `otEndAt: null` (mock không tính mốc; đủ để demo cờ). Cập nhật `saveAssignmentsInDb` để truyền `otHours` xuống (thêm tham số optional).
  b. Thêm mock: `completeTaskInDb(taskId)` (đóng assignment active + `status='completed'`), `completedTasksFromDb()` (lọc completed + gom worker + tổng phút từ `startedAt/endedAt` + phút OT), `clockOutInDb()` (đóng assignment active không OT, task về unassigned).
  c. Thêm nhánh http (khi không mock) gọi `POST /tasks/:id/assign` (kèm otHours), `POST /tasks/:id/complete`, `GET /tasks/completed`, `POST /tasks/clock-out`.
  d. Hook react-query: `useCompleteTask`, `useCompletedTasks`, `useClockOut`. `useSaveAssignments`/`useAssignWorker` mở rộng nhận `otHours`.

  (Giữ đúng pattern `USE_MOCK`/`mockRequest`/`apiPost`/`apiGet` như các hàm hiện có trong file.)

- [ ] **Step 3: Build**

Run: `cd frontend && npm run build`
Expected: PASS (hoặc chỉ lỗi ở Kanban — Task 7/8/9). Ghi report.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/index.ts frontend/src/api/tasks.ts
git commit -m "feat(tasks): FE types + api cho OT, hoàn thành, danh sách hoàn thành, tan ca"
```

---

### Task 7: FE — dialog nhập giờ OT khi giao việc sau 17:00

**Files:**
- Create: `frontend/src/components/kanban/OvertimeDialog.tsx`
- Modify: `frontend/src/pages/Kanban.tsx`

**Interfaces:**
- Consumes: `useSaveAssignments` (otHours) (Task 6).

- [ ] **Step 1: Dialog** — `OvertimeDialog.tsx`:
```tsx
import { useState } from 'react'
import { FormModal } from '@/components/ui/FormModal'
import { FormField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'

interface Props { open: boolean; onCancel: () => void; onConfirm: (otHours: number) => void }

/** Dialog nhập số giờ tăng ca (giao việc sau 17:00). OT tính từ 17:15. */
export function OvertimeDialog({ open, onCancel, onConfirm }: Props) {
  const [hours, setHours] = useState('2')
  const n = Number(hours)
  const valid = !Number.isNaN(n) && n > 0 && n <= 6
  return (
    <FormModal open={open} onClose={onCancel} size="sm" title="Xin tăng ca"
      footer={<>
        <Button onClick={onCancel}>Hủy</Button>
        <Button variant="primary" disabled={!valid} onClick={() => onConfirm(n)}>Xác nhận tăng ca</Button>
      </>}>
      <p style={{ marginBottom: 12, color: 'var(--color-text-2)' }}>
        Đang giao việc sau 17:00. Giờ tăng ca tính từ <strong>17:15</strong>; nhập số giờ, nhân viên sẽ tự về trạng thái chờ sau khi hết giờ.
      </p>
      <FormField label="Số giờ tăng ca">
        <input inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} />
      </FormField>
    </FormModal>
  )
}
```

- [ ] **Step 2: Wire vào Kanban** — `Kanban.tsx`:
  a. Import `OvertimeDialog` và thêm state `const [otOpen, setOtOpen] = useState(false)`.
  b. Tách hàm lưu nhận otHours:
```tsx
  const doSave = async (otHours?: number) => {
    const n = await saveAssignments.mutateAsync({ draft, otHours })
    setDraft({}); setOtOpen(false)
    toast(`✓ Đã lưu ${n} lượt giao việc${otHours ? ` (tăng ca ${otHours}h)` : ''}`)
  }
```
  (Cập nhật `useSaveAssignments` ở Task 6 để nhận `{ draft, otHours }`.)
  c. `handleSave` cũ đổi thành: nếu `new Date().getHours() >= 17` → `setOtOpen(true)`; ngược lại `doSave()`.
  d. Render `<OvertimeDialog open={otOpen} onCancel={() => setOtOpen(false)} onConfirm={(h) => doSave(h)} />` cuối component.

- [ ] **Step 3: Build**

Run: `cd frontend && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/kanban/OvertimeDialog.tsx frontend/src/pages/Kanban.tsx
git commit -m "feat(tasks): dialog nhập giờ tăng ca khi giao việc sau 17:00"
```

---

### Task 8: FE — nút "Hoàn thành" hạng mục + "Tan ca"

**Files:**
- Modify: `frontend/src/pages/Kanban.tsx`

**Interfaces:**
- Consumes: `useCompleteTask`, `useClockOut` (Task 6).

- [ ] **Step 1: Nút hoàn thành mỗi hạng mục** — `Kanban.tsx`:
  a. `const completeTask = useCompleteTask()`, `const clockOut = useClockOut()`.
  b. Trong `task-row__head` (cạnh Badge priority), thêm nút:
```tsx
                            <button className="task-row__done" title="Đánh dấu hoàn thành"
                              onClick={async () => { await completeTask.mutateAsync(t.id); toast('✓ Đã hoàn thành hạng mục') }}>
                              <IconCircleCheck size={15} /> Hoàn thành
                            </button>
```
  c. Footer step 4: thêm nút "Tan ca":
```tsx
              <Button variant="default" onClick={async () => { const r = await clockOut.mutateAsync(); toast(`✓ Đã tan ca — đóng ${r.ended} lượt`) }}>Tan ca</Button>
```

- [ ] **Step 2: CSS** — `Kanban.css`, thêm:
```css
.task-row__done { display:inline-flex; align-items:center; gap:4px; font-size:12px; color:var(--color-green); background:none; border:1px solid var(--color-green); border-radius:6px; padding:3px 8px; cursor:pointer; }
.task-row__done:hover { background:var(--color-green); color:#fff; }
```

- [ ] **Step 3: Build**

Run: `cd frontend && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Kanban.tsx frontend/src/pages/Kanban.css
git commit -m "feat(tasks): nút hoàn thành hạng mục + tan ca trong màn giao việc"
```

---

### Task 9: FE — panel "Hạng mục đã hoàn thành" + kiểm thử tổng

**Files:**
- Create: `frontend/src/components/kanban/CompletedTasksPanel.tsx`
- Modify: `frontend/src/pages/Kanban.tsx`

**Interfaces:**
- Consumes: `useCompletedTasks` (Task 6).

- [ ] **Step 1: Panel** — `CompletedTasksPanel.tsx`:
```tsx
import { useCompletedTasks } from '@/api/tasks'

function fmt(min: number): string {
  const h = Math.floor(min / 60), m = min % 60
  return h ? `${h}h${m ? ` ${m}p` : ''}` : `${m}p`
}

/** Danh sách hạng mục đã hoàn thành: ai làm, tổng giờ, OT. */
export function CompletedTasksPanel() {
  const { data: rows = [] } = useCompletedTasks()
  if (rows.length === 0) return <div className="kb-empty">Chưa có hạng mục hoàn thành</div>
  return (
    <div className="ct-list">
      {rows.map((r) => (
        <div key={r.id} className="ct-row">
          <div className="ct-row__main">
            <div className="ct-row__title">{r.title}</div>
            <div className="ct-row__workers">
              {r.workers.map((w) => (
                <span key={w.id} className="ct-av" style={{ background: w.avatarColor }} title={w.fullName}>{w.initials}</span>
              ))}
            </div>
          </div>
          <div className="ct-row__time">
            <span>{fmt(r.totalMinutes)}</span>
            {r.overtimeMinutes > 0 && <span className="ct-ot">+OT {fmt(r.overtimeMinutes)}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Toggle trong Kanban** — `Kanban.tsx`: thêm state `const [showDone, setShowDone] = useState(false)` và 1 nút toggle ở step 4 head (hoặc footer) mở `CompletedTasksPanel`. Render panel khi `showDone`:
```tsx
{showDone && <div className="kb-done-wrap"><CompletedTasksPanel /></div>}
```
Nút: `<Button variant="default" onClick={() => setShowDone((v) => !v)}>{showDone ? 'Ẩn hoàn thành' : 'Hạng mục đã hoàn thành'}</Button>` (đặt ở footer step 4).

- [ ] **Step 3: CSS** — `Kanban.css`, thêm style `.ct-list/.ct-row/.ct-av/.ct-ot/.kb-done-wrap` (gọn, theo token màu hiện có).

- [ ] **Step 4: Kiểm thử tổng**

Run: `cd frontend && npx vitest run && npm run build`
Expected: build PASS; không fail MỚI ngoài 10 lỗi pre-existing.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/kanban/CompletedTasksPanel.tsx frontend/src/pages/Kanban.tsx frontend/src/pages/Kanban.css
git commit -m "feat(tasks): panel danh sách hạng mục đã hoàn thành (ai làm/giờ/OT)"
```

---

## Kiểm thử tổng (sau Task 9)
- BE: `cd backend && npm run migration:run && npx jest --config ./test/jest-e2e.json tasks && npx jest shift` → PASS.
- FE: `cd frontend && npm run build` → OK; vitest không fail MỚI.
- Thủ công (mock): giao việc trước 17:00 lưu bình thường; (giả lập sau 17:00) hiện dialog OT; nút Hoàn thành đẩy hạng mục sang panel "đã hoàn thành" kèm người + giờ; nút Tan ca đóng giao việc.

## Self-Review (đã rà)
- **Spec coverage:** (1) đếm giờ/(2) chuyển việc — dùng field cũ, không đổi; (3) tan ca 17:00 → Task 3+5; (4) OT dialog + mốc 17:15+N → Task 1(util)+2(assign)+3(sweep)+5(scheduler)+7(dialog); (5) danh sách hoàn thành → Task 4(BE)+8(complete btn)+9(panel).
- **Mốc OT đúng D1:** `computeOtEndAt` neo 17:15 (unit test 2h→19:15).
- **Không thêm dependency (D3):** scheduler `setInterval`, logic ở service (test trực tiếp).
- **Type consistency:** `isOvertime/otEndAt` đồng nhất BE entity ↔ FE TaskAssignment; `completedTasks` shape ↔ FE `CompletedTask`.
- **BE seed:** task_assignments seed không cần đổi (2 cột mới có default) — KHÁC Gói 2/3 (không có giá trị enum cũ). Vẫn kiểm `db:reset` ở cuối nếu cần.
- **Rủi ro mở:** mock FE không tự sweep OT theo thời gian thực (chấp nhận POC); `api/tasks.ts` cần đọc kỹ để khớp pattern hook/mock hiện có.
