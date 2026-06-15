# WorkShop Pro — Prototype Design Spec

**Date:** 2026-06-14
**Status:** Approved (design) — pending implementation plan
**Scope:** Frontend prototype with in-code mock data. NO backend / DB / real API.

---

## 1. Mục tiêu & ranh giới

**Mục tiêu:** App React chạy được, đầy đủ UX của **6 module core**, dùng **mock data trong code**, để stakeholder review trọn vẹn luồng nghiệp vụ **trước khi** dựng database và ghép API thật.

**Trong phạm vi:**
- App Shell (Module 0: Sidebar + Topbar + Toast)
- Bộ UI components dùng chung
- 6 module core: Công nhân, Khách hàng, Dự án, Báo giá (+ Preview A4), Kanban, Chấm công
- Mock data đầy đủ cho mọi entity (gồm `sites` dù chưa có trang Sites riêng, vì Workers/Projects tham chiếu `siteId`)

**Ngoài phạm vi (làm sau):**
- Backend NestJS, MariaDB, migrations
- Auth thật (JWT), RBAC enforcement thật
- Realtime Kanban (WebSocket) — prototype không cần polling thật
- Module Dashboard (1), Sites (2), Report (9) — hiển thị nav item dạng placeholder "Đang phát triển"
- Export Excel/PDF thật (prototype có thể stub nút, hoặc export client-side bằng exceljs nếu nhanh)

---

## 2. Tech Stack (đã chốt)

| Lớp | Lựa chọn |
|-----|----------|
| Framework | React 18 + TypeScript |
| Build/dev | Vite 5 |
| Styling | **Vanilla CSS** — `design/tokens.css` (CSS variables) + 1 file `.css` per component (BEM nhẹ). Không Tailwind. |
| Server state | @tanstack/react-query v5 |
| UI/global state | zustand (sidebar, toast, kanban selection) |
| Routing | react-router-dom v6 |
| Forms | react-hook-form + zod + @hookform/resolvers |
| Drag-drop | @hello-pangea/dnd |
| Icons | @tabler/icons-react (outline) |
| Utils | date-fns (ngày), exceljs (export — optional ở prototype) |

> Lưu ý: spec gốc (`workshop_pro_spec.md`) và `context/tech-stack.md` đã được đồng bộ về stack này. SQL trong spec viết theo PostgreSQL-isms — chỉ liên quan phase DB, không ảnh hưởng prototype.

---

## 3. Kiến trúc Mock Data (mấu chốt)

Mục tiêu thiết kế: **đổi từ mock sang API thật chỉ cần sửa ruột `src/api/*.ts`, không đụng component.**

```
src/mocks/
  db.ts            # in-memory store: các mảng dữ liệu (mutable) cho mọi entity
  seed/
    sites.ts
    workers.ts     # kèm worker_contracts
    customers.ts   # kèm customer_contacts
    projects.ts
    quotes.ts      # kèm quote_items, quote_payment_steps
    tasks.ts       # kèm task_assignments
    timesheet.ts

src/api/
  client.ts        # mockRequest<T>(resolver: () => T, delayMs = 300): Promise<T>
                   #   — giả lập latency mạng; sau này thay bằng axios instance
  customers.ts     # useCustomers(), useCustomer(id), useCreateCustomer(), ...
  sites.ts         # useSites() (đọc-only, phục vụ dropdown)
  workers.ts
  projects.ts
  quotes.ts
  tasks.ts
  timesheet.ts
```

**Nguyên tắc:**
- Mỗi hook trả `useQuery`/`useMutation` của React Query — đúng signature như khi có API thật.
- `queryFn`/`mutationFn` gọi `mockRequest(() => <đọc/ghi vào db.ts>)`.
- **Mutations sửa thẳng store in-memory** (push/splice/gán) rồi `queryClient.invalidateQueries` → UI cập nhật ngay → prototype "sống" để review luồng tạo/sửa/duyệt/chuyển việc thật.
- Dữ liệu seed: tiếng Việt thực tế, ≈10–20 bản ghi/entity, đủ để bảng/filter/KPI có ý nghĩa.
- Khi ghép API: `src/api/client.ts` đổi thành axios instance (base URL, JWT interceptor); mỗi `mockRequest(() => db...)` → `api.get/post/put(...)`. Hook & component giữ nguyên.

---

## 4. Cấu trúc thư mục

Theo `design/component-library.md` (đã cập nhật để gồm `customers/` và `QuotePreview`):

