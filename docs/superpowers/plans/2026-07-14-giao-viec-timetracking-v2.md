# Giao việc v2 — OT per-worker / kẹp 17:15 / giờ ca cấu hình — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sửa màn Giao việc cho khớp MEMO: nhập tăng ca RIÊNG từng nhân viên, phút OT kẹp mốc 17:15, và giờ tan ca đọc từ cấu hình + đồng hồ đếm ngược trên UI.

**Architecture:** Không đổi DB (2 cột OT `is_overtime`/`ot_end_at` đã có). BE: `shift.ts` đọc mốc giờ từ env + thêm `otMinutesOf` (kẹp 17:15); `saveAssignments` đổi tham số OT từ số đơn sang **map** `{workerId: giờ}`; thêm `GET /tasks/shift-config`. FE: `OvertimeDialog` thành danh sách per-worker; `Kanban` lấy mốc giờ từ config để mở dialog + badge đếm ngược.

**Tech Stack:** NestJS + TypeORM + MariaDB (BE), React + react-query + Vitest (FE). Spec: `docs/superpowers/specs/2026-07-14-giao-viec-timetracking-v2-design.md`.

## Global Constraints

- Giữ mô hình **nháp + nút "Lưu giao việc"** (không đổi luồng kéo-thả). Quy tắc 1 thỏa qua bước Lưu.
- Mốc giờ đọc từ env: `SHIFT_END` (fallback `17:00`), `OT_START` (fallback `17:15`), định dạng `"HH:MM"`. **Không thêm dependency.**
- Phút OT của 1 assignment kẹp về `OT_START` cùng ngày: `endedAt − max(startedAt, OT_START)`. `totalMinutes` vẫn tính từ `startedAt` thực.
- DB MariaDB qua Docker (container `workshop_pro_mariadb`, port 3307) đang chạy; migration đã áp — **không thêm migration**.
- Branch `poc`, commit trực tiếp, **không tạo branch mới**. Commit tiếng Việt, prefix `feat(tasks)`.
- Lệnh test: BE unit `cd backend && npx jest shift`; BE e2e `cd backend && npx jest --config ./test/jest-e2e.json tasks`; FE gate `cd frontend && npm run build`. 10 lỗi vitest pre-existing — bỏ qua.
- Envelope API: dữ liệu nằm ở `res.body.data`.

---

### Task 1: BE — `shift.ts` đọc env + `parseHm` + `otMinutesOf` (kẹp 17:15)

**Files:**
- Modify: `backend/src/modules/tasks/shift.ts`
- Modify: `backend/src/modules/tasks/shift.spec.ts`

**Interfaces:**
- Produces: `parseHm(raw, fbH, fbM): {hour, min}`; `formatHm(hour, min): string`; `otMinutesOf(startedAt: Date, endedAt: Date): number`; giữ `SHIFT_END_HOUR/MIN`, `OT_START_HOUR/MIN`, `isOvertimeTime`, `computeOtEndAt`.

- [ ] **Step 1: Viết test (RED)** — thay nội dung `backend/src/modules/tasks/shift.spec.ts`:
```ts
import { isOvertimeTime, computeOtEndAt, parseHm, otMinutesOf } from './shift'

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
  it('parseHm: hợp lệ và fallback khi sai định dạng', () => {
    expect(parseHm('18:30', 17, 0)).toEqual({ hour: 18, min: 30 })
    expect(parseHm('bậy', 17, 0)).toEqual({ hour: 17, min: 0 })
    expect(parseHm(undefined, 17, 15)).toEqual({ hour: 17, min: 15 })
    expect(parseHm('25:00', 17, 0)).toEqual({ hour: 17, min: 0 })
  })
  it('otMinutesOf: kẹp mốc 17:15 (thả 17:05 -> 19:15 = 120 phút)', () => {
    expect(otMinutesOf(new Date('2026-07-14T17:05:00'), new Date('2026-07-14T19:15:00'))).toBe(120)
  })
  it('otMinutesOf: thả sau 17:15 tính từ giờ thả', () => {
    expect(otMinutesOf(new Date('2026-07-14T17:30:00'), new Date('2026-07-14T18:30:00'))).toBe(60)
  })
})
```

