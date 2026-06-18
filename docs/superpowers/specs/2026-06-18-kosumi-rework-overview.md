# Kosumi App — Đợt chỉnh sửa theo MEMO (2026-06-18)

> Tài liệu tổng (master) cho đợt sửa theo `MEMO.MD`. Mỗi gói có spec + plan riêng,
> làm tuần tự, duyệt từng gói. File này giữ các quyết định nền tảng để không mất ngữ cảnh.

## Nguồn yêu cầu
`MEMO.MD` (mới nhất) — **ghi đè** `docs/review/change-requests.md` ở phần Giao việc.

## Kiến trúc liên quan (hiện tại)
- **FE:** React + Vite, `frontend/src/pages` + `components/<domain>`, lớp `api/*` chuyển mock↔real qua `VITE_USE_MOCK`.
- **BE:** NestJS module hoá, TypeORM, MariaDB (native localhost). Migrations ở `backend/src/database/migrations`.
- **Phân cấp dữ liệu:** `Project → Quote → QuoteItem` (`sectionName`=đầu mục, `itemName`=hạng mục) `→ Task` (1 task/1 quote item, giữ `quoteItemId` + `section`) `→ TaskAssignment` (đã có `assignedAt/startedAt/endedAt/isActive/transferredFromTaskId`).
- **Site.type:** `factory` (nhà máy) | `construction` (công trường) | `warehouse`.

## Quyết định gating (đã chốt với chủ dự án)

### G1 — Giờ làm & Tăng ca (Giao việc)
- Ca thường kết thúc **17:00**.
- **17:00:** tự động **tan ca** — kết thúc toàn bộ assignment đang active, NV về *chờ giao việc*.
- Giao việc **sau 17:00** ⇒ **tăng ca**: hiện **dialog nhập số giờ OT**.
- Giờ OT **tính bắt đầu từ 17:15**. Nhập **N** giờ ⇒ tự trả NV về *chờ giao việc* lúc **17:15 + N** (vd 2h → 19:15).

### G2 — Cơ chế tan ca
- **Tự động** bằng scheduler backend (`@nestjs/schedule`) chạy lúc 17:00. (Kèm sweep định kỳ để đóng các block OT khi tới hạn 17:15+N.)

### G3 — "Có lắp đặt"
- **Nhập** bằng checkbox trên **Báo giá** (Quote).
- **Cờ tổng hợp ở cấp Dự án**: dự án *có lắp đặt* nếu **bất kỳ** báo giá nào của nó bật cờ.
  - Có lắp đặt ⇒ dự án hiện ở **Công trường** *và* **Nhà máy**.
  - Không lắp đặt ⇒ dự án **chỉ ở Nhà máy**.

### G4 — Thứ tự
Data-model nền tảng trước, UI phụ thuộc sau.

## Lộ trình 6 gói

| # | Gói | Phụ thuộc | Spec |
|---|-----|-----------|------|
| 1 | **Báo giá + "Có lắp đặt"** | — | `2026-06-18-quotes-installation-design.md` |
| 2 | **Khách hàng** (phân loại + ngành nghề + bỏ tab điều khoản) | — | (sẽ viết khi tới) |
| 3 | **Nhân viên** (2 nhóm chức vụ + lọc giao việc + KPI) | — | (sẽ viết khi tới) |
| 4 | **Giao việc** (tính giờ + OT + DS hoàn thành) ⚠ nặng | 3 | (sẽ viết khi tới) |
| 5 | **Dự án** (hoàn thành/hủy hạng mục + ai làm + thời gian) | 4 | (sẽ viết khi tới) |
| 6 | **Dashboard** (đổi tên app, KPI tách CT/NM, doanh thu, biểu đồ) | 1,3,4 | (sẽ viết khi tới) |

Gói 1–3 độc lập (làm trước). Gói 4 là tiền đề cho 5. Gói 6 cần dữ liệu của 1/3/4 → làm cuối.

## Điểm đã chốt thêm (2026-06-18)
- **Gói 2 — Ngành nghề KD chính:** ô **text tự nhập** (không cần combobox gợi ý). Map enum KH cũ: `business→domestic`, `studio→household`, `foreign→foreign`, `state→state`.
- **Gói 3 — Chức vụ:** triển khai dạng **enum/hằng tập trung 1 chỗ** (1 file master), thiết kế sao cho **sau này nâng thành master-data sửa được từ config/file** mà không phải đổi nhiều nơi. 2 nhóm: NV (hiện trong giao việc) = Quản đốc, Phó quản đốc, Tổ trưởng, Tổ phó, Công nhân; QL (ẩn khỏi giao việc) = Giám đốc, Phó GĐ, Kế toán trưởng, Kế toán viên, Thủ kho, Sale, Khác.
- **Gói 4 — Doanh thu:** tính theo **năm dương lịch, chốt sổ 31/12** (reset 1/1). Tổng = Σ tiền báo giá `approved` trong năm hiện tại.

## Điểm còn cần xác nhận (theo gói, không chặn Gói 1)
- **Gói 4:** Khi giao OT lúc 18:00 (đã quá 17:15) thì block vẫn kết thúc tại 17:15+N hay N giờ kể từ lúc giao? (sẽ chốt khi viết spec Gói 4)
