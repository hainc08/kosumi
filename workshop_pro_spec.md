# WorkShop Pro — Product Specification
**Version:** 2.0 · **Date:** 12/06/2026  
**System:** Phần mềm quản lý xưởng sản xuất cơ khí / nội thất / kim khí  
**Cập nhật:** Đồng bộ hoàn toàn với prototype `workshop_pro.html`

---

## Tổng quan kiến trúc

```
Frontend (SPA - Vite + React 18 + TypeScript)
  ├── Module 0:  Layout Shell (Sidebar + Topbar)
  ├── Module 1:  Dashboard
  ├── Module 2:  Quản lý Công trường / Xưởng
  ├── Module 3:  Quản lý Công nhân
  ├── Module 4:  Quản lý Dự án
  ├── Module 5:  Quản lý Khách hàng
  ├── Module 6:  Quản lý Báo giá
  │   └── Sub:   Xem trước & In ấn (full-page module)
  ├── Module 7:  Giao việc Kanban  ← tích hợp Module 3, 4, 5, 6
  ├── Module 8:  Chấm công         ← đọc dữ liệu từ Module 3, 7
  └── Module 9:  Báo cáo Hiệu suất

Backend (REST API - NestJS)
  ├── MariaDB (relational data)
  ├── Redis (session — Phase 3)
  └── WebSocket / Polling (kanban sync)
```

**Tech stack:**
- Frontend: Vite 5 + React 18 + TypeScript + Vanilla CSS (CSS variables — `design/tokens.css`)
- State/Data: React Query (server state) + Zustand (UI state); forms: react-hook-form + zod; drag-drop: @hello-pangea/dnd
- Backend: Node.js (NestJS) + TypeORM
- Database: MariaDB 10.11
  > ⚠️ **Lưu ý dialect:** Các đoạn SQL minh hoạ bên dưới viết theo cú pháp PostgreSQL (`gen_random_uuid()`, partial unique index `... WHERE`). Khi triển khai trên MariaDB cần chuyển đổi: dùng `UUID()`/app-level UUID, và enforce ràng buộc "chỉ 1 active" bằng app logic hoặc trigger (MariaDB không hỗ trợ partial index). Generated column `GENERATED ALWAYS AS (...) STORED` thì MariaDB hỗ trợ.
- Cache/Realtime: Phase 1 dùng polling 5s; Phase 3 nâng cấp Redis + Socket.io
- Auth: JWT (stateless, không cần Redis Phase 1)
- Deploy: Mắt Bão Plesk — Frontend static `httpdocs/dist/`, Backend Node.js process, MariaDB có sẵn

---

## Module 0 — Layout Shell (Global UI)

### 0.1 Sidebar

Sidebar có thể thu gọn (collapsed = 56px) hoặc mở rộng (220px).

**Nhóm menu:**

| Group | Items |
|-------|-------|
| Tổng quan | Dashboard |
| Quản lý | Công trường / Xưởng · Công nhân · Dự án · Khách hàng · Báo giá |
| Sản xuất | Giao việc (Kanban) · Chấm công |
| Báo cáo | Hiệu suất |

**Badge số lượng (đỏ):** Hiển thị trên menu item "Công nhân" — giá trị = số công nhân `status = 'working'` hôm nay. Khi sidebar collapsed, badge thu nhỏ thành chấm tròn 8px góc trên phải icon.

**Chân sidebar — User Info:**
- Avatar (chữ viết tắt tên) + Tên đầy đủ + Role (ví dụ: "Quản lý xưởng")
- Hiển thị info-only. Không có dropdown tại đây.

### 0.2 Topbar

| Element | Mô tả |
|---------|-------|
| Page title | Tên module hiện tại + subtitle (VD: "Dashboard · Tổng quan hôm nay") |
| 🔍 Search icon | Placeholder Phase 1 — Phase 2 implement global search (tìm công nhân, dự án, báo giá) |
| 🔔 Bell icon | Placeholder Phase 1 — Phase 3 implement notification system |
| User Chip | Avatar + Role text + chevron ↓ → Dropdown: **Đăng xuất** (tối thiểu Phase 1) |

### 0.3 Toast Notification

- Vị trí: góc dưới phải, `position: fixed; bottom: 20px; right: 20px`
- Trigger: sau mọi thao tác lưu / xóa / cập nhật thành công
- Format: icon ✓ + message text (VD: "✓ Đã thêm công trường mới")
- Tự ẩn sau **3 giây**
- Animation: fade in + slide up khi xuất hiện, fade out khi ẩn

---

## Module 1 — Dashboard

### 1.1 KPI Cards (4 thẻ)

| Thẻ | Giá trị | Sub-text |
|-----|---------|----------|
| Công trường | Tổng sites active | "N đang hoạt động" |
| Công nhân hôm nay | Count workers `status=working` | "N đang làm việc" |
| Dự án đang chạy | Count projects `status=in_progress` | "N dự án sắp đến hạn" |
| Báo giá tháng này | Count quotes trong tháng | "+N so với tháng trước" |

### 1.2 Widget "Hoạt động gần đây" (Activity Feed)

Timeline hiển thị 5–10 sự kiện gần nhất trong hệ thống:
- Worker được giao task (TaskAssignment created)
- Báo giá được tạo / duyệt / từ chối
- Worker chuyển việc (Transfer)
- Task hoàn thành
- Tiến độ dự án được cập nhật

Mỗi item: icon dot màu (done=xanh / pending=xám) + title + timestamp + site name.

**API:** `GET /api/activity-feed?limit=10`

