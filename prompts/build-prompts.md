# WorkShop Pro — Prompt Library
# File: prompts/build-prompts.md
# Copy-paste these prompts into Google Agentspace to generate code

## Cách dùng
1. Mở Google Agentspace
2. Upload các file trong /context/ và /design/ vào Knowledge Base của agent
3. Copy prompt bên dưới, paste vào chat → agent sẽ generate code

---

## PROMPT 01 — Scaffold dự án React

```
Dựa vào context/project-context.md, design/tokens.css và design/component-library.md,
hãy scaffold cấu trúc dự án React 18 + TypeScript + Vite cho WorkShop Pro:

1. Tạo package.json với các dependencies:
   - react, react-dom, typescript
   - @tanstack/react-query
   - zustand
   - @hello-pangea/dnd             ← dùng thay react-beautiful-dnd (maintained fork)
   - @tabler/icons-react
   - (Styling = Vanilla CSS thuần, không cần Tailwind. autoprefixer + postcss tuỳ chọn)
   - axios
   - date-fns
   - exceljs (for Excel export)
   - react-router-dom              ← routing
   - react-hook-form               ← form management
   - zod + @hookform/resolvers     ← schema validation

2. Tạo vite.config.ts với path alias @/ → src/

3. Tạo src/main.tsx, src/App.tsx với React Query provider và BrowserRouter

4. Tạo src/lib/axios.ts với base URL và JWT interceptor:
   - Request interceptor: đọc token từ localStorage → attach Authorization header
   - Response interceptor: handle 401 → clear token → redirect /login

5. Tạo src/router/routes.tsx với React Router v6:
   - /login → LoginPage (public, không cần auth)
   - / → redirect to /dashboard
   - Wrap protected routes bằng AuthGuard (check token, redirect /login nếu chưa đăng nhập)
   - Routes: /dashboard | /customers | /sites | /workers | /projects | /quotes | /assign | /timesheet | /report

6. Tạo toàn bộ cấu trúc folder theo component-library.md

Output: tất cả files dưới dạng code blocks với path comment ở đầu mỗi file.
```

---

## PROMPT 02 — UI Components cơ bản

```
Dựa vào design/design-system.md và design/tokens.css,
generate các shared UI components sau (mỗi file riêng biệt):

1. src/components/ui/Badge.tsx — variants: green, blue, amber, red, purple, gray
2. src/components/ui/Button.tsx — variants: primary, default, danger; sizes: md, sm
3. src/components/ui/KpiCard.tsx — label, value, icon, change, changeType
4. src/components/ui/ProgressBar.tsx — value 0-100, color, optional label
5. src/components/ui/SearchBox.tsx — controlled input with search icon
6. src/components/ui/DataTable.tsx — generic with Column<T>, loading skeleton, empty state
7. src/components/ui/FormModal.tsx — open, title, size, footer slot, onSubmit
8. src/components/ui/DetailDrawer.tsx — open, width sm/md, actions slot
9. src/components/ui/Toast.tsx — global toast via useToastStore (zustand)
10. src/components/ui/ConfirmDialog.tsx — danger/default variant

Rules:
- Styling = Vanilla CSS: mỗi component 1 file .css đi kèm (BEM nhẹ), không inline style theming
- Dùng CSS variables từ design/tokens.css (không hardcode hex)
- TypeScript với đầy đủ interface types
- Vietnamese text cho aria-labels
```

---

## PROMPT 03 — Layout Shell

```
Generate layout components cho WorkShop Pro dựa trên design/design-system.md:

1. src/components/layout/AppShell.tsx
   - Sidebar 220px (collapsible → 56px)
   - Main area flex-1
   - Topbar 52px fixed
   - Smooth collapse animation

2. src/components/layout/Sidebar.tsx  
   - Navigation items với icons (Tabler)
   - Active state = blue background
   - Collapse: show icons only, hide text
   - User info at bottom
   - Badge count trên Workers nav item

3. src/components/layout/Topbar.tsx
   - Page title + subtitle
   - Search, Bell icons
   - User chip with dropdown placeholder

Module list:
- dashboard: Dashboard, Tổng quan hôm nay
- customers: Khách hàng, Quản lý đối tác
- sites: Công trường / Xưởng, Quản lý địa điểm
- workers: Quản lý công nhân, Nhân sự xưởng
- projects: Quản lý dự án, Theo dõi tiến độ
- quotes: Quản lý báo giá, Báo giá và đơn đặt hàng
- assign: Giao việc Kanban, Phân công hàng ngày
- timesheet: Chấm công, Theo dõi giờ công
- report: Báo cáo hiệu suất, Thống kê
```

