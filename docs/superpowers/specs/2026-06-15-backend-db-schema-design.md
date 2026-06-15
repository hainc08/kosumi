# Spec 1 — Nền tảng Database (MariaDB)

> WorkShop Pro — giai đoạn backend. Phương án **A (vertical slice theo module)**.
> Nguồn chân lý của data model là `frontend/src/types/index.ts` (prototype đã chạy), KHÔNG phải các doc agent cũ.

## Bối cảnh & quyết định nền

| Hạng mục | Quyết định | Lý do |
|---|---|---|
| Khóa chính | `char(36)` UUID (`@PrimaryGeneratedColumn('uuid')`) | FE coi `id` là chuỗi mờ → không phải sửa. Bỏ id kiểu `w-1`. |
| Mã nghiệp vụ | cột `code` riêng, `varchar` UNIQUE (CN001, CS001, PRJ001, BG2026...) | Sinh bằng count+pad trong transaction ở service. |
| Tiền tệ | `decimal(15,2)` + `ColumnNumericTransformer` (string↔number) | TypeORM trả `decimal` ra **string** — phải transform về `number`, nếu không FE tính sai. Đơn vị VNĐ. |
| Ngày | `date` cho ngày thuần (workDate, quoteDate, startDate, deadline...); `datetime` cho created/updated + timestamps phân công | API trao đổi `YYYY-MM-DD` với ngày thuần, ISO với timestamp. |
| Enum | cột `ENUM(...)` khớp **đúng literal union** trong `types/index.ts` | KHÔNG dùng `hourly/daily/monthly` của doc cũ. |
| Xóa mềm | `@DeleteDateColumn deleted_at` trên 5 bảng master (sites, workers, customers, projects, quotes) | Rule "không hard delete"; check FK trước khi xóa → 409. |
| Timestamps | `@CreateDateColumn created_at` / `@UpdateDateColumn updated_at` | |

## Stack
NestJS (latest) + TypeORM + MariaDB 10.11 + Redis 7 (đã có trong `docker-compose.yml`). Migration chạy bằng TypeORM CLI qua `data-source.ts`.

## 12 bảng + thứ tự migration (theo phụ thuộc FK)

```
1  sites
2  workers              → site_id (FK sites, nullable)
3  worker_contracts     → worker_id ; 1 active/worker (ép ở service)
4  customers
5  customer_contacts    → customer_id ; is_primary
6  projects             → customer_id (nullable), site_id (nullable)
7  quotes               → project_id, customer_id (nullable), contact_id (nullable)
8  quote_items          → quote_id ; section_name nhóm hạng mục
9  quote_payment_steps  → quote_id
10 tasks                → quote_item_id (nullable), project_id, site_id
11 task_assignments     → task_id, worker_id ; 1 active/worker (ép ở service)
12 timesheet_entries    → worker_id, site_id (nullable) ; UNIQUE(worker_id, work_date)
```

**KHÔNG tạo bảng `timesheet_monthly_summary`** — `MonthlySummary` là tổng hợp (gộp theo `DATE_FORMAT(work_date,'%Y-%m')`), tính ở service đúng như `api/timesheet.ts` hiện nay. Tránh dữ liệu trùng lặp.

**Bảng `users` (auth)**: hoãn sang phase sau theo quyết định "làm CRUD trước". Cột `manager_id`, `approved_by` để kiểu `char(36)` nullable, CHƯA gắn FK tới `users`.

## Enum chuẩn (khớp prototype)

- `sites.type`: `factory | construction | warehouse`
- `sites.status`: `active | paused | preparing`
- `workers.status`: `working | on_leave | absent | resigned`
- `workers.position`: `team_leader | senior_worker | worker | apprentice | technician | supervisor | other`
- `worker_contracts.contract_type`: `piece_rate | official | probation` ← **đúng prototype**, bỏ hourly/daily/monthly
- `customers.type`: `business | studio | foreign | state`
- `customers.status`: `active | inactive | pending`
- `projects.project_type`: `commercial | apartment | industrial | art | other`
- `projects.status`: `planning | in_progress | near_deadline | completed | paused | cancelled`
- `quotes.status`: `draft | pending | approved | rejected | po_received`
- `tasks.status`: `unassigned | in_progress | paused | completed | cancelled`
- `tasks.priority`: `high | medium | low`
- `timesheet_entries.day_type`: `workday | leave_paid | leave_unpaid | holiday | absent`
- `timesheet_entries.status`: `draft | pending_approval | approved | rejected`

