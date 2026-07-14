# Giao việc v2 — sửa tính giờ / tăng ca cho khớp MEMO (2026-07-14)

> Rework tiếp nối `2026-06-18-tasks-timetracking-overtime-design.md`. Đợt 06-18 đã dựng khung (cột OT, scheduler, dialog, panel hoàn thành) nhưng hành vi thực tế **lệch MEMO** ở 3 điểm. Spec này chốt cách sửa. Giữ mô hình *nháp + nút Lưu* (theo yêu cầu quản lý: tránh kéo nhầm).

## Bối cảnh — review hiện trạng so với MEMO ("Màn hình giao việc")

| # | Yêu cầu MEMO | Hiện trạng | Kết luận |
|---|---|---|---|
| 1 | Kéo NV vào làm → bắt đầu đếm giờ | Kéo = nháp; bấm **Lưu** mới tạo assignment + `startedAt` | **Chấp nhận qua bước Lưu** — giữ nguyên (quản lý muốn có nút Lưu chống nhầm) |
| 2 | Chuyển việc → chốt giờ việc cũ, tính việc mới | `transfer()` = unassign + assign, mốc giờ đúng | Đạt (còn 1 edge: transfer sau 17:00 tạo assignment thường) |
| 3 | Sau 17:00 tự tan ca, NV về *chờ* | `endOfShiftClockOut` + scheduler theo giờ server, có nút Tan ca | Có code nhưng **không cấu hình/không đếm ngược** → khó demo |
| 4 | Sau 17:00 giao lại = OT; dialog nhập giờ; OT từ **17:15**; 2h → 19:15 tự về *chờ* | Dialog OT + `otEndAt=17:15+N` + sweep. Nhưng OT nhập **chung 1 lần** và `overtimeMinutes` tính từ `startedAt` thực | **Lệch 2 chỗ:** OT chưa per-worker; phút OT chưa kẹp 17:15 |
| 5 | Danh sách hạng mục hoàn thành (ai/giờ/OT) | `CompletedTasksPanel` + `GET /tasks/completed` | Đạt |

Mục tiêu spec: đóng 3 khoảng lệch (**D2, D3, D4** dưới đây); quy tắc 1/2/5 giữ nguyên.

## Quyết định thiết kế (chốt)

- **D1 — Giữ mô hình nháp + nút "Lưu giao việc".** Kéo NV vào hạng mục chỉ cập nhật `draft` (state cục bộ). Bấm **Lưu** → `assign()`, `startedAt = now`, `LiveTimer` chạy. Coi thời điểm Lưu là "bắt đầu làm" (thỏa quy tắc 1). **Không đổi** luồng kéo-thả/nháp hiện có.

- **D2 — OT nhập RIÊNG từng NV.** Khi bấm Lưu mà `now ≥ SHIFT_END` (17:00), `OvertimeDialog` hiển thị **danh sách từng NV trong nháp** (gom distinct workerId), mỗi người một ô số giờ (mặc định 2h, khoảng hợp lệ 0.5–6). Khi xác nhận → gửi map `{ workerId: otHours }` xuống, mỗi assignment nhận đúng số giờ của NV đó. Bỏ mô hình "1 số giờ cho cả batch".

- **D3 — Phút OT kẹp mốc 17:15.** Hàm tính phút OT của một assignment OT = `endedAt − max(startedAt, OT_START_hôm_đó)` (không âm), thay cho `endedAt − startedAt`. Áp dụng ở cả `completedTasks()` và `tasksForProject()`. `totalMinutes` (tổng thời lượng làm) vẫn tính từ `startedAt` thực — chỉ **phần OT** mới kẹp 17:15.

- **D4 — Giờ ca cấu hình được + đếm ngược.**
  - BE: `SHIFT_END_HOUR/MIN`, `OT_START_HOUR/MIN` trong `shift.ts` đọc từ `process.env` (`SHIFT_END`, `OT_START` dạng `"HH:MM"`), fallback 17:00 / 17:15. Scheduler và `isOvertimeTime`/`computeOtEndAt` dùng chung hằng số này.
  - FE: thêm badge trong màn giao việc (step 4): "Còn X phút tới tan ca" tính theo mốc SHIFT_END; với mỗi NV đang OT hiển thị "tự về chờ lúc HH:MM" (từ `otEndAt`). FE lấy mốc giờ từ 1 endpoint cấu hình nhẹ hoặc hằng số dùng chung (xem D5).

- **D5 — FE biết mốc giờ ca bằng cách nào.** Thêm `GET /tasks/shift-config` trả `{ shiftEnd: "HH:MM", otStart: "HH:MM" }` (đọc từ `shift.ts`). FE dùng để: (a) quyết định có mở `OvertimeDialog` khi Lưu không (thay `getHours() >= 17` cứng), (b) tính badge đếm ngược. Tránh hard-code mốc ở FE.

