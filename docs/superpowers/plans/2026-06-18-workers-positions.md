# Gói 3 — Nhân viên Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tách chức vụ nhân viên thành 12 loại theo 2 nhóm (Nhân viên / Quản lý), chỉ nhóm Nhân viên hiển thị trong danh sách giao việc, và KPI tổng NV vs tổng Quản lý — khai báo chức vụ ở 1 file master để dễ nâng cấp.

**Architecture:** Master file hằng số chức vụ (BE + FE). Migration MariaDB remap enum `workers.position` (widen→UPDATE→narrow). Nhóm suy ra từ chức vụ (không thêm cột). `availableWorkers` lọc nhóm staff.

**Tech Stack:** NestJS + TypeORM + MariaDB (BE), React + react-hook-form + zod + Vitest (FE). Spec: `docs/superpowers/specs/2026-06-18-workers-positions-design.md`.

## Global Constraints

- DB MariaDB native localhost, KHÔNG docker. Migration raw `ALTER TABLE`, widen→UPDATE→narrow (như `1718000015000`).
- 12 chức vụ — nhóm **staff** (hiện giao việc): `foreman`(Quản đốc), `deputy_foreman`(Phó quản đốc), `team_leader`(Tổ trưởng), `deputy_leader`(Tổ phó), `worker`(Công nhân). Nhóm **management** (ẩn giao việc): `director`(Giám đốc), `deputy_director`(Phó giám đốc), `chief_accountant`(Kế toán trưởng), `accountant`(Kế toán viên), `storekeeper`(Thủ kho), `sales`(Sale), `other`(Khác).
- Map cũ→mới: `team_leader→team_leader`, `senior_worker→worker`, `worker→worker`, `apprentice→worker`, `technician→worker`, `supervisor→foreman`, `other→other`.
- BE e2e: `cd backend && npm run migration:run` rồi `npx jest --config ./test/jest-e2e.json workers`. FE gate: `cd frontend && npm run build` (KHÔNG `npx tsc --noEmit` — stale .tsbuildinfo). FE test: `npx vitest run`.
- 10 lỗi vitest pre-existing (pay-calculator/sites/timesheet/smoke) — bỏ qua, không tính là lỗi.
- Commit prefix `feat(workers)`, tiếng Việt. Branch `poc`, commit trực tiếp, KHÔNG tạo branch.

---

### Task 1: BE — master chức vụ + remap enum (migration + entity + DTO + schema.sql + e2e)

**Files:**
- Create: `backend/src/modules/workers/worker-positions.ts`
- Create: `backend/src/database/migrations/1718000016000-AlterWorkersPositions.ts`
- Modify: `backend/src/modules/workers/entities/worker.entity.ts`
- Modify: `backend/src/modules/workers/dto/create-worker.dto.ts`
- Modify: `backend/src/modules/workers/dto/query-worker.dto.ts`
- Modify: `backend/database/schema.sql`
- Test: `backend/test/workers.e2e-spec.ts`

**Interfaces:**
- Produces: `STAFF_POSITIONS`, `MANAGEMENT_POSITIONS`, `ALL_POSITIONS` (string[]) từ `worker-positions.ts`; `worker.position` chấp nhận 12 giá trị mới.

- [ ] **Step 1: Thêm test e2e mới (RED)** — trong `backend/test/workers.e2e-spec.ts`, sửa test đầu `position: 'worker'` giữ nguyên (vẫn hợp lệ), và thêm test trước test DELETE:
```ts
  it('POST /api/workers chấp nhận chức vụ mới (foreman/director)', async () => {
    const f = await request(app.getHttpServer()).post('/api/workers')
      .send({ fullName: 'Quản đốc Test', gender: 'male', position: 'foreman', contractType: 'official', startDate: '2026-01-01', baseSalary: 9000000 }).expect(201)
    expect(f.body.data.position).toBe('foreman')
    const d = await request(app.getHttpServer()).post('/api/workers')
      .send({ fullName: 'Giám đốc Test', gender: 'male', position: 'director', contractType: 'official', startDate: '2026-01-01', baseSalary: 20000000 }).expect(201)
    expect(d.body.data.position).toBe('director')
  })
```

- [ ] **Step 2: Chạy test xác nhận FAIL**

Run: `cd backend && npx jest --config ./test/jest-e2e.json -t "chức vụ mới"`
Expected: FAIL (DTO từ chối `foreman`/`director`).

