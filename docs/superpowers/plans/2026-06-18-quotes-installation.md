# Gói 1 — Báo giá + "Có lắp đặt" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm cờ "Có lắp đặt" vào báo giá (suy ra cờ ở cấp dự án), bỏ field "ĐK Thanh toán" trùng, và gom danh sách báo giá theo Dự án → Đầu mục → Hạng mục.

**Architecture:** Thêm cột `quotes.has_installation` (data-model nền tảng). Cờ cấp dự án suy ra (không lưu cột) qua aggregate trong `ProjectsService`. FE: bỏ select điều khoản (giá trị `paymentTerms` derive từ các đợt thanh toán), thêm checkbox, và thay bảng phẳng bằng danh sách gom nhóm (helper thuần + view).

**Tech Stack:** NestJS + TypeORM + MariaDB (BE), React + react-hook-form + zod + Vitest (FE). Spec: `docs/superpowers/specs/2026-06-18-quotes-installation-design.md`.

## Global Constraints

- DB MariaDB native localhost (user `haimv`), KHÔNG docker. Migration kiểu raw `ALTER TABLE` (xem `1718000013000-AlterWorkersSpecialty.ts`).
- Cột boolean trên MariaDB: dùng `tinyint(1)` (nhất quán schema hiện tại).
- BE test: `cd backend && npm run test:e2e` (jest e2e chạy với DB thật — chạy `npm run migration:run` trước).
- FE unit test: `cd frontend && npx vitest run <path>`.
- FE build kiểm tra: `cd frontend && npm run build`.
- Commit message tiếng Việt, prefix `feat(quotes)`/`feat(projects)`; KHÔNG đụng business logic ngoài phạm vi Gói 1.
- Giữ cột `quotes.payment_terms` (NOT NULL) — FE luôn gửi giá trị derive, backend không đổi DTO `paymentTerms`.

---

### Task 1: BE — cột `quotes.has_installation` (migration + entity + DTO + schema.sql)

**Files:**
- Create: `backend/src/database/migrations/1718000014000-AlterQuotesHasInstallation.ts`
- Modify: `backend/src/modules/quotes/entities/quote.entity.ts`
- Modify: `backend/src/modules/quotes/dto/create-quote.dto.ts`
- Modify: `backend/database/schema.sql:165` (sau dòng `payment_terms`)
- Test: `backend/test/quotes.e2e-spec.ts`

**Interfaces:**
- Produces: `Quote.hasInstallation: boolean`; DTO `CreateQuoteDto.hasInstallation?: boolean` (mặc định `false`). Response báo giá có field `hasInstallation`.

- [ ] **Step 1: Viết test e2e thất bại** — thêm vào cuối `describe` trong `backend/test/quotes.e2e-spec.ts` (trước dòng `it('DELETE ...')`):

```ts
  it('POST /api/quotes lưu hasInstallation và trả lại đúng', async () => {
    const res = await request(app.getHttpServer()).post('/api/quotes')
      .send({
        projectId,
        title: 'Báo giá có lắp đặt',
        quoteDate: '2026-06-18',
        taxRate: 8, validityDays: 14, deliveryDays: 30, paymentTerms: '50-50',
        hasInstallation: true,
        items: [{ itemName: 'HM', unit: 'm2', quantity: 1, unitPrice: 1000 }],
        paymentSteps: [{ percentage: 100, description: '1 lần' }],
      }).expect(201)
    expect(res.body.data.hasInstallation).toBe(true)

    const got = await request(app.getHttpServer()).get(`/api/quotes/${res.body.data.id}`).expect(200)
    expect(got.body.data.hasInstallation).toBe(true)
  })
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Run: `cd backend && npm run migration:run && npx jest --config ./test/jest-e2e.json -t "lưu hasInstallation"`
Expected: FAIL (`hasInstallation` undefined — cột/field chưa tồn tại).

- [ ] **Step 3: Tạo migration**

```ts
import { MigrationInterface, QueryRunner } from 'typeorm'