- [ ] **Step 2: Chạy test xác nhận FAIL**

Run: `cd backend && npx jest shift`
Expected: FAIL (`parseHm`/`otMinutesOf` chưa export).

- [ ] **Step 3: Viết `shift.ts`** — thay toàn bộ nội dung:
```ts
/** Hằng số ca làm + tiện ích tính giờ tăng ca. Mốc đọc từ env, fallback 17:00 / 17:15. */

/** Parse "HH:MM" -> {hour, min}; sai định dạng/ngoài khoảng -> fallback. */
export function parseHm(raw: string | undefined, fbH: number, fbM: number): { hour: number; min: number } {
  const m = /^(\d{1,2}):(\d{2})$/.exec((raw ?? '').trim())
  if (!m) return { hour: fbH, min: fbM }
  const hour = Number(m[1]), min = Number(m[2])
  if (hour < 0 || hour > 23 || min < 0 || min > 59) return { hour: fbH, min: fbM }
  return { hour, min }
}

const _shiftEnd = parseHm(process.env.SHIFT_END, 17, 0)
const _otStart = parseHm(process.env.OT_START, 17, 15)

export const SHIFT_END_HOUR = _shiftEnd.hour
export const SHIFT_END_MIN = _shiftEnd.min
export const OT_START_HOUR = _otStart.hour
export const OT_START_MIN = _otStart.min

/** "HH:MM" của một mốc (để trả cho FE). */
export function formatHm(hour: number, min: number): string {
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

/** Giao việc tại `now` có phải tăng ca không (>= SHIFT_END). */
export function isOvertimeTime(now: Date): boolean {
  const h = now.getHours(), m = now.getMinutes()
  return h > SHIFT_END_HOUR || (h === SHIFT_END_HOUR && m >= SHIFT_END_MIN)
}

/** Thời điểm kết thúc OT = OT_START (theo ngày của `base`) + `otHours` giờ. */
export function computeOtEndAt(base: Date, otHours: number): Date {
  const d = new Date(base)
  d.setHours(OT_START_HOUR, OT_START_MIN, 0, 0)
  d.setMinutes(d.getMinutes() + Math.round(otHours * 60))
  return d
}

/** Số phút OT của 1 assignment: mốc bắt đầu kẹp về OT_START cùng ngày ("OT tính từ 17:15"). */
export function otMinutesOf(startedAt: Date, endedAt: Date): number {
  const otStartOfDay = new Date(startedAt)
  otStartOfDay.setHours(OT_START_HOUR, OT_START_MIN, 0, 0)
  const from = startedAt > otStartOfDay ? startedAt : otStartOfDay
  return Math.max(0, Math.round((+endedAt - +from) / 60000))
}
```

- [ ] **Step 4: Chạy test PASS**