### 1.3 Widget "Công nhân theo xưởng"

Progress bar ngang cho từng Site:
- Label: tên xưởng
- Value: số công nhân đang làm việc hôm nay tại xưởng đó
- % = workers_at_site / total_workers_working_today × 100

### 1.4 Widget "Trạng thái dự án"

Grid 4 mini-stat:
- Đang thi công (`in_progress`)
- Sắp bàn giao (`near_deadline` — deadline trong 14 ngày tới)
- Hoàn thành (`completed`)
- Tạm dừng (`paused`)

---

## Module 2 — Quản lý Công trường / Xưởng

### 2.1 Mô tả
Quản lý danh sách các địa điểm sản xuất. Mỗi xưởng là đơn vị tổ chức cơ bản chứa công nhân và thực hiện dự án.

### 2.2 Data Model

```sql
CREATE TABLE sites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            VARCHAR(20) UNIQUE NOT NULL,          -- VD: XHN001
  name            VARCHAR(200) NOT NULL,
  type            ENUM('factory','construction','warehouse') NOT NULL,
  industrial_zone VARCHAR(200),                         -- KCN Thăng Long
  address         TEXT NOT NULL,
  city            VARCHAR(100),
  manager_id      UUID REFERENCES users(id),
  phone           VARCHAR(20),
  area_m2         NUMERIC(10,2),
  status          ENUM('active','paused','preparing') DEFAULT 'active',
  notes           TEXT,
  deleted_at      TIMESTAMP NULL DEFAULT NULL,          -- soft delete
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

### 2.3 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/sites` | Danh sách (filter: status, search) |
| GET | `/api/sites/:id` | Chi tiết + stats (workers, projects count) |
| POST | `/api/sites` | Tạo mới |
| PUT | `/api/sites/:id` | Cập nhật |
| DELETE | `/api/sites/:id` | Xóa (soft delete, kiểm tra FK) |
| GET | `/api/sites/:id/workers` | Công nhân thuộc xưởng |
| GET | `/api/sites/:id/projects` | Dự án đang thực hiện |

### 2.4 Business Rules
- Không thể xóa xưởng đang có công nhân active hoặc dự án đang chạy
- `code` tự sinh theo format: XHN001 (X=Xưởng, HN=địa điểm, 001=thứ tự)
- Khi đổi `manager_id`: gửi notification cho manager mới (Phase 3)
- Tất cả xóa là soft delete (`deleted_at = NOW()`)

### 2.5 UI Screens
1. **Danh sách** — 3 KPI cards (Tổng công trường / Công nhân đang làm / Dự án đang chạy) + bảng với search + filter status
2. **Chi tiết (drawer phải)** — thông tin chung + stats workers/projects
3. **Form thêm/sửa (modal)** — fields: Tên, Loại (dropdown), KCN, Địa chỉ, Người phụ trách, SĐT, Trạng thái, Ghi chú

---

## Module 3 — Quản lý Công nhân

### 3.1 Mô tả
Hồ sơ công nhân đầy đủ gồm thông tin cá nhân, kỹ năng, và **loại hợp đồng + đơn giá** để hệ thống tự tính lương từ chấm công.

### 3.2 Data Model

```sql
CREATE TABLE workers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             VARCHAR(20) UNIQUE NOT NULL,    -- CN001
  full_name        VARCHAR(200) NOT NULL,
  gender           ENUM('male','female') NOT NULL,
  date_of_birth    DATE,
  id_number        VARCHAR(20),                    -- CCCD
  phone            VARCHAR(20),
  address          TEXT,
  site_id          UUID REFERENCES sites(id),
  primary_skill    ENUM('welding_electric','welding_tig','cnc_cutting',
                        'laser_cutting','assembly','painting',
                        'qc_inspection','other') NOT NULL,
  experience_years SMALLINT DEFAULT 0,
  status           ENUM('working','on_leave','absent','resigned') DEFAULT 'working',
  notes            TEXT,
  deleted_at       TIMESTAMP NULL DEFAULT NULL,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE worker_contracts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id     UUID REFERENCES workers(id) NOT NULL,
  contract_type ENUM('hourly','daily','monthly','piece') NOT NULL,
  start_date    DATE NOT NULL,
  end_date      DATE,                           -- NULL = indefinite
  -- Hourly / Daily
  rate_normal   NUMERIC(12,2),                  -- VNĐ/giờ hoặc VNĐ/ngày
  rate_overtime NUMERIC(12,2),                  -- VNĐ/giờ OT (= rate_normal × 1.5 mặc định)
  -- Monthly
  base_salary   NUMERIC(12,2),
  allowance     NUMERIC(12,2) DEFAULT 0,
  -- Piece-rate
  rate_per_unit NUMERIC(12,2),
  unit_name     VARCHAR(50),                    -- VD: "sản phẩm", "m²", "bộ"
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW()
);
-- Chỉ 1 contract active tại 1 thời điểm:
-- CREATE UNIQUE INDEX ON worker_contracts(worker_id) WHERE is_active = TRUE;
```

### 3.3 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/workers` | Danh sách (filter: site, status, skill, search) |
| GET | `/api/workers/:id` | Chi tiết + contract hiện tại |
| POST | `/api/workers` | Tạo công nhân + contract đầu tiên |
| PUT | `/api/workers/:id` | Cập nhật thông tin |
| PUT | `/api/workers/:id/status` | Đổi trạng thái |
| GET | `/api/workers/:id/contracts` | Lịch sử hợp đồng |
| POST | `/api/workers/:id/contracts` | Tạo hợp đồng mới (deactivate cũ) |
| GET | `/api/workers/:id/timesheet` | Chấm công theo tháng |
| GET | `/api/workers/:id/assignments` | Lịch sử phân công |

