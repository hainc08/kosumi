# Gói 5 — Dự án: hoàn thành/hủy hạng mục + ai làm/thời gian Plan

> Thuộc đợt sửa `2026-06-18-kosumi-rework-overview.md`. Tái dùng `completeTask` + time-tracking của Gói 4.

**Goal:** Trong chi tiết dự án (ProjectDetailDrawer), mỗi hạng mục công việc có nút **Hoàn thành** + nút **Hủy**, và hiển thị **ai đã làm** + **thời gian đã làm** (gồm OT).

**Design (chốt):**
- BE: thêm `cancelTask(taskId)` (đóng assignment active + `status='cancelled'`) + `POST /tasks/:id/cancel`. Mở rộng `tasksForProject` để mỗi task kèm `workedBy` (distinct mọi worker từng làm), `totalMinutes`, `overtimeMinutes` (tổng thời lượng các assignment đã đóng).
- FE: `useCancelTask` + mock; `tasksForProjectDb` mock thêm aggregate; ProjectDetailDrawer thêm 2 nút + dòng "ai làm · thời gian".
- Reuse Gói 4: `completeTask`/`useCompleteTask` đã có.

## Global Constraints
- MariaDB native localhost. BE e2e: `cd backend && npx jest --config ./test/jest-e2e.json tasks`. FE gate: `cd frontend && npm run build`. Commit prefix `feat(tasks)`/`feat(projects)`, tiếng Việt. Branch `poc`, commit trực tiếp. KHÔNG migration mới (dùng cột sẵn có).

---

### Task 1: BE — `cancelTask` + endpoint + e2e
- `TasksService.cancelTask(taskId)`: như `completeTask` nhưng `status='cancelled'`.
- Controller: `@Post(':id/cancel') cancel(...) { return this.svc.cancelTask(id) }`.
- e2e (`tasks.e2e-spec.ts`): assign worker → cancel → task `status='cancelled'`, assignment đóng.
- Commit `feat(tasks): hủy hạng mục công việc (cancelTask + endpoint)`.

### Task 2: BE — `tasksForProject` kèm workedBy/totalMinutes/overtimeMinutes
- Sau khi enrich + gắn section, load TẤT CẢ assignment của các task (không chỉ active), gom theo task:
  - `workedBy`: distinct worker (mini) từ mọi assignment.
  - `totalMinutes`: Σ (endedAt-startedAt) phút các assignment đã đóng.
  - `overtimeMinutes`: Σ phút các assignment `is_overtime`.
- Trả thêm 3 field này trên mỗi task của `tasksForProject`.
- e2e: GET `/tasks?projectId=...` trả task có `workedBy`/`totalMinutes`/`overtimeMinutes`.
- Commit `feat(projects): hạng mục dự án kèm ai đã làm + thời gian (gồm OT)`.

### Task 3: FE — types + api (cancel hook + mock + aggregate mock)
- `types`: `Task += workedBy?: {id;fullName;initials;avatarColor}[]; totalMinutes?: number; overtimeMinutes?: number`.
- `api/tasks.ts`: `cancelTaskInDb(taskId)`; `useCancelTask`; mở rộng `tasksForProjectDb` để thêm workedBy/totalMinutes/overtimeMinutes (từ db.taskAssignments của task).
- Build PASS.
- Commit `feat(tasks): FE cancel hạng mục + aggregate ai làm/thời gian (api+mock)`.

### Task 4: FE — ProjectDetailDrawer 2 nút + ai làm/thời gian
- Mỗi `pd-task`: nếu status ∈ {unassigned,in_progress,paused} → nút **Hoàn thành** (useCompleteTask) + **Hủy** (useCancelTask).
- Hiển thị `workedBy` (avatars) + thời gian `fmt(totalMinutes)` (+OT nếu có) thay cho/đi kèm activeWorkers.
- Build PASS.
- Commit `feat(projects): nút hoàn thành/hủy + hiển thị ai làm/thời gian trong chi tiết dự án`.

## Kiểm thử tổng
- BE: `npx jest --config ./test/jest-e2e.json tasks` PASS. FE: `npm run build` OK, vitest không fail mới.
- Rebuild deploy bundle cuối.