Run: `cd backend && npx jest shift`
Expected: PASS (5/5).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/tasks/shift.ts backend/src/modules/tasks/shift.spec.ts
git commit -m "feat(tasks): shift.ts đọc mốc giờ từ env + otMinutesOf kẹp 17:15"
```

---

### Task 2: BE — `saveAssignments` nhận map OT per-worker + `GET /tasks/shift-config`

**Files:**
- Modify: `backend/src/modules/tasks/tasks.service.ts` (`saveAssignments`, thêm `shiftConfig`)
- Modify: `backend/src/modules/tasks/tasks.controller.ts` (route `assignments/bulk`, thêm `shift-config`)
- Test: `backend/test/tasks.e2e-spec.ts`

**Interfaces:**
- Consumes: `SHIFT_END_HOUR/MIN`, `OT_START_HOUR/MIN`, `formatHm` (Task 1); `assign(taskId, workerId, otHours?)` (sẵn có).
- Produces: `saveAssignments(draft, otHoursByWorker?: Record<string, number>): Promise<number>`; `shiftConfig(): { shiftEnd: string; otStart: string }`; `POST /tasks/assignments/bulk` body `{ draft, otHoursByWorker? }`; `GET /tasks/shift-config`.

- [ ] **Step 1: Viết e2e (RED)** — thêm vào cuối `describe` trong `backend/test/tasks.e2e-spec.ts` (trước `afterAll` là được, jest cho phép `it` ở bất kỳ đâu trong describe):
```ts
  it('GET /shift-config trả mốc giờ ca (mặc định 17:00 / 17:15)', async () => {
    const r = await request(app.getHttpServer()).get('/api/tasks/shift-config').expect(200)
    expect(r.body.data.shiftEnd).toBe('17:00')
    expect(r.body.data.otStart).toBe('17:15')
  })

  it('POST /assignments/bulk với otHoursByWorker -> assignment OT theo từng NV', async () => {
    // đảm bảo worker rảnh trước khi test
    await request(app.getHttpServer()).post(`/api/tasks/${anotherUnassignedTaskId}/unassign`).send({ workerId: freeWorkerId }).expect(201)
    const draft = { [anotherUnassignedTaskId]: [freeWorkerId] }
    await request(app.getHttpServer()).post('/api/tasks/assignments/bulk')
      .send({ draft, otHoursByWorker: { [freeWorkerId]: 2 } }).expect(201)
    const active = await request(app.getHttpServer()).get('/api/tasks/active').expect(200)
    const t = active.body.data.find((x: { id: string }) => x.id === anotherUnassignedTaskId)
    const a = t.assignments.find((x: { workerId: string }) => x.workerId === freeWorkerId) as { isOvertime: boolean; otEndAt: string | null }
    expect(a.isOvertime).toBe(true)
    expect(a.otEndAt).toBeTruthy()
    // dọn dẹp
    await request(app.getHttpServer()).post(`/api/tasks/${anotherUnassignedTaskId}/unassign`).send({ workerId: freeWorkerId }).expect(201)
  })
```

- [ ] **Step 2: Chạy test xác nhận FAIL**

Run: `cd backend && npx jest --config ./test/jest-e2e.json -t "shift-config"`
Expected: FAIL (route `shift-config` 404).

- [ ] **Step 3: Service** — `tasks.service.ts`:
  a. Sửa import dòng `import { computeOtEndAt } from './shift'` thành:
```ts
import { computeOtEndAt, SHIFT_END_HOUR, SHIFT_END_MIN, OT_START_HOUR, OT_START_MIN, formatHm } from './shift'
```
  b. Thay method `saveAssignments` (giữ vị trí hiện tại):
```ts
  /** Lưu phân công nháp; OT theo TỪNG NV: otHoursByWorker[workerId] (giờ). Trả về số lượt giao. */
  async saveAssignments(draft: Record<string, string[]>, otHoursByWorker?: Record<string, number>): Promise<number> {
    let count = 0
    for (const [taskId, workerIds] of Object.entries(draft)) {
      for (const workerId of workerIds) {
        await this.assign(taskId, workerId, otHoursByWorker?.[workerId])
        count += 1
      }
    }
    return count
  }

  /** Mốc giờ ca cho FE (đọc từ hằng số shift.ts). */
  shiftConfig(): { shiftEnd: string; otStart: string } {
    return { shiftEnd: formatHm(SHIFT_END_HOUR, SHIFT_END_MIN), otStart: formatHm(OT_START_HOUR, OT_START_MIN) }
  }
```

- [ ] **Step 4: Controller** — `tasks.controller.ts`:
  a. Thêm route tĩnh cạnh `@Get('completed')`:
```ts
  // Mốc giờ ca (giờ tan ca / bắt đầu OT) cho FE.
  @Get('shift-config') shiftConfig() { return this.svc.shiftConfig() }
```
  b. Thay route `assignments/bulk`:
```ts
  @Post('assignments/bulk') saveAssignments(@Body() body: { draft: Record<string, string[]>; otHoursByWorker?: Record<string, number> }) {
    return this.svc.saveAssignments(body.draft, body.otHoursByWorker)
  }
```

- [ ] **Step 5: Chạy test PASS**

Run: `cd backend && npx jest --config ./test/jest-e2e.json -t "shift-config|otHoursByWorker"`
Expected: PASS (2/2).

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/tasks/tasks.service.ts backend/src/modules/tasks/tasks.controller.ts backend/test/tasks.e2e-spec.ts
git commit -m "feat(tasks): saveAssignments nhận OT per-worker + endpoint shift-config"
```

