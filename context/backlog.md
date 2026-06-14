# WorkShop Pro — Backlog & Feature Gaps
# File: context/backlog.md
# Cập nhật: 12/06/2026 — Review bởi Senior Factory Ops

---

## 🎯 SPRINT HIỆN TẠI — 6 Module Core (Ưu tiên cao nhất)

Hoàn thành đầy đủ luồng chính cho 6 module sau trước khi làm bất kỳ tính năng mới nào:

| # | Module | Spec ref | Trạng thái |
|---|--------|----------|------------|
| 1 | **Báo giá** — full workflow (tạo, duyệt, từ chối, xem trước A4, PDF) | Module 6 | 🔲 Chưa làm |
| 2 | **Khách hàng** — CRUD, 3 tabs, multi-contacts, điều khoản mặc định | Module 5 | 🔲 Chưa làm |
| 3 | **Quản lý Dự án** — CRUD, link KH, tiến độ, cảnh báo deadline | Module 4 | 🔲 Chưa làm |
| 4 | **Giao công việc (Kanban)** — 4 bước, drag-drop, Transfer Drawer | Module 7 | 🔲 Chưa làm |
| 5 | **Quản lý Nhân viên** — CRUD, hợp đồng, calculator lương | Module 3 | 🔲 Chưa làm |
| 6 | **Chấm công** — tổng hợp tháng, duyệt, xuất Excel | Module 8 | 🔲 Chưa làm |

> **Ghi chú:** Module 0 (Layout Shell), Module 1 (Dashboard), Module 2 (Sites), Module 9 (Báo cáo)
> sẽ được xây dựng song song hoặc sau khi 6 module core hoàn thành.

---

## 📋 BACKLOG — Tính năng thiếu từ Review Vận hành

*(Tổng hợp từ buổi review ngày 12/06/2026 — Góc nhìn Senior Factory Operations Manager)*

---

### 🔴 NHÓM A — Critical (ảnh hưởng vận hành hàng ngày)

#### A1. Leave Request — Quy trình xin nghỉ phép
- **Vấn đề:** Hiện tại manager tự set `day_type` trong timesheet. Không có luồng công nhân xin phép → dễ tranh chấp.
- **Cần làm:**
  - [ ] Bảng `leave_requests` (worker_id, date_from, date_to, type: paid/unpaid, reason, status: pending/approved/rejected, approved_by)
  - [ ] API: `POST /api/leave-requests`, `PATCH /api/leave-requests/:id/approve`
  - [ ] UI: form xin nghỉ (worker) + danh sách duyệt (manager)
  - [ ] Khi approved → tự động set `day_type` tương ứng trong timesheet
- **Phase đề xuất:** Phase 2

---

#### A2. Salary Advance — Tạm ứng lương
- **Vấn đề:** Công nhân xây dựng/cơ khí ~100% có nhu cầu tạm ứng. Thiếu → vẫn dùng Excel song song.
- **Cần làm:**
  - [ ] Bảng `salary_advances` (worker_id, amount, advance_date, approved_by, deduct_month, status)
  - [ ] API: `POST /api/advances`, `GET /api/advances?worker_id=`
  - [ ] UI: form tạm ứng + list + tự động trừ vào `monthly_summary.total_pay`
  - [ ] Cột "Tạm ứng" và "Thực lĩnh" trong bảng chấm công tháng
- **Phase đề xuất:** Phase 2

---

#### A3. Daily Log — Nhật báo ca sản xuất
- **Vấn đề:** Trưởng ca cần ghi lại sản lượng, sự cố, ghi chú. Bằng chứng khi tranh chấp tiến độ với KH.
- **Cần làm:**
  - [ ] Bảng `daily_logs` (site_id, log_date, shift, produced_qty, notes, issues, created_by)
  - [ ] API: `POST /api/daily-logs`, `GET /api/daily-logs?site_id=&date=`
  - [ ] UI: form điền nhật báo cuối ca + xem lịch sử nhật báo theo xưởng
- **Phase đề xuất:** Phase 2

---

