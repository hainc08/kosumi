# Plan sửa: Form "Nhập thông tin báo giá" (module Báo giá)

**Nguồn yêu cầu:** `docs/review/change-requests.md` › mục Báo giá (review của anh Hải, 15/06/2026)
**Phạm vi:** Chỉ màn **Tạo / Sửa báo giá** (`QuoteForm`). List + Preview A4 giữ nguyên.
**Trạng thái:** 🟡 Chờ duyệt plan → chưa code.

---

## 1. Hiện trạng (để đối chiếu)

- `src/components/quotes/QuoteForm.tsx` — modal **3 tab**: Thông tin chung / Hạng mục / Thanh toán.
- `projectId` **bắt buộc**, chọn từ dự án có sẵn (`<select>`). Khách hàng là `<select>` tùy chọn.
- Hạng mục: danh sách **phẳng**, mỗi dòng tự nhập `sectionName` (Phân nhóm) + itemName + ĐVT/SL/giá.
- Ngày báo giá mặc định = hôm nay ✓. `validUntil` mặc định +10 ngày, `validityDays` = 10.
- Số báo giá **không hiển thị** trong form (sinh lúc lưu qua `nextQuoteCode`).
- Footer: **Hủy** + **Lưu báo giá** (luôn tạo status `draft`).
- Data: `quoteFormShape.ts` (FormShape string-typed + zod), `formToValues` → `QuoteFormValues`; lưu qua `createQuoteInDb` / `updateQuoteInDb` trong `src/api/quotes.ts`.

---

## 2. Yêu cầu → việc cần làm

| # | Yêu cầu | Việc cần làm | File chính |
|---|---------|--------------|-----------|
| 0 | Bỏ tab | Gộp 3 tab → **1 form cuộn dọc**, chia khối bằng tiêu đề (Thông tin chung → Hạng mục → Thanh toán → Ghi chú). | `QuoteForm.tsx`, `QuoteForm.css` |
| 1 | Số báo giá tự sinh | Thêm ô **"Số báo giá"** read-only. Tạo mới: preview mã kế tiếp; Sửa: hiện mã hiện có. | `quotes.ts` (hàm `peekNextQuoteCode`), `QuoteForm.tsx` |
| 2 | Check "Dự án đã có" | Checkbox **"Dự án đã có"** (mặc định bật). Bật → chọn dự án từ list. Tắt → ô **"Tên gói thầu / dự án mới"**; khi lưu **tạo dự án mới** gắn vào báo giá. | `QuoteForm.tsx`, `quoteFormShape.ts`, `quotes.ts`, dùng `createProjectInDb` |
| 3 | Khách hàng tìm-chọn | Đổi `<select>` khách hàng → **combobox tìm kiếm** (gõ lọc theo tên/mã). Không có → hiện gợi ý "vào module Khách hàng thêm trước". Không cho tạo khách inline. | component mới `CustomerCombobox`, `QuoteForm.tsx` |
| 4 | Hạng mục lồng danh mục | Đổi UI sang **2 cấp**: Hạng mục (section, có tên) → bên trong nhiều **Danh mục** (line item: ĐVT/SL/đơn giá). Thêm/xóa ở cả 2 cấp. | `QuoteForm.tsx`, `quoteFormShape.ts` (đổi shape `items` → `sections[]`) |
| 5 | Ngày báo giá = hôm nay | Giữ mặc định hôm nay (đã đúng) — xác nhận lại khi tạo mới. | `quoteFormShape.ts` |
| 6 | Hiệu lực +30 ngày tự điền | `validityDays` mặc định **30**; `validUntil` **tự tính = ngày báo giá + 30** và auto cập nhật khi đổi ngày/số ngày. | `quoteFormShape.ts`, `QuoteForm.tsx` |
| 7 | Nút "Gửi duyệt báo giá" | Footer 3 nút: **Hủy** · **Lưu báo giá** (draft) · **Gửi duyệt báo giá** (lưu rồi set status `pending`). | `QuoteForm.tsx`, dùng `updateQuoteStatusInDb` |

---

## 3. Thay đổi cấu trúc dữ liệu form (req #4 là lớn nhất)

Đổi `QuoteFormShape.items: QuoteItemFormShape[]` → **nhóm 2 cấp**:

```ts
interface QuoteSectionFormShape {
  id?: string
  name: string            // tên hạng mục, vd "Cầu thang thép"
  nameEn?: string         // (tuỳ chọn) phục vụ Preview song ngữ
  items: QuoteLineFormShape[]   // danh mục bên trong
}
interface QuoteLineFormShape {
  id?: string
  itemName: string        // vd "Lan can cầu thang thép"
  description: string
  unit: string
  quantity: string
  unitPrice: string
}
```