---

### Task 3: BE — `overtimeMinutes` kẹp mốc 17:15 ở `completedTasks` + `tasksForProject`

**Files:**
- Modify: `backend/src/modules/tasks/tasks.service.ts`
- Test: `backend/test/tasks.e2e-spec.ts`

**Interfaces:**
- Consumes: `otMinutesOf` (Task 1).
- Produces: `overtimeMinutes` (trong `completedTasks()` và `tasksForProject()`) tính bằng `otMinutesOf` thay vì `endedAt−startedAt`.

- [ ] **Step 1: Viết e2e (RED)** — thêm vào `tasks.e2e-spec.ts`:
```ts
  it('GET /completed: overtimeMinutes là số (kẹp mốc OT)', async () => {
    const draft = { [unassignedTaskId]: [freeWorkerId] }
    await request(app.getHttpServer()).post('/api/tasks/assignments/bulk')
      .send({ draft, otHoursByWorker: { [freeWorkerId]: 1 } }).expect(201)
    await request(app.getHttpServer()).post(`/api/tasks/${unassignedTaskId}/complete`).expect(201)
    const done = await request(app.getHttpServer()).get('/api/tasks/completed').expect(200)
    const row = done.body.data.find((x: { id: string }) => x.id === unassignedTaskId)
    expect(row).toBeTruthy()
    expect(typeof row.overtimeMinutes).toBe('number')
    expect(row.overtimeMinutes).toBeGreaterThanOrEqual(0)
  })
```

- [ ] **Step 2: Chạy test xác nhận trạng thái**

Run: `cd backend && npx jest --config ./test/jest-e2e.json -t "kẹp mốc OT"`
Expected: PASS về mặt shape (test này chủ yếu chốt hành vi; đảm bảo không lỗi runtime). Nếu FAIL do `overtimeMinutes` undefined → tiếp Step 3. Kẹp mốc đúng đã được đảm bảo bởi unit test `otMinutesOf` (Task 1).

- [ ] **Step 3: Service** — `tasks.service.ts`:
  a. Bổ sung `otMinutesOf` vào dòng import shift:
```ts
import { computeOtEndAt, SHIFT_END_HOUR, SHIFT_END_MIN, OT_START_HOUR, OT_START_MIN, formatHm, otMinutesOf } from './shift'
```
  b. Trong `completedTasks()`, thay dòng tính `overtimeMinutes`:
```ts
      const overtimeMinutes = list.reduce(
        (s, a) => s + (a.isOvertime && a.startedAt && a.endedAt ? otMinutesOf(a.startedAt, a.endedAt) : 0),
        0,
      )
```
  c. Trong `tasksForProject()`, thay dòng `overtimeMinutes: list.filter((a) => a.isOvertime).reduce(...)` thành:
```ts
        overtimeMinutes: list.reduce(
          (s, a) => s + (a.isOvertime && a.startedAt && a.endedAt ? otMinutesOf(a.startedAt, a.endedAt) : 0),
          0,
        ),
```

- [ ] **Step 4: Chạy test PASS + toàn bộ tasks e2e**

Run: `cd backend && npx jest --config ./test/jest-e2e.json tasks`
Expected: PASS (không lỗi mới).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/tasks/tasks.service.ts backend/test/tasks.e2e-spec.ts
git commit -m "feat(tasks): phút OT kẹp mốc 17:15 ở danh sách hoàn thành + chi tiết dự án"
```

---

### Task 4: FE — type `ShiftConfig` + hook `useShiftConfig` + mock kẹp OT

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/api/tasks.ts`

**Interfaces:**
- Produces: `interface ShiftConfig { shiftEnd: string; otStart: string }`; `useShiftConfig()` (react-query); mock `completedTasksFromDb` kẹp OT về 17:15.
- Ghi chú: KHÔNG đổi `useSaveAssignments`/`OvertimeDialog` ở task này (giữ build xanh). Đổi ở Task 5.