### 3.4 Business Rules — Contract & Pay

| Loại HĐ | Cách tính lương |
|---------|----------------|
| **Theo giờ** | `(giờ_thường × rate_normal) + (giờ_OT × rate_overtime)` |
| **Theo ngày công** | `(ngày_công × rate_normal) + (giờ_OT × rate_normal/8 × 1.5)` |
| **Cố định tháng** | `base_salary + allowance` |
| **Khoán sản phẩm** | `số_lượng_hoàn_thành × rate_per_unit` |

- OT mặc định = `rate_normal × 1.5` (có thể override)
- Khi tạo hợp đồng mới: set `is_active=FALSE` cho hợp đồng cũ
- `code` tự sinh: CN + 3 digits (VD: CN009)

### 3.5 UI Screens

1. **Danh sách** — bảng với cột Loại HĐ + Đơn giá/giờ, filter theo xưởng + status + kỹ năng
2. **Form thêm công nhân (modal)**:
   - Section thông tin cá nhân: Tên, Mã (tự sinh), Giới tính, Ngày sinh, Kỹ năng chính, Năm KN, Xưởng, SĐT, CCCD, Ghi chú
   - Section **"Hợp đồng & Tiền công"**: dropdown Loại HĐ → dynamic fields theo loại:
     - `hourly`: Đơn giá/giờ + Đơn giá OT/giờ
     - `daily`: Đơn giá/ngày + Đơn giá OT (auto = ngày/8 × 1.5)
     - `monthly`: Lương cơ bản/tháng + Phụ cấp/tháng
     - `piece`: Đơn giá/đơn vị + Tên đơn vị
   - **Calculator preview lương ước tính:**
     - `hourly/daily`: `đơn_giá × 26 ngày × 8 giờ/ngày`
     - `monthly`: `base_salary + allowance`
     - Hiển thị: "Ước tính: ~7,280,000đ (26 ngày × 8 giờ/ngày)"
3. **Chi tiết worker (drawer phải)** — profile + lịch sử HĐ + chấm công tháng hiện tại

---

## Module 4 — Quản lý Dự án

### 4.1 Data Model

```sql
CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            VARCHAR(20) UNIQUE NOT NULL,    -- PRJ001
  name            VARCHAR(300) NOT NULL,
  customer_id     UUID REFERENCES customers(id),  -- Liên kết Module Khách hàng
  project_type    ENUM('commercial','apartment','industrial','art','other') NOT NULL,
  -- Các giá trị hiển thị: Thương mại dịch vụ / Căn hộ cao cấp / Khu công nghiệp / Kiến trúc nghệ thuật / Khác
  site_id         UUID REFERENCES sites(id),
  contract_value  NUMERIC(15,2),
  start_date      DATE,
  deadline        DATE NOT NULL,
  actual_end_date DATE,
  progress_pct    SMALLINT DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  status          ENUM('planning','in_progress','near_deadline',
                       'completed','paused','cancelled') DEFAULT 'planning',
  description     TEXT,
  manager_id      UUID REFERENCES users(id),
  deleted_at      TIMESTAMP NULL DEFAULT NULL,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

### 4.2 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/projects` | Danh sách (filter: status, site, deadline) |
| GET | `/api/projects/:id` | Chi tiết + quotes + workers |
| POST | `/api/projects` | Tạo mới |
| PUT | `/api/projects/:id` | Cập nhật |
| GET | `/api/projects/:id/quotes` | Danh sách báo giá của dự án |
| GET | `/api/projects/:id/workers` | Công nhân đang giao cho dự án |
| PATCH | `/api/projects/:id/progress` | Cập nhật % tiến độ |

### 4.3 Business Rules
- `status` tự động chuyển `near_deadline` khi `deadline - NOW() <= 14 days` (cron job hằng ngày)
- `progress_pct` có thể nhập tay hoặc tính từ tasks hoàn thành / tổng tasks
- Không thể xóa dự án đang có assignment active
- Trường `customer_id` là **dropdown tìm kiếm từ bảng customers** (không phải text tự do)

### 4.4 UI Screens

1. **Danh sách** — bảng + filter status + filter site
2. **Form thêm/sửa (modal)**: Tên dự án, Chủ đầu tư (dropdown search từ customers), Loại công trình (dropdown enum), Công trường thực hiện, Giá trị HĐ, Ngày khởi công, Ngày bàn giao, Mô tả
3. **Chi tiết (drawer phải)** — thông tin + tiến độ + danh sách quotes + workers

---

## Module 5 — Quản lý Khách hàng

### 5.1 Mô tả
CRM mini — quản lý thông tin khách hàng, nhiều người liên hệ, điều khoản mặc định để tự điền vào báo giá.

### 5.2 Data Model