---

## PROMPT 04 — Module Workers (đầy đủ)

```
Generate toàn bộ module Công nhân cho WorkShop Pro.
Load context: context/project-context.md, context/types.ts, design/design-system.md

Files cần generate:

1. src/types/worker.ts (đã có trong context/types.ts, copy sang)

2. src/api/workers.ts
   - useWorkers(filters) → GET /workers
   - useWorker(id) → GET /workers/:id
   - useCreateWorker() → POST /workers
   - useUpdateWorker() → PUT /workers/:id
   - useUpdateWorkerStatus() → PATCH /workers/:id/status
   - useAddContract() → POST /workers/:id/contracts

3. src/components/workers/WorkerContractSection.tsx
   - Dynamic fields theo contractType (hourly/daily/monthly/piece)
   - Live pay estimator (updates khi nhập đơn giá) — import calculatePay từ @/utils/pay-calculator
   - OT rate default = normal * 1.5

4. src/components/workers/WorkerForm.tsx
   - Create + Edit mode
   - Dùng WorkerContractSection
   - Validation với react-hook-form + zod schema
   - Submit qua useCreateWorker / useUpdateWorker

5. src/components/workers/WorkerDetailDrawer.tsx
   - Profile info
   - Active contract summary  
   - Tháng công hiện tại (mini table)
   - Nút "Chỉnh sửa", "Đổi hợp đồng"

6. src/pages/Workers.tsx
   - KPI cards: Tổng / Đang làm / Nghỉ / Hiệu suất TB
   - Bảng với cột: Công nhân | Kỹ năng | KN | Xưởng | Loại HĐ | Đơn giá/h | Trạng thái | Hiệu suất
   - Filter: xưởng, trạng thái
   - Search: tên, kỹ năng
   - Row click → WorkerDetailDrawer
   - Button Thêm → WorkerForm modal
```

---

## PROMPT 05 — Module Báo giá (đầy đủ)

```
Generate module Quản lý Báo giá cho WorkShop Pro.
Load: context/types.ts, context/project-context.md

Files:
1. src/api/quotes.ts (useQuotes, useQuote, useCreateQuote, useUpdateQuoteItems, useChangeQuoteStatus)
2. src/components/quotes/QuoteItemsEditor.tsx
   - Thêm/xóa/sắp xếp hạng mục
   - Auto-calculate amount = quantity × unitPrice
   - Footer: Subtotal + VAT 8% (mặc định, config được) + Total
   - Live update

3. src/components/quotes/QuoteForm.tsx (create + edit)
4. src/components/quotes/QuoteDetailDrawer.tsx (view chi tiết + approve/reject actions)
5. src/pages/Quotes.tsx (danh sách, KPI cards, filter theo status)

Lưu ý: 
- Badge colors theo QUOTE_STATUS_LABELS từ types.ts. 
- Bọc các nút "Phê duyệt", "Từ chối" trong `<RequireRole allowedRoles={['manager', 'admin']}>`.
```

---

## PROMPT 06 — Module Kanban (đầy đủ)

```
Generate Kanban Board module cho WorkShop Pro.
Load: context/project-context.md, context/types.ts, agents/05-kanban-agent.md

Files:
1. src/stores/kanbanStore.ts (zustand — full state machine từ agents/05-kanban-agent.md)
2. src/api/tasks.ts (useBoardData, useAssignWorker, useTransferWorker, useMoveTask)
3. src/components/kanban/StepWizard.tsx (4 bước: site → project → quote → board)
4. src/components/kanban/WorkerPanel.tsx (left panel, draggable workers)
5. src/components/kanban/KanbanColumn.tsx (droppable, 5 columns)
6. src/components/kanban/KanbanTaskCard.tsx (draggable, worker chips)
7. src/components/kanban/WorkerChip.tsx (avatar + name + transfer btn + remove btn)
8. src/components/kanban/TransferDrawer.tsx (3-tab drawer: site/project-quote/task → confirm)
9. src/pages/Kanban.tsx (assembles everything, connects to store)

Drag-drop: @hello-pangea/dnd
Workers draggable FROM panel, droppable ON task cards
Tasks draggable between columns (reorder status)

Business Rules bổ sung:
- Thẻ công nhân: Hiển thị bộ đếm giờ (Live timer: HH:mm:ss) thực tế đang làm.
- Logic 17:00: Hệ thống tự động reset bộ đếm vào lúc 17:00 hằng ngày. Các phân công giao sau 17:00 tự động gắn nhãn "Tăng ca" (OT).
```