- [ ] **Step 1: Type** — `frontend/src/types/index.ts`, thêm gần các type liên quan Task (vd cạnh `CompletedTask`):
```ts
export interface ShiftConfig { shiftEnd: string; otStart: string }
```

- [ ] **Step 2: Mock kẹp OT** — `frontend/src/api/tasks.ts`, trong `completedTasksFromDb`, thay hàm `minutesOf`/tính `overtimeMinutes`. Thêm helper local ngay trước `return db.tasks.filter(...)`:
```ts
  // Phút OT kẹp mốc 17:15 (đồng bộ BE otMinutesOf).
  const otMinutesInDb = (a: TaskAssignment): number => {
    if (!a.isOvertime || !a.startedAt || !a.endedAt) return 0
    const start = new Date(a.startedAt)
    const otStart = new Date(start); otStart.setHours(17, 15, 0, 0)
    const from = start > otStart ? start : otStart
    return Math.max(0, Math.round((+new Date(a.endedAt) - +from) / 60000))
  }
```
  Rồi đổi dòng `overtimeMinutes` trong object trả về:
```ts
      overtimeMinutes: list.reduce((s, a) => s + otMinutesInDb(a), 0),
```

- [ ] **Step 3: Hook `useShiftConfig`** — `frontend/src/api/tasks.ts`:
  a. Thêm `ShiftConfig` vào import type (dòng import từ `@/types` hoặc `../types`; khớp cách import type hiện có trong file).
  b. Thêm hook (cạnh `useWorkerAllocation`):
```ts
/** Mốc giờ ca (giờ tan ca / bắt đầu OT) cho FE. */
export function useShiftConfig() {
  return useQuery<ShiftConfig>({
    queryKey: ['tasks', 'shift-config'],
    queryFn: () => USE_MOCK
      ? mockRequest(() => ({ shiftEnd: '17:00', otStart: '17:15' }))
      : apiGet<ShiftConfig>('/tasks/shift-config'),
    staleTime: Infinity,
  })
}
```

- [ ] **Step 4: Build**

Run: `cd frontend && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types/index.ts frontend/src/api/tasks.ts
git commit -m "feat(tasks): FE type ShiftConfig + useShiftConfig + mock kẹp phút OT 17:15"
```

---

### Task 5: FE — `OvertimeDialog` per-worker + đổi `saveAssignments` sang map + wire Kanban

**Files:**
- Modify: `frontend/src/components/kanban/OvertimeDialog.tsx`
- Modify: `frontend/src/api/tasks.ts` (`assignWorkerInDb`, `saveAssignmentsInDb`, `useSaveAssignments`)
- Modify: `frontend/src/pages/Kanban.tsx`
- Modify: `frontend/src/pages/Kanban.css`

**Interfaces:**
- Consumes: `useShiftConfig` (Task 4); `workerMap` (sẵn có trong Kanban).
- Produces: `OvertimeDialog` props `{ open, workers: OtWorker[], onCancel, onConfirm(map: Record<string, number>) }`; `useSaveAssignments` nhận `{ draft, otHoursByWorker? }`.