/** Thêm cột quotes.has_installation (cờ "có lắp đặt" nhập trên báo giá). */
export class AlterQuotesHasInstallation1718000014000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query("ALTER TABLE `quotes` ADD `has_installation` tinyint(1) NOT NULL DEFAULT 0 AFTER `payment_terms`")
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.query("ALTER TABLE `quotes` DROP COLUMN `has_installation`")
  }
}
```

- [ ] **Step 4: Thêm field vào entity** — `backend/src/modules/quotes/entities/quote.entity.ts`, ngay sau dòng `paymentTerms`:

```ts
  @Column({ name: 'has_installation', type: 'boolean', default: false }) hasInstallation: boolean
```

- [ ] **Step 5: Thêm vào DTO** — `backend/src/modules/quotes/dto/create-quote.dto.ts`. Thêm `IsBoolean` vào import `class-validator` và field sau `paymentTerms`:

```ts
  @IsOptional() @IsBoolean() hasInstallation?: boolean
```

- [ ] **Step 6: Map khi tạo** — `backend/src/modules/quotes/quotes.service.ts`, trong `create()` ở object `m.create(Quote, {...})` (quanh dòng 222), thêm sau `paymentTerms: dto.paymentTerms,`:

```ts
        hasInstallation: dto.hasInstallation ?? false,
```

- [ ] **Step 7: Cập nhật schema.sql** — `backend/database/schema.sql`, thêm dòng ngay sau `` `payment_terms` varchar(50) NOT NULL, ``:

```sql
  `has_installation` tinyint(1) NOT NULL DEFAULT 0,
```

- [ ] **Step 8: Chạy migration + test PASS**

Run: `cd backend && npm run migration:run && npx jest --config ./test/jest-e2e.json -t "lưu hasInstallation"`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add backend/src/database/migrations/1718000014000-AlterQuotesHasInstallation.ts backend/src/modules/quotes/entities/quote.entity.ts backend/src/modules/quotes/dto/create-quote.dto.ts backend/src/modules/quotes/quotes.service.ts backend/database/schema.sql backend/test/quotes.e2e-spec.ts
git commit -m "feat(quotes): thêm cột has_installation (cờ có lắp đặt) cho báo giá"
```

---

### Task 2: BE — `hasInstallation` được giữ khi update & duplicate

**Files:**
- Modify: `backend/src/modules/quotes/quotes.service.ts` (`duplicate()` ~ dòng 298)
- Test: `backend/test/quotes.e2e-spec.ts`

**Interfaces:**
- Consumes: `Quote.hasInstallation` (Task 1).
- Produces: `duplicate()` clone giữ nguyên `hasInstallation`; `update()` đã tự nhận qua `...quoteFields` (UpdateQuoteDto là partial của CreateQuoteDto — đã có `hasInstallation`).

- [ ] **Step 1: Viết test thất bại** — thêm vào `quotes.e2e-spec.ts`:

```ts
  it('duplicate giữ nguyên hasInstallation; update đổi được cờ', async () => {
    const created = await request(app.getHttpServer()).post('/api/quotes')
      .send({
        projectId, title: 'BG gốc lắp đặt', quoteDate: '2026-06-18',
        taxRate: 8, validityDays: 14, deliveryDays: 30, paymentTerms: '50-50',
        hasInstallation: true,
        items: [{ itemName: 'HM', unit: 'm2', quantity: 1, unitPrice: 1000 }],
        paymentSteps: [{ percentage: 100, description: '1 lần' }],
      }).expect(201)

    const dup = await request(app.getHttpServer()).post(`/api/quotes/${created.body.data.id}/duplicate`).expect(201)
    expect(dup.body.data.hasInstallation).toBe(true)

    const upd = await request(app.getHttpServer()).put(`/api/quotes/${created.body.data.id}`)
      .send({
        projectId, title: 'BG gốc lắp đặt', quoteDate: '2026-06-18',
        taxRate: 8, validityDays: 14, deliveryDays: 30, paymentTerms: '50-50',
        hasInstallation: false,
        items: [{ itemName: 'HM', unit: 'm2', quantity: 1, unitPrice: 1000 }],
        paymentSteps: [{ percentage: 100, description: '1 lần' }],
      }).expect(200)
    expect(upd.body.data.hasInstallation).toBe(false)
  })
```