- [ ] **Step 3: Tạo master** — `backend/src/modules/workers/worker-positions.ts`:
```ts
/** Master chức vụ nhân viên + nhóm. Sau này có thể nâng thành bảng/config sửa được. */
export const STAFF_POSITIONS: string[] = ['foreman', 'deputy_foreman', 'team_leader', 'deputy_leader', 'worker']
export const MANAGEMENT_POSITIONS: string[] = ['director', 'deputy_director', 'chief_accountant', 'accountant', 'storekeeper', 'sales', 'other']
export const ALL_POSITIONS: string[] = [...STAFF_POSITIONS, ...MANAGEMENT_POSITIONS]
```

- [ ] **Step 4: Tạo migration** — `1718000016000-AlterWorkersPositions.ts`:
```ts
import { MigrationInterface, QueryRunner } from 'typeorm'

/** Đổi workers.position sang 12 chức vụ (2 nhóm) + map dữ liệu cũ. */
export class AlterWorkersPositions1718000016000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query("ALTER TABLE `workers` MODIFY COLUMN `position` ENUM('team_leader','senior_worker','worker','apprentice','technician','supervisor','other','foreman','deputy_foreman','deputy_leader','director','deputy_director','chief_accountant','accountant','storekeeper','sales') NOT NULL")
    await q.query("UPDATE `workers` SET `position`='worker' WHERE `position` IN ('senior_worker','apprentice','technician')")
    await q.query("UPDATE `workers` SET `position`='foreman' WHERE `position`='supervisor'")
    await q.query("ALTER TABLE `workers` MODIFY COLUMN `position` ENUM('foreman','deputy_foreman','team_leader','deputy_leader','worker','director','deputy_director','chief_accountant','accountant','storekeeper','sales','other') NOT NULL")
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.query("ALTER TABLE `workers` MODIFY COLUMN `position` ENUM('team_leader','senior_worker','worker','apprentice','technician','supervisor','other','foreman','deputy_foreman','deputy_leader','director','deputy_director','chief_accountant','accountant','storekeeper','sales') NOT NULL")
    await q.query("UPDATE `workers` SET `position`='supervisor' WHERE `position` IN ('foreman','deputy_foreman')")
    await q.query("UPDATE `workers` SET `position`='team_leader' WHERE `position`='deputy_leader'")
    await q.query("UPDATE `workers` SET `position`='other' WHERE `position` IN ('director','deputy_director','chief_accountant','accountant','storekeeper','sales')")
    await q.query("ALTER TABLE `workers` MODIFY COLUMN `position` ENUM('team_leader','senior_worker','worker','apprentice','technician','supervisor','other') NOT NULL")
  }
}
```

- [ ] **Step 5: Entity** — `worker.entity.ts`: thêm import `import { ALL_POSITIONS } from '../worker-positions'` và đổi dòng `position`:
```ts
  @Column({ type: 'enum', enum: ALL_POSITIONS }) position: string
```

- [ ] **Step 6: create DTO** — `create-worker.dto.ts`: thêm `import { ALL_POSITIONS } from '../worker-positions'`; đổi:
```ts
  @IsEnum(ALL_POSITIONS) position: string
```

- [ ] **Step 7: query DTO** — `query-worker.dto.ts`: thêm `import { ALL_POSITIONS } from '../worker-positions'`; đổi:
```ts
  @IsOptional() @EmptyToUndefined() @IsEnum(ALL_POSITIONS) position?: string
```

- [ ] **Step 8: schema.sql** — đổi dòng `position` enum thành:
```sql
  `position` enum('foreman','deputy_foreman','team_leader','deputy_leader','worker','director','deputy_director','chief_accountant','accountant','storekeeper','sales','other') NOT NULL,
```

- [ ] **Step 9: migration:run + test PASS**

Run: `cd backend && npm run migration:run && npx jest --config ./test/jest-e2e.json workers`
Expected: tất cả workers e2e PASS (gồm test mới).

- [ ] **Step 10: Commit**

```bash
git add backend/src/modules/workers/worker-positions.ts backend/src/database/migrations/1718000016000-AlterWorkersPositions.ts backend/src/modules/workers/entities/worker.entity.ts backend/src/modules/workers/dto/create-worker.dto.ts backend/src/modules/workers/dto/query-worker.dto.ts backend/database/schema.sql backend/test/workers.e2e-spec.ts
git commit -m "feat(workers): 12 chức vụ (2 nhóm NV/Quản lý) + master file + migration"
```

---

