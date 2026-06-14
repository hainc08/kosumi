# WorkShop Pro — Project Context
# File: context/project-context.md
# Load this file into every agent session before generating code

## What is WorkShop Pro?
Phần mềm quản lý xưởng sản xuất cơ khí / nội thất / kim khí cho doanh nghiệp vừa và nhỏ Việt Nam.
Người dùng chính: quản lý xưởng, trưởng ca.
Ngôn ngữ UI: Tiếng Việt hoàn toàn.

## Core Entities & Relationships
```
Site (Xưởng/Công trường)
  ↳ Workers (Công nhân)          — nhiều worker thuộc 1 site
      ↳ WorkerContracts          — 1 active contract tại 1 thời điểm
  ↳ Projects (Dự án)             — nhiều project tại 1 site
      ↳ Quotes (Báo giá)         — nhiều quote cho 1 project
          ↳ QuoteItems (Hạng mục)— nhiều item trong 1 quote
              ↳ Tasks (Công việc) — mỗi task tương ứng 1 quote item (hoặc tự tạo)
                  ↳ TaskAssignments — worker được phân công vào task
                      ↳ TimesheetEntries — giờ công được tính từ assignments
```

## Key Business Flows

### Flow 1: Tạo công nhân
Site → New Worker Form (tên, kỹ năng, xưởng) → Contract Section (loại HĐ + đơn giá) → Save

### Flow 2: Giao việc hàng ngày
Kanban Board → Chọn site → Chọn project → Chọn quote → Kéo worker vào task
→ System: creates TaskAssignment, starts_at = NOW(), worker status = busy

### Flow 3: Chuyển công nhân
Từ chip worker trên task card → Transfer Drawer → 3 bước chọn đích (site/project/quote/task)
→ Confirm: old assignment ends_at=NOW, new assignment created

### Flow 4: Chấm công
Cuối ngày (hoặc manual): generate timesheet from assignments
Worker A: hàn 8h → TimesheetEntry: 8h × 35,000đ = 280,000đ
→ Manager reviews → approve → export Excel → payroll

### Flow 5: Báo giá → Tasks
Create quote with items → Approve → "Tạo tasks từ báo giá"
→ System creates 1 Task per QuoteItem, status=unassigned, linked to quoteItemId

## Technical Constraints
- No hard deletes — soft delete with deleted_at
- Worker can only be in 1 active TaskAssignment at a time
- Worker can only have 1 active Contract at a time
- Task status driven by assignments: no workers → unassigned, has workers → in_progress
- Pay calculation always snapshots contract at time of work (not current contract)
- All monetary values in VNĐ (Vietnamese Dong), stored as NUMERIC(15,2)
- Dates: YYYY-MM-DD in API, displayed as DD/MM/YYYY in UI

## API Base URL
- Dev: http://localhost:3000/api
- Prod: https://api.workshoppro.vn/api

## Auth
- JWT in Authorization header: `Bearer <token>`
- Refresh token in httpOnly cookie
- All API routes require auth except /auth/login

## Environment Variables
```
DATABASE_URL=mysql://user:pass@localhost:3306/workshop_pro
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=8h
REFRESH_TOKEN_EXPIRES_IN=30d
PORT=3000
```

---

## ⚠️ Development Phase & Workflow (PHẢI ĐỌC)

### Giai đoạn hiện tại: PROTOTYPE
Dự án đang ở giai đoạn **Prototype** — chưa code backend, chưa code frontend production.

**Nguồn sự thật UI duy nhất:** `workshop_pro.html` (file HTML prototype đầy đủ ~6000 dòng).

### Quy tắc bắt buộc cho mọi AI Agent

**QUY TẮC 1 — HTML là nguồn sự thật:**
> Khi có mâu thuẫn giữa `workshop_pro.html` và `workshop_pro_spec.md`,
> **HTML luôn đúng hơn spec**. Spec là tài liệu được sync từ HTML, không phải ngược lại.

**QUY TẮC 2 — Sync sau mỗi thay đổi HTML:**
> Mỗi khi `workshop_pro.html` được chỉnh sửa (thêm UI mới, đổi layout, thêm form field...),
> AI Agent PHẢI:
> 1. So sánh phần thay đổi trong HTML với spec hiện tại
> 2. Xác định gap (phần HTML có nhưng spec chưa có)
> 3. Cập nhật `workshop_pro_spec.md` để phản ánh đúng UI mới

**QUY TẮC 3 — Quy trình Sync Spec:**
```
User thông báo: "Tôi vừa update HTML, hãy sync lại spec"
  → Agent đọc lại workshop_pro.html (hoặc phần được chỉ định)
  → Agent so sánh với workshop_pro_spec.md
  → Agent liệt kê các gap tìm thấy
  → User xác nhận → Agent update spec
```

**QUY TẮC 4 — Khi generate code production:**
> Trước khi viết bất kỳ component / API nào, Agent PHẢI:
> 1. Đọc section tương ứng trong `workshop_pro_spec.md` (spec đã sync)
> 2. Đọc phần HTML tương ứng trong `workshop_pro.html` để lấy đúng CSS class, structure, behavior
> 3. Code phải khớp pixel-perfect với prototype HTML

### File quan trọng cần load vào mỗi session
| File | Mục đích | Khi nào load |
|------|----------|--------------|
| `context/project-context.md` | Bức tranh tổng thể + quy tắc này | **Luôn luôn** |
| `context/tech-stack.md` | Stack, patterns, conventions | **Luôn luôn** |
| `workshop_pro_spec.md` | Spec đầy đủ đã sync với HTML | Khi làm bất kỳ feature nào |
| `workshop_pro.html` | Prototype HTML (nguồn sự thật UI) | Khi cần xem UI chi tiết / sync spec |
| `design/component-library.md` | Design system | Khi code frontend |

### ⚡ Module Line Map — Đọc đúng phần, không đọc cả file

Để tiết kiệm token, khi làm việc với `workshop_pro.html` chỉ đọc đúng dòng cần thiết:

| Module | ID trong HTML | Lines (approx) | Spec section |
|--------|---------------|----------------|--------------|
| CSS (dùng chung) | `<style>` | 12 → 3041 | — |
| Sidebar + Topbar | `.sidebar` `.topbar` | 3044 → 3128 | Module 0 |
| Dashboard | `#mod-dashboard` | 3129 → 3242 | Module 1 |
| Công trường/Xưởng | `#mod-sites` | 3243 → 3348 | Module 2 |
| Công nhân | `#mod-workers` | 3349 → 3668 | Module 3 |
| Dự án | `#mod-projects` | 3669 → 3858 | Module 4 |
| Khách hàng | `#mod-customers` | 3859 → 3963 | Module 5 |
| Báo giá | `#mod-quotes` | 3964 → 4059 | Module 6 |
| Kanban (Giao việc) | `#mod-assign` | 4060 → 4066 | Module 7 |
| Chấm công | `#mod-timesheet` | 4067 → 4234 | Module 8 |
| Báo cáo/Hiệu suất | `#mod-report` | 4235 → 4369 | Module 9 |
| Quote Preview | `#mod-quote-preview` | 4370 → ~4600 | Module 6.4 |
| JavaScript (dùng chung) | `<script>` | ~4600 → 6123 | — |

**Cách dùng:** Khi AI cần xem module Báo giá → đọc HTML từ dòng 3964 đến 4059, không cần đọc toàn bộ.
> Lưu ý: Line numbers có thể lệch khi file được cập nhật. Dùng làm ước lượng.