- **D6 — Edge transfer sau 17:00 (ngoài phạm vi chính, ghi nhận).** `transfer()` sau `OT_START` vẫn tạo assignment thường. Chấp nhận cho đợt này; nêu rõ ở phần "Ngoài phạm vi". Không sửa.

## Thay đổi Backend (`modules/tasks`)

- **`shift.ts`:** đọc `SHIFT_END`/`OT_START` từ env (parse `"HH:MM"`, fallback 17:00/17:15). Thêm `otMinutesOf(assignment, base?)` helper hoặc export mốc để service tính. Giữ `isOvertimeTime`, `computeOtEndAt`.
- **`tasks.service.ts`:**
  - `saveAssignments(draft, otHoursByWorker?)`: đổi tham số từ `otHours?: number` sang **map** `Record<string, number>` (workerId → giờ). Mỗi `assign` lấy `otHoursByWorker[workerId]`.
  - Công thức OT ở `completedTasks()` + `tasksForProject()`: dùng `otMinutesOf` (kẹp 17:15) cho `overtimeMinutes`. `totalMinutes` giữ nguyên.
  - Thêm `shiftConfig()` trả `{ shiftEnd, otStart }`.
- **`tasks.controller.ts`:** `GET /tasks/shift-config` (route tĩnh, đặt cạnh `active`/`completed`). Route lưu batch hiện tại là `POST /tasks/assignments/bulk` với body `{ draft, otHours? }` → đổi body thành `{ draft, otHoursByWorker?: Record<string, number> }`.
- **`assign(taskId, workerId, otHours?)`** giữ nguyên chữ ký (assign đơn vẫn nhận số); chỉ `saveAssignments` chuyển sang map.
- Migration/entity: **không đổi** (2 cột OT đã có từ 06-18).

## Thay đổi Frontend

- **`api/tasks.ts`:** `useSaveAssignments` gửi `otHoursByWorker` (map) thay vì `otHours` đơn. Thêm `useShiftConfig()` (GET). Cập nhật nhánh mock tương ứng (dù `VITE_USE_MOCK=false`, giữ mock đồng bộ).
- **`components/kanban/OvertimeDialog.tsx`:** đổi từ 1 ô số giờ → **danh sách NV** (nhận `workers: {id, fullName, initials, avatarColor}[]`), state `Record<workerId, hours>`, validate từng ô; `onConfirm(map)`.
- **`pages/Kanban.tsx`:**
  - `handleSave`: dùng `shiftConfig` (từ `useShiftConfig`) để quyết định mở dialog thay cho `new Date().getHours() >= 17`.
  - Truyền danh sách NV distinct trong `draft` vào `OvertimeDialog`.
  - `doSave` nhận map OT.
  - Thêm badge đếm ngược tới tan ca (step 4 header/footer) + nhãn "tự về chờ lúc HH:MM" cạnh chip NV đang OT (dựa `assignment.isOvertime` + `otEndAt`).
- **`LiveTimer`/chip:** hiển thị mốc OT end nếu assignment là OT.

## Test

- **BE unit (`shift.spec.ts`):** thêm case `otMinutesOf` kẹp 17:15 (thả 17:05 làm tới 19:15 → OT = 120’ không phải 130’); parse env `SHIFT_END`/`OT_START`.
- **BE e2e (`tasks.e2e-spec.ts`):**
  - `save-assignments` với `otHoursByWorker` khác nhau/2 NV → mỗi assignment `otEndAt` đúng theo giờ riêng.
  - `GET /tasks/completed` → `overtimeMinutes` phản ánh mốc 17:15.
  - `GET /tasks/shift-config` trả đúng mốc (mặc định + khi set env).
- **FE:** `npm run build` PASS; `OvertimeDialog` render danh sách nhiều NV; badge đếm ngược render. Không thêm lỗi vitest mới (10 lỗi pre-existing bỏ qua).

## Ngoài phạm vi

- Không đổi wizard chọn site/project/quote, không đổi cột DB.
- Không đổi mô hình nháp/Lưu (D1 giữ nguyên).
- **D6:** transfer sau 17:00 không tự đánh dấu OT — để đợt sau.
- Bảng chấm công (timesheet) — module khác.

## Rủi ro

- FE cần đọc đúng tên route/hook lưu batch hiện tại (`saveAssignments`) khi refactor sang map OT — kiểm tra ở bước lập plan.
- Đổi chữ ký `saveAssignments` (số → map) là breaking cho cả BE lẫn FE + mock; phải sửa đồng bộ trong cùng đợt.
- Mốc giờ phụ thuộc timezone server (Asia/Ho_Chi_Minh). Method nhận `now`/`base` để test xác định (giữ như 06-18).
- Env `SHIFT_END`/`OT_START` sai định dạng → cần fallback an toàn về 17:00/17:15.