### Task 2: BE — `availableWorkers` chỉ trả nhóm Nhân viên (giao việc)

**Files:**
- Modify: `backend/src/modules/tasks/tasks.service.ts` (`availableWorkers()`)
- Test: `backend/test/workers.e2e-spec.ts`

**Interfaces:**
- Consumes: `STAFF_POSITIONS` (Task 1).
- Produces: `GET /api/tasks/available-workers` loại worker nhóm management.

- [ ] **Step 1: Viết test (RED)** — thêm vào `workers.e2e-spec.ts` (trước DELETE):
```ts
  it('available-workers loại nhóm Quản lý, giữ nhóm Nhân viên', async () => {
    await request(app.getHttpServer()).post('/api/workers')
      .send({ fullName: 'CN Giao Việc', gender: 'male', position: 'worker', contractType: 'official', startDate: '2026-01-01', baseSalary: 8000000 }).expect(201)
    const dir = await request(app.getHttpServer()).post('/api/workers')
      .send({ fullName: 'GĐ Ẩn', gender: 'male', position: 'director', contractType: 'official', startDate: '2026-01-01', baseSalary: 20000000 }).expect(201)
    const res = await request(app.getHttpServer()).get('/api/tasks/available-workers').expect(200)
    const ids = res.body.data.map((w: { id: string }) => w.id)
    expect(ids).not.toContain(dir.body.data.id)
    expect(res.body.data.every((w: { position: string }) => ['foreman','deputy_foreman','team_leader','deputy_leader','worker'].includes(w.position))).toBe(true)
  })
```

- [ ] **Step 2: Chạy test xác nhận FAIL**

Run: `cd backend && npx jest --config ./test/jest-e2e.json -t "loại nhóm Quản lý"`
Expected: FAIL (director vẫn xuất hiện trong available-workers).

- [ ] **Step 3: Lọc staff trong service** — `tasks.service.ts`:
  a. Thêm import: `import { STAFF_POSITIONS } from '../workers/worker-positions'` (cạnh các import worker). `In` đã import từ `typeorm`.
  b. Trong `availableWorkers()`, đổi dòng tải workers:
```ts
    const workers = await this.workerRepo.find({ where: { status: 'working', position: In(STAFF_POSITIONS) } })
```

- [ ] **Step 4: Chạy test PASS**

Run: `cd backend && npx jest --config ./test/jest-e2e.json -t "loại nhóm Quản lý"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/tasks/tasks.service.ts backend/test/workers.e2e-spec.ts
git commit -m "feat(workers): danh sách giao việc chỉ hiện nhóm Nhân viên"
```

---

### Task 3: FE — types master chức vụ (12 + nhóm)

**Files:**
- Modify: `frontend/src/types/index.ts`

**Interfaces:**
- Produces: `Position` (12), `POSITION_LABELS`, `POSITION_GROUP`, `STAFF_POSITIONS`, `MANAGEMENT_POSITIONS`, `POSITION_GROUP_LABELS`.

- [ ] **Step 1: Thay block Position** — `types/index.ts` dòng 75-89 (type `Position` + `POSITION_LABELS`) thành:
```ts
export type Position =
  | 'foreman' | 'deputy_foreman' | 'team_leader' | 'deputy_leader' | 'worker'
  | 'director' | 'deputy_director' | 'chief_accountant' | 'accountant' | 'storekeeper' | 'sales' | 'other'
export type PositionGroup = 'staff' | 'management'

export const POSITION_LABELS: Record<Position, string> = {
  foreman:         'Quản đốc',
  deputy_foreman:  'Phó quản đốc',
  team_leader:     'Tổ trưởng',
  deputy_leader:   'Tổ phó',
  worker:          'Công nhân',
  director:        'Giám đốc',
  deputy_director: 'Phó giám đốc',
  chief_accountant:'Kế toán trưởng',
  accountant:      'Kế toán viên',
  storekeeper:     'Thủ kho',
  sales:           'Sale',
  other:           'Khác',
}

export const STAFF_POSITIONS: Position[] = ['foreman', 'deputy_foreman', 'team_leader', 'deputy_leader', 'worker']
export const MANAGEMENT_POSITIONS: Position[] = ['director', 'deputy_director', 'chief_accountant', 'accountant', 'storekeeper', 'sales', 'other']
export const POSITION_GROUP: Record<Position, PositionGroup> = Object.fromEntries([
  ...STAFF_POSITIONS.map((p) => [p, 'staff']),
  ...MANAGEMENT_POSITIONS.map((p) => [p, 'management']),
]) as Record<Position, PositionGroup>
export const POSITION_GROUP_LABELS: Record<PositionGroup, string> = { staff: 'Nhân viên', management: 'Quản lý' }
```

