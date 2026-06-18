# Gói 3 — Nhân viên (2026-06-18)

> Thuộc đợt sửa `2026-06-18-kosumi-rework-overview.md`. Tách chức vụ thành 2 nhóm (Nhân viên / Quản lý), lọc danh sách giao việc chỉ nhóm Nhân viên, KPI tổng NV vs tổng Quản lý.

## Mục tiêu (từ MEMO — phần "Nhân viên")
1. **Chức vụ 2 nhóm:**
   - **Nhóm Nhân viên** (HIỆN trong danh sách giao việc): Quản đốc, Phó quản đốc, Tổ trưởng, Tổ phó, Công nhân.
   - **Nhóm Quản lý** (ẨN khỏi danh sách giao việc): Giám đốc, Phó giám đốc, Kế toán trưởng, Kế toán viên, Thủ kho, Sale, Khác.
2. **KPI:** Tổng số nhân viên (nhóm NV) + Tổng số Quản lý (nhóm QL).

## Quyết định thiết kế
- **Master data tập trung 1 file** (gating decision): danh sách chức vụ + nhóm khai báo 1 chỗ, dùng chung cho entity/DTO/service (BE) và labels/form/KPI (FE), để sau nâng thành master-data sửa từ config/DB mà không phải đổi nhiều nơi.
  - BE: `backend/src/modules/workers/worker-positions.ts` — `STAFF_POSITIONS`, `MANAGEMENT_POSITIONS`, `ALL_POSITIONS`.
  - FE: block "WORKER POSITIONS — master" trong `types/index.ts` — `Position`, `POSITION_LABELS`, `POSITION_GROUP`, `STAFF_POSITIONS`, `MANAGEMENT_POSITIONS`, `POSITION_GROUP_LABELS`.
- **Nhóm suy ra từ chức vụ** (không thêm cột DB riêng): mỗi `position` thuộc 1 nhóm cố định trong master. Lọc giao việc & KPI dựa trên nhóm.
- **12 chức vụ mới** (value : nhãn : nhóm):
  | value | nhãn | nhóm |
  |---|---|---|
  | foreman | Quản đốc | staff |
  | deputy_foreman | Phó quản đốc | staff |
  | team_leader | Tổ trưởng | staff |
  | deputy_leader | Tổ phó | staff |
  | worker | Công nhân | staff |
  | director | Giám đốc | management |
  | deputy_director | Phó giám đốc | management |
  | chief_accountant | Kế toán trưởng | management |
  | accountant | Kế toán viên | management |
  | storekeeper | Thủ kho | management |
  | sales | Sale | management |
  | other | Khác | management |
- **Map enum cũ → mới** (migration): `team_leader→team_leader`, `senior_worker→worker`, `worker→worker`, `apprentice→worker`, `technician→worker`, `supervisor→foreman`, `other→other`.

## Phạm vi BE
- **Master** `worker-positions.ts`: 3 mảng hằng (staff/management/all). `ALL_POSITIONS` dùng cho enum entity/DTO; `STAFF_POSITIONS` dùng để lọc giao việc.
- **Migration** `1718000016000-AlterWorkersPositions`: widen (enum gồm cũ ∪ mới) → UPDATE map dữ liệu → narrow (12 giá trị mới). `down()`: map ngược best-effort (foreman→supervisor, deputy_*→…, các QL→other) → narrow về enum cũ 7 giá trị.
- `worker.entity.ts`: enum `position` → `ALL_POSITIONS`.
- `create-worker.dto.ts` + `query-worker.dto.ts`: `@IsEnum(ALL_POSITIONS)`.
- `tasks.service.ts` `availableWorkers()`: thêm lọc `position IN STAFF_POSITIONS` (chỉ nhóm NV vào danh sách giao việc).
- `schema.sql`: enum `position` 12 giá trị mới.
- (Không cần endpoint stats mới — KPI tính ở FE từ danh sách worker + nhóm.)

## Phạm vi FE
- `types/index.ts` block master: `Position` (12), `POSITION_LABELS` (12), `POSITION_GROUP: Record<Position,'staff'|'management'>`, `STAFF_POSITIONS`/`MANAGEMENT_POSITIONS: Position[]`, `POSITION_GROUP_LABELS = { staff:'Nhân viên', management:'Quản lý' }`.
- `workerFormShape.ts`: zod `position` enum 12 giá trị; default `'worker'`.
- `WorkerForm.tsx`: select chức vụ chia **2 optgroup** (Nhân viên / Quản lý) theo `STAFF_POSITIONS`/`MANAGEMENT_POSITIONS`.
- `Workers.tsx`: KPI đổi thành **Tổng nhân viên** (đếm nhóm staff) + **Tổng quản lý** (đếm nhóm management) + giữ "Đang làm việc" + "Nghỉ/Vắng" (bỏ thẻ "Hiệu suất TB —"). Filter chức vụ dùng 12 nhãn mới (có thể nhóm optgroup).
- `api/tasks.ts` `availableWorkersAtSite()`: thêm lọc `STAFF_POSITIONS` (mock khớp BE — nhóm QL không vào giao việc).
- `mocks/seed/workers.ts`: map position seed cũ→mới (senior_worker→worker, supervisor→foreman, technician→worker, apprentice→worker; team_leader/worker giữ). Thêm vài record nhóm Quản lý (vd 1 giám đốc, 1 kế toán) để demo KPI & lọc giao việc.

## Test
- BE e2e (`workers.e2e-spec.ts`): tạo worker `position='foreman'` (staff) và `position='director'` (management) → đọc lại đúng; `GET /api/tasks/available-workers` KHÔNG chứa worker `director`, CÓ chứa worker `foreman` (cùng `status='working'`).
- FE: build PASS; form có 2 optgroup; KPI hiện tổng NV vs tổng QL; mock available-workers loại nhóm QL.

## Ngoài phạm vi
- Không đổi logic hợp đồng/lương.
- Migration prod chạy lúc deploy (`migration:run`).

## Rủi ro
- Migration enum 2 bước (widen→update→narrow) phải đúng thứ tự (như Gói 2). `down()` lossy (chấp nhận, chỉ rollback dev).
- Nhiều file FE import `POSITION_LABELS`/`Position` từ `@/types` → giữ export ở `@/types` để không vỡ; build sẽ bắt chỗ tham chiếu chức vụ cũ.