## Sửa cho đúng MariaDB (doc `03-database-agent.md` là PostgreSQL → BỎ)

1. **Partial index** `... WHERE is_active=TRUE` không có trên MariaDB → thay bằng **logic transaction ở service** ("deactivate bản cũ → insert bản active") + index thường trên `worker_id`. Áp cho `worker_contracts` và `task_assignments`.
2. `DATE_TRUNC('month', ...)` → `DATE_FORMAT(work_date, '%Y-%m')`.
3. Hàm `calculate_pay` plpgsql → **bỏ**; port `utils/timesheet-calc.ts` thành `PayCalculatorService`. `timesheet_entries.pay_amount` **lưu**, tính lúc ghi.
4. `gen_random_uuid()` (Postgres) → để TypeORM tự sinh UUID qua `@PrimaryGeneratedColumn('uuid')`.

## Trường tính toán: lưu hay tính khi đọc?

| Trường | Cách làm |
|---|---|
| `timesheet_entries.pay_amount` | **Lưu** — tính lúc create/update bằng `PayCalculatorService` |
| `quote_items.amount` = quantity × unit_price | **Lưu** — tính lúc ghi |
| Quote `subtotal/taxAmount/totalAmount/itemCount/sectionCount` | **Tính khi đọc** từ items |
| Site `workerCount/projectCount` | **Tính khi đọc** (COUNT subquery) |
| Project `quoteCount/workerCount` | **Tính khi đọc** |
| Customer `projectCount/quoteCount/totalContractValue` | **Tính khi đọc** (COUNT/SUM) |
| Worker `initials/avatarColor` | **Tính ở response transformer** (deterministic từ tên/id) — giữ shape, FE không đổi |
| Worker `activeContract` | **Join** (contract WHERE is_active) |
| Task `assignments/activeWorkers` | **Tính khi đọc** (port `enrichTask` vào service) |
| `MonthlySummary` | **Tính khi đọc** (endpoint tổng hợp) |

## Index quan trọng (MariaDB hợp lệ)

```sql
CREATE INDEX idx_workers_site_id        ON workers(site_id);
CREATE INDEX idx_workers_status         ON workers(status);
CREATE INDEX idx_contracts_worker       ON worker_contracts(worker_id);
CREATE INDEX idx_tasks_site_proj_date   ON tasks(site_id, project_id, task_date);
CREATE INDEX idx_tasks_status           ON tasks(status);
CREATE INDEX idx_assignments_task       ON task_assignments(task_id);
CREATE INDEX idx_assignments_worker     ON task_assignments(worker_id);
CREATE UNIQUE INDEX uq_timesheet_worker_date ON timesheet_entries(worker_id, work_date);
CREATE INDEX idx_quote_items_quote      ON quote_items(quote_id);
```

## Seed
Port nguyên seed của prototype (`frontend/src/mocks/seed/*`) sang `src/database/seeds/initial.seed.ts`: 5 sites, 8 workers + contracts (piece_rate/official/probation), customers + contacts, projects, quotes + items + payment steps, tasks + 3 active assignments, timesheet tháng 6/2026. Bỏ seed cũ trong `03-database-agent.md` (sai contract type + skill).

## Sửa type FE (duy nhất)
Thêm `siteId: string | null` vào interface `Worker` trong `frontend/src/types/index.ts` (seed + `Sites.ts` đã dùng `w.siteId` nhưng type chưa khai báo). Không đụng component.

## Phạm vi NGOÀI spec này
Auth/users, phân quyền, realtime websocket Kanban, báo cáo nâng cao — phase sau.