---

## PROMPT 07 — Module Chấm công

```
Generate module Chấm công dựa trên context/types.ts và agents/06-timesheet-agent.md

Files:
1. src/api/timesheet.ts
2. src/utils/pay-calculator.ts — copy từ skills/pay-calculator.skill.ts, thêm:
   - formatPay(amount: number): string → Intl.NumberFormat('vi-VN', { currency: 'VND' })
   - formatHours(h: number): string → "8h 30m"
3. src/components/timesheet/TimesheetTable.tsx
   - Bảng: Công nhân | Xưởng | Ngày công | Giờ thường | Giờ OT | Đơn giá | Thành tiền | Trạng thái
   - Row color: approved=green, pending=amber, absent=red
   - Inline edit giờ OT
   - Bulk select + approve
4. src/pages/Timesheet.tsx
   - Month picker
   - KPI row: Tổng giờ | Ngày công TB | Vắng | Giờ OT
   - TimesheetTable
   - Nút "Tạo từ giao việc" (gọi /generate)
   - Nút "Xuất Excel" (dùng exceljs)
   - Bọc nút "Phê duyệt" bảng công trong `<RequireRole allowedRoles={['manager', 'admin']}>`.
```

---

## PROMPT 08 — Backend: Workers module (NestJS)

```
Generate NestJS module cho Workers theo agents/02-backend-agent.md và agents/03-database-agent.md.

Files:
1. Migration: CreateWorkers + CreateWorkerContracts (TypeORM migration format)
2. Entities: worker.entity.ts, worker-contract.entity.ts
3. DTOs: create-worker.dto.ts, update-worker.dto.ts, create-contract.dto.ts, query-worker.dto.ts
4. workers.repository.ts (custom queries)
5. workers.service.ts (với transaction logic cho create + addContract)
6. workers.controller.ts (tất cả endpoints từ spec)
7. workers.module.ts

Business rules bắt buộc:
- Tự sinh code CN001, CN002...
- Transaction khi tạo worker + contract
- Deactivate old contract khi add new contract
- Soft delete với check FK (task assignments, timesheet)
- Error messages tiếng Việt
- Tích hợp Swagger UI (@nestjs/swagger) và viết decorator document đầy đủ cho các endpoint, DTO
```

---

## PROMPT 09 — Backend: Tasks + Assignments (NestJS)

```
Generate Kanban backend module theo context/project-context.md:

Files:
1. Migration: CreateTasks, CreateTaskAssignments
2. task.entity.ts, task-assignment.entity.ts
3. tasks.service.ts với các methods:
   - getBoardData(siteId, projectId, quoteId, date): grouped by status
   - assignWorker(taskId, workerId): transaction, ends active assignment if worker busy
   - unassignWorker(taskId, workerId)
   - transferWorker(fromTaskId, toTaskId, workerId)
   - moveTask(taskId, newStatus)
   - createFromQuote(quoteId): bulk create tasks từ quote items
4. tasks.controller.ts
5. kanban.gateway.ts (Socket.io gateway, broadcast events to room)

Critical: UNIQUE PARTIAL INDEX on task_assignments(worker_id) WHERE is_active = TRUE
- Tích hợp Swagger UI (@nestjs/swagger) và viết decorator document đầy đủ cho các endpoint, DTO
```

---

## PROMPT 10 — Dashboard + Reports

```
Generate Dashboard và Reports pages:

1. src/api/dashboard.ts (useDashboardKpis, useRecentActivity, useSiteUtilization)
2. src/api/reports.ts (useProductivityReport, useProjectProgress, useLaborCost)
3. src/pages/Dashboard.tsx
   - KPI row: Sites active | Workers today | Projects | Quotes this month
   - Recent activity timeline (last 5 events)
   - Worker distribution by site (progress bars)
   - Project status summary (2×2 grid mini stats)

4. src/pages/Report.tsx
   - KPI row: Revenue | Tasks completed | Efficiency | QC rate
   - Top workers efficiency table
   - Project progress bars
   - Month/quarter filter
```