```sql
CREATE TABLE customers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                  VARCHAR(20) UNIQUE NOT NULL,    -- CUST001 (KH001)
  name                  VARCHAR(300) NOT NULL,
  type                  ENUM('business','studio','foreign','state') DEFAULT 'business',
  -- business = Doanh nghiệp, studio = Cá nhân/Studio,
  -- foreign = Doanh nghiệp nước ngoài, state = Đơn vị nhà nước
  tax_code              VARCHAR(50),
  address               TEXT,
  website               VARCHAR(200),
  status                ENUM('active','inactive','pending') DEFAULT 'active',
  -- active=Đang hợp tác, pending=Chờ phản hồi, inactive=Ngừng hợp tác
  -- Điều khoản mặc định (auto-fill khi tạo báo giá mới cho KH này)
  default_validity_days    INT DEFAULT 10,              -- Hiệu lực báo giá (ngày)
  default_delivery_days    INT DEFAULT 50,              -- Thời gian giao hàng (ngày)
  default_payment_terms    VARCHAR(50) DEFAULT '30-25-35-10',
  -- Các option: '30-25-35-10' / '50-50' / '30-70' / '100-prepay' / 'custom'
  default_warranty_note    TEXT,                        -- Điều khoản bảo hành mặc định
  default_special_note     TEXT,                        -- Ghi chú điều khoản đặc biệt
  notes                 TEXT,
  deleted_at            TIMESTAMP NULL DEFAULT NULL,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

-- Bảng người liên hệ (1 KH có nhiều liên hệ)
CREATE TABLE customer_contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  full_name   VARCHAR(200) NOT NULL,
  title       VARCHAR(100),                             -- Chức vụ
  phone       VARCHAR(50),
  email       VARCHAR(100),
  is_primary  BOOLEAN DEFAULT FALSE,                    -- Liên hệ chính → auto-fill trên báo giá
  sort_order  SMALLINT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW()
);
-- Liên hệ đầu tiên tạo = is_primary = TRUE
-- Chỉ 1 is_primary = TRUE per customer:
-- CREATE UNIQUE INDEX ON customer_contacts(customer_id) WHERE is_primary = TRUE;
```

### 5.3 Computed / Aggregate (View hoặc query)

```sql
-- Tổng giá trị hợp đồng per customer
SELECT
  c.id, c.name,
  COUNT(DISTINCT p.id)   AS project_count,
  COUNT(DISTINCT q.id)   AS quote_count,
  COALESCE(SUM(qs.total_amount), 0) AS total_contract_value
FROM customers c
LEFT JOIN projects p   ON p.customer_id = c.id AND p.deleted_at IS NULL
LEFT JOIN quotes q     ON q.customer_id = c.id AND q.deleted_at IS NULL
LEFT JOIN quote_summary qs ON qs.id = q.id
WHERE c.deleted_at IS NULL
GROUP BY c.id;
```

### 5.4 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/customers` | Danh sách (filter: type, status, search: name/tax_code/contact) |
| GET | `/api/customers/:id` | Chi tiết + project/quote history + contacts |
| POST | `/api/customers` | Tạo mới + contacts đầu tiên |
| PUT | `/api/customers/:id` | Cập nhật thông tin |
| GET | `/api/customers/:id/contacts` | Danh sách người liên hệ |
| POST | `/api/customers/:id/contacts` | Thêm người liên hệ |
| PUT | `/api/customers/:id/contacts/:contactId` | Sửa liên hệ |
| DELETE | `/api/customers/:id/contacts/:contactId` | Xóa liên hệ |

### 5.5 UI Screens

1. **Danh sách** — 4 KPI cards: Tổng KH / Có báo giá / Chờ phản hồi / Tổng giá trị HĐ  
   Bảng: Tên KH, Mã KH, Loại, Người liên hệ chính, SĐT/Email, Dự án, Báo giá, Tổng giá trị, Trạng thái  
   Filter: dropdown Loại + search (tên, mã, liên hệ)  
   Action mỗi row: 👁 Chi tiết · 📄+ Tạo báo giá nhanh · ✏ Sửa · 🗑 Xóa

2. **Form thêm/sửa (modal 3 Tabs)**:
   - **Tab 1 — Thông tin chung**: Tên KH/Công ty, Mã KH (tự sinh), Loại KH, Địa chỉ trụ sở, Mã số thuế, Website, Ghi chú
   - **Tab 2 — Người liên hệ**: Danh sách contact rows (Họ tên / Chức vụ / SĐT / Email). Người đầu tiên = liên hệ chính (label "Chính"). Nút "+ Thêm người liên hệ".
   - **Tab 3 — Điều khoản mặc định**: Hiệu lực BG (ngày), Thời gian giao hàng (ngày), Điều khoản thanh toán (dropdown preset), Bảo hành mặc định (textarea), Ghi chú đặc biệt (textarea)

3. **Lịch sử giao dịch (Drawer phải)** — tabs: Dự án · Báo giá thuộc về khách hàng này

---

## Module 6 — Quản lý Báo giá

### 6.1 Data Model

