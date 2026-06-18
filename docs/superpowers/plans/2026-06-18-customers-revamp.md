# Gói 2 — Khách hàng Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đổi phân loại khách hàng sang 5 loại mới, thêm "Ngành nghề KD chính" tự nhập (thay trường Trạng thái trong UX), và bỏ tab "Điều khoản mặc định" khỏi form khách hàng.

**Architecture:** Migration MariaDB remap enum `customers.type` (nới→update→thu) + thêm cột `industry`. Giữ cột `status`/`default_*` trong DB (chỉ gỡ khỏi UX). FE đổi types/form/list/drawer/mock.

**Tech Stack:** NestJS + TypeORM + MariaDB (BE), React + react-hook-form + zod + Vitest (FE). Spec: `docs/superpowers/specs/2026-06-18-customers-revamp-design.md`.

## Global Constraints

- DB MariaDB native localhost (user `haimv`), KHÔNG docker. Migration raw `ALTER TABLE` (style `1718000013000-AlterWorkersSpecialty.ts`).
- Enum mới của `type`: `domestic | foreign | state | household | individual`. Map cũ→mới: `business→domestic`, `studio→household`, `foreign→foreign`, `state→state`.
- Nhãn tiếng Việt: domestic="Doanh nghiệp trong nước", foreign="Doanh nghiệp nước ngoài", state="Doanh nghiệp nhà nước", household="Hộ kinh doanh", individual="Cá nhân".
- `industry` = `VARCHAR(200)` nullable, free text. KHÔNG xoá cột `status`/`default_*` trong DB.
- BE e2e: `cd backend && npm run migration:run` rồi `npx jest --config ./test/jest-e2e.json customers`. FE: `cd frontend && npx vitest run <file>` + `npm run build`.
- Commit prefix `feat(customers)`; tiếng Việt. Branch `poc`, commit trực tiếp, KHÔNG tạo branch.

---

### Task 1: BE — remap enum `type` + thêm `industry` (migration + entity + DTO + service + e2e)

**Files:**
- Create: `backend/src/database/migrations/1718000015000-AlterCustomersTypeAndIndustry.ts`
- Modify: `backend/src/modules/customers/entities/customer.entity.ts`
- Modify: `backend/src/modules/customers/dto/create-customer.dto.ts`
- Modify: `backend/src/modules/customers/dto/query-customer.dto.ts`
- Modify: `backend/src/modules/customers/customers.service.ts` (`create()`)
- Modify: `backend/database/schema.sql` (enum `type` + dòng `industry`)
- Test: `backend/test/customers.e2e-spec.ts`

**Interfaces:**
- Produces: `Customer.type` enum mới; `Customer.industry: string | null`; DTO `CreateCustomerDto.type` (enum mới) + `industry?: string`; `QueryCustomerDto.type` enum mới.

- [ ] **Step 1: Sửa test e2e hiện có + thêm test mới (RED)** — trong `backend/test/customers.e2e-spec.ts`:
  a. Đổi 2 chỗ `type: 'business'` (dòng ~24 và ~55) thành `type: 'domestic'`.
  b. Thêm test mới trước test DELETE:
```ts
  it('POST /api/customers chấp nhận type mới + industry; lọc ?type=domestic không 400', async () => {
    const res = await request(app.getHttpServer()).post('/api/customers')
      .send({
        name: 'Hộ KD Cơ khí Test',
        type: 'household',
        industry: 'Cơ khí chính xác',
        contacts: [{ fullName: 'Người LH', title: 'Chủ', phone: '0900000009', email: 'h@test.com' }],
      }).expect(201)
    expect(res.body.data.type).toBe('household')
    expect(res.body.data.industry).toBe('Cơ khí chính xác')

    const list = await request(app.getHttpServer()).get('/api/customers').query({ type: 'domestic' }).expect(200)
    expect(Array.isArray(list.body.data)).toBe(true)
  })
```

- [ ] **Step 2: Chạy test xác nhận FAIL**

Run: `cd backend && npx jest --config ./test/jest-e2e.json -t "type mới"`
Expected: FAIL (DTO từ chối `type: 'household'`/`industry`, hoặc 400).

- [ ] **Step 3: Tạo migration**