```
src/
├── components/
│   ├── layout/        AppShell, Sidebar, Topbar
│   ├── ui/            Badge, Button, KpiCard, ProgressBar, SearchBox, FilterSelect,
│   │                  DataTable, FormModal, DetailDrawer, FormField, Toast,
│   │                  ConfirmDialog, LoadingSkeleton, AvatarStack
│   ├── workers/       WorkerForm, WorkerContractSection, WorkerDetailDrawer
│   ├── customers/     CustomerForm (3 tabs), CustomerDetailDrawer
│   ├── projects/      ProjectForm, ProjectDetailDrawer
│   ├── quotes/        QuoteForm, QuoteItemsEditor, QuoteDetailDrawer, QuotePreview
│   ├── kanban/        StepWizard, WorkerPanel, KanbanColumn, KanbanTaskCard,
│   │                  WorkerChip, TransferDrawer
│   └── timesheet/     TimesheetTable
├── pages/             Workers, Customers, Projects, Quotes, Kanban, Timesheet
│                      (+ placeholder: Dashboard, Sites, Report)
├── api/               (xem mục 3)
├── mocks/             (xem mục 3)
├── stores/            appStore (sidebar/current module), toastStore, kanbanStore
├── types/             customer, site, worker, project, quote, task, timesheet
│                      (nguồn: context/types.ts — đã đồng bộ spec v2.0)
├── utils/             pay-calculator, date, format (vi-VN)
├── styles/            global.css, tokens.css (copy/symlink từ design/tokens.css)
├── router/            routes.tsx
├── App.tsx
└── main.tsx
```

**Routing:**
- `/` → redirect `/quotes` (hoặc trang landing tạm)
- `/workers` `/customers` `/projects` `/quotes` `/assign` `/timesheet`
- `/quotes/:id/preview` → QuotePreview (full-page, có toolbar in ấn)
- `/dashboard` `/sites` `/report` → placeholder "Đang phát triển"
- Không có AuthGuard ở prototype (mock user cố định trong appStore để hiển thị topbar/sidebar).

---

## 5. CSS — bóc từ prototype HTML

- Tách phần `<style>` (~6000 dòng) trong `workshop_pro.html` thành các file `.css` theo component.
- **Map mọi giá trị hex về `var(--color-*)`** từ `design/tokens.css` (đã chứa đủ token + `--radius-pill`, layout sizes, shadows).
- Giữ nguyên spacing/typography/animation theo `design/design-system.md` để parity với mock đã duyệt.

---

## 6. Thứ tự dựng (foundation → 6 module theo phụ thuộc kỹ thuật)

1. **Foundation:** scaffold Vite + TS + path alias `@/`; React Query provider + BrowserRouter; `tokens.css` + global; `mocks/client.ts` + `mocks/db.ts` + seed.
2. **App Shell + UI components chung** (layout + toàn bộ `components/ui/`).
3. **Công nhân** — Workers + Contracts + calculator lương (làm mẫu pattern list/form/drawer).
4. **Khách hàng** — 3-tab modal + multi-contacts + điều khoản mặc định.
5. **Dự án** — link Customer (dropdown search), tiến độ, cảnh báo deadline (UI).
6. **Báo giá** — workflow trạng thái + QuoteItemsEditor (section, VAT 8%) + Preview A4 in ấn + duplicate.
7. **Kanban** — StepWizard 4 bước + drag-drop worker→task + Transfer Drawer + live timer.
8. **Chấm công** — tổng hợp tháng + badge day_type + (optional) export Excel.

**Lý do khác thứ tự backlog:** Quotes phụ thuộc Customers + Projects; Kanban phụ thuộc Quotes + Workers. Dựng theo chiều phụ thuộc tránh phải stub chéo.

---

## 7. Tiêu chí hoàn thành (review gate)

- [x] App chạy `npm run dev`, không lỗi console (chỉ còn favicon 404 vô hại — đã gỡ link).
- [x] Điều hướng được tới cả 6 module core qua sidebar; placeholder còn lại hiển thị đúng.
- [x] Mỗi module core: list + filter/search + tạo + sửa + xem chi tiết hoạt động trên mock (mutation phản ánh ngay).
- [x] Báo giá: tạo → gửi duyệt → duyệt/từ chối; xem Preview A4 song ngữ in được (`window.print()`).
- [x] Kanban: chọn 4 bước → kéo worker vào task → chuyển việc qua Transfer Drawer (live timer chạy).
- [x] Chấm công: xem bảng tháng, badge loại ngày đúng màu, duyệt bảng công, xuất Excel.
- [x] Giao diện khớp `workshop_pro.html`; mọi màu dùng CSS variables.
- [x] `src/api/*.ts` cô lập được phần mock (đổi sang axios không đụng component).

---

## 8. Rủi ro & lưu ý

- **Khối lượng lớn:** 6 module + shell. Plan thực thi nên chia checkpoint theo từng module để review tăng dần.
- **Kanban là phần phức tạp nhất** (drag-drop + state machine Transfer). Tách store + logic trước, UI sau.
- **Parity CSS:** bóc CSS từ HTML thủ công dễ sót; review trực quan từng module so với mock.
- **Mock không enforce ràng buộc DB** (unique code, FK). Prototype mô phỏng ở app-level vừa đủ để demo luồng, không cần chặt như production.
