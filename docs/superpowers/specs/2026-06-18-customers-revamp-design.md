# Gói 2 — Khách hàng (2026-06-18)

> Thuộc đợt sửa `2026-06-18-kosumi-rework-overview.md`. Đổi phân loại KH, thêm ngành nghề tự nhập, bỏ tab điều khoản mặc định.

## Mục tiêu (từ MEMO — phần "Khách hàng")
1. **Ngành nghề KD chính (tự nhập)** thay cho trường "Trạng thái": ô **text tự do** (VD: Xây dựng, Cơ khí chính xác, Xây lắp, kết cấu thép, nội thất…).
2. **Phân loại khách hàng** (đổi enum `type`) thành 5 loại:
   - `domestic` — Doanh nghiệp trong nước
   - `foreign` — Doanh nghiệp nước ngoài
   - `state` — Doanh nghiệp nhà nước
   - `household` — Hộ kinh doanh
   - `individual` — Cá nhân
3. **Bỏ tab "Điều khoản mặc định"** trong form khách hàng.

## Quyết định thiết kế
- **`industry` là cột mới, KHÔNG xoá `status`.** Thêm `customers.industry VARCHAR(200) NULL`. Trường `status` (active/inactive/pending) vẫn còn trong DB + type (mặc định `active`) để không phá vỡ backend, nhưng **gỡ khỏi UX** (form, cột danh sách, KPI). Form thay ô "Trạng thái" bằng "Ngành nghề KD chính"; danh sách thay cột "Trạng thái" bằng "Ngành nghề".
- **KPI "Chờ phản hồi" (đếm status=pending) bị bỏ** (do status không còn nhập) → hàng KPI còn 3 thẻ: Tổng KH, Có báo giá, Tổng giá trị HĐ.
- **Map enum cũ → mới:** `business→domestic`, `studio→household`, `foreign→foreign`, `state→state`. Migration MariaDB: nới enum (gồm cả cũ+mới) → UPDATE dữ liệu → thu enum về 5 giá trị mới.
- **Giữ cột `default_*`** (điều khoản mặc định — vẫn dùng để auto-fill báo giá). Bỏ tab UI nhưng **giữ các field `default*` trong `CustomerFormShape`** (ẩn, mang giá trị cũ qua `customerToForm`/`emptyCustomerForm`) để create/update không làm mất dữ liệu, báo giá vẫn prefill được.

## Phạm vi BE
- **Migration mới** `1718000015000-AlterCustomersTypeAndIndustry`:
  1. `ALTER TABLE customers MODIFY COLUMN type ENUM('business','studio','foreign','state','domestic','household','individual') NOT NULL` (nới).
  2. `UPDATE customers SET type='domestic' WHERE type='business'`; `UPDATE customers SET type='household' WHERE type='studio'`.
  3. `ALTER TABLE customers MODIFY COLUMN type ENUM('domestic','foreign','state','household','individual') NOT NULL` (thu).
  4. `ALTER TABLE customers ADD COLUMN industry VARCHAR(200) NULL AFTER type`.
  - `down()`: đảo ngược (xoá industry; nới enum gồm cũ+mới; UPDATE ngược `domestic→business`, `household→studio`; thu về enum cũ).
- `customer.entity.ts`: đổi enum `type`; thêm `@Column industry: string | null`.
- `create-customer.dto.ts`: `@IsEnum([...5 new])`; thêm `@IsOptional() @IsString() industry?: string`.
- `query-customer.dto.ts`: `type` enum → 5 giá trị mới (giữ `status` enum như cũ — vô hại).
- `customers.service.ts`: `create()` thêm `industry: dto.industry ?? null` (status giữ default 'active'); `update()` đã chảy qua `...customerFields` (UpdateCustomerDto partial) → industry tự có.
- `schema.sql`: cập nhật enum `type` + thêm dòng `industry`.

## Phạm vi FE
- `types/index.ts`:
  - `CustomerType = 'domestic' | 'foreign' | 'state' | 'household' | 'individual'`.
  - `CUSTOMER_TYPE_LABELS` 5 nhãn mới (tiếng Việt như mục tiêu #2).
  - `Customer += industry: string | null`; `CreateCustomerDto += industry?: string`.
  - Giữ `CustomerStatus`/`CUSTOMER_STATUS_LABELS` (status còn tồn tại trong type/DB) — không xoá để tránh vỡ chỗ khác, nhưng FE thôi render.
- `customerFormShape.ts`: `type` default `'domestic'`; thêm `industry: string`; zod `type` enum mới + `industry: z.string()`; **bỏ `status` khỏi UI nhưng giữ field** (`status` vẫn trong shape, không hiển thị) hoặc bỏ hẳn status khỏi shape và để backend default — **chọn: bỏ `status` khỏi `CustomerFormShape`/zod/formToCreateDto** (backend mặc định 'active'); giữ `default*` trong shape.
- `CustomerForm.tsx`:
  - Tab 1: `type` dùng nhãn mới; thay FormField "Trạng thái" → "Ngành nghề KD chính" (`<input {...register('industry')}>`).
  - **Bỏ Tab 3 "Điều khoản mặc định"** → còn 2 tab. Gỡ import `PAYMENT_TERMS_LABELS`/`PaymentTermsPreset`/`CUSTOMER_STATUS_LABELS`/`CustomerStatus` nếu mồ côi.
- `Customers.tsx`:
  - Cột "Trạng thái" → cột "Ngành nghề" (`render: (c) => c.industry || '—'`); gỡ `STATUS_VARIANT`/`CUSTOMER_STATUS_LABELS` nếu mồ côi.
  - Bỏ KPI "Chờ phản hồi" → 3 thẻ.
  - Filter `type` dùng nhãn mới (tự động qua `CUSTOMER_TYPE_LABELS`).
- `CustomerDetailDrawer.tsx`: thay badge `status` bằng dòng "Ngành nghề: {industry}" (hoặc bỏ badge, hiện industry).
- `api/customers.ts` + `mocks/seed/customers.ts`: thêm `industry`; đổi `type` mock sang giá trị mới (`cust-1 business→domestic`, `cust-2 studio→household`, …); `createCustomerInDb`/`updateCustomerInDb` mang `industry`.

## Test
- BE e2e (`backend/test/customers.e2e-spec.ts` nếu có; nếu không, thêm test tối thiểu): tạo KH với `type='household'` + `industry='Cơ khí'` → đọc lại đúng; filter `?type=domestic` hợp lệ (không 400).
- FE: build PASS; mock list hiển thị cột Ngành nghề, không còn cột/KPI trạng thái.

## Ngoài phạm vi
- Không đụng logic auto-fill báo giá từ `default_*` (giữ nguyên).
- Migration dữ liệu prod chạy lúc deploy (`migration:run`).

## Rủi ro
- Migration enum 2 bước trên MariaDB phải đúng thứ tự (nới → update → thu) nếu không sẽ lỗi truncate. `down()` cũng vậy.
- Có code khác tham chiếu `CustomerType` cũ (`business`/`studio`) → build sẽ bắt; sửa theo.