```ts
import { MigrationInterface, QueryRunner } from 'typeorm'

/** Đổi customers.type sang 5 loại mới (map dữ liệu cũ) + thêm cột industry (ngành nghề tự nhập). */
export class AlterCustomersTypeAndIndustry1718000015000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    // 1) Nới enum gồm cả cũ + mới để UPDATE không bị truncate.
    await q.query("ALTER TABLE `customers` MODIFY COLUMN `type` ENUM('business','studio','foreign','state','domestic','household','individual') NOT NULL")
    // 2) Map dữ liệu cũ.
    await q.query("UPDATE `customers` SET `type`='domestic' WHERE `type`='business'")
    await q.query("UPDATE `customers` SET `type`='household' WHERE `type`='studio'")
    // 3) Thu về 5 giá trị mới.
    await q.query("ALTER TABLE `customers` MODIFY COLUMN `type` ENUM('domestic','foreign','state','household','individual') NOT NULL")
    // 4) Thêm cột ngành nghề.
    await q.query("ALTER TABLE `customers` ADD COLUMN `industry` varchar(200) NULL AFTER `type`")
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.query("ALTER TABLE `customers` DROP COLUMN `industry`")
    await q.query("ALTER TABLE `customers` MODIFY COLUMN `type` ENUM('business','studio','foreign','state','domestic','household','individual') NOT NULL")
    await q.query("UPDATE `customers` SET `type`='business' WHERE `type`='domestic'")
    await q.query("UPDATE `customers` SET `type`='studio' WHERE `type`='household'")
    await q.query("ALTER TABLE `customers` MODIFY COLUMN `type` ENUM('business','studio','foreign','state') NOT NULL")
  }
}
```

- [ ] **Step 4: Entity** — `customer.entity.ts`: đổi dòng `type` enum và thêm `industry` ngay sau:
```ts
  @Column({ type: 'enum', enum: ['domestic', 'foreign', 'state', 'household', 'individual'] }) type: string
  @Column({ type: 'varchar', length: 200, nullable: true }) industry: string | null
```

- [ ] **Step 5: create DTO** — `create-customer.dto.ts`: đổi `@IsEnum([...])` cho `type` và thêm `industry`:
```ts
  @IsEnum(['domestic', 'foreign', 'state', 'household', 'individual']) type: string
```
thêm dòng (sau `type`):
```ts
  @IsOptional() @IsString() industry?: string
```

- [ ] **Step 6: query DTO** — `query-customer.dto.ts`: đổi enum của `type`:
```ts
  @IsOptional() @EmptyToUndefined() @IsEnum(['domestic', 'foreign', 'state', 'household', 'individual']) type?: string
```

- [ ] **Step 7: service create** — `customers.service.ts`, trong `m.create(Customer, {...})` của `create()`, thêm sau `type: dto.type,`:
```ts
        industry: dto.industry ?? null,
```
(update() không cần sửa — `industry` đã chảy qua `...customerFields`.)

- [ ] **Step 8: schema.sql** — đổi dòng `` `type` enum('business','studio','foreign','state') NOT NULL, `` thành:
```sql
  `type` enum('domestic','foreign','state','household','individual') NOT NULL,
  `industry` varchar(200) DEFAULT NULL,
```

- [ ] **Step 9: migration:run + test PASS**

Run: `cd backend && npm run migration:run && npx jest --config ./test/jest-e2e.json customers`
Expected: toàn bộ customers e2e PASS (gồm test mới).

- [ ] **Step 10: Commit**

```bash
git add backend/src/database/migrations/1718000015000-AlterCustomersTypeAndIndustry.ts backend/src/modules/customers/entities/customer.entity.ts backend/src/modules/customers/dto/create-customer.dto.ts backend/src/modules/customers/dto/query-customer.dto.ts backend/src/modules/customers/customers.service.ts backend/database/schema.sql backend/test/customers.e2e-spec.ts
git commit -m "feat(customers): phân loại 5 loại mới + cột industry (ngành nghề)"
```

---

### Task 2: FE — types: `CustomerType` mới + nhãn + `industry`

**Files:**
- Modify: `frontend/src/types/index.ts`

**Interfaces:**
- Produces: `CustomerType = 'domestic'|'foreign'|'state'|'household'|'individual'`; `CUSTOMER_TYPE_LABELS` 5 nhãn; `Customer.industry: string | null`; `CreateCustomerDto.industry?: string`.

- [ ] **Step 1: Đổi `CustomerType` + nhãn** — `types/index.ts` dòng 157-165:
```ts
export type CustomerType   = 'domestic' | 'foreign' | 'state' | 'household' | 'individual'
export type CustomerStatus = 'active' | 'inactive' | 'pending'

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  domestic:   'Doanh nghiệp trong nước',
  foreign:    'Doanh nghiệp nước ngoài',
  state:      'Doanh nghiệp nhà nước',
  household:  'Hộ kinh doanh',
  individual: 'Cá nhân',
}
```

- [ ] **Step 2: Thêm `industry`** — trong `interface Customer` (sau dòng `type:`):
```ts
  industry:             string | null
```
và trong `interface CreateCustomerDto` (sau `type:`):
```ts
  industry?:            string
```