```sql
CREATE TABLE quotes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            VARCHAR(20) UNIQUE NOT NULL,    -- WS0087 (KSM format)
  project_id      UUID REFERENCES projects(id) NOT NULL,
  customer_id     UUID REFERENCES customers(id),
  contact_id      UUID REFERENCES customer_contacts(id),  -- Người liên hệ cụ thể
  title           VARCHAR(300) NOT NULL,          -- Đầu mục / tên gói thầu
  quote_date      DATE DEFAULT CURRENT_DATE,
  valid_until     DATE,                           -- Mặc định = quote_date + 7 ngày
  status          ENUM('draft','pending','approved','rejected','po_received') DEFAULT 'draft',
  reject_reason   TEXT,
  tax_rate        NUMERIC(5,2) DEFAULT 8.00,      -- VAT % — mặc định 8%
  validity_days   INT DEFAULT 10,                 -- Hiệu lực báo giá (ngày)
  delivery_days   INT DEFAULT 50,                 -- Thời gian giao hàng (ngày)
  payment_terms   VARCHAR(50) DEFAULT '30-25-35-10',
  warranty_note   TEXT,
  contractor_note TEXT,                           -- "Nhà thầu chính cung cấp (miễn phí)"
  notes           TEXT,
  created_by      UUID REFERENCES users(id),
  deleted_at      TIMESTAMP NULL DEFAULT NULL,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Items có hỗ trợ phân Section (Section I, Section II...)
CREATE TABLE quote_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id     UUID REFERENCES quotes(id) ON DELETE CASCADE,
  section_name VARCHAR(100),                      -- VD: "Cầu thang thép số 1" — NULL nếu không phân section
  section_name_en VARCHAR(100),                   -- Tên tiếng Anh của section (cho bản in song ngữ)
  sort_order   SMALLINT DEFAULT 0,
  item_name    VARCHAR(300) NOT NULL,             -- Tên hạng mục
  description  TEXT,                              -- Diễn giải chi tiết (multiline, hiển thị pre-line)
  unit         VARCHAR(50),                       -- ĐVT: m, m², kg, bộ, cái, gói
  quantity     NUMERIC(12,3) NOT NULL,
  unit_price   NUMERIC(15,2) NOT NULL,
  amount       NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  notes        VARCHAR(500)
);

-- Lịch thanh toán theo đợt
CREATE TABLE quote_payment_steps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id   UUID REFERENCES quotes(id) ON DELETE CASCADE,
  step_order SMALLINT NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,              -- VD: 30.00
  description TEXT NOT NULL,                    -- VD: "Tạm ứng khi ký hợp đồng"
  description_en TEXT                           -- English version
);

-- View tổng hợp
CREATE VIEW quote_summary AS
SELECT
  q.*,
  COALESCE(SUM(qi.amount), 0)                          AS subtotal,
  COALESCE(SUM(qi.amount), 0) * q.tax_rate / 100       AS tax_amount,
  COALESCE(SUM(qi.amount), 0) * (1 + q.tax_rate / 100) AS total_amount,
  COUNT(qi.id)                                         AS item_count,
  COUNT(DISTINCT qi.section_name)                      AS section_count
FROM quotes q
LEFT JOIN quote_items qi ON qi.quote_id = q.id
GROUP BY q.id;
```

**Preset điều khoản thanh toán mặc định:**
- `30-25-35-10`: 30% tạm ứng ký HĐ · 25% tạm ứng đợt 2 khi triển khai · 35% khi bàn giao · 10% sau bảo hành
- `50-50`: 50% trước · 50% khi nhận hàng
- `30-70`: 30% trước · 70% khi bàn giao
- `100-prepay`: 100% trước khi nhận hàng
- `custom`: Tùy chỉnh (nhập text)

### 6.2 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/quotes` | Danh sách (filter: status, project, customer, date range) |
| GET | `/api/quotes/:id` | Chi tiết với items + summary |
| POST | `/api/quotes` | Tạo BG + items (transaction) |
| PUT | `/api/quotes/:id` | Cập nhật header |
| PUT | `/api/quotes/:id/items` | Replace toàn bộ items (bulk upsert) |
| PATCH | `/api/quotes/:id/status` | Chuyển trạng thái |
| POST | `/api/quotes/:id/duplicate` | Nhân bản báo giá (→ draft mới) |
| GET | `/api/quotes/:id/pdf` | Export PDF |
| POST | `/api/quotes/from-customer/:customerId` | Tạo BG nhanh pre-fill từ KH |

### 6.3 Business Rules

**Quy trình phê duyệt:**

| Status | Mô tả | Action có thể |
|--------|-------|---------------|
| `draft` | Nháp mặc định khi tạo | Sửa · Gửi duyệt · Nhân bản · Xóa |
| `pending` | Chờ phê duyệt | Phê duyệt · Từ chối · Nhân bản |
| `approved` | Đã phê duyệt | Xem · Nhân bản · Tạo tasks từ BG |
| `rejected` | Không phê duyệt (có lý do) | Sửa lại → Gửi duyệt lại |
| `po_received` | Khách đã có PO / Ký HĐ | Xem · Nhân bản |

- Khi `rejected`: bắt buộc nhập `reject_reason` (Modal Từ chối riêng biệt)
- Không thể sửa BG khi `status = approved` hoặc `po_received`
- `code` tự sinh: `WS` + 4 digits sequential (WS0087, WS0088...)
- VAT mặc định **8%** (config override được per quote)
- Khi approved: tự động tạo Tasks trong Kanban từ `quote_items`

### 6.4 UI Screens

1. **Danh sách** — 4 KPI cards: Tổng BG / Đã duyệt+PO / Chờ phê duyệt / Tổng giá trị  
   Bảng: Số BG, Đầu mục, Dự án, Số hạng mục, Ngày tạo, Giá trị, Trạng thái  
   Filter: search Số BG + search Khách hàng + dropdown Trạng thái  
   Actions theo status:
   - `draft`: 📤 Gửi duyệt · 📋 Nhân bản · ✏ Sửa · 🗑 Xóa
   - `pending`: ✅ Phê duyệt · ❌ Từ chối · 📋 Nhân bản · 👁 Chi tiết · 🖨 Xem trước
   - `approved/po_received`: 👁 Chi tiết · 📋 Nhân bản · 🖨 Xem trước