#### A4. Shift — Ca làm việc
- **Vấn đề:** Kanban reset 17:00 chỉ phù hợp 1 ca. Nhiều xưởng có ca sáng/chiều/đêm.
- **Cần làm:**
  - [ ] Thêm trường `shift ENUM('morning','afternoon','night','full_day')` vào `task_assignments` và `timesheet_entries`
  - [ ] Config giờ bắt đầu/kết thúc mỗi ca trong Settings
  - [ ] Logic OT tính theo ca thay vì cứng 17:00
  - [ ] Kanban: filter/switch theo ca
- **Phase đề xuất:** Phase 2

---

#### A5. Project Cost — Chi phí vật tư dự án
- **Vấn đề:** Có doanh thu (từ quotes) nhưng không có chi phí → không tính được lợi nhuận dự án.
- **Cần làm:**
  - [ ] Bảng `project_costs` (project_id, category: material/tool/subcontract/other, description, amount, cost_date, created_by)
  - [ ] API: `POST /api/projects/:id/costs`, `GET /api/projects/:id/costs`
  - [ ] UI: tab "Chi phí" trong detail drawer dự án
  - [ ] Báo cáo: doanh thu - chi phí nhân công - chi phí vật tư = lợi nhuận ước tính
- **Phase đề xuất:** Phase 2

---

### 🟡 NHÓM B — Important (nâng cao chất lượng quản lý)

#### B1. Worker Certifications — Chứng chỉ kỹ năng
- **Vấn đề:** Thợ hàn TIG, vận hành CNC... cần chứng chỉ có thời hạn. An toàn lao động bắt buộc.
- **Cần làm:**
  - [ ] Bảng `worker_certifications` (worker_id, cert_name, cert_number, issued_by, issued_date, expiry_date)
  - [ ] Alert khi chứng chỉ hết hạn trong 30 ngày (banner Dashboard)
  - [ ] (Tùy chọn) Validate khi giao task: cảnh báo nếu worker thiếu cert yêu cầu
- **Phase đề xuất:** Phase 2

---

#### B2. Bonus & Penalty — Thưởng phạt
- **Vấn đề:** Thưởng chuyên cần, phạt đi trễ/làm hỏng. Hiện không có chỗ ghi → không cộng/trừ được vào lương.
- **Cần làm:**
  - [ ] Bảng `worker_adjustments` (worker_id, year_month, type: bonus/penalty, amount, reason, created_by)
  - [ ] UI: trong màn hình chấm công tháng, cho phép thêm dòng thưởng/phạt
  - [ ] Tự động cộng/trừ vào `monthly_summary.total_pay`
- **Phase đề xuất:** Phase 2

---

#### B3. BHXH fields — Bảo hiểm xã hội trong hồ sơ CN
- **Vấn đề:** Hồ sơ workers hiện thiếu thông tin BHXH — nghĩa vụ pháp lý khi thanh kiểm tra.
- **Cần làm:**
  - [ ] Thêm vào bảng `workers`: `bhxh_number VARCHAR(20)`, `bhyt_number VARCHAR(20)`, `bhxh_enrolled_date DATE`, `bhxh_rate_pct NUMERIC(5,2) DEFAULT 10.5`
  - [ ] Hiển thị trong tab thông tin worker
  - [ ] (Phase 3) Tính khấu trừ BHXH vào lương net
- **Phase đề xuất:** Phase 1 (chỉ thêm fields — không cần logic)

---

#### B4. Project Delivery — Bàn giao dự án
- **Vấn đề:** Không có bước bàn giao thực tế → tranh chấp bảo hành sau này.
- **Cần làm:**
  - [ ] Thêm vào bảng `projects`: `delivered_at TIMESTAMP`, `delivery_notes TEXT`, `warranty_months INT DEFAULT 12`, `warranty_end_date DATE`
  - [ ] UI: nút "Bàn giao" trong detail dự án → modal điền ngày + ghi chú → set status=completed
  - [ ] Tự tính `warranty_end_date = delivered_at + warranty_months`
- **Phase đề xuất:** Phase 2

---