- [ ] **Step 1: Viết lại `OvertimeDialog.tsx`** — thay toàn bộ:
```tsx
import { useState } from 'react'
import { FormModal } from '@/components/ui/FormModal'
import { Button } from '@/components/ui/Button'

export interface OtWorker { id: string; fullName: string; initials: string; avatarColor: string }

interface Props {
  open: boolean
  workers: OtWorker[]
  onCancel: () => void
  onConfirm: (otHoursByWorker: Record<string, number>) => void
}

/** Dialog nhập số giờ tăng ca RIÊNG từng NV (giao việc sau giờ tan ca). OT tính từ 17:15. */
export function OvertimeDialog({ open, workers, onCancel, onConfirm }: Props) {
  const [hours, setHours] = useState<Record<string, string>>({})
  const valueOf = (id: string) => hours[id] ?? '2'
  const parsed = (id: string) => Number(valueOf(id))
  const validOne = (id: string) => { const n = parsed(id); return !Number.isNaN(n) && n >= 0.5 && n <= 6 }
  const allValid = workers.length > 0 && workers.every((w) => validOne(w.id))
  const confirm = () => {
    const map: Record<string, number> = {}
    for (const w of workers) map[w.id] = parsed(w.id)
    onConfirm(map)
  }
  return (
    <FormModal open={open} onClose={onCancel} size="md" title="Xin tăng ca"
      footer={<>
        <Button onClick={onCancel}>Hủy</Button>
        <Button variant="primary" disabled={!allValid} onClick={confirm}>Xác nhận tăng ca</Button>
      </>}>
      <p style={{ marginBottom: 12, color: 'var(--color-text-2)' }}>
        Đang giao việc sau giờ tan ca. Giờ tăng ca tính từ <strong>17:15</strong>; nhập số giờ cho từng nhân viên — hết giờ họ tự về trạng thái chờ.
      </p>
      <div className="ot-list">
        {workers.map((w) => (
          <div key={w.id} className="ot-row">
            <span className="ot-row__av" style={{ background: w.avatarColor }}>{w.initials}</span>
            <span className="ot-row__name">{w.fullName}</span>
            <input className="ot-row__input" inputMode="decimal" value={valueOf(w.id)}
              onChange={(e) => setHours((prev) => ({ ...prev, [w.id]: e.target.value }))}
              aria-invalid={!validOne(w.id)} />
            <span className="ot-row__unit">giờ</span>
          </div>
        ))}
      </div>
    </FormModal>
  )
}
```

- [ ] **Step 2: `api/tasks.ts`** — 3 sửa đổi:
  a. `assignWorkerInDb` — tính `otEndAt` khi có OT (thay dòng `otEndAt: null`). Thay thân hàm phần tạo `otEnd`:
```ts
export function assignWorkerInDb(taskId: string, workerId: string, otHours?: number): TaskAssignment {
  const overtime = typeof otHours === 'number' && otHours > 0
  let otEnd: string | null = null
  if (overtime) {
    const d = new Date(); d.setHours(17, 15, 0, 0); d.setMinutes(d.getMinutes() + Math.round((otHours as number) * 60))
    otEnd = d.toISOString()
  }
  const a: TaskAssignment = {
    id: nextId('ta'), taskId, workerId,
    assignedAt: now(), startedAt: now(), endedAt: null, isActive: true,
    isOvertime: overtime, otEndAt: otEnd,
    createdAt: now(), updatedAt: now(),
  }
  db.taskAssignments.push(a)
  const task = db.tasks.find((t) => t.id === taskId)
  if (task && task.status === 'unassigned') { task.status = 'in_progress'; task.updatedAt = now() }
  return a
}
```
  b. `saveAssignmentsInDb` — nhận map:
```ts
/** Lưu phân công nháp (taskId -> workerIds); OT theo từng NV. Trả về số lượt giao. */
export function saveAssignmentsInDb(draft: Record<string, string[]>, otHoursByWorker?: Record<string, number>): number {
  let count = 0
  for (const [taskId, workerIds] of Object.entries(draft)) {
    for (const workerId of workerIds) { assignWorkerInDb(taskId, workerId, otHoursByWorker?.[workerId]); count += 1 }
  }
  return count
}
```
  c. `useSaveAssignments` — nhận map:
```ts
export function useSaveAssignments() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ draft, otHoursByWorker }: { draft: Record<string, string[]>; otHoursByWorker?: Record<string, number> }) => USE_MOCK
      ? mockRequest(() => saveAssignmentsInDb(draft, otHoursByWorker))
      : apiPost('/tasks/assignments/bulk', { draft, otHoursByWorker }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
```

- [ ] **Step 3: `Kanban.tsx`** — wire per-worker OT:
  a. Sửa import `OvertimeDialog`:
```tsx
import { OvertimeDialog, type OtWorker } from '@/components/kanban/OvertimeDialog'
```
  b. Thêm `useShiftConfig` vào import từ `@/api/tasks` và khai báo trong component (cạnh các hook khác):
```tsx
  const { data: shiftConfig } = useShiftConfig()
```
  c. Thêm danh sách NV distinct trong nháp (cạnh `draftCount`):