2. **Form Báo giá (Modal)**:
   - Số BG (tự sinh, readonly)
   - Checkbox "Dự án đã có" → hiện/ẩn dropdown tìm dự án
   - Khách hàng (input với datalist gợi ý từ customers)
   - Người liên hệ
   - Đầu mục / Tên gói thầu
   - Bảng hạng mục: Tên hạng mục · ĐVT · Số lượng · Đơn giá · Thành tiền (auto) · Xóa row
   - Nút "+ Thêm hạng mục"
   - Ngày báo giá (default: hôm nay) · Hiệu lực đến (default: +7 ngày)
   - Ghi chú điều khoản

3. **Chi tiết (Drawer phải)** — thông tin BG + lịch sử status + nút Phê duyệt / Từ chối

4. **Màn hình Xem trước & In ấn (Full-page Module — `mod-quote-preview`)**:
   - Toolbar sticky (no-print): nút Quay lại · Badge status · nút In (`window.print()`) · nút Xuất PDF
   - Document A4 preview gồm:
     - **Header**: Logo + tên công ty Kosumi · "Bảng Báo Giá / QUOTATION" · Số BG
     - **Meta row**: Ngày · Người gửi · Liên hệ
     - **Parties**: Gửi đến (KH) · Nhà cung cấp (Kosumi)
     - **Project row**: Dự án · Đầu mục · Hiệu lực
     - **Sections** (I, II, III...): mỗi section có tiêu đề (VN + EN) + số tiền section
     - **Items table**: STT · Hạng mục · Diễn giải (multiline) · ĐVT · Số lượng · Đơn giá · Thành tiền
     - **Totals**: Subtotal · VAT (8%) · Grand Total
     - **Điều khoản**: Hiệu lực · Thời gian giao hàng · Lịch thanh toán (payment steps)
     - **Nhà thầu chính cung cấp**: danh sách bullet (config từ `contractor_note`)
     - **Chữ ký**: 2 bên (KH xác nhận + Đại diện Kosumi)
     - **Footer**: ghi chú pháp lý · Trang 1/1

5. **Modal Từ chối** — textarea "Lý do từ chối" (bắt buộc) + nút Xác nhận (đỏ)

---

## Module 7 — Giao việc Kanban

### 7.1 Mô tả
Màn hình trung tâm để phân công công nhân vào hạng mục công việc theo từng ngày. Kéo-thả (drag & drop), tích hợp Module 3, 4, 6.

### 7.2 Data Model

```sql
CREATE TABLE tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_item_id UUID REFERENCES quote_items(id),  -- NULL nếu task thủ công
  project_id    UUID REFERENCES projects(id) NOT NULL,
  site_id       UUID REFERENCES sites(id) NOT NULL,
  title         VARCHAR(300) NOT NULL,
  description   TEXT,
  task_date     DATE DEFAULT CURRENT_DATE,
  status        ENUM('unassigned','in_progress','paused','completed','cancelled') DEFAULT 'unassigned',
  priority      ENUM('high','medium','low') DEFAULT 'medium',
  sort_order    SMALLINT DEFAULT 0,
  created_by    UUID REFERENCES users(id),
  deleted_at    TIMESTAMP NULL DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE task_assignments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id               UUID REFERENCES tasks(id) NOT NULL,
  worker_id             UUID REFERENCES workers(id) NOT NULL,
  assigned_at           TIMESTAMP DEFAULT NOW(),
  started_at            TIMESTAMP,
  ended_at              TIMESTAMP,
  is_active             BOOLEAN DEFAULT TRUE,
  is_overtime           BOOLEAN DEFAULT FALSE,      -- TRUE nếu assign sau 17:00
  transferred_from_task_id UUID REFERENCES tasks(id),
  notes                 TEXT
);
-- Chỉ 1 active assignment per worker:
-- CREATE UNIQUE INDEX ON task_assignments(worker_id) WHERE is_active = TRUE;
```

### 7.3 UI Flow — 4 bước chọn (Step Bar)

```
Step 1: Chọn Công trường / Xưởng
  → Step 2: Chọn Dự án (filter theo site)
    → Step 3: Chọn Số Báo giá (filter theo project)
      → Step 4: Kéo-thả Công nhân vào Hạng mục
                Left panel: danh sách workers (filter tên/kỹ năng)
                             chỉ hiện workers chưa assigned (dot xanh = rảnh)
                Main: task rows (mỗi row = 1 quote_item)
                       chip worker + live timer + nút chuyển việc + nút bỏ
```

### 7.4 UI Transfer Drawer (Chuyển việc — 3 bước trong Drawer phải)

Khi click icon "Chuyển việc" trên chip worker của một task:

```
Drawer mở (width: 420px) gồm:
  ├── Header: "Chuyển việc" · tên worker hiện tại
  ├── Banner cam: "Đang làm: [Site] / [Project] / [Task] · Thời gian: HH:mm"
  ├── Tab bar (3 tabs): [1. Xưởng] [2. Dự án] [3. Task → Xác nhận]
  ├── Body (scroll):
  │    Tab 1: Danh sách Xưởng (card select)
  │    Tab 2: Danh sách Dự án tại xưởng đã chọn (card select)
  │    Tab 3: Danh sách Tasks tại dự án + site đã chọn (row select)
  │            + Summary: Worker / Từ task / Sang task / Thời gian đã làm
  └── Footer: [Hủy] [Xác nhận chuyển] (primary)
```

**Logic khi Confirm:**
1. `old_assignment.ended_at = NOW()`, `is_active = FALSE`
2. `new_assignment` created với `started_at = NOW()`, `is_active = TRUE`, `transferred_from_task_id = old_task_id`
3. Task cũ: nếu không còn worker nào → `status = unassigned`
4. Task mới: `status = in_progress`