- [ ] **Step 2: Chạy test xác nhận FAIL**

Run: `cd backend && npx jest --config ./test/jest-e2e.json -t "giữ nguyên hasInstallation"`
Expected: FAIL (`dup.hasInstallation` là `false` vì clone chưa copy cờ).

- [ ] **Step 3: Copy cờ trong `duplicate()`** — trong object `m.create(Quote, {...})` của `duplicate()`, thêm sau `paymentTerms: source.paymentTerms,`:

```ts
        hasInstallation: source.hasInstallation,
```

- [ ] **Step 4: Chạy test PASS**

Run: `cd backend && npx jest --config ./test/jest-e2e.json -t "giữ nguyên hasInstallation"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/quotes/quotes.service.ts backend/test/quotes.e2e-spec.ts
git commit -m "feat(quotes): duplicate/update giữ cờ has_installation"
```

---

### Task 3: BE — `ProjectsService` phơi cờ `hasInstallation` (suy ra)

**Files:**
- Modify: `backend/src/modules/projects/projects.service.ts`
- Test: `backend/test/quotes.e2e-spec.ts` (kiểm qua API projects — không có file e2e projects riêng)

**Interfaces:**
- Consumes: `quotes.has_installation` (Task 1).
- Produces: `ProjectWithRelations.hasInstallation: boolean` = tồn tại ≥1 báo giá (chưa xóa) của dự án bật cờ. Trả ra ở `GET /api/projects` và `GET /api/projects/:id`.

- [ ] **Step 1: Viết test thất bại** — thêm vào `quotes.e2e-spec.ts`:

```ts
  it('GET /api/projects trả hasInstallation=true khi dự án có báo giá lắp đặt', async () => {
    await request(app.getHttpServer()).post('/api/quotes')
      .send({
        projectId, title: 'BG bật lắp đặt cho dự án', quoteDate: '2026-06-18',
        taxRate: 8, validityDays: 14, deliveryDays: 30, paymentTerms: '50-50',
        hasInstallation: true,
        items: [{ itemName: 'HM', unit: 'm2', quantity: 1, unitPrice: 1000 }],
        paymentSteps: [{ percentage: 100, description: '1 lần' }],
      }).expect(201)

    const res = await request(app.getHttpServer()).get(`/api/projects/${projectId}`).expect(200)
    expect(res.body.data.hasInstallation).toBe(true)
  })
```

- [ ] **Step 2: Chạy test xác nhận FAIL**

Run: `cd backend && npx jest --config ./test/jest-e2e.json -t "hasInstallation=true khi dự án"`
Expected: FAIL (`hasInstallation` undefined trên project).

- [ ] **Step 3: Thêm `hasInstallation` vào type + agg** — trong `projects.service.ts`:

  a. `ProjectWithRelations` (thêm field):
```ts
export type ProjectWithRelations = Project & {
  site?: { id: string; name: string }
  customer?: { id: string; name: string }
  quoteCount: number
  workerCount: number
  hasInstallation: boolean
  quotes: QuoteMini[]
}
```
  b. `ProjectAgg` + `ZERO_AGG`:
```ts
type ProjectAgg = { quoteCount: number; workerCount: number; hasInstallation: boolean; quotes: QuoteMini[] }
const ZERO_AGG: ProjectAgg = { quoteCount: 0, workerCount: 0, hasInstallation: false, quotes: [] }
```
  c. Trong `loadAggregates`, dòng khởi tạo map đổi thành:
```ts
    for (const id of ids) map.set(id, { quoteCount: 0, workerCount: 0, hasInstallation: false, quotes: [] })
```
  d. Trong `loadAggregates`, query `quoteRows` thêm `.addSelect('q.hasInstallation', 'has_installation')` (sau `.addSelect('q.status', 'status')`), và đổi kiểu generic `getRawMany<{ id; code; title; status; pid; has_installation: number }>()`.
  e. Trong vòng `for (const r of quoteRows)`:
```ts
    for (const r of quoteRows) {
      const a = map.get(r.pid)
      if (a) {
        a.quotes.push({ id: r.id, code: r.code, title: r.title, status: r.status })
        a.quoteCount += 1
        if (Number(r.has_installation) === 1) a.hasInstallation = true
      }
    }
```