- [ ] **Step 3: Build TS để bắt chỗ vỡ (dự kiến có lỗi ở mock/form sẽ sửa task sau)**

Run: `cd frontend && npx tsc --noEmit`
Expected: có thể còn lỗi ở `customerFormShape`/mock (sửa ở Task 3–5). Nếu lỗi CHỈ nằm ở các file đó → chấp nhận, ghi vào report. Không sửa file ngoài Task 2 ở bước này.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "feat(customers): type 5 loại mới + nhãn + field industry (FE types)"
```

---

### Task 3: FE — form shape + `CustomerForm` (type mới, status→industry, bỏ Tab 3)

**Files:**
- Modify: `frontend/src/components/customers/customerFormShape.ts`
- Modify: `frontend/src/components/customers/CustomerForm.tsx`

**Interfaces:**
- Consumes: `CustomerType` mới, `Customer.industry` (Task 2).
- Produces: `CustomerFormShape` không còn `status`, có `industry`; `formToCreateDto` gửi `industry` (không gửi `status` → BE default 'active').

- [ ] **Step 1: `customerFormShape.ts`**:
  a. Interface `CustomerFormShape`: **bỏ** `status: CustomerStatus`, **thêm** `industry: string` (đặt sau `website`). Bỏ import `CustomerStatus` nếu mồ côi.
  b. `customerSchema`: bỏ `status: z.enum([...])`, đổi `type: z.enum(['domestic','foreign','state','household','individual'])`, thêm `industry: z.string()`.
  c. `emptyCustomerForm`: bỏ `status: 'active'`, đổi `type: 'domestic'`, thêm `industry: ''`. (Giữ nguyên các `default*`.)
  d. `customerToForm(c)`: bỏ `status: c.status`, thêm `industry: c.industry ?? ''`. (Giữ `default*`.)
  e. `formToCreateDto(v)`: bỏ `status: v.status`, thêm `industry: v.industry || undefined`. (Giữ `default*` như cũ.)

- [ ] **Step 2: `CustomerForm.tsx`**:
  a. Import: bỏ `CUSTOMER_STATUS_LABELS`, `CustomerStatus`, `PAYMENT_TERMS_LABELS`, `PaymentTermsPreset` (sẽ mồ côi sau khi bỏ Tab 3).
  b. `type Tab = 1 | 2 | 3` → `type Tab = 1 | 2`. Bỏ nút tab 3 (dòng 71). Bỏ cả khối `{/* Tab 3 */}` (dòng 145-168).
  c. Trong Tab 1, thay FormField "Trạng thái" (dòng 94-100) bằng:
```tsx
            <FormField label="Ngành nghề KD chính">
              <input placeholder="VD: Xây dựng, Cơ khí chính xác, kết cấu thép..." {...register('industry')} />
            </FormField>
```
  d. FormField "Loại khách hàng" giữ nguyên (nó map qua `CUSTOMER_TYPE_LABELS` đã đổi).

- [ ] **Step 3: Build**

Run: `cd frontend && npm run build`
Expected: PASS (không lỗi unused-import / `status` / `paymentTerms`). Nếu mock chưa khớp gây lỗi build → đó là Task 5; nhưng `npm run build` phải xanh sau Task 5. Ở task này chỉ cần `npx tsc --noEmit` cho 2 file này không sinh lỗi mới ngoài mock. Nếu build đỏ chỉ vì `mocks/seed/customers.ts`/`api/customers.ts` thiếu industry/type cũ → ghi vào report, để Task 5 xử lý.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/customers/customerFormShape.ts frontend/src/components/customers/CustomerForm.tsx
git commit -m "feat(customers): form đổi loại KH, thay Trạng thái bằng Ngành nghề, bỏ tab điều khoản"
```

---

### Task 4: FE — `Customers.tsx` (cột Ngành nghề, bỏ KPI pending) + `CustomerDetailDrawer`

**Files:**
- Modify: `frontend/src/pages/Customers.tsx`
- Modify: `frontend/src/components/customers/CustomerDetailDrawer.tsx`

**Interfaces:**
- Consumes: `Customer.industry`, `CUSTOMER_TYPE_LABELS` mới.

- [ ] **Step 1: `Customers.tsx`**:
  a. Bỏ import `CUSTOMER_STATUS_LABELS`, `CustomerStatus`; bỏ `Badge`/`BadgeVariant` nếu mồ côi (kiểm tra: chỉ status column dùng Badge → bỏ được). Bỏ `IconClockHour4` nếu mồ côi.
  b. Bỏ hằng `STATUS_VARIANT` (dòng 17).
  c. `kpis`: bỏ `pending`. Bỏ thẻ KPI "Chờ phản hồi" (dòng 70) → còn 3 thẻ: Tổng KH, Có báo giá, Tổng giá trị HĐ.
  d. Cột `status` (dòng 56) → đổi thành cột Ngành nghề:
```tsx
    { key: 'industry', header: 'Ngành nghề', render: (c) => c.industry || '—' },
```

- [ ] **Step 2: `CustomerDetailDrawer.tsx`**:
  a. Bỏ import `CUSTOMER_STATUS_LABELS` (và `STATUS_VARIANT` constant nếu có trong file).
  b. Thay `<Badge variant={STATUS_VARIANT[customer.status]} dot>{CUSTOMER_STATUS_LABELS[customer.status]}</Badge>` (dòng ~34) bằng:
```tsx
        {customer.industry && <Badge variant="blue">{customer.industry}</Badge>}
```
  (Giữ import `Badge`.) Nếu `STATUS_VARIANT` định nghĩa trong file này thì xoá nó.

- [ ] **Step 3: Build**

Run: `cd frontend && npm run build`
Expected: PASS (sau khi Task 5 cập nhật mock; nếu chỉ còn lỗi mock → ghi report).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Customers.tsx frontend/src/components/customers/CustomerDetailDrawer.tsx
git commit -m "feat(customers): danh sách + drawer hiển thị Ngành nghề thay Trạng thái"
```

---

### Task 5: FE — mock seed + api (industry + type mới) + kiểm thử tổng

**Files:**
- Modify: `frontend/src/mocks/seed/customers.ts`
- Modify: `frontend/src/api/customers.ts`

**Interfaces:**
- Consumes: `Customer.industry`, `CustomerType` mới.

- [ ] **Step 1: Seed** — `mocks/seed/customers.ts`: với MỌI record seed:
  - Đổi `type` cũ sang mới: `business→domestic`, `studio→household`, `foreign→foreign`, `state→state`.
  - Thêm `industry: '<ngành phù hợp>'` (vd cust-1: 'Bán lẻ / Thương mại', cust-2: 'Kiến trúc / Nội thất'; record khác chọn hợp lý).
  - Bỏ hoặc giữ `status` đều được (type `Customer` vẫn có `status`; nếu giữ thì OK, không cần đổi). KHÔNG cần thêm/sửa `status`.

- [ ] **Step 2: api** — `api/customers.ts`:
  - `CustomerFilters` giữ nguyên (status filter không dùng nhưng vô hại).
  - `createCustomerInDb`: trong object `customer`, thêm `industry: dto.industry ?? null,` (cạnh `type`).
  - `updateCustomerInDb`: trong `Object.assign`, thêm `industry: dto.industry ?? null,`.

- [ ] **Step 3: Kiểm thử tổng**

Run: `cd frontend && npx vitest run && npm run build`
Expected: build PASS; các test FE liên quan PASS. (10 test pre-existing fail ở pay-calculator/sites/timesheet/smoke là lỗi sẵn có — bỏ qua, KHÔNG tính là lỗi task này; nếu xuất hiện fail MỚI liên quan customers thì phải sửa.)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/mocks/seed/customers.ts frontend/src/api/customers.ts
git commit -m "feat(customers): mock seed/api theo loại KH mới + industry"
```

---

## Kiểm thử tổng (sau Task 5)
- BE: `cd backend && npm run migration:run && npx jest --config ./test/jest-e2e.json customers` → PASS.
- FE: `cd frontend && npm run build` → OK; vitest không có fail MỚI ngoài 10 lỗi pre-existing.
- Thủ công (mock): form khách hàng có "Ngành nghề KD chính" (tự nhập), 5 loại KH mới, không còn tab "Điều khoản mặc định"; danh sách có cột Ngành nghề, không còn cột/KPI Trạng thái.

## Self-Review (đã rà)
- **Spec coverage:** (1) ngành nghề tự nhập → Task 1 (cột) + 2 (type) + 3 (form) + 4 (list/drawer); (2) phân loại 5 loại → Task 1 (enum+migration) + 2 (labels) + 3/5; (3) bỏ tab điều khoản → Task 3.
- **Migration an toàn:** nới→update→thu đúng thứ tự; `down()` đảo ngược. Giữ `default_*`/`status` → không mất dữ liệu, báo giá vẫn prefill.
- **Placeholder:** không còn; mọi step có code/lệnh.
- **Type consistency:** `industry` đồng nhất BE entity/DTO/service ↔ FE types/form/list/drawer/mock; `CustomerType` mới đồng nhất labels/zod/DTO/query.
- **Rủi ro mở:** chỗ khác (ngoài file đã liệt kê) tham chiếu `CustomerType` cũ → `npm run build` ở Task 3/4/5 sẽ bắt; sửa theo.
