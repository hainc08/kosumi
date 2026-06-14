# Prototype — Workers Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]`.

**Goal:** Module Công nhân đầy đủ trên mock data: danh sách + filter/search, form thêm/sửa (thông tin cá nhân + hợp đồng động + ước tính lương live), drawer chi tiết. Thay trang placeholder `/workers` bằng trang thật.

**Architecture:** `src/api/workers.ts` (React Query hooks gọi vào `db.workers`, mutations sửa in-memory + invalidate). UI: page + form (react-hook-form + zod) + contract section + detail drawer. Dùng lại UI lib + utils ở Foundation.

**Depends on:** Foundation (committed `8b45b65`). Types `Worker`, `WorkerContract`, label maps đã có trong `src/types`. Seed `db.workers` đã có 3 bản ghi.

**Spec ref:** `workshop_pro_spec.md` Module 3; `design/component-library.md` (WorkerContractSection, WorkerForm, WorkerDetailDrawer).

---

## File Structure
```
src/api/workers.ts                              # CREATE — hooks
src/components/workers/WorkerContractSection.tsx + .css   # CREATE
src/components/workers/WorkerForm.tsx + .css             # CREATE
src/components/workers/WorkerDetailDrawer.tsx + .css     # CREATE
src/pages/Workers.tsx + .css                    # CREATE
src/router/routes.tsx                           # MODIFY — /workers -> WorkersPage
tests/workers-api.test.ts                       # CREATE — mock CRUD logic
```

---

## Task 1: Helpers cho worker (initials, avatar color, code) — TDD

**Files:** Create `src/utils/worker-helpers.ts`, Test `tests/worker-helpers.test.ts`

- [ ] **Step 1: Test fail**
```ts
import { describe, it, expect } from 'vitest'
import { deriveInitials, nextWorkerCode } from '@/utils/worker-helpers'
describe('worker-helpers', () => {
  it('deriveInitials: chữ đầu của từ đầu + từ cuối', () => {
    expect(deriveInitials('Nguyễn Văn Hùng')).toBe('NH')
    expect(deriveInitials('Mai')).toBe('M')
  })
  it('nextWorkerCode: CN + số tăng, pad 3 chữ số', () => {
    expect(nextWorkerCode(['CN001', 'CN009'])).toBe('CN010')
    expect(nextWorkerCode([])).toBe('CN001')
  })
})
```
- [ ] **Step 2: Run fail** — `npx vitest run tests/worker-helpers.test.ts` → FAIL
- [ ] **Step 3: Implement**
```ts
// src/utils/worker-helpers.ts
const PALETTE = ['#1D4ED8', '#16A34A', '#D97706', '#7C3AED', '#DC2626', '#0891B2']

export function deriveInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  const first = parts[0].charAt(0)
  const last = parts[parts.length - 1].charAt(0)
  return (first + last).toUpperCase()
}

export function avatarColorFor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

export function nextWorkerCode(existing: string[]): string {
  const nums = existing
    .map((c) => parseInt(c.replace(/^CN/, ''), 10))
    .filter((n) => !Number.isNaN(n))
  const max = nums.length ? Math.max(...nums) : 0
  return 'CN' + String(max + 1).padStart(3, '0')
}
```
- [ ] **Step 4: Run pass** — PASS
- [ ] **Step 5: Commit** — `git add src/utils/worker-helpers.ts tests/worker-helpers.test.ts && git commit -m "feat(workers): add worker helper utils with tests"`

---

## Task 2: Workers API (mock hooks) — TDD cho mutation logic

**Files:** Create `src/api/workers.ts`, Test `tests/workers-api.test.ts`

DTO/types (khai báo trong workers.ts):
```ts
export interface WorkerFilters { search?: string; siteId?: string; status?: string; skill?: string }
export interface WorkerFormValues {
  fullName: string; gender: 'male' | 'female'; dateOfBirth?: string; idNumber?: string
  phone?: string; address?: string; siteId?: string; primarySkill: PrimarySkill
  experienceYears: number; notes?: string
  contractType: ContractType; startDate: string
  rateNormal?: number; rateOvertime?: number; baseSalary?: number; allowance?: number
  ratePerUnit?: number; unitName?: string
}
```

Logic thuần (export để test): `createWorkerInDb(values)`, `updateWorkerInDb(id, values)`, `filterWorkers(list, filters)`.

- [ ] **Step 1: Test fail**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/mocks/db'
import { seedWorkers } from '@/mocks/seed/workers'
import { createWorkerInDb, filterWorkers } from '@/api/workers'

beforeEach(() => { db.workers = structuredClone(seedWorkers) })