- [ ] **Step 4: Gắn vào response** — trong cả `enrich()` (return) và `enrichMany()` (object map), thêm `hasInstallation: agg.hasInstallation,` cạnh `quoteCount`/`workerCount`.

- [ ] **Step 5: Chạy test PASS**

Run: `cd backend && npx jest --config ./test/jest-e2e.json -t "hasInstallation=true khi dự án"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/projects/projects.service.ts backend/test/quotes.e2e-spec.ts
git commit -m "feat(projects): suy ra hasInstallation từ báo giá có lắp đặt"
```

---

### Task 4: FE — form shape: thêm `hasInstallation`, bỏ `paymentTerms`, derive khi submit

**Files:**
- Modify: `frontend/src/types/index.ts` (interface `Quote`, `Project`)
- Modify: `frontend/src/api/quotes.ts` (`QuoteFormValues`)
- Modify: `frontend/src/components/quotes/quoteFormShape.ts`
- Test: `frontend/src/components/quotes/quoteFormShape.test.ts` (tạo mới)

**Interfaces:**
- Produces: `QuoteFormShape.hasInstallation: boolean`; `formToValues` trả `values.paymentTerms` = chuỗi `%` nối bằng `-` (vd `30-70`), `values.hasInstallation`.
- Consumes: `Quote.hasInstallation` (response BE Task 1).

- [ ] **Step 1: Viết test thất bại** — tạo `frontend/src/components/quotes/quoteFormShape.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { emptyQuoteForm, formToValues } from './quoteFormShape'

describe('quoteFormShape', () => {
  it('emptyQuoteForm mặc định hasInstallation=false', () => {
    expect(emptyQuoteForm().hasInstallation).toBe(false)
  })

  it('formToValues derive paymentTerms từ các đợt thanh toán và mang hasInstallation', () => {
    const f = emptyQuoteForm()
    f.hasInstallation = true
    f.paymentSteps = [
      { stepOrder: 1, percentage: '30', description: 'Tạm ứng' },
      { stepOrder: 2, percentage: '70', description: 'Bàn giao' },
    ]
    const v = formToValues(f)
    expect(v.paymentTerms).toBe('30-70')
    expect(v.hasInstallation).toBe(true)
  })
})
```

- [ ] **Step 2: Chạy test xác nhận FAIL**

Run: `cd frontend && npx vitest run src/components/quotes/quoteFormShape.test.ts`
Expected: FAIL (`hasInstallation` không tồn tại; `paymentTerms` không phải `30-70`).

- [ ] **Step 3: Cập nhật types** — `frontend/src/types/index.ts`:
  a. Trong `interface Quote`, sau dòng `paymentTerms:`, thêm:
```ts
  hasInstallation: boolean
```
  b. Trong `interface Project` (tìm `export interface Project extends BaseEntity`), thêm vào nhóm `// computed`/joined:
```ts
  hasInstallation?: boolean
```

- [ ] **Step 4: Cập nhật `QuoteFormValues`** — `frontend/src/api/quotes.ts`, trong interface, sau `paymentTerms: ...`:
```ts
  hasInstallation: boolean
```

- [ ] **Step 5: Cập nhật `quoteFormShape.ts`**:
  a. `QuoteFormShape` interface: thêm `hasInstallation: boolean` (sau `paymentTerms`).
  b. `quoteSchema`: **bỏ** rule `paymentTerms: z.string().min(1, ...)`, **thêm** `hasInstallation: z.boolean(),`.
  c. `emptyQuoteForm()` return: thêm `hasInstallation: false,`.
  d. `quoteToForm(q)` return: thêm `hasInstallation: q.hasInstallation ?? false,`.
  e. `formToValues(v)` return: thay `paymentTerms: v.paymentTerms,` bằng derive + thêm cờ:
```ts
    paymentTerms: v.paymentSteps.map((s) => String(Math.round(Number(s.percentage) || 0))).join('-') || 'custom',
    hasInstallation: v.hasInstallation,
```
  (Giữ nguyên `paymentTerms` field trong `QuoteFormShape`? KHÔNG — xoá `paymentTerms` khỏi interface, khỏi `emptyQuoteForm`/`quoteToForm`, để không còn ô nhập. Nếu TypeScript báo lỗi ở nơi khác tham chiếu `v.paymentTerms`, sửa theo.)

- [ ] **Step 6: Chạy test PASS**

Run: `cd frontend && npx vitest run src/components/quotes/quoteFormShape.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/types/index.ts frontend/src/api/quotes.ts frontend/src/components/quotes/quoteFormShape.ts frontend/src/components/quotes/quoteFormShape.test.ts
git commit -m "feat(quotes): form shape thêm hasInstallation, derive paymentTerms từ đợt thanh toán"
```

---

### Task 5: FE — `QuoteForm` UI: bỏ "ĐK Thanh toán", thêm checkbox "Có lắp đặt"

**Files:**
- Modify: `frontend/src/components/quotes/QuoteForm.tsx`

**Interfaces:**
- Consumes: `QuoteFormShape.hasInstallation` (Task 4); register form.

- [ ] **Step 1: Bỏ FormField "ĐK Thanh toán"** — `QuoteForm.tsx` dòng 124-136. Thay khối `<div className="form-grid"> ... </div>` (chứa "Số báo giá" + "ĐK Thanh toán") bằng chỉ giữ "Số báo giá" + thêm checkbox lắp đặt:

```tsx
        <div className="form-grid">
          <FormField label="Số báo giá (tự sinh)">
            <input value={code} readOnly className="qf-readonly" />
          </FormField>
          <FormField label="Lắp đặt">
            <label className="qf-check" style={{ marginTop: 8 }}>
              <input type="checkbox" {...register('hasInstallation')} />
              Có lắp đặt (dự án thực hiện ở công trường + nhà máy)
            </label>
          </FormField>
        </div>
```

- [ ] **Step 2: Gỡ import không dùng** — nếu `PAYMENT_TERMS_LABELS`/`PaymentTermsPreset` không còn dùng ở file, xoá khỏi dòng import `@/types` (dòng 5). Kiểm tra bằng search trong file.

- [ ] **Step 3: Build FE để chắc không vỡ type**

Run: `cd frontend && npm run build`
Expected: build PASS (không lỗi TS về `paymentTerms`).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/quotes/QuoteForm.tsx
git commit -m "feat(quotes): form bỏ ô ĐK Thanh toán trùng, thêm checkbox Có lắp đặt"
```

---

### Task 6: FE — helper gom nhóm Dự án → Đầu mục → Hạng mục (thuần, có test)

**Files:**
- Create: `frontend/src/components/quotes/groupQuotes.ts`
- Test: `frontend/src/components/quotes/groupQuotes.test.ts`

**Interfaces:**
- Produces:
```ts
export interface QuoteItemRow { quoteId: string; quoteCode: string; status: string; itemName: string; unit: string; quantity: number; unitPrice: number; amount: number }
export interface SectionGroup { sectionName: string; items: QuoteItemRow[] }
export interface ProjectGroup { projectId: string; projectName: string; hasInstallation: boolean; quoteCount: number; sections: SectionGroup[] }
export function groupQuotes(quotes: Quote[]): ProjectGroup[]
```
- Quy tắc: gom mọi `q.items` của các báo giá theo `projectId` → trong dự án gom theo `sectionName` (rỗng → "Khác") → liệt kê hạng mục. `hasInstallation` của nhóm = OR `q.hasInstallation` của các báo giá. Sắp xếp dự án theo `projectName`.

- [ ] **Step 1: Viết test thất bại** — `frontend/src/components/quotes/groupQuotes.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { groupQuotes } from './groupQuotes'
import type { Quote } from '@/types'

const q = (over: Partial<Quote>): Quote => ({
  id: 'q1', code: 'WS0001', projectId: 'p1', customerId: null, contactId: null,
  title: 'BG', quoteDate: '2026-06-18', validUntil: null, status: 'draft', rejectReason: null,
  taxRate: 8, validityDays: 14, deliveryDays: 30, paymentTerms: '50-50', hasInstallation: false,
  warrantyNote: null, contractorNote: null, notes: null,
  createdAt: '', updatedAt: '', items: [], ...over,
} as Quote)