---

## PROMPT 11 — Module Sites (Công trường)

```
Generate module Quản lý Sites cho WorkShop Pro.
Load: context/project-context.md, context/types.ts, design/design-system.md

Files:
1. src/api/sites.ts
   - useSites(filters?) → GET /sites
   - useSite(id) → GET /sites/:id
   - useCreateSite() → POST /sites
   - useUpdateSite() → PUT /sites/:id
   - useDeactivateSite() → PATCH /sites/:id/status

2. src/components/sites/SiteForm.tsx
   - Create + Edit mode
   - Fields: tên xưởng, địa chỉ, loại (metal/furniture/other), capacity (số công nhân tối đa)
   - Validation với react-hook-form + zod

3. src/components/sites/SiteDetailDrawer.tsx
   - Thông tin xưởng
   - Workers hiện tại (count + mini list)
   - Projects đang chạy (count)
   - Nút "Chỉnh sửa"

4. src/pages/Sites.tsx
   - KPI cards: Tổng xưởng | Đang hoạt động | Tổng công nhân | Công suất TB
   - Grid cards hiển thị từng xưởng (tên, địa chỉ, worker count, capacity bar)
   - Filter: loại xưởng, trạng thái
   - Click card → SiteDetailDrawer
   - Nút Thêm → SiteForm modal
```

---

## PROMPT 12 — Module Projects (Dự án)

```
Generate module Quản lý Projects cho WorkShop Pro.
Load: context/project-context.md, context/types.ts, design/design-system.md

Files:
1. src/api/projects.ts
   - useProjects(filters?) → GET /projects
   - useProject(id) → GET /projects/:id
   - useCreateProject() → POST /projects
   - useUpdateProject() → PUT /projects/:id
   - useUpdateProjectStatus() → PATCH /projects/:id/status

2. src/components/projects/ProjectForm.tsx
   - Fields: tên dự án, xưởng (select Site), khách hàng, ngày bắt đầu, ngày dự kiến hoàn thành, mô tả
   - Validation với react-hook-form + zod

3. src/components/projects/ProjectDetailDrawer.tsx
   - Thông tin dự án + tiến độ (progress bar)
   - Danh sách Quotes (mini table: tên, giá trị, trạng thái)
   - Tasks summary (tổng / hoàn thành / đang làm)
   - Nút "Chỉnh sửa", "Tạo báo giá"

4. src/pages/Projects.tsx
   - KPI cards: Tổng dự án | Đang thi công | Hoàn thành | Giá trị tháng này
   - Bảng: Dự án | Khách hàng | Xưởng | Tiến độ | Ngày kết thúc | Trạng thái
   - Filter: xưởng, trạng thái
   - Row click → ProjectDetailDrawer
   - Nút Thêm → ProjectForm modal
```

---

## PROMPT 13 — Auth: Login + AuthGuard

```
Generate Auth module cho WorkShop Pro frontend.
Load: context/project-context.md (phần Auth)

Files:
1. src/stores/authStore.ts (zustand)
   - State: user, token, isAuthenticated
   - Actions: login(token, user), logout(), setToken(token)
   - Persist token vào localStorage

2. src/lib/axios.ts (update interceptors)
   - Request: lấy token từ authStore → Authorization header
   - Response 401: gọi authStore.logout() → navigate('/login')

3. src/components/auth/AuthGuard.tsx
   - Check isAuthenticated từ authStore
   - Nếu chưa đăng nhập → <Navigate to="/login" replace />
   - Nếu đã đăng nhập → render children

4. src/components/auth/RequireRole.tsx
   - Component nhận prop `allowedRoles: string[]`
   - Check role của current user. Nếu hợp lệ → render children, nếu không → return null.

5. src/api/auth.ts
   - useLogin() → POST /auth/login → { token, user }
   - useLogout() → POST /auth/logout
   - useMe() → GET /auth/me (fetch current user info)

5. src/pages/Login.tsx
   - Form: email + password
   - Validation với react-hook-form + zod
   - Submit qua useLogin → lưu token → navigate('/dashboard')
   - Error state hiển thị message từ API
   - UI: centered card, logo WorkShop Pro, nền light gray
```