describe('workers mock logic', () => {
  it('createWorkerInDb thêm worker mới với code tăng + initials + activeContract', () => {
    const before = db.workers.length
    const w = createWorkerInDb({
      fullName: 'Phạm Văn Đức', gender: 'male', primarySkill: 'assembly',
      experienceYears: 2, contractType: 'hourly', startDate: '2026-06-01', rateNormal: 30000,
    })
    expect(db.workers.length).toBe(before + 1)
    expect(w.code).toBe('CN004')
    expect(w.initials).toBe('PĐ')
    expect(w.activeContract?.contractType).toBe('hourly')
    expect(w.status).toBe('working')
  })
  it('filterWorkers lọc theo status và search', () => {
    expect(filterWorkers(db.workers, { status: 'on_leave' }).length).toBe(1)
    expect(filterWorkers(db.workers, { search: 'mai' }).length).toBe(1)
  })
})
```
- [ ] **Step 2: Run fail** — FAIL
- [ ] **Step 3: Implement** (xem code đầy đủ ở phần Implementation bên dưới Task 2)
- [ ] **Step 4: Run pass** — PASS
- [ ] **Step 5: Commit** — `git commit -m "feat(workers): add mock workers API with create/update/filter logic + tests"`

**Implementation `src/api/workers.ts`:**
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mockRequest } from './client'
import { db, nextId } from '@/mocks/db'
import { deriveInitials, avatarColorFor, nextWorkerCode } from '@/utils/worker-helpers'
import type { Worker, WorkerContract, PrimarySkill, ContractType } from '@/types'

export interface WorkerFilters { search?: string; siteId?: string; status?: string; skill?: string }
export interface WorkerFormValues {
  fullName: string; gender: 'male' | 'female'; dateOfBirth?: string; idNumber?: string
  phone?: string; address?: string; siteId?: string; primarySkill: PrimarySkill
  experienceYears: number; notes?: string
  contractType: ContractType; startDate: string
  rateNormal?: number; rateOvertime?: number; baseSalary?: number; allowance?: number
  ratePerUnit?: number; unitName?: string
}

const now = () => new Date().toISOString()

function buildContract(workerId: string, v: WorkerFormValues): WorkerContract {
  return {
    id: nextId('c'), workerId, contractType: v.contractType, startDate: v.startDate, endDate: null,
    rateNormal: v.rateNormal ?? null, rateOvertime: v.rateOvertime ?? null,
    baseSalary: v.baseSalary ?? null, allowance: v.allowance ?? null,
    ratePerUnit: v.ratePerUnit ?? null, unitName: v.unitName ?? null,
    isActive: true, createdAt: now(), updatedAt: now(),
  }
}

export function filterWorkers(list: Worker[], f: WorkerFilters): Worker[] {
  return list.filter((w) => {
    if (f.siteId && w.siteId !== f.siteId) return false
    if (f.status && w.status !== f.status) return false
    if (f.skill && w.primarySkill !== f.skill) return false
    if (f.search) {
      const q = f.search.toLowerCase()
      if (!w.fullName.toLowerCase().includes(q) && !w.code.toLowerCase().includes(q)) return false
    }
    return true
  })
}

export function createWorkerInDb(v: WorkerFormValues): Worker {
  const id = nextId('w')
  const code = nextWorkerCode(db.workers.map((w) => w.code))
  const site = db.sites.find((s) => s.id === v.siteId)
  const worker: Worker = {
    id, code, fullName: v.fullName, gender: v.gender,
    dateOfBirth: v.dateOfBirth ?? null, idNumber: v.idNumber ?? null, phone: v.phone ?? null,
    address: v.address ?? null, siteId: v.siteId ?? null, primarySkill: v.primarySkill,
    experienceYears: v.experienceYears, status: 'working', notes: v.notes ?? null,
    createdAt: now(), updatedAt: now(),
    initials: deriveInitials(v.fullName), avatarColor: avatarColorFor(id),
    site: site ? { id: site.id, name: site.name } : undefined,
    activeContract: buildContract(id, v),
  }
  db.workers.unshift(worker)
  return worker
}

export function updateWorkerInDb(id: string, v: WorkerFormValues): Worker | undefined {
  const w = db.workers.find((x) => x.id === id)
  if (!w) return undefined
  const site = db.sites.find((s) => s.id === v.siteId)
  Object.assign(w, {
    fullName: v.fullName, gender: v.gender, dateOfBirth: v.dateOfBirth ?? null,
    idNumber: v.idNumber ?? null, phone: v.phone ?? null, address: v.address ?? null,
    siteId: v.siteId ?? null, primarySkill: v.primarySkill, experienceYears: v.experienceYears,
    notes: v.notes ?? null, updatedAt: now(), initials: deriveInitials(v.fullName),
    site: site ? { id: site.id, name: site.name } : undefined,
  })
  // cập nhật hợp đồng active hiện tại theo form (prototype: sửa trực tiếp, không tạo lịch sử)
  if (w.activeContract) {
    Object.assign(w.activeContract, {
      contractType: v.contractType, startDate: v.startDate,
      rateNormal: v.rateNormal ?? null, rateOvertime: v.rateOvertime ?? null,
      baseSalary: v.baseSalary ?? null, allowance: v.allowance ?? null,
      ratePerUnit: v.ratePerUnit ?? null, unitName: v.unitName ?? null, updatedAt: now(),
    })
  }
  return w
}

export function setWorkerStatusInDb(id: string, status: Worker['status']): void {
  const w = db.workers.find((x) => x.id === id)
  if (w) { w.status = status; w.updatedAt = now() }
}

// ─── Hooks ───
export function useWorkers(filters: WorkerFilters = {}) {
  return useQuery<Worker[]>({
    queryKey: ['workers', filters],
    queryFn: () => mockRequest(() => filterWorkers(db.workers, filters)),
  })
}

export function useCreateWorker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: WorkerFormValues) => mockRequest(() => createWorkerInDb(v)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workers'] }),
  })
}

export function useUpdateWorker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: WorkerFormValues }) =>
      mockRequest(() => updateWorkerInDb(id, values)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workers'] }),
  })
}

export function useUpdateWorkerStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Worker['status'] }) =>
      mockRequest(() => setWorkerStatusInDb(id, status)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workers'] }),
  })
}
```