describe('groupQuotes', () => {
  it('gom theo dự án → đầu mục → hạng mục và OR hasInstallation', () => {
    const quotes = [
      q({ id: 'q1', projectId: 'p1', project: { id: 'p1', name: 'Aeon' }, hasInstallation: true,
        items: [{ sectionName: 'Thang thép', itemName: 'Kết cấu', unit: 'm', quantity: 2, unitPrice: 100, amount: 200, sectionNameEn: null, sortOrder: 1, description: null }] }),
      q({ id: 'q2', projectId: 'p1', project: { id: 'p1', name: 'Aeon' }, hasInstallation: false,
        items: [{ sectionName: 'Thang thép', itemName: 'Hàn', unit: 'cái', quantity: 1, unitPrice: 50, amount: 50, sectionNameEn: null, sortOrder: 1, description: null }] }),
    ]
    const groups = groupQuotes(quotes)
    expect(groups).toHaveLength(1)
    expect(groups[0].projectName).toBe('Aeon')
    expect(groups[0].hasInstallation).toBe(true)
    expect(groups[0].sections).toHaveLength(1)
    expect(groups[0].sections[0].sectionName).toBe('Thang thép')
    expect(groups[0].sections[0].items.map((i) => i.itemName)).toEqual(['Kết cấu', 'Hàn'])
  })

  it('sectionName rỗng → nhóm "Khác"', () => {
    const groups = groupQuotes([q({ items: [{ sectionName: null, itemName: 'X', unit: 'm', quantity: 1, unitPrice: 1, amount: 1, sectionNameEn: null, sortOrder: 1, description: null }] })])
    expect(groups[0].sections[0].sectionName).toBe('Khác')
  })
})
```

- [ ] **Step 2: Chạy test xác nhận FAIL**

Run: `cd frontend && npx vitest run src/components/quotes/groupQuotes.test.ts`
Expected: FAIL (`groupQuotes` chưa tồn tại).

- [ ] **Step 3: Viết helper** — `frontend/src/components/quotes/groupQuotes.ts`:

```ts
import type { Quote } from '@/types'

export interface QuoteItemRow {
  quoteId: string; quoteCode: string; status: string
  itemName: string; unit: string; quantity: number; unitPrice: number; amount: number
}
export interface SectionGroup { sectionName: string; items: QuoteItemRow[] }
export interface ProjectGroup {
  projectId: string; projectName: string; hasInstallation: boolean
  quoteCount: number; sections: SectionGroup[]
}

export function groupQuotes(quotes: Quote[]): ProjectGroup[] {
  const byProject = new Map<string, ProjectGroup>()
  const sectionMap = new Map<string, Map<string, SectionGroup>>() // projectId -> sectionName -> group
  const quoteIds = new Map<string, Set<string>>() // projectId -> set of quote ids

  for (const q of quotes) {
    const pid = q.projectId || '—'
    if (!byProject.has(pid)) {
      byProject.set(pid, { projectId: pid, projectName: q.project?.name ?? 'Chưa gắn dự án', hasInstallation: false, quoteCount: 0, sections: [] })
      sectionMap.set(pid, new Map())
      quoteIds.set(pid, new Set())
    }
    const group = byProject.get(pid)!
    if (q.hasInstallation) group.hasInstallation = true
    quoteIds.get(pid)!.add(q.id)

    for (const it of q.items ?? []) {
      const sname = it.sectionName?.trim() || 'Khác'
      const secs = sectionMap.get(pid)!
      if (!secs.has(sname)) {
        const sg: SectionGroup = { sectionName: sname, items: [] }
        secs.set(sname, sg)
        group.sections.push(sg)
      }
      secs.get(sname)!.items.push({
        quoteId: q.id, quoteCode: q.code, status: q.status,
        itemName: it.itemName, unit: it.unit, quantity: it.quantity, unitPrice: it.unitPrice, amount: it.amount,
      })
    }
  }

  for (const [pid, group] of byProject) group.quoteCount = quoteIds.get(pid)!.size
  return [...byProject.values()].sort((a, b) => a.projectName.localeCompare(b.projectName, 'vi'))
}
```

- [ ] **Step 4: Chạy test PASS**

Run: `cd frontend && npx vitest run src/components/quotes/groupQuotes.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/quotes/groupQuotes.ts frontend/src/components/quotes/groupQuotes.test.ts
git commit -m "feat(quotes): helper gom danh sách báo giá theo dự án/đầu mục/hạng mục"
```

---

### Task 7: FE — `Quotes.tsx` hiển thị danh sách gom nhóm

**Files:**
- Modify: `frontend/src/pages/Quotes.tsx`
- Modify: `frontend/src/pages/Quotes.css` (thêm style nhóm)

**Interfaces:**
- Consumes: `groupQuotes` (Task 6), `Quote.hasInstallation`.

- [ ] **Step 1: Thêm view gom nhóm** — trong `Quotes.tsx`:
  a. Import: `import { groupQuotes } from '@/components/quotes/groupQuotes'` và `IconBuildingFactory2` từ `@tabler/icons-react`.
  b. Sau `const { data: quotes = [], isLoading } = useQuotes({ ... })`, thêm:
```tsx
  const groups = useMemo(() => groupQuotes(quotes), [quotes])
