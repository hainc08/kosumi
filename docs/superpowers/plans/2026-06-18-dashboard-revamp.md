# Gói 6 — Dashboard Plan (gói cuối)

> Thuộc đợt sửa `2026-06-18-kosumi-rework-overview.md`. Đổi tên app + KPI công trường/nhà máy + công nhân + doanh thu năm + công nhân theo hạng mục + 2 biểu đồ.

**Design (chốt):**
- Biểu đồ: **SVG thuần** (không thêm thư viện).
- "Có lắp đặt" (Gói 1) quyết định Công trường: **Nhà máy = TẤT CẢ dự án** (mọi dự án đều sản xuất ở nhà máy); **Công trường = dự án `hasInstallation=true`**.
- Doanh thu: Σ `totalAmount` báo giá `approved`/`po_received` có `quoteDate` trong **năm dương lịch hiện tại** (reset 31/12).
- Công nhân theo nơi: theo `worker.siteId → site.type` (construction=công trường, factory=nhà máy); nghỉ = status `on_leave`/`absent`.
- "Công nhân theo hạng mục": endpoint BE mới (cần join project name + section + title cho assignment active).

## Global Constraints
- KHÔNG migration mới. BE e2e `npx jest --config ./test/jest-e2e.json tasks`. FE gate `npm run build`. Commit prefix `feat(dashboard)`/`feat(tasks)`, tiếng Việt. Branch `poc`, commit trực tiếp.

---

### Task 1: FE — đổi tên app "WorkShop Pro" → "Kosumi Management Software"
- `Sidebar.tsx`: brand `sidebarCollapsed ? 'KMS' : 'Kosumi Management Software'`.
- `index.html` `<title>`: `Kosumi Management Software`.
- `QuotePreview.tsx` toolbar: `Kosumi Management Software`.
- `utils/excel.ts` creator: `Kosumi Management Software`.
- Build PASS. Commit `feat(dashboard): đổi tên app thành Kosumi Management Software`.

### Task 2: BE — công nhân theo hạng mục (`GET /tasks/worker-allocation`)
- `TasksService.workerAllocation()`: lấy assignment active → gom theo taskId → mỗi task: `{ projectName, section, title, workerCount }` (join Project name + quoteItem.sectionName). Chỉ task có ≥1 worker active.
- Controller route tĩnh `@Get('worker-allocation')`.
- Mock `workerAllocationFromDb()` + hook `useWorkerAllocation`.
- e2e: GET trả mảng phần tử có `projectName/section/title/workerCount`.
- Commit `feat(tasks): API công nhân theo hạng mục (Dự án/Đầu mục/Hạng mục)`.

### Task 3: FE — Dashboard KPIs + doanh thu + công nhân theo hạng mục
- `Dashboard.tsx` viết lại phần KPI/section:
  - **Công trường** (dự án hasInstallation): tổng / đang triển khai (in_progress|near_deadline) / tạm dừng (paused|planning).
  - **Nhà máy** (tất cả dự án): tổng / đang triển khai / tạm dừng.
  - **Công nhân**: tổng (status≠resigned) / tại công trường / tại nhà máy / nghỉ (on_leave|absent).
  - **Doanh thu năm**: Σ totalAmount báo giá approved|po_received, quoteDate năm hiện tại.
  - **Công nhân theo hạng mục**: list từ `useWorkerAllocation` — "Dự án / Đầu mục / Hạng mục · N người".
- Helper tính ở FE từ hooks sẵn có (sites/workers/projects/quotes). Build PASS.
- Commit `feat(dashboard): KPI công trường/nhà máy/công nhân + doanh thu năm + công nhân theo hạng mục`.

### Task 4: FE — 2 biểu đồ doanh thu (SVG) + verify
- Component `RevenueBarChart` (SVG cột): props `{ data: {label;value}[]; color }`.
- Dashboard: biểu đồ **theo tháng** (12 tháng năm hiện tại, Σ approved theo tháng) + biểu đồ **theo năm** (mỗi năm Σ approved).
- Helper gom doanh thu theo tháng/năm từ quotes. Build PASS + vitest không lỗi mới.
- Commit `feat(dashboard): biểu đồ doanh thu theo tháng + theo năm (SVG)`.

## Kiểm thử tổng
- BE e2e tasks PASS. FE build OK, vitest không fail mới. Rebuild deploy bundle cuối.
