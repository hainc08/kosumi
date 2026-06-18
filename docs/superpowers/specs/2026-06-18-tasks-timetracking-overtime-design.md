# Gói 4 — Giao việc: tính giờ + tăng ca + danh sách hoàn thành (2026-06-18)

> Thuộc đợt sửa `2026-06-18-kosumi-rework-overview.md`. Gói NẶNG nhất. Tính giờ làm theo ca, tự tan ca 17:00, tăng ca có dialog, và danh sách hạng mục đã hoàn thành (ai làm/bao lâu/OT).

## Mục tiêu (từ MEMO — phần "Giao việc")
1. Kéo NV vào việc → **bắt đầu đếm giờ** (đã có: `assignment.startedAt`).
2. **Chuyển việc** → kết thúc giờ việc cũ, bắt đầu tính việc mới (đã có: `transfer()`).
3. **17:00 tự động tan ca**: kết thúc toàn bộ assignment đang active (ca thường), NV về *chờ giao việc*.
4. **Giao việc sau 17:00 = tăng ca**: hiện **dialog nhập số giờ OT**. Giờ OT tính **từ 17:15**; nhập **N** giờ → tự trả NV về *chờ* lúc **17:15 + N** (vd 2h → 19:15).
5. **Danh sách hạng mục đã hoàn thành**: ai đã làm, tổng thời gian, có OT thì cộng thêm.

## Quyết định thiết kế (chốt)
- **D1 — Mốc OT:** OT bắt đầu **17:15**, kết thúc **17:15 + N giờ** (neo cố định ở 17:15, đúng như "2h→19:15"). Hằng số: `SHIFT_END=17:00`, `OT_START=17:15`.
- **D2 — Điều kiện tăng ca:** giao việc khi giờ hiện tại **≥ 17:00** ⇒ tăng ca (FE hiện dialog nhập giờ). Khoảng 17:00–17:15 không tính (nghỉ giải lao); OT luôn tính từ 17:15.
- **D3 — Cơ chế tự động (KHÔNG thêm dependency):** provider `ShiftScheduler` (NestJS `OnModuleInit`) chạy `setInterval` mỗi 60s, gọi: (a) `endOfShiftClockOut()` khi vượt mốc 17:00, (b) `sweepExpiredOvertime()` để đóng block OT tới hạn. **Toàn bộ logic nằm trong method service** (nhận `now` để test trực tiếp); scheduler chỉ là vỏ gọi. Kèm endpoint `POST /tasks/clock-out` để quản lý tan ca thủ công (và để e2e test).
- **D4 — "Hoàn thành hạng mục"** thêm ở Gói này (nút trong Kanban) → kết thúc assignment active + set `status='completed'`. Tái dùng cho Gói 5 (màn Dự án).

## Data model (TaskAssignment thêm cột)
- `is_overtime BOOLEAN NOT NULL DEFAULT false` — assignment này là tăng ca.
- `ot_end_at DATETIME NULL` — thời điểm tự kết thúc OT (= 17:15 + N giờ theo ngày giao).
- (Thời lượng = `endedAt - startedAt`; OT = các assignment `is_overtime`. Không cần cột duration.)
- Migration `1718000017000-AlterTaskAssignmentsOvertime`.

## Phạm vi BE (`tasks` module)
- **Service methods (test trực tiếp, inject `now`):**
  - `assign(taskId, workerId, otHours?)`: nếu có `otHours` (FE gửi khi sau 17:00) ⇒ `is_overtime=true`, `ot_end_at = hôm nay 17:15 + otHours giờ`; ngược lại assign thường (giữ logic cũ).
  - `endOfShiftClockOut(now)`: kết thúc mọi assignment active **không phải OT** (`endedAt=now`, `isActive=false`); task không còn active → `status='unassigned'`. Trả số lượt.
  - `sweepExpiredOvertime(now)`: kết thúc assignment active `is_overtime` có `ot_end_at <= now`; cập nhật task.
  - `completeTask(taskId)`: kết thúc assignment active + `status='completed'`.
  - `completedTasks()`: trả task `status='completed'` kèm `workers` (distinct ai đã làm), `totalMinutes` (Σ thời lượng), `overtimeMinutes` (Σ thời lượng assignment OT).
- **Scheduler** `ShiftScheduler` (provider, `OnModuleInit`/`OnModuleDestroy`): `setInterval(60s)`. Mỗi tick: `sweepExpiredOvertime(now)`; nếu phát hiện vừa qua mốc 17:00 (so `lastTickDate`) → `endOfShiftClockOut(now)`. Đăng ký trong `TasksModule` providers.
- **Endpoints (controller):**
  - `POST /tasks/clock-out` → `endOfShiftClockOut(new Date())` (tan ca thủ công + test).
  - `POST /tasks/:id/complete` → `completeTask`.
  - `GET /tasks/completed` → `completedTasks`.
  - `POST /tasks/:id/assign` mở rộng: `AssignWorkerDto += otHours?: number`.
- **Entity/migration/schema.sql** cập nhật 2 cột mới.

## Phạm vi FE
- `types/index.ts`: `TaskAssignment += isOvertime: boolean; otEndAt?: string | null`. Type `CompletedTaskRow` cho danh sách hoàn thành.
- `api/tasks.ts` (mock + http):
  - `assign` nhận `otHours?`; mock set `isOvertime`/`otEndAt`.
  - Mock `endOfShiftClockOut`/`sweepExpiredOvertime`/`completeTask`/`completedTasks` (đồng bộ hành vi BE để chế độ mock chạy được).
  - Hook `useCompleteTask`, `useCompletedTasks`, `useClockOut`.
- `Kanban.tsx`:
  - Khi bấm "Lưu giao việc" mà giờ hiện tại **≥ 17:00** → hiện **dialog nhập số giờ OT** (1 lần cho cả batch), gửi `otHours` kèm.
  - Mỗi hạng mục thêm nút **"Hoàn thành"** (gọi completeTask).
  - Thêm **panel "Hạng mục đã hoàn thành"** (toggle/section) hiển thị: tên hạng mục, ai làm, tổng thời gian, OT (nếu có).
  - Nút **"Tan ca"** (gọi clock-out) cho quản lý (tùy chọn, đặt ở footer step 4).
- `components/kanban/`: dialog OT (`OvertimeDialog`), component danh sách hoàn thành (`CompletedTasksPanel`).

## Test
- BE e2e (`tasks.e2e-spec.ts`): 
  - `assign` với `otHours=2` → assignment `is_overtime=true`, `ot_end_at` = 17:15+2h cùng ngày.
  - `endOfShiftClockOut` kết thúc assignment thường, KHÔNG đụng assignment OT.
  - `sweepExpiredOvertime` với `now > ot_end_at` → kết thúc OT.
  - `completeTask` → task `completed`, assignment đóng.
  - `GET /tasks/completed` trả worker + totalMinutes + overtimeMinutes.
- FE: build PASS; dialog OT hiện khi giờ ≥17:00; panel hoàn thành render.

## Ngoài phạm vi
- Không đổi wizard chọn site/project/quote.
- Bảng chấm công (timesheet) — gói khác.

## Rủi ro
- Scheduler `setInterval` trong 1 instance (POC OK); nếu chạy nhiều instance sẽ trùng — chấp nhận cho POC.
- Logic mốc giờ phụ thuộc giờ server (Asia/Ho_Chi_Minh). Method nhận `now` để test xác định.
- FE mock phải đồng bộ hành vi với BE để demo nhất quán (đã đưa vào phạm vi).
