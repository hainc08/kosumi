# Gói 1 — Báo giá + "Có lắp đặt" (2026-06-18)

> Thuộc đợt sửa `2026-06-18-kosumi-rework-overview.md`. Gói nền tảng: thêm cờ lắp đặt,
> bỏ field điều khoản trùng, gom nhóm danh sách báo giá.

## Mục tiêu (từ MEMO — phần "Màn hình Báo giá")
1. **Danh sách** báo giá sắp xếp/gom theo **Dự án → Đầu mục → Hạng mục**.
2. **Bỏ field "ĐK Thanh toán"** (preset `paymentTerms`) — trùng với bảng đợt thanh toán (`paymentSteps`) bên dưới.
3. **Thêm checkbox "Có lắp đặt: Có/Không"** trên báo giá.
   - Cờ tổng hợp ở cấp Dự án: dự án có lắp đặt ⇔ tồn tại ≥1 báo giá bật cờ.
   - Có ⇒ dự án xuất hiện ở **Công trường + Nhà máy**; Không ⇒ **chỉ Nhà máy**.
4. Màn **Báo giá để IN** (`QuotePreview.tsx`): MEMO không nêu thay đổi → **giữ nguyên** (chỉ đảm bảo không vỡ khi bỏ `paymentTerms`).

## Phạm vi data-model

### 1. `quotes.has_installation`
- Migration: `ALTER TABLE quotes ADD COLUMN has_installation BOOLEAN NOT NULL DEFAULT 0` (sau `status`/trước `notes`).
- Entity `Quote`: `@Column({ name: 'has_installation', type: 'boolean', default: false }) hasInstallation: boolean`.
- DTO `CreateQuoteDto`: `@IsBoolean() @IsOptional() hasInstallation?: boolean` (mặc định `false`).
- Service: lưu khi create/update; **clone** (`duplicate`) giữ nguyên cờ.

### 2. Cờ lắp đặt cấp Dự án (suy ra, KHÔNG lưu cột riêng)
- Helper `projectHasInstallation(projectId): boolean` = `EXISTS(quote WHERE project_id=? AND has_installation=1 AND deleted_at IS NULL)`.
- Phơi ra ở response Project: thêm field tính toán `hasInstallation` trong `ProjectsService.enrich` (1 batch query gom theo `projectId`, tránh N+1) — phục vụ Dashboard (Gói 6) và lọc Công trường/Nhà máy.
- Lý do không lưu cột: luôn nhất quán, không cần đồng bộ khi báo giá đổi cờ/bị xoá.

### 3. Bỏ "ĐK Thanh toán" (`paymentTerms`)
- **Quyết định:** giữ cột DB `quotes.payment_terms` (tránh migration phá dữ liệu + còn dùng cho bản IN), nhưng:
  - **FE:** bỏ ô nhập preset khỏi `QuoteForm`. Không hiển thị thẻ "ĐK Thanh toán" trùng.
  - **Giá trị `paymentTerms`** được **suy ra tự động** từ `paymentSteps` (ghép `%` theo thứ tự, vd `30-25-35-10`) khi submit, trong `formToValues` / hoặc service. Vẫn còn để bản IN dùng nếu cần.
  - Bỏ rule zod bắt buộc nhập `paymentTerms`.

## Phạm vi BE
- `quote.entity.ts`: + `hasInstallation`.
- `create-quote.dto.ts`: + `hasInstallation?`.
- `quotes.service.ts`: map `hasInstallation` ở create/update/duplicate; derive `paymentTerms` từ steps nếu FE không gửi.
- `projects.service.ts`: enrich `hasInstallation` cho response (batch).
- Migration mới trong `backend/src/database/migrations` + cập nhật `schema.sql`/seed nếu có cột liệt kê tường minh.

## Phạm vi FE
- `types/index.ts`: `Quote += hasInstallation: boolean`; `Project += hasInstallation?: boolean`.
- `quoteFormShape.ts`: thêm `hasInstallation: boolean` (mặc định `false`); bỏ `paymentTerms` khỏi form bắt buộc; `formToValues` tự ghép `paymentTerms` từ `paymentSteps`.
- `QuoteForm.tsx`: thêm checkbox "Có lắp đặt"; gỡ ô nhập "ĐK Thanh toán".
- `Quotes.tsx` (danh sách): nhóm 2 cấp — **Dự án** → **Đầu mục (`sectionName`)** → liệt kê **hạng mục**. Hiển thị badge "Có lắp đặt" ở cấp dự án.
- `api/quotes.ts` mock: cập nhật shape mock cho khớp (`hasInstallation`).

## Cách gom nhóm danh sách (chi tiết)
- Dữ liệu: mỗi quote có `items` (mỗi item có `sectionName`, `itemName`). 1 báo giá thuộc 1 dự án (`project.name`).
- Cây hiển thị:
  - **Dự án** (gom theo `projectId`/`project.name`) + badge lắp đặt.
    - **Đầu mục** (`sectionName`, gom các item cùng section trong các báo giá của dự án).
      - **Hạng mục** (`itemName`, + ĐVT/SL/đơn giá/thành tiền).
- Giữ được lối mở báo giá gốc (click → drawer chi tiết hiện có).

## Test
- BE: tạo/sửa báo giá set `hasInstallation` → đọc lại đúng; `projectHasInstallation` đúng khi có/không báo giá bật cờ; `paymentTerms` được derive đúng từ steps.
- FE: form lưu cờ; danh sách gom nhóm đúng 3 cấp; không còn ô "ĐK Thanh toán".

## Ngoài phạm vi (sang gói khác)
- Hiển thị dự án ở màn Công trường/Nhà máy theo cờ → **Gói 6 (Dashboard)** dùng field `hasInstallation` này.
- Logic sinh task/giao việc — không đổi ở gói này.

## Rủi ro
- Derive `paymentTerms` từ steps có thể khác chuỗi cũ → kiểm tra bản IN (`QuotePreview`) vẫn hiển thị hợp lý.
- Migration boolean trên MariaDB: dùng `TINYINT(1)`/`BOOLEAN` nhất quán với các cột bool khác trong `schema.sql`.