#### B5. Deadline Alert — Cảnh báo trực quan
- **Vấn đề:** Spec đổi status `near_deadline` nhưng không ai nhận thông báo nếu không mở phần mềm.
- **Cần làm:**
  - [ ] Dashboard: Banner cảnh báo "⚠ N dự án sắp đến hạn trong 14 ngày" (click → link vào danh sách)
  - [ ] Bảng dự án: row highlight màu vàng/đỏ khi `near_deadline` / `overdue`
  - [ ] (Phase 3) Zalo OA / Email alert
- **Phase đề xuất:** Phase 1 (chỉ UI — không cần backend mới)

---

#### B6. OT Approval — Duyệt tăng ca trước
- **Vấn đề:** OT đang auto-detect sau 17:00. Quản lý muốn kiểm soát trước, không để OT tràn lan.
- **Cần làm:**
  - [ ] Thêm `ot_approved BOOLEAN DEFAULT FALSE` vào `task_assignments`
  - [ ] UI: supervisor phải tick "Cho phép tăng ca" trước khi assign sau 17:00
  - [ ] Chỉ tính OT pay khi `ot_approved = TRUE`
- **Phase đề xuất:** Phase 2

---

### 🟢 NHÓM C — Nice to Have

#### C1. Task Comments — Ghi chú trên công việc
- [ ] Bảng `task_comments` (task_id, user_id, content, created_at)
- [ ] UI: section comment ở cuối task card (drawer)
- **Phase đề xuất:** Phase 2

---

#### C2. Task Attachments — Đính kèm bản vẽ
- [ ] Bảng `task_attachments` (task_id, file_name, file_url, file_size, uploaded_by)
- [ ] Upload lên server hoặc link Google Drive
- [ ] Hiển thị thumbnail/link trong task card
- **Phase đề xuất:** Phase 3

---

#### C3. Equipment Management — Quản lý máy móc
- [ ] Bảng `equipment` (code, name, type, serial_no, site_id, status, next_maintenance_date, notes)
- [ ] UI: danh sách máy + filter theo xưởng + alert sắp bảo dưỡng
- [ ] (Phase 4) Link equipment vào task — track máy nào đang dùng cho việc gì
- **Phase đề xuất:** Phase 3

---

#### C4. System Settings — Cài đặt hệ thống
- **Vấn đề:** Nhiều giá trị đang hardcode (giờ OT, ngày cảnh báo, VAT, tên công ty trên BG).
- **Cần làm:**
  - [ ] Bảng `system_config` (key VARCHAR(100) PK, value TEXT, description TEXT, updated_by, updated_at)
  - [ ] UI: Module 10 — Cài đặt (admin only), dạng form key-value có label mô tả
  - [ ] Các key cần config: `company_name`, `company_address`, `company_phone`, `company_tax_code`, `default_vat_rate`, `ot_start_hour`, `deadline_warning_days`, `timesheet_reset_hour`, `default_work_hours_per_day`
- **Phase đề xuất:** Phase 2

---

## 📌 Roadmap đề xuất (sau khi xong 6 Module Core)

```
Phase 2 (ưu tiên):
  ✦ A3: Daily Log
  ✦ A5: Project Cost (lợi nhuận dự án)
  ✦ B3: BHXH fields (thêm vào form Worker — dễ)
  ✦ B5: Deadline Alert UI
  ✦ A2: Salary Advance
  ✦ A4: Shift Management
  ✦ C4: System Settings
  ✦ B1: Worker Certifications
  ✦ B2: Bonus & Penalty
  ✦ B4: Project Delivery
  ✦ A1: Leave Request
  ✦ B6: OT Approval
  ✦ C1: Task Comments

Phase 3:
  ✦ C2: Task Attachments
  ✦ C3: Equipment Management
  ✦ Notification (Zalo OA / Email)
  ✦ Realtime Kanban (WebSocket)
  ✦ Mobile app worker check-in
```

---

*Backlog này được review bởi Senior Factory Ops Manager — 12/06/2026*
*Cập nhật khi có tính năng mới được phát hiện hoặc phê duyệt.*