---

## PROMPT 14 — Backend: Auth Module (NestJS)

```
Generate NestJS Auth module theo context/project-context.md và agents/02-backend-agent.md.

Files:
1. Migration: CreateUsers table
2. user.entity.ts (id, email, passwordHash, name, role: admin|manager, createdAt)
3. dto/login.dto.ts, dto/user-response.dto.ts
4. auth.service.ts:
   - login(email, password): validate → generate JWT + refresh token
   - refreshToken(refreshToken): verify → issue new JWT
   - logout(userId): invalidate refresh token
5. auth.controller.ts:
   - POST /auth/login
   - POST /auth/refresh
   - POST /auth/logout
   - GET /auth/me (JwtAuthGuard)
6. jwt.strategy.ts + jwt-auth.guard.ts
7. auth.module.ts

Rules:
- Password hashing: bcrypt (saltRounds=12)
- JWT expires: 8h (env: JWT_EXPIRES_IN)
- Refresh token: httpOnly cookie, 30d
- Error messages tiếng Việt
- Swagger decorators đầy đủ
```

---

## PROMPT 15 — Backend: Quotes Module (NestJS)

```
Generate NestJS Quotes module theo agents/02-backend-agent.md và agents/03-database-agent.md.

Files:
1. Migration: CreateQuotes + CreateQuoteItems
2. quote.entity.ts, quote-item.entity.ts
3. DTOs: create-quote.dto.ts, update-quote.dto.ts, update-quote-status.dto.ts, create-quote-item.dto.ts
4. quotes.service.ts:
   - findAll(filters): paginated list
   - findOne(id): với items
   - create(dto): auto-generate quote number (QT001, QT002...)
   - updateItems(id, items[]): replace all items, recalculate totals
   - changeStatus(id, status): validate state machine (draft→sent→approved/rejected)
   - createTasksFromQuote(id): bulk tạo Tasks từ QuoteItems (gọi sang TasksModule)
5. quotes.controller.ts + quotes.module.ts

Business rules:
- Tổng tiền = sum(quantity × unitPrice), VAT 8% (mặc định, override per quote), stored separately
- Chỉ approve/reject quote ở trạng thái 'sent'
- Swagger decorators đầy đủ
```

---

## PROMPT 16 — Backend: Timesheet Module (NestJS)

```
Generate NestJS Timesheet module theo agents/02-backend-agent.md.

Files:
1. Migration: CreateTimesheetEntries
2. timesheet-entry.entity.ts
3. DTOs: query-timesheet.dto.ts, update-timesheet-entry.dto.ts, approve-bulk.dto.ts
4. timesheet.service.ts:
   - findAll(month, filters): grouped by worker
   - generateFromAssignments(month, siteId?): tạo entries từ TaskAssignments trong tháng
     Logic: regularHours = min(totalHours, 8), overtimeHours = max(0, totalHours - 8)
     Pay snapshot từ WorkerContract active tại thời điểm đó
   - approve(id): status → approved
   - bulkApprove(ids[]): batch approve
   - exportExcel(month, siteId?): trả về buffer Excel (dùng exceljs)
5. timesheet.controller.ts + timesheet.module.ts

Swagger decorators đầy đủ
```

---

## PROMPT 17 — Backend: Sites + Projects Modules (NestJS)

```
Generate NestJS Sites và Projects modules theo agents/02-backend-agent.md và agents/03-database-agent.md.

SITES Module:
1. Migration: CreateSites
2. site.entity.ts (id, name, address, type, capacity, status, deletedAt)
3. DTOs: create-site.dto.ts, update-site.dto.ts, query-site.dto.ts
4. sites.service.ts: findAll, findOne, create, update, deactivate (soft)
5. sites.controller.ts + sites.module.ts

PROJECTS Module:
1. Migration: CreateProjects
2. project.entity.ts (id, siteId, name, customer, startDate, endDate, status, deletedAt)
3. DTOs: create-project.dto.ts, update-project.dto.ts, query-project.dto.ts
4. projects.service.ts: findAll (với quote count, task progress), findOne, create, update, updateStatus
5. projects.controller.ts + projects.module.ts

Cả 2 modules:
- Soft delete với deletedAt
- Error messages tiếng Việt
- Swagger decorators đầy đủ
```