```tsx
  const draftWorkers: OtWorker[] = useMemo(() => {
    const ids = [...new Set(Object.values(draft).flat())]
    return ids
      .map((id) => workerMap.get(id))
      .filter((w): w is NonNullable<typeof w> => !!w)
      .map((w) => ({ id: w.id, fullName: w.fullName, initials: w.initials, avatarColor: w.avatarColor }))
  }, [draft, workerMap])
```
  d. Thay `doSave` + `handleSave`:
```tsx
  const doSave = async (otHoursByWorker?: Record<string, number>) => {
    const n = await saveAssignments.mutateAsync({ draft, otHoursByWorker })
    setDraft({}); setOtOpen(false)
    const otCount = otHoursByWorker ? Object.keys(otHoursByWorker).length : 0
    toast(`✓ Đã lưu ${n} lượt giao việc${otCount ? ` (tăng ca ${otCount} người)` : ''}`)
  }

  // Giao việc sau giờ tan ca -> hỏi giờ tăng ca (mốc lấy từ shift-config); ngược lại lưu ngay.
  const isAfterShiftEnd = () => {
    const [h, m] = (shiftConfig?.shiftEnd ?? '17:00').split(':').map(Number)
    const now = new Date()
    return now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m)
  }
  const handleSave = async () => {
    if (isAfterShiftEnd()) setOtOpen(true)
    else await doSave()
  }
```
  e. Thay render dialog ở cuối component:
```tsx
      <OvertimeDialog open={otOpen} workers={draftWorkers} onCancel={() => setOtOpen(false)} onConfirm={(map) => doSave(map)} />
```

- [ ] **Step 4: CSS** — `Kanban.css`, thêm:
```css
.ot-list { display: flex; flex-direction: column; gap: 8px; }
.ot-row { display: flex; align-items: center; gap: 8px; }
.ot-row__av { width: 26px; height: 26px; border-radius: 50%; color: #fff; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; }
.ot-row__name { flex: 1 1 auto; font-size: 13px; }
.ot-row__input { width: 64px; text-align: right; }
.ot-row__input[aria-invalid="true"] { border-color: var(--color-red); }
.ot-row__unit { color: var(--color-text-2); font-size: 12px; }
```

- [ ] **Step 5: Build**

Run: `cd frontend && npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/kanban/OvertimeDialog.tsx frontend/src/api/tasks.ts frontend/src/pages/Kanban.tsx frontend/src/pages/Kanban.css
git commit -m "feat(tasks): dialog tăng ca nhập riêng từng NV + lưu giao việc theo map OT"
```

---

### Task 6: FE — badge đếm ngược tan ca + nhãn "tự về chờ lúc HH:MM" cho NV đang OT

**Files:**
- Create: `frontend/src/components/kanban/ShiftCountdown.tsx`
- Modify: `frontend/src/pages/Kanban.tsx`
- Modify: `frontend/src/pages/Kanban.css`

**Interfaces:**
- Consumes: `shiftConfig` (Task 5); `assignment.isOvertime`, `assignment.otEndAt` (sẵn có).
- Produces: component `ShiftCountdown` (badge đếm ngược).

- [ ] **Step 1: Component** — `frontend/src/components/kanban/ShiftCountdown.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { IconClock } from '@tabler/icons-react'

/** Badge đếm ngược tới giờ tan ca (mốc "HH:MM"). Tự cập nhật mỗi 30s. */
export function ShiftCountdown({ shiftEnd }: { shiftEnd: string }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 30_000)
    return () => clearInterval(t)
  }, [])
  const [h, m] = shiftEnd.split(':').map(Number)
  const now = new Date()
  const end = new Date(now); end.setHours(h, m, 0, 0)
  const mins = Math.round((+end - +now) / 60000)
  if (mins <= 0) {
    return <span className="kb-countdown kb-countdown--off"><IconClock size={14} /> Đã qua giờ tan ca ({shiftEnd})</span>
  }
  const hh = Math.floor(mins / 60), mm = mins % 60
  return <span className="kb-countdown"><IconClock size={14} /> Còn {hh ? `${hh}h ` : ''}{mm}p tới tan ca ({shiftEnd})</span>
}
```

