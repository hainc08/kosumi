# Spec 2 — REST API (NestJS + TypeORM)

> Phụ thuộc Spec 1 (DB). Phương án A: dựng & verify từng module.
> Cấu trúc module theo `agents/02-backend-agent.md`: `controller + service + repository + dto/ + entities/`.

## Quy ước chung

- **Base URL**: `http://localhost:3000/api` (đã set `VITE_API_BASE_URL`).
- **Envelope**: `ResponseInterceptor` bọc mọi response thành `{ data }`; list phân trang `{ data, meta:{ total, page, limit } }`.
- **FE unwrap**: axios interceptor `res => res.data.data` → hook nhận payload trần **y như `mockRequest` trả về hôm nay** → component không sửa.
- **Validation**: `class-validator` DTO + `ValidationPipe({ whitelist:true, transform:true })`.
- **Lỗi**: `HttpExceptionFilter` trả `{ statusCode, message, errors? }`, message tiếng Việt. 409 khi vướng FK, 404 "Không tìm thấy…", 400 validate.
- **Auth**: route để mở phase này; chừa sẵn `@UseGuards(JwtAuthGuard)` (guard tạm return `true`) để bật ở phase sau.
- **Soft delete**: `DELETE` set `deleted_at`; query mặc định lọc bản chưa xóa.
- **Swagger**: `/api/docs` qua `@nestjs/swagger`.

## Hạ tầng chung (làm 1 lần ở bước nền, trước module đầu tiên)

`data-source.ts` (migration CLI) · `ConfigModule` đọc `.env` · `ResponseInterceptor` · `HttpExceptionFilter` · `ColumnNumericTransformer` · `JwtAuthGuard` (tạm) · `CurrentUser` decorator · `ParseUUIDPipe` · `PayCalculatorService` (common) · Swagger setup · CORS cho `http://localhost:5173`/`5174`.

## Endpoint theo module

### Sites
- `GET /sites?search&type&status` — list, kèm `workerCount`, `projectCount`
- `GET /sites/:id`
- `POST /sites` — sinh `code` CS### trong transaction
- `PUT /sites/:id`
- `PATCH /sites/:id/status` — `{ status }`
- `DELETE /sites/:id` — 409 nếu còn worker/project

### Workers
- `GET /workers?search&siteId&status&position` — kèm `activeContract`, `initials`, `avatarColor`
- `GET /workers/:id`
- `POST /workers` — kèm contract đầu tiên (transaction), sinh `code` CN###
- `PUT /workers/:id`
- `PATCH /workers/:id/status` — `{ status }`
- `POST /workers/:id/contracts` — deactivate contract cũ → tạo active mới (transaction)
- `DELETE /workers/:id` — 409 nếu đang có assignment active

### Customers
- `GET /customers?search&type&status` — kèm `primaryContact`, các `*Count`
- `GET /customers/:id` — kèm `contacts[]` đầy đủ (dùng auto-fill báo giá)
- `POST /customers` — kèm `contacts[]` (transaction), sinh `code`
- `PUT /customers/:id` — upsert contacts
- `DELETE /customers/:id` — 409 nếu còn project/quote

### Projects
- `GET /projects?search&status&siteId&customerId` — kèm `site`, `customer`, `quoteCount`, `workerCount`
- `GET /projects/:id`
- `POST /projects` — sinh `code` PRJ###
- `PUT /projects/:id`
- `PATCH /projects/:id/status` — `{ status }`
- `DELETE /projects/:id` — 409 nếu còn quote

### Quotes
- `GET /quotes?search&status&projectId` — kèm `project`, `customer`, `totalAmount`, `itemCount`
- `GET /quotes/:id` — kèm `items[]`, `paymentSteps[]`, `subtotal/taxAmount/totalAmount/sectionCount`
- `GET /quotes/next-code` — trả mã kế tiếp (thay `peekNextQuoteCode`), field readonly trên form
- `POST /quotes` — nếu không `projectId` mà có `newProjectName` → tạo project mới (site null, type 'other', status 'planning', deadline=quoteDate+60) **trong cùng transaction**; tạo items + payment steps
- `PUT /quotes/:id`
- `PATCH /quotes/:id/status` — `{ status, rejectReason? }` (draft→pending khi "Gửi duyệt")
- `DELETE /quotes/:id`

### Tasks / Kanban
- `GET /tasks?quoteId` — task của 1 báo giá, kèm `assignments`, `activeWorkers` (port `enrichTask`)
- `GET /tasks/active` — mọi task có người làm (Transfer Drawer + bảng tổng quan)
- `GET /tasks/available-workers?siteId` — công nhân `working` & chưa bận
- `POST /tasks/:id/assign` — `{ workerId }`; task `unassigned`→`in_progress`
- `POST /tasks/:id/unassign` — `{ workerId }`; task về `unassigned` nếu hết người
- `POST /tasks/transfer` — `{ workerId, fromTaskId, toTaskId }`; kết thúc cũ → tạo mới `transferred_from_task_id`
- `POST /tasks/assignments/bulk` — `{ [taskId]: workerId[] }`; lưu phân công nháp, trả số lượt giao

### Timesheet
- `GET /timesheet/summaries?yearMonth&siteId&search` — `MonthlySummary[]` (gộp `DATE_FORMAT('%Y-%m')`)
- `GET /timesheet/months` — danh sách `YYYY-MM` có dữ liệu, mới nhất trước
- `GET /timesheet/entries?workerId&yearMonth` — chi tiết theo ngày
- `POST /timesheet/approve` — `{ workerId, yearMonth }`; set status các entry trong tháng

### Dashboard
- `GET /dashboard/stats` — KPI (số dự án/công nhân/báo giá chờ/…)
- `GET /dashboard/activity?limit=6` — timeline gộp tasks/quotes/projects, sort desc
- `GET /dashboard/workers-by-site` — phân bổ công nhân theo công trường

## Logic nghiệp vụ chốt ở service (port từ prototype, KHÔNG thêm tính năng mới)

- **Sinh mã**: count+pad trong transaction (CN###, CS###, PRJ###, `BG{year}{seq}`).
- **Quote tạo kèm dự án mới**: như `createQuoteInDb` — transaction.
- **1-active**: contract & assignment — transaction "deactivate cũ → insert active".
- **Transfer**: như `transferWorkerInDb`.
- **Pay**: `PayCalculatorService` port `timesheet-calc.ts` (piece_rate/official/probation), `pay_amount` lưu khi ghi.
- **Aggregate đọc**: COUNT/SUM QueryBuilder cho `*Count`, totals báo giá, MonthlySummary.

## Phản hồi lỗi mẫu (tiếng Việt)
```
throw new ConflictException('Công nhân đang được giao việc, không thể xóa')
throw new ConflictException('Xưởng đang có công nhân, không thể xóa')
throw new NotFoundException('Không tìm thấy báo giá')
throw new BadRequestException('Đơn giá phải lớn hơn 0')
```

## Phạm vi NGOÀI spec này
`/auth/*`, guard thật, websocket realtime, phân trang server-side bắt buộc (giữ trả mảng + meta optional) — phase sau.