- `useFieldArray` lồng: 1 array `sections`, mỗi section 1 array `items` (nested field array).
- `formToValues` **làm phẳng** lại về `QuoteItem[]`: mỗi line → `{ sectionName: section.name, sectionNameEn: section.nameEn, itemName, ... }`. **Không phải đổi DB/storage** — `QuoteItem.sectionName/sectionNameEn` đã có sẵn, và Preview A4 đã gom nhóm theo `sectionName`.
- `quoteToForm` (khi sửa): gom các `QuoteItem` cùng `sectionName` lại thành section.

---

## 4. Thay đổi mock API (`src/api/quotes.ts`)

1. `peekNextQuoteCode(): string` — tính mã kế tiếp **không tăng counter** (tách logic khỏi `nextQuoteCode`), để hiển thị read-only.
2. `createQuoteInDb` nhận thêm cờ tạo dự án mới: nếu không có `projectId` mà có `newProjectName` → gọi `createProjectInDb` (tên = gói thầu, customerId = khách đã chọn, type `other`, status `planning`, progress 0) rồi gắn `projectId` trả về vào quote.
3. Hook `useCreateQuote` mở rộng để trả về quote vừa tạo (đã có) → dùng cho luồng "Gửi duyệt" (tạo xong gọi `updateQuoteStatus` → `pending`).

**Quyết định đã chốt:**
- (a) ✅ **Tạo dự án mới tối giản, để trống Xưởng.** Nới `Project.siteId` → `string | null`; dự án mới tạo với `siteId = null`, `type = 'other'`, `status = 'planning'`, `progressPct = 0`, tên = gói thầu, customerId = khách đã chọn. Hoàn thiện xưởng/giá trị/deadline sau trong module Dự án. (Cần kiểm tra các chỗ đọc `siteId`/`site.name` đã chịu được null: list/drawer Dự án, filter Kanban.)
- (b) ✅ Khi **tắt** "Dự án đã có" → **bắt buộc chọn Khách hàng** (để gắn cho dự án mới). Thêm validation trong zod `superRefine`.

---

## 5. Thứ tự thực thi (mỗi bước build + test xong mới qua bước sau)

1. **Data layer:** đổi `quoteFormShape.ts` sang cấu trúc sections lồng + `formToValues`/`quoteToForm` mới; `peekNextQuoteCode` + nhánh tạo dự án trong `quotes.ts`. → cập nhật/ì thêm test `quotes-api.test.ts`.
2. **Bỏ tab + bố cục 1 cột** (req 0) + ô số báo giá read-only (req 1) + ngày/hiệu lực auto 30 ngày (req 5,6).
3. **Checkbox "Dự án đã có"** + luồng tạo dự án mới (req 2) + validation khách bắt buộc khi tạo mới (4b).
4. **CustomerCombobox** tìm-chọn khách (req 3).
5. **UI hạng mục 2 cấp** với nested field array (req 4).
6. **Nút "Gửi duyệt báo giá"** (req 7).
7. Build + full test + **kiểm tra trình duyệt**: tạo báo giá mới (cả 2 nhánh dự án), gửi duyệt, sửa lại, xem Preview A4 nhóm đúng hạng mục.

---

## 6. Tiêu chí hoàn thành

- [ ] Form 1 trang, không còn tab; số báo giá hiện read-only (mã kế tiếp / mã hiện có).
- [ ] Bỏ check "Dự án đã có" → nhập tên gói thầu → lưu thì có **dự án mới** + báo giá gắn vào nó.
- [ ] Ô khách hàng gõ để lọc & chọn khách có sẵn; không có thì báo dẫn sang module Khách hàng.
- [ ] Hạng mục lồng danh mục; Preview A4 gom đúng theo hạng mục.
- [ ] Ngày báo giá = hôm nay; hiệu lực tự = +30 ngày.
- [ ] 3 nút Hủy / Lưu báo giá / Gửi duyệt; "Gửi duyệt" đưa status sang **Chờ phê duyệt**.
- [ ] `npm run build` + toàn bộ test PASS.

## 7. Ngoài phạm vi

- Tạo khách hàng / chọn người liên hệ chi tiết ngay trong form báo giá (chỉ chọn khách có sẵn).
- Chọn đầy đủ thuộc tính dự án mới (giá trị HĐ, deadline, xưởng) — để hoàn thiện ở module Dự án.
- Thay đổi list báo giá và Preview A4 (đã khớp `workshop_pro.html`).