### 7.5 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/tasks` | Danh sách (filter: date, site, project, status) |
| POST | `/api/tasks` | Tạo task thủ công |
| POST | `/api/tasks/from-quote/:quoteId` | Tạo tasks từ quote items |
| PATCH | `/api/tasks/:id/status` | Cập nhật trạng thái |
| POST | `/api/tasks/:id/assign` | Phân công worker vào task |
| DELETE | `/api/tasks/:id/assign/:workerId` | Rút worker |
| POST | `/api/tasks/:id/transfer` | Chuyển worker sang task khác |
| GET | `/api/tasks/board` | Toàn bộ board state cho ngày cụ thể |

**Phase 3:** WebSocket `ws://…/kanban` — emit events: `assign`, `transfer`, `status_change`  
**Phase 1:** Polling `GET /api/tasks/board` mỗi 5 giây

### 7.6 Business Rules

| Rule | Mô tả |
|------|-------|
| Auto-start | Worker assign → `started_at = NOW()`, task `status = in_progress` |
| Auto-stop | Worker rút hoặc chuyển → `ended_at = NOW()`, `is_active = FALSE` |
| Chỉ hiển thị rảnh | Left panel chỉ show workers chưa có active assignment |
| Duplicate check | Không cho assign 1 worker vào 2 task cùng lúc |
| Reset 17:00 | Board đếm ngược đến 17:00 → reset (Phase 2) |
| OT tự động | Assignments sau 17:00 → `is_overtime = TRUE` → tính lương OT rate |
| Live timer | Chip worker trên task hiển thị `HH:mm:ss` đếm từ `started_at` |
| Daily snapshot | Cron 23:55 → generate `timesheet_entries` từ assignments |

---

## Module 8 — Chấm công

### 8.1 Mô tả
Tổng hợp giờ công từ `task_assignments`. Manager review, điều chỉnh và duyệt trước khi chốt lương.

### 8.2 Data Model

```sql
CREATE TABLE timesheet_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id       UUID REFERENCES workers(id) NOT NULL,
  work_date       DATE NOT NULL,
  site_id         UUID REFERENCES sites(id),
  regular_hours   NUMERIC(5,2) DEFAULT 0,
  overtime_hours  NUMERIC(5,2) DEFAULT 0,
  day_type        ENUM('workday','leave_paid','leave_unpaid','holiday','absent') DEFAULT 'workday',
  contract_type   VARCHAR(20),                    -- snapshot từ contract lúc đó
  rate_normal     NUMERIC(12,2),
  rate_overtime   NUMERIC(12,2),
  pay_amount      NUMERIC(15,2) GENERATED ALWAYS AS (
                    CASE contract_type
                      WHEN 'hourly' THEN regular_hours * rate_normal + overtime_hours * rate_overtime
                      WHEN 'daily'  THEN CEIL(regular_hours / 8.0) * rate_normal
                      ELSE 0
                    END
                  ) STORED,
  status          ENUM('draft','pending_approval','approved','rejected') DEFAULT 'draft',
  approved_by     UUID REFERENCES users(id),
  approved_at     TIMESTAMP,
  notes           TEXT,
  UNIQUE (worker_id, work_date)
);

CREATE TABLE timesheet_monthly_summary (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id           UUID REFERENCES workers(id),
  year_month          CHAR(7) NOT NULL,           -- VD: '2026-06'
  total_workdays      NUMERIC(5,2),
  total_regular_hours NUMERIC(7,2),
  total_ot_hours      NUMERIC(7,2),
  total_leave_days    NUMERIC(5,2),
  total_absent_days   NUMERIC(5,2),
  total_pay           NUMERIC(15,2),
  base_salary         NUMERIC(15,2),              -- Cho loại monthly
  allowance           NUMERIC(12,2),
  status              ENUM('open','submitted','approved','paid') DEFAULT 'open',
  created_at          TIMESTAMP DEFAULT NOW(),
  UNIQUE (worker_id, year_month)
);
```

### 8.3 Badge màu theo `day_type`

| day_type | Badge | Màu |
|----------|-------|-----|
| `workday` | Đã duyệt / Chờ duyệt | xanh lá / cam |
| `leave_paid` | Nghỉ phép | cam (amber) |
| `leave_unpaid` | Nghỉ không lương | đỏ nhạt (red-light) |
| `holiday` | Nghỉ lễ | tím (purple) |
| `absent` | Vắng không phép | đỏ (red) |

### 8.4 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/timesheet` | Bảng công theo tháng (filter: year_month, site, worker) |
| GET | `/api/timesheet/:workerId/:yearMonth` | Chi tiết ngày công 1 người |
| POST | `/api/timesheet/generate` | Tạo entries từ task_assignments |
| PUT | `/api/timesheet/:id` | Điều chỉnh thủ công |
| POST | `/api/timesheet/approve-bulk` | Duyệt hàng loạt |
| GET | `/api/timesheet/monthly-summary` | Bảng tổng kết tháng |
| GET | `/api/timesheet/export` | Export Excel/CSV |

### 8.5 UI Screens

1. **Bảng chấm công (chế độ mặc định: Tháng tổng hợp)**:
   - 4 KPI cards: Tổng giờ tháng / Ngày công TB / Ngày vắng / Giờ OT
   - Header: dropdown chọn tháng + nút Xuất Excel
   - Bảng: Công nhân · Xưởng · Ngày công · Giờ thường · Giờ OT · Đơn giá · Thành tiền · Trạng thái (badge)