---

## PROMPT 18 — Module Khách hàng (Frontend)

```
Generate module Quản lý Khách hàng (Customers) cho WorkShop Pro.
Load: context/project-context.md, context/types.ts, design/design-system.md

Files:
1. src/api/customers.ts
   - useCustomers(filters?) → GET /customers
   - useCustomer(id) → GET /customers/:id
   - useCreateCustomer() → POST /customers
   - useUpdateCustomer() → PUT /customers/:id

2. src/components/customers/CustomerForm.tsx
   - Create + Edit mode
   - Fields: Tên khách hàng, mã số thuế, người liên hệ, số điện thoại, email, địa chỉ, loại (individual/company)
   - Validation với react-hook-form + zod

3. src/components/customers/CustomerDetailDrawer.tsx
   - Thông tin doanh nghiệp/cá nhân, thông tin liên hệ.
   - Nút "Chỉnh sửa"

4. src/pages/Customers.tsx
   - KPI cards: Tổng số khách hàng | Khách hàng mới tháng này
   - Bảng: Mã KH | Tên | Mã số thuế | Người liên hệ | Điện thoại
   - Filter: Loại khách hàng
   - Row click → CustomerDetailDrawer
   - Nút Thêm → CustomerForm modal
```

---

## PROMPT 19 — Backend: Customers Module (NestJS)

```
Generate NestJS Customers module theo agents/02-backend-agent.md và agents/03-database-agent.md.

Files:
1. Migration: CreateCustomers
2. customer.entity.ts (id, code, name, taxCode, address, contactPerson, phone, email, type, status, deletedAt)
3. DTOs: create-customer.dto.ts, update-customer.dto.ts, query-customer.dto.ts
4. customers.service.ts: findAll, findOne, create (tự sinh mã CUST001), update
5. customers.controller.ts + customers.module.ts

Rules:
- Soft delete với deletedAt
- Error messages tiếng Việt
- Swagger decorators đầy đủ
```

---

## PROMPT 20 — Backend: Dashboard & Reports (NestJS)

```
Generate NestJS Dashboard/Reports module theo agents/02-backend-agent.md.

Files:
1. dashboard.service.ts
   - getKpis(): Tổng xưởng hoạt động, Tổng công nhân đang làm (từ worker.status), Số dự án đang chạy, Số báo giá tháng này.
   - getRecentActivity(): Lấy 5 task assignments hoặc quotes mới nhất.
   - getSiteUtilization(): Đếm số workers đang ở từng xưởng so với capacity.
2. dashboard.controller.ts + dashboard.module.ts

3. reports.service.ts
   - getProductivityReport(month)
   - getProjectProgress()
   - getLaborCost(month)
4. reports.controller.ts + reports.module.ts

Rules:
- Dùng query builder (TypeORM) để group by và tính toán.
- Swagger decorators đầy đủ
```

---

## Ghi chú khi dùng với Agentspace

1. **Upload vào Knowledge Base** (1 lần): tất cả files trong /context/ và /design/
2. **Upload thêm agent files** tùy prompt:
   - Frontend prompts (01-07, 10-13, 18): upload agents/01-ui-agent.md
   - Backend prompts (08-09, 14-17, 19, 20): upload agents/02-backend-agent.md + agents/03-database-agent.md
   - Kanban (06): upload thêm agents/05-kanban-agent.md
   - Timesheet (07, 16): upload thêm agents/06-timesheet-agent.md
3. **Prompt theo thứ tự**: 01 → 02 → 03 → 13 (Auth) → 18 (Customers) → 04 → 05 → 06 → 07 → 10 → 11 → 12
   - Auth (PROMPT 13) nên chạy ngay sau Layout để AuthGuard có sẵn
4. **Backend chạy riêng**: 14 → 19 (Customers) → 17 → 08 → 09 → 15 → 16 → 20 (Dashboard/Reports)
5. **Sau mỗi prompt**: review code, adjust nếu cần, lưu vào project
6. **Prompt 06 (Kanban)** là phức tạp nhất — có thể tách thành 2 phần: store+api trước, components sau
7. **skills/ folder**: skills/pay-calculator.skill.ts và skills/api-client.skill.ts là reference implementations — upload vào Knowledge Base nếu muốn agent dùng làm nền tảng