- [ ] **Step 2: Build để xác định chỗ vỡ (dự kiến mock/form)**

Run: `cd frontend && npm run build`
Expected: lỗi build CHỈ ở `workerFormShape.ts`/`WorkerForm.tsx`/`Workers.tsx`/`mocks/seed/workers.ts`/`api/tasks.ts` (chức vụ cũ) — các Task 4–6 xử lý. Ghi danh sách lỗi vào report. Không sửa file ngoài Task 3.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "feat(workers): types 12 chức vụ + nhóm staff/management (FE master)"
```

---

### Task 4: FE — form shape zod + `WorkerForm` (select 2 optgroup)

**Files:**
- Modify: `frontend/src/components/workers/workerFormShape.ts`
- Modify: `frontend/src/components/workers/WorkerForm.tsx`

**Interfaces:**
- Consumes: `Position`, `POSITION_LABELS`, `STAFF_POSITIONS`, `MANAGEMENT_POSITIONS` (Task 3).

- [ ] **Step 1: `workerFormShape.ts`** — đổi zod enum `position` (dòng ~33) sang 12 giá trị mới:
```ts
    position: z.enum([
      'foreman', 'deputy_foreman', 'team_leader', 'deputy_leader', 'worker',
      'director', 'deputy_director', 'chief_accountant', 'accountant', 'storekeeper', 'sales', 'other',
    ]),
```
và trong `emptyWorkerForm`, đảm bảo `position: 'worker'` (giữ nguyên nếu đã là 'worker').

- [ ] **Step 2: `WorkerForm.tsx`** — đổi import dòng 5:
```ts
import { POSITION_LABELS, STAFF_POSITIONS, MANAGEMENT_POSITIONS, type Position, type Worker } from '@/types'
```
và thay khối `<select {...register('position')}>...</select>` (dòng 82-86) bằng:
```tsx
            <select {...register('position')}>
              <optgroup label="Nhân viên">
                {STAFF_POSITIONS.map((k) => <option key={k} value={k}>{POSITION_LABELS[k]}</option>)}
              </optgroup>
              <optgroup label="Quản lý">
                {MANAGEMENT_POSITIONS.map((k) => <option key={k} value={k}>{POSITION_LABELS[k]}</option>)}
              </optgroup>
            </select>
```
(Nếu `Position` import không còn dùng trực tiếp thì bỏ; nếu vẫn dùng giữ lại.)

- [ ] **Step 3: Build**

Run: `cd frontend && npm run build`
Expected: PASS hoặc chỉ còn lỗi ở `Workers.tsx`/`mocks`/`api/tasks.ts` (Task 5–6). Ghi report.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/workers/workerFormShape.ts frontend/src/components/workers/WorkerForm.tsx
git commit -m "feat(workers): form chọn chức vụ theo 2 nhóm (optgroup NV/Quản lý)"
```

---

### Task 5: FE — `Workers.tsx` KPI tổng NV / tổng Quản lý

**Files:**
- Modify: `frontend/src/pages/Workers.tsx`

**Interfaces:**
- Consumes: `POSITION_GROUP`, `POSITION_LABELS` (Task 3).

- [ ] **Step 1: Đổi KPI + filter** — `Workers.tsx`:
  a. Import: thêm `POSITION_GROUP` vào dòng import `@/types`; thêm icon `IconBriefcase` (nhóm QL) vào import tabler (thay `IconTrendingUp`).
  b. `kpis` (dòng 42-46):
```ts
  const kpis = useMemo(() => ({
    staff: all.filter((w) => POSITION_GROUP[w.position] === 'staff').length,
    management: all.filter((w) => POSITION_GROUP[w.position] === 'management').length,
    working: all.filter((w) => w.status === 'working').length,
    off: all.filter((w) => w.status === 'on_leave' || w.status === 'absent').length,
  }), [all])
```
  c. Hàng KPI (dòng 76-81) → 4 thẻ:
```tsx
      <div className="kpi-row">
        <KpiCard label="Tổng nhân viên" value={kpis.staff} icon={<IconUsers size={16} />} iconColor="var(--color-blue)" />
        <KpiCard label="Tổng quản lý" value={kpis.management} icon={<IconBriefcase size={16} />} iconColor="var(--color-purple)" />
        <KpiCard label="Đang làm việc" value={kpis.working} icon={<IconUserCheck size={16} />} iconColor="var(--color-green)" />
        <KpiCard label="Nghỉ / Vắng" value={kpis.off} icon={<IconUserOff size={16} />} iconColor="var(--color-amber)" />
      </div>
```
  (Bỏ `IconTrendingUp` nếu mồ côi.) Filter chức vụ (`Object.entries(POSITION_LABELS)`) giữ nguyên — tự cập nhật 12 nhãn.

- [ ] **Step 2: Build**

Run: `cd frontend && npm run build`
Expected: PASS hoặc chỉ còn lỗi ở `mocks/seed/workers.ts`/`api/tasks.ts` (Task 6).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Workers.tsx
git commit -m "feat(workers): KPI tổng nhân viên vs tổng quản lý"
```

---

### Task 6: FE — mock seed remap + `availableWorkersAtSite` lọc staff + kiểm thử tổng

**Files:**
- Modify: `frontend/src/mocks/seed/workers.ts`
- Modify: `frontend/src/api/tasks.ts`

**Interfaces:**
- Consumes: `STAFF_POSITIONS`, `Position` (Task 3).

- [ ] **Step 1: Seed remap + thêm nhóm Quản lý** — `mocks/seed/workers.ts`:
  - Đổi mọi `position` cũ sang mới: `senior_worker→worker`, `supervisor→foreman`, `technician→worker`, `apprentice→worker`; giữ `team_leader`/`worker`.
  - Đổi 2 record sang nhóm Quản lý để demo KPI & lọc giao việc: chọn 2 record bất kỳ (vd record đang là 'worker' sau remap) đổi `position` thành `'director'` và `'chief_accountant'` (cập nhật cả `specialty`/tên cho hợp lý nếu muốn). Đảm bảo có ≥1 staff và ≥1 management trong seed.

- [ ] **Step 2: Mock available lọc staff** — `api/tasks.ts`:
  a. Thêm import `STAFF_POSITIONS` từ `@/types` (cùng dòng import types khác).
  b. `availableWorkersAtSite` (dòng ~90-92):
```ts
export function availableWorkersAtSite(_siteId: string): Worker[] {
  const busy = busyWorkerIds()
  return db.workers.filter((w) => w.status === 'working' && !busy.has(w.id) && STAFF_POSITIONS.includes(w.position))
}
```
  (Giữ tên hàm `busyWorkerIds()` đúng như hiện có — đọc lại file để khớp tên biến busy.)

- [ ] **Step 3: Kiểm thử tổng**

Run: `cd frontend && npx vitest run && npm run build`
Expected: build PASS; không có fail MỚI liên quan workers (10 fail pre-existing bỏ qua).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/mocks/seed/workers.ts frontend/src/api/tasks.ts
git commit -m "feat(workers): mock seed chức vụ mới + giao việc chỉ nhóm NV"
```

---

## Kiểm thử tổng (sau Task 6)
- BE: `cd backend && npm run migration:run && npx jest --config ./test/jest-e2e.json workers` → PASS.
- FE: `cd frontend && npm run build` → OK; vitest không có fail MỚI.
- Thủ công (mock): form NV có 2 nhóm chức vụ (optgroup); KPI hiện Tổng nhân viên + Tổng quản lý; màn Giao việc danh sách công nhân KHÔNG có người nhóm Quản lý.

## Self-Review (đã rà)
- **Spec coverage:** (1) 2 nhóm chức vụ → Task 1 (master+migration) + 3 (types) + 4 (form); (2) ẩn nhóm QL khỏi giao việc → Task 2 (BE) + 6 (mock); (3) KPI tổng NV/QL → Task 5.
- **Migration:** widen→update→narrow đúng thứ tự; down() best-effort (lossy, chấp nhận).
- **Master 1 chỗ:** BE `worker-positions.ts` dùng cho entity/DTO/service; FE block master trong types dùng cho labels/group/form/KPI/mock.
- **Type consistency:** `Position` 12 giá trị đồng nhất BE enum ↔ FE; `STAFF_POSITIONS` đồng nhất BE (lọc service) ↔ FE (lọc mock + optgroup).
- **Placeholder:** không còn; mọi step có code/lệnh.
- **Rủi ro mở:** chỗ khác import `Position`/`POSITION_LABELS` → build Task 3/4/5 sẽ bắt; sửa theo.