- [ ] **Step 2: `Kanban.tsx`** — hiển thị badge + nhãn OT:
  a. Import:
```tsx
import { ShiftCountdown } from '@/components/kanban/ShiftCountdown'
```
  b. Trong `kb-tasks` header (`<div className="kb-page__head">` của bước 4, sau `<span className="kb-crumb">`), thêm badge:
```tsx
                    {shiftConfig && <ShiftCountdown shiftEnd={shiftConfig.shiftEnd} />}
```
  c. Trong khối render chip NV đã lưu (`{(t.assignments ?? []).map((a) => (...))}`), sau `<LiveTimer since={a.assignedAt} />` thêm nhãn OT:
```tsx
                              {a.isOvertime && a.otEndAt && (
                                <span className="chip__ot" title="Tự về trạng thái chờ khi hết giờ tăng ca">
                                  OT · về chờ {new Date(a.otEndAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
```

- [ ] **Step 3: CSS** — `Kanban.css`, thêm:
```css
.kb-countdown { display: inline-flex; align-items: center; gap: 4px; margin-left: auto; font-size: 12px; color: var(--color-blue); background: var(--color-surface-2); border-radius: 6px; padding: 3px 8px; }
.kb-countdown--off { color: var(--color-red); }
.chip__ot { font-size: 11px; color: var(--color-amber); background: var(--color-surface-2); border-radius: 5px; padding: 1px 6px; }
```

- [ ] **Step 4: Kiểm thử tổng FE**

Run: `cd frontend && npx vitest run; npm run build`
Expected: build PASS; vitest không fail MỚI ngoài 10 lỗi pre-existing.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/kanban/ShiftCountdown.tsx frontend/src/pages/Kanban.tsx frontend/src/pages/Kanban.css
git commit -m "feat(tasks): badge đếm ngược tan ca + nhãn tự-về-chờ cho NV tăng ca"
```

---

## Kiểm thử tổng (sau Task 6)
- BE: `cd backend && npx jest shift && npx jest --config ./test/jest-e2e.json tasks` → PASS.
- FE: `cd frontend && npm run build` → OK; vitest không fail MỚI.
- Thủ công (API thật, `VITE_USE_MOCK=false`): giao việc trước 17:00 lưu bình thường; đặt env `SHIFT_END=10:00` (hoặc giờ hiện tại) khởi động lại backend → bấm Lưu hiện dialog OT liệt kê từng NV, mỗi người nhập giờ riêng; badge đếm ngược hiển thị đúng; chip NV OT có nhãn "về chờ HH:MM"; danh sách hoàn thành hiển thị phút OT kẹp 17:15.

## Self-Review (đã rà)
- **Spec coverage:** D1 giữ nguyên (không task — có chủ đích); D2 → Task 2 (BE map) + Task 5 (dialog/FE map); D3 → Task 1 (`otMinutesOf`) + Task 3 (BE) + Task 4 (mock); D4 → Task 1 (env) + Task 6 (badge/nhãn); D5 → Task 2 (endpoint) + Task 4 (hook) + Task 5 (gating). D6 (transfer sau 17:00) — ngoài phạm vi, không task.
- **Type consistency:** `saveAssignments(draft, otHoursByWorker?)` đồng nhất BE service ↔ controller ↔ FE `useSaveAssignments` ↔ mock; `OvertimeDialog.onConfirm(map)` ↔ `doSave(map)`; `ShiftConfig{shiftEnd,otStart}` đồng nhất BE `shiftConfig()` ↔ FE type/hook; `otMinutesOf(startedAt, endedAt)` dùng nhất quán BE + mirror ở mock.
- **Build xanh mỗi task:** Task 4 KHÔNG đụng `useSaveAssignments`/dialog (tránh vỡ build); mọi thay đổi signature phá vỡ nằm gọn trong Task 5.
- **Không migration:** 2 cột OT đã có từ đợt 06-18.
- **Rủi ro:** e2e phụ thuộc thứ tự `it` dùng chung `freeWorkerId` — test OT bulk tự `unassign` trước để đảm bảo rảnh. Mock hardcode 17:15 (demo chạy API thật nên không ảnh hưởng).
```