---

## Task 3: WorkerContractSection (dynamic fields + live estimator)

**Files:** Create `src/components/workers/WorkerContractSection.tsx` + `.css`

Component nhận `UseFormReturn` từ react-hook-form (register + watch). Hiển thị field theo `contractType`, và ước tính lương qua `estimateMonthlyPay`.

- [ ] **Step 1: Implement** (xem code đầy đủ trong file thực thi)
- [ ] **Step 2: Verify typecheck** — `npx tsc -b` không lỗi (sau khi WorkerForm dùng nó ở Task 4).
- [ ] **Step 3: Commit** cùng Task 4.

---

## Task 4: WorkerForm (zod + react-hook-form)

**Files:** Create `src/components/workers/WorkerForm.tsx` + `.css`

- Zod schema validate: fullName bắt buộc; experienceYears 0–50; theo contractType yêu cầu rate tương ứng (hourly→rateNormal ≥1000...).
- Create + Edit (nhận `worker?: Worker`). Submit gọi useCreateWorker/useUpdateWorker → toast → đóng.

- [ ] **Step 1: Implement** (code đầy đủ trong file thực thi)
- [ ] **Step 2: Verify typecheck**
- [ ] **Step 3: Commit** — `git commit -m "feat(workers): add WorkerForm + ContractSection with live pay estimate"`

---

## Task 5: WorkerDetailDrawer

**Files:** Create `src/components/workers/WorkerDetailDrawer.tsx` + `.css`

Hiển thị: avatar + tên + mã + badge trạng thái; thông tin cá nhân; tóm tắt hợp đồng active (loại + đơn giá + ước tính lương). Nút "Chỉnh sửa" (callback mở form). (Lịch sử chấm công: ghi chú "sẽ có ở module Chấm công".)

- [ ] **Step 1: Implement**
- [ ] **Step 2: Commit** cùng Task 6.

---

## Task 6: Workers page + wire route

**Files:** Create `src/pages/Workers.tsx` + `.css`; Modify `src/router/routes.tsx`

- KPI cards: Tổng / Đang làm / Nghỉ (on_leave+absent) / Hiệu suất TB ("—").
- Toolbar: SearchBox (tên/mã) + FilterSelect xưởng + status + skill + Button "Thêm công nhân".
- DataTable cột: Công nhân (avatar+tên+mã) · Kỹ năng · KN · Xưởng · Loại HĐ · Đơn giá · Trạng thái.
- Row click → WorkerDetailDrawer. Nút Thêm/Sửa → WorkerForm modal.
- routes.tsx: `import WorkersPage`, đổi `{ path: 'workers', element: <WorkersPage /> }`.

- [ ] **Step 1: Implement page + route**
- [ ] **Step 2: Verify build** — `npm run build` thành công.
- [ ] **Step 3: Verify browser** — `/workers`: thấy KPI + bảng 3 công nhân seed; thêm 1 công nhân → xuất hiện trong bảng + toast; mở chi tiết; filter status "Nghỉ phép" → 1 dòng.
- [ ] **Step 4: Commit** — `git commit -m "feat(workers): add Workers page, detail drawer, wire route"`

---

## Task 7: Final verify
- [ ] `npm run test` → tất cả PASS (gồm worker-helpers, workers-api).
- [ ] `npm run build` → PASS.
- [ ] Commit nếu còn sót.

## Self-Review
- Spec Module 3 coverage: danh sách+filter (Task 6), form cá nhân+HĐ động+estimator (Task 3,4), drawer (Task 5), API endpoints mô phỏng (Task 2). Lịch sử HĐ nhiều bản ghi & chấm công: out-of-scope prototype (ghi chú trong drawer).
- Type consistency: `WorkerFormValues` dùng chung form/api; hooks `useWorkers/useCreateWorker/useUpdateWorker/useUpdateWorkerStatus`.
- No placeholder trong code thực thi.