```
  c. Thay khối `<DataTable .../>` (dòng 114-117) bằng danh sách gom nhóm (giữ `onRowClick` mở drawer qua việc bấm mã báo giá ở hạng mục):
```tsx
      {isLoading ? (
        <div className="dash-empty">Đang tải…</div>
      ) : groups.length === 0 ? (
        <div className="dash-empty">Không tìm thấy báo giá nào</div>
      ) : (
        <div className="q-groups">
          {groups.map((g) => (
            <div key={g.projectId} className="q-group">
              <div className="q-group__head">
                <span className="q-group__name">{g.projectName}</span>
                {g.hasInstallation && (
                  <Badge variant="info" >Có lắp đặt</Badge>
                )}
                <span className="q-group__meta">{g.quoteCount} báo giá</span>
              </div>
              {g.sections.map((sec) => (
                <div key={sec.sectionName} className="q-sec">
                  <div className="q-sec__name">{sec.sectionName}</div>
                  <table className="q-itable">
                    <tbody>
                      {sec.items.map((it, idx) => {
                        const q = quotes.find((x) => x.id === it.quoteId)!
                        return (
                          <tr key={it.quoteId + idx} onClick={() => setSelected(q)} className="q-irow">
                            <td className="q-irow__name">{it.itemName}</td>
                            <td>{it.quantity} {it.unit}</td>
                            <td>{formatCurrency(it.unitPrice)}</td>
                            <td className="q-irow__amt">{formatCurrency(it.amount)}</td>
                            <td><span style={{ color: 'var(--blue)' }}>{it.quoteCode}</span></td>
                            <td><Badge variant={QUOTE_STATUS_VARIANT[it.status as QuoteStatus]} dot>{QUOTE_STATUS_LABELS[it.status as QuoteStatus]}</Badge></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
```
  d. Xoá import `DataTable`/`Column` nếu không còn dùng; bỏ mảng `columns` và các handler chỉ phục vụ cột (`handleStatusChange`/`handleDuplicate` vẫn có thể giữ nếu chuyển vào drawer — nếu không dùng, xoá để tránh cảnh báo lint).

- [ ] **Step 2: Thêm CSS** — `frontend/src/pages/Quotes.css`, thêm cuối file:
```css
.q-groups { display: flex; flex-direction: column; gap: 16px; }
.q-group { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; background: var(--surface); }
.q-group__head { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--surface-2, #f7f8fa); font-weight: 600; }
.q-group__meta { margin-left: auto; color: var(--text-3); font-weight: 400; font-size: 12px; }
.q-sec { padding: 4px 14px 10px; }
.q-sec__name { font-size: 12px; text-transform: uppercase; letter-spacing: .03em; color: var(--text-3); margin: 8px 0 4px; }
.q-itable { width: 100%; border-collapse: collapse; }
.q-irow { cursor: pointer; }
.q-irow:hover { background: var(--surface-2, #f7f8fa); }
.q-irow td { padding: 6px 8px; border-top: 1px solid var(--border); font-size: 13px; }
.q-irow__name { font-weight: 500; }
.q-irow__amt { font-weight: 600; text-align: right; }
```

- [ ] **Step 3: Build FE**

Run: `cd frontend && npm run build`
Expected: build PASS.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Quotes.tsx frontend/src/pages/Quotes.css
git commit -m "feat(quotes): danh sách gom theo Dự án → Đầu mục → Hạng mục + badge có lắp đặt"
```

---

### Task 8: FE — mock seed + mock api mang `hasInstallation` (chế độ VITE_USE_MOCK)

**Files:**
- Modify: `frontend/src/mocks/seed/quotes.ts`
- Modify: `frontend/src/api/quotes.ts` (`createQuoteInDb`, `enrichQuoteWithSummary`)
- Modify: `frontend/src/api/projects.ts` (enrich derive `hasInstallation` cho mock)

**Interfaces:**
- Consumes: `Quote.hasInstallation`, `Project.hasInstallation` (Task 4).

- [ ] **Step 1: Seed có cờ** — `frontend/src/mocks/seed/quotes.ts`: thêm `hasInstallation: true` cho `quote-1` và `hasInstallation: false` cho các quote còn lại (mỗi object thêm 1 dòng cạnh `paymentTerms`). Đảm bảo ít nhất 1 dự án có cờ true.

- [ ] **Step 2: Mock create giữ cờ** — `frontend/src/api/quotes.ts`, trong `createQuoteInDb`, object tạo quote thêm `hasInstallation: v.hasInstallation ?? false,`. (Nếu `enrichQuoteWithSummary` dùng `...q`, cờ tự đi theo — không cần sửa thêm.)

- [ ] **Step 3: Mock projects derive cờ** — `frontend/src/api/projects.ts`: tại nơi enrich project (tìm hàm trả `ProjectWithRelations`/summary), thêm:
```ts
    hasInstallation: db.quotes.some((q) => q.projectId === p.id && q.hasInstallation),
```
(đặt cạnh `quoteCount`/`workerCount`; nếu file dùng tên biến khác cho project, sửa cho khớp.)

- [ ] **Step 4: Chạy toàn bộ FE unit test + build**

Run: `cd frontend && npx vitest run && npm run build`
Expected: tất cả PASS, build OK.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/mocks/seed/quotes.ts frontend/src/api/quotes.ts frontend/src/api/projects.ts
git commit -m "feat(quotes): mock seed/api mang cờ hasInstallation cho chế độ mock"
```

---

## Kiểm thử tổng (sau Task 8)
- BE: `cd backend && npm run migration:run && npm run test:e2e` → toàn bộ quotes e2e PASS (gồm 3 test mới).
- FE: `cd frontend && npx vitest run` → PASS; `npm run build` → OK.
- Thủ công (mock): mở form báo giá → có checkbox "Có lắp đặt", không còn ô "ĐK Thanh toán"; lưu báo giá bật cờ → danh sách gom theo Dự án → Đầu mục → Hạng mục, dự án có badge "Có lắp đặt".

## Self-Review (đã rà)
- **Spec coverage:** (1) list gom nhóm → Task 6+7; (2) bỏ ĐK Thanh toán → Task 4+5; (3) checkbox + cờ cấp dự án → Task 1,3,4,5; (4) bản IN giữ nguyên (FE vẫn gửi `paymentTerms` derive) → không có task sửa `QuotePreview`, đúng phạm vi.
- **Placeholder:** không còn TBD; mọi step có code/lệnh cụ thể.
- **Type consistency:** `hasInstallation` đồng nhất BE entity/DTO/response, FE `Quote`/`Project`/`QuoteFormValues`/`QuoteFormShape`; helper `groupQuotes` khớp field `Quote.items`.
- **Rủi ro mở:** nếu chỗ khác trong FE tham chiếu `QuoteFormShape.paymentTerms` (đã xoá) → build sẽ báo, sửa theo (Task 5 Step 3 build sẽ bắt).