### 8.6 Quy trình chốt lương

```
Cuối ngày (cron 23:55): generate_timesheet_from_assignments(date=today)

Cuối tháng:
  Manager review entries → điều chỉnh nếu cần
  → Duyệt từng entry hoặc bulk approve
  → Generate monthly_summary
  → Export Excel → Chuyển bộ phận lương
```

---

## Module 9 — Báo cáo Hiệu suất

### 9.1 KPI Cards (4 thẻ)

| Thẻ | Nguồn dữ liệu |
|-----|---------------|
| Doanh thu tháng | `SUM(quote_summary.total_amount)` WHERE `status IN ('approved','po_received')` trong tháng |
| Công việc hoàn thành | `COUNT(tasks)` WHERE `status='completed'` trong tháng |
| Hiệu suất lao động | `tasks_completed / tasks_assigned × 100%` trong tháng |
| Chất lượng QC | Phase 2 — Placeholder hiện tại hiển thị `—` |

### 9.2 Bảng Top Công nhân hiệu suất cao

Cột: Rank · Công nhân · Xưởng · Hiệu suất % · Ngày công

**Công thức hiệu suất:** `tasks_completed_by_worker / tasks_assigned_to_worker × 100`

### 9.3 Biểu đồ Tiến độ Dự án

Progress bar ngang cho từng project đang `in_progress`:  
Label: Tên dự án · % (màu sắc: <60% = blue / 60–85% = blue / >85% = green / sắp hạn = amber)

### 9.4 Report APIs

| Endpoint | Mô tả |
|----------|-------|
| `GET /api/reports/productivity` | Hiệu suất công nhân theo kỳ |
| `GET /api/reports/project-progress` | Tiến độ dự án |
| `GET /api/reports/labor-cost` | Chi phí nhân công theo dự án |
| `GET /api/reports/site-utilization` | Tỷ lệ sử dụng xưởng |
| `GET /api/reports/revenue` | Doanh thu theo kỳ (từ quotes approved/po_received) |

---

## Phân quyền (RBAC)

| Role | Quyền |
|------|-------|
| `admin` | Full access tất cả modules |
| `workshop_manager` | CRUD sites, workers, projects, customers, quotes; approve timesheet |
| `supervisor` | Tạo tasks, assign workers, view reports |
| `worker` | View task của mình, check-in/out (mobile app — Phase 3) |
| `accountant` | Chỉ đọc timesheet + báo cáo lương + xuất Excel |

---

## Luồng dữ liệu tổng thể

```
Sites ──────────────────────────────────────────────┐
                                                     ↓
Workers ─── Contracts ──────────────────► Task Assignments ────► Timesheet Entries
    ↑                                         ↑                       ↓
Customers ─ Projects ─ Quotes ─── Quote Items ─► Tasks          Monthly Summary
                                        ↑                             ↓
                                   Kanban Board               Payroll Export (Excel)
```

---

## Môi trường & Deploy

```yaml
Development:
  - Frontend: npm run dev (Vite port 5173)
  - Backend: npm run start:dev (NestJS port 3000)
  - MariaDB: localhost:3306/workshop_pro
  - Redis: localhost:6379 (Phase 3 only)

Production (Mắt Bão Plesk):
  - Frontend: Build dist/ → upload httpdocs/ (Nginx serve static)
  - Backend: Node.js process via Plesk, managed by PM2
  - Database: MariaDB trên cùng server Plesk
  - Domain: workshoppro.vn → static files
            workshoppro.vn/api/* → Nginx proxy → Node.js :3000
  - SSL: Let's Encrypt via Plesk
  - Deploy: 1-Click Code Deploy (Plesk GitHub integration)

WebSocket Note:
  Phase 1: Polling GET /api/tasks/board mỗi 5 giây (không cần WebSocket)
  Phase 3: Socket.io — cần kiểm tra Plesk Nginx WebSocket proxy config
```

---

## Ưu tiên phát triển (Roadmap)

### Phase 1 — MVP (Sprint 1–4, ~8 tuần)
- [x] Auth + User management (JWT stateless)
- [x] Module 0: Layout Shell (Sidebar + Topbar + Toast)
- [x] Module 2: Sites (CRUD)
- [x] Module 3: Workers + Contracts + Calculator preview
- [x] Module 5: Customers (3-tab modal + multi-contacts)
- [x] Module 7: Kanban (drag-drop + Transfer Drawer)
- [x] Module 8: Chấm công (tổng hợp tháng + xuất Excel)

### Phase 2 — Core Business (Sprint 5–8, ~8 tuần)
- [ ] Module 1: Dashboard (Activity Feed + Widgets)
- [ ] Module 4: Projects (link với Customers)
- [ ] Module 6: Quotes (full workflow + Preview A4 + PDF export)
- [ ] Module 9: Báo cáo Hiệu suất
- [ ] Global Search (Topbar)
- [ ] QC tracking (cơ bản)

### Phase 3 — Advanced (Sprint 9–12, ~8 tuần)
- [ ] Realtime Kanban (WebSocket / Socket.io)
- [ ] Notification system (Bell icon + Zalo OA / Email)
- [ ] User Dropdown (Đổi mật khẩu, Profile)
- [ ] Mobile app worker check-in
- [ ] Payroll integration
- [ ] Advanced reports + Excel nâng cao

---

*Tài liệu phiên bản 2.0 — đồng bộ với prototype `workshop_pro.html`. Mọi thay đổi cần review với stakeholder trước khi bắt đầu code từng module.*
