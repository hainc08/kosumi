-- ============================================================================
-- Kosumi Management Software — Schema + Data mẫu (MariaDB / MySQL)
-- Chạy trên phpMyAdmin:
--   1) Tạo (hoặc chọn) database, ví dụ: CREATE DATABASE kosumi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   2) Chọn database đó ở cột trái, vào tab "SQL", dán toàn bộ file này, bấm "Thực hiện".
-- File ĐÃ bao gồm DROP TABLE IF EXISTS nên chạy lại nhiều lần được (sẽ xoá & tạo lại + nạp lại data).
-- Đã cập nhật đủ 6 gói: has_installation, enum khách hàng/chức vụ mới, cột tăng ca (is_overtime/ot_end_at), industry.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ──────────────────────────────────────────────────────────────────────────
-- 1) CẤU TRÚC BẢNG
-- ──────────────────────────────────────────────────────────────────────────

-- ─── sites ───
DROP TABLE IF EXISTS `sites`;
CREATE TABLE `sites` (
  `id` char(36) NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(200) NOT NULL,
  `type` enum('factory','construction','warehouse') NOT NULL,
  `industrial_zone` varchar(200) DEFAULT NULL,
  `address` text NOT NULL,
  `city` varchar(100) DEFAULT NULL,
  `manager_id` char(36) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `area_m2` decimal(10,2) DEFAULT NULL,
  `status` enum('active','paused','preparing') NOT NULL DEFAULT 'active',
  `notes` text DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_sites_code` (`code`),
  KEY `idx_sites_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── customers ───
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` char(36) NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(200) NOT NULL,
  `type` enum('domestic','foreign','state','household','individual') NOT NULL,
  `industry` varchar(200) DEFAULT NULL,
  `tax_code` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `website` varchar(200) DEFAULT NULL,
  `status` enum('active','inactive','pending') NOT NULL DEFAULT 'active',
  `default_validity_days` int(11) NOT NULL DEFAULT 10,
  `default_delivery_days` int(11) NOT NULL DEFAULT 50,
  `default_payment_terms` varchar(50) NOT NULL DEFAULT '30-25-35-10',
  `default_warranty_note` text DEFAULT NULL,
  `default_special_note` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_customers_code` (`code`),
  KEY `idx_customers_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── workers ───
DROP TABLE IF EXISTS `workers`;
CREATE TABLE `workers` (
  `id` char(36) NOT NULL,
  `code` varchar(20) NOT NULL,
  `full_name` varchar(200) NOT NULL,
  `gender` enum('male','female') NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `id_number` varchar(20) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `position` enum('foreman','deputy_foreman','team_leader','deputy_leader','worker','director','deputy_director','chief_accountant','accountant','storekeeper','sales','other') NOT NULL,
  `specialty` varchar(200) DEFAULT NULL,
  `status` enum('working','on_leave','absent','resigned') NOT NULL DEFAULT 'working',
  `notes` text DEFAULT NULL,
  `site_id` char(36) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_workers_code` (`code`),
  KEY `idx_workers_status` (`status`),
  KEY `idx_workers_site_id` (`site_id`),
  CONSTRAINT `FK_workers_site` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── worker_contracts ───
DROP TABLE IF EXISTS `worker_contracts`;
CREATE TABLE `worker_contracts` (
  `id` char(36) NOT NULL,
  `worker_id` char(36) NOT NULL,
  `contract_type` enum('piece_rate','official','probation') NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `base_salary` decimal(15,2) DEFAULT NULL,
  `allowance_responsibility` decimal(15,2) DEFAULT NULL,
  `allowance_attendance` decimal(15,2) DEFAULT NULL,
  `rate_per_unit` decimal(15,2) DEFAULT NULL,
  `unit_name` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_contracts_worker` (`worker_id`),
  CONSTRAINT `FK_contracts_worker` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── customer_contacts ───
DROP TABLE IF EXISTS `customer_contacts`;
CREATE TABLE `customer_contacts` (
  `id` char(36) NOT NULL,
  `customer_id` char(36) NOT NULL,
  `full_name` varchar(200) NOT NULL,
  `title` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(200) DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_contacts_customer` (`customer_id`),
  CONSTRAINT `FK_contacts_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── projects ───
DROP TABLE IF EXISTS `projects`;
CREATE TABLE `projects` (
  `id` char(36) NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(200) NOT NULL,
  `customer_id` char(36) DEFAULT NULL,
  `project_type` enum('commercial','apartment','industrial','art','other') NOT NULL,
  `site_id` char(36) DEFAULT NULL,
  `contract_value` decimal(15,2) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `deadline` date NOT NULL,
  `actual_end_date` date DEFAULT NULL,
  `progress_pct` int(11) NOT NULL DEFAULT 0,
  `status` enum('planning','in_progress','near_deadline','completed','paused','cancelled') NOT NULL DEFAULT 'planning',
  `description` text DEFAULT NULL,
  `manager_id` char(36) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_projects_code` (`code`),
  KEY `idx_projects_status` (`status`),
  KEY `idx_projects_site_id` (`site_id`),
  KEY `idx_projects_customer_id` (`customer_id`),
  CONSTRAINT `FK_projects_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_projects_site` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── quotes ───
DROP TABLE IF EXISTS `quotes`;
CREATE TABLE `quotes` (
  `id` char(36) NOT NULL,
  `code` varchar(20) NOT NULL,
  `project_id` char(36) NOT NULL,
  `customer_id` char(36) DEFAULT NULL,
  `contact_id` char(36) DEFAULT NULL,
  `title` varchar(300) NOT NULL,
  `quote_date` date NOT NULL,
  `valid_until` date DEFAULT NULL,
  `status` enum('draft','pending','approved','rejected','po_received') NOT NULL DEFAULT 'draft',
  `reject_reason` text DEFAULT NULL,
  `tax_rate` decimal(5,2) NOT NULL DEFAULT 8.00,
  `validity_days` int(11) NOT NULL,
  `delivery_days` int(11) NOT NULL,
  `payment_terms` varchar(50) NOT NULL,
  `has_installation` tinyint(1) NOT NULL DEFAULT 0,
  `warranty_note` text DEFAULT NULL,
  `contractor_note` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_quotes_code` (`code`),
  KEY `idx_quotes_status` (`status`),
  KEY `idx_quotes_project_id` (`project_id`),
  KEY `idx_quotes_customer_id` (`customer_id`),
  CONSTRAINT `FK_quotes_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_quotes_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── quote_items ───
DROP TABLE IF EXISTS `quote_items`;
CREATE TABLE `quote_items` (
  `id` char(36) NOT NULL,
  `quote_id` char(36) NOT NULL,
  `section_name` varchar(200) DEFAULT NULL,
  `section_name_en` varchar(200) DEFAULT NULL,
  `sort_order` int(11) NOT NULL,
  `item_name` varchar(300) NOT NULL,
  `description` text DEFAULT NULL,
  `unit` varchar(50) NOT NULL,
  `quantity` decimal(15,2) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_quote_items_quote` (`quote_id`),
  CONSTRAINT `FK_quote_items_quote` FOREIGN KEY (`quote_id`) REFERENCES `quotes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── quote_payment_steps ───
DROP TABLE IF EXISTS `quote_payment_steps`;
CREATE TABLE `quote_payment_steps` (
  `id` char(36) NOT NULL,
  `quote_id` char(36) NOT NULL,
  `step_order` int(11) NOT NULL,
  `percentage` decimal(5,2) NOT NULL,
  `description` varchar(300) NOT NULL,
  `description_en` varchar(300) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_quote_steps_quote` (`quote_id`),
  CONSTRAINT `FK_quote_steps_quote` FOREIGN KEY (`quote_id`) REFERENCES `quotes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── tasks ───
DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
  `id` char(36) NOT NULL,
  `quote_item_id` char(36) DEFAULT NULL,
  `project_id` char(36) NOT NULL,
  `site_id` char(36) NOT NULL,
  `title` varchar(300) NOT NULL,
  `description` text DEFAULT NULL,
  `task_date` date NOT NULL,
  `status` enum('unassigned','in_progress','paused','completed','cancelled') NOT NULL DEFAULT 'unassigned',
  `priority` enum('high','medium','low') NOT NULL DEFAULT 'medium',
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_tasks_status` (`status`),
  KEY `idx_tasks_site_project_date` (`site_id`,`project_id`,`task_date`),
  KEY `idx_tasks_quote_item` (`quote_item_id`),
  KEY `idx_tasks_project` (`project_id`),
  CONSTRAINT `FK_tasks_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `FK_tasks_quote_item` FOREIGN KEY (`quote_item_id`) REFERENCES `quote_items` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_tasks_site` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── task_assignments ───
DROP TABLE IF EXISTS `task_assignments`;
CREATE TABLE `task_assignments` (
  `id` char(36) NOT NULL,
  `task_id` char(36) NOT NULL,
  `worker_id` char(36) NOT NULL,
  `assigned_at` datetime NOT NULL,
  `started_at` datetime DEFAULT NULL,
  `ended_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_overtime` tinyint(1) NOT NULL DEFAULT 0,
  `ot_end_at` datetime DEFAULT NULL,
  `transferred_from_task_id` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_assignments_task` (`task_id`),
  KEY `idx_assignments_worker` (`worker_id`),
  CONSTRAINT `FK_assignments_worker` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_assignments_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── timesheet_entries ───
DROP TABLE IF EXISTS `timesheet_entries`;
CREATE TABLE `timesheet_entries` (
  `id` char(36) NOT NULL,
  `worker_id` char(36) NOT NULL,
  `work_date` date NOT NULL,
  `site_id` char(36) DEFAULT NULL,
  `regular_hours` decimal(5,2) NOT NULL DEFAULT 0.00,
  `overtime_hours` decimal(5,2) NOT NULL DEFAULT 0.00,
  `day_type` enum('workday','leave_paid','leave_unpaid','holiday','absent') NOT NULL,
  `contract_type` enum('piece_rate','official','probation') NOT NULL,
  `rate_normal` decimal(15,2) DEFAULT NULL,
  `rate_overtime` decimal(15,2) DEFAULT NULL,
  `pay_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` enum('draft','pending_approval','approved','rejected') NOT NULL DEFAULT 'draft',
  `approved_by` char(36) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_timesheet_worker_date` (`worker_id`,`work_date`),
  KEY `idx_timesheet_worker` (`worker_id`),
  KEY `idx_timesheet_site` (`site_id`),
  CONSTRAINT `FK_timesheet_worker` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_timesheet_site` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────────────────────
-- 2) DATA MẪU
-- ──────────────────────────────────────────────────────────────────────────

-- ─── sites (2 nhà máy, 2 công trường, 1 kho) ───
INSERT INTO `sites` (`id`,`code`,`name`,`type`,`industrial_zone`,`address`,`city`,`phone`,`area_m2`,`status`,`notes`) VALUES
('a0000000-0000-0000-0000-000000000001','CS-001','Xưởng Cơ khí Hà Nội','factory','KCN Thăng Long','Lô A1, KCN Thăng Long, Đông Anh','Hà Nội','0241234567',1200.00,'active',NULL),
('a0000000-0000-0000-0000-000000000002','CS-002','Xưởng Nội thất Long Biên','factory',NULL,'Số 5 Ngõ 100 Nguyễn Văn Cừ, Long Biên','Hà Nội','0249876543',800.00,'active',NULL),
('a0000000-0000-0000-0000-000000000003','CS-003','Công trường Aeon Bình Tân','construction',NULL,'Aeon Mall Bình Tân, TP.HCM','TP.HCM','0281122334',NULL,'preparing',NULL),
('a0000000-0000-0000-0000-000000000004','CS-004','Kho vật tư Bắc Ninh','warehouse','KCN Quế Võ','Đường TS5, KCN Quế Võ, Bắc Ninh','Bắc Ninh','0222345678',2500.00,'active',NULL),
('a0000000-0000-0000-0000-000000000005','CS-005','Công trường Vincity Hà Nam','construction',NULL,'Khu đô thị Vincity, Phủ Lý, Hà Nam','Hà Nam','0226789012',NULL,'paused','Tạm hoãn chờ phê duyệt mặt bằng');

-- ─── workers (đủ chức vụ staff + management, nhiều trạng thái) ───
INSERT INTO `workers` (`id`,`code`,`full_name`,`gender`,`date_of_birth`,`phone`,`address`,`position`,`specialty`,`status`,`notes`,`site_id`) VALUES
('b0000000-0000-0000-0000-000000000001','NV-001','Nguyễn Văn An','male','1985-03-12','0901000001','Đông Anh, Hà Nội','foreman','Giám sát thi công','working',NULL,'a0000000-0000-0000-0000-000000000001'),
('b0000000-0000-0000-0000-000000000002','NV-002','Trần Văn Bình','male','1990-07-08','0901000002','Long Biên, Hà Nội','worker','Hàn kết cấu','working',NULL,'a0000000-0000-0000-0000-000000000001'),
('b0000000-0000-0000-0000-000000000003','NV-003','Lê Văn Cường','male','1992-11-20','0901000003','Gia Lâm, Hà Nội','worker','Lắp dựng thép','working',NULL,'a0000000-0000-0000-0000-000000000001'),
('b0000000-0000-0000-0000-000000000004','NV-004','Phạm Thị Dung','female','1988-05-30','0901000004','Hoàn Kiếm, Hà Nội','team_leader','Quản lý tổ thép','on_leave','Nghỉ phép năm','a0000000-0000-0000-0000-000000000002'),
('b0000000-0000-0000-0000-000000000005','NV-005','Hoàng Văn Em','male','1995-01-15','0901000005','Bắc Từ Liêm, Hà Nội','worker','Gia công cơ khí','working',NULL,'a0000000-0000-0000-0000-000000000002'),
('b0000000-0000-0000-0000-000000000006','NV-006','Vũ Thị Hoa','female','1980-09-09','0901000006','Cầu Giấy, Hà Nội','director','Quản trị doanh nghiệp','working',NULL,NULL),
('b0000000-0000-0000-0000-000000000007','NV-007','Đặng Văn Giang','male','1993-04-22','0901000007','Long Biên, Hà Nội','worker','Sơn tĩnh điện','absent','Nghỉ không phép 1 ngày','a0000000-0000-0000-0000-000000000002'),
('b0000000-0000-0000-0000-000000000008','NV-008','Bùi Thị Hạnh','female','1987-12-02','0901000008','Đống Đa, Hà Nội','chief_accountant','Kế toán tài chính','working',NULL,NULL),
('b0000000-0000-0000-0000-000000000009','NV-009','Ngô Văn Khoa','male','1991-06-18','0901000009','Phủ Lý, Hà Nam','deputy_leader','Lắp dựng','working',NULL,'a0000000-0000-0000-0000-000000000003'),
('b0000000-0000-0000-0000-000000000010','NV-010','Lý Văn Long','male','1989-08-25','0901000010','Quế Võ, Bắc Ninh','storekeeper','Thủ kho','working',NULL,'a0000000-0000-0000-0000-000000000004');

-- ─── worker_contracts ───
INSERT INTO `worker_contracts` (`id`,`worker_id`,`contract_type`,`start_date`,`end_date`,`base_salary`,`allowance_responsibility`,`allowance_attendance`,`rate_per_unit`,`unit_name`,`is_active`) VALUES
('b1000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','official','2022-01-01',NULL,12000000.00,2000000.00,500000.00,NULL,NULL,1),
('b1000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000002','official','2023-03-01',NULL,8000000.00,0.00,500000.00,NULL,NULL,1),
('b1000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000003','piece_rate','2023-06-15',NULL,NULL,NULL,NULL,250000.00,'m²',1),
('b1000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000005','probation','2026-05-01','2026-07-31',6000000.00,0.00,0.00,NULL,NULL,1);

-- ─── customers (đủ 5 loại type + industry tự nhập) ───
INSERT INTO `customers` (`id`,`code`,`name`,`type`,`industry`,`tax_code`,`address`,`website`,`status`,`default_validity_days`,`default_delivery_days`,`default_payment_terms`,`notes`) VALUES
('c0000000-0000-0000-0000-000000000001','KH-001','Công ty TNHH Aeon Việt Nam','foreign','Bán lẻ','0301234567','30 Bờ Bao Tân Thắng, Bình Tân, TP.HCM','https://aeon.com.vn','active',10,50,'30-25-35-10',NULL),
('c0000000-0000-0000-0000-000000000002','KH-002','Tập đoàn Vingroup','domestic','Bất động sản','0302345678','7 Bằng Lăng 1, Vinhomes Riverside, Hà Nội','https://vingroup.net','active',15,60,'50-50',NULL),
('c0000000-0000-0000-0000-000000000003','KH-003','Ban QLDA Đầu tư Xây dựng tỉnh Hà Nam','state','Đầu tư công','0700123456','Đường Lê Chân, Phủ Lý, Hà Nam',NULL,'active',10,50,'30-25-35-10','Khách hàng nhà nước'),
('c0000000-0000-0000-0000-000000000004','KH-004','Hộ kinh doanh Cơ khí Minh Phát','household','Cơ khí gia dụng',NULL,'Số 12 Ngõ 8 Lê Trọng Tấn, Hà Nội',NULL,'active',7,30,'50-50',NULL),
('c0000000-0000-0000-0000-000000000005','KH-005','Ông Nguyễn Văn Tú','individual',NULL,NULL,'Phường Dịch Vọng, Cầu Giấy, Hà Nội',NULL,'pending',10,45,'30-25-35-10','Khách lẻ');

-- ─── customer_contacts ───
INSERT INTO `customer_contacts` (`id`,`customer_id`,`full_name`,`title`,`phone`,`email`,`is_primary`,`sort_order`) VALUES
('c1000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','Tanaka Hiroshi','Giám đốc dự án','0911000001','tanaka@aeon.com.vn',1,0),
('c1000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000002','Lê Thị Mai','Trưởng phòng mua hàng','0911000002','mai.lt@vingroup.net',1,0),
('c1000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000003','Trần Quốc Hùng','Cán bộ kỹ thuật','0911000003','hung.tq@hanam.gov.vn',1,0),
('c1000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000004','Phạm Minh Phát','Chủ hộ','0911000004',NULL,1,0),
('c1000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000005','Nguyễn Văn Tú','Chủ nhà','0911000005',NULL,1,0);

-- ─── projects (P1,P2 ở công trường; P3,P4 ở nhà máy) ───
INSERT INTO `projects` (`id`,`code`,`name`,`customer_id`,`project_type`,`site_id`,`contract_value`,`start_date`,`deadline`,`actual_end_date`,`progress_pct`,`status`,`description`) VALUES
('d0000000-0000-0000-0000-000000000001','DA-001','Nhà máy Aeon Bình Tân - Kết cấu thép','c0000000-0000-0000-0000-000000000001','commercial','a0000000-0000-0000-0000-000000000003',2000000000.00,'2026-01-20','2026-08-30',NULL,45,'in_progress','Cung cấp & lắp dựng kết cấu thép'),
('d0000000-0000-0000-0000-000000000002','DA-002','Nội thất Vincity Hà Nam','c0000000-0000-0000-0000-000000000002','apartment','a0000000-0000-0000-0000-000000000005',1500000000.00,'2026-03-15','2026-07-15',NULL,70,'near_deadline','Sản xuất & lắp đặt nội thất căn hộ'),
('d0000000-0000-0000-0000-000000000003','DA-003','Gia công cơ khí Vingroup','c0000000-0000-0000-0000-000000000002','industrial','a0000000-0000-0000-0000-000000000001',900000000.00,NULL,'2026-09-30',NULL,0,'planning','Gia công khung máy CNC'),
('d0000000-0000-0000-0000-000000000004','DA-004','Tủ bếp hộ Minh Phát','c0000000-0000-0000-0000-000000000004','other','a0000000-0000-0000-0000-000000000002',45000000.00,'2025-10-10','2025-12-15','2025-12-10',100,'completed','Đã bàn giao');

-- ─── quotes (Q1,Q2 has_installation=1 → dự án "có lắp đặt"; doanh thu: Q1/Q2 2026, Q4 2025) ───
INSERT INTO `quotes` (`id`,`code`,`project_id`,`customer_id`,`contact_id`,`title`,`quote_date`,`valid_until`,`status`,`tax_rate`,`validity_days`,`delivery_days`,`payment_terms`,`has_installation`,`notes`) VALUES
('e0000000-0000-0000-0000-000000000001','BG-001','d0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','Báo giá kết cấu thép Aeon Bình Tân','2026-01-15','2026-01-25','approved',8.00,10,50,'30-25-35-10',1,NULL),
('e0000000-0000-0000-0000-000000000002','BG-002','d0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000002','Báo giá nội thất Vincity Hà Nam','2026-03-10','2026-03-25','po_received',8.00,15,60,'50-50',1,NULL),
('e0000000-0000-0000-0000-000000000003','BG-003','d0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000002','Báo giá gia công khung máy CNC','2026-05-20','2026-06-05','pending',8.00,15,60,'50-50',0,NULL),
('e0000000-0000-0000-0000-000000000004','BG-004','d0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000004','Báo giá tủ bếp hộ Minh Phát','2025-11-05','2025-11-15','approved',8.00,7,30,'50-50',0,NULL);

-- ─── quote_items (section = đầu mục, item = hạng mục) ───
INSERT INTO `quote_items` (`id`,`quote_id`,`section_name`,`sort_order`,`item_name`,`unit`,`quantity`,`unit_price`,`amount`) VALUES
('e1000000-0000-0000-0000-000000000001','e0000000-0000-0000-0000-000000000001','Kết cấu thép',1,'Cột thép H350','cây',20.00,4500000.00,90000000.00),
('e1000000-0000-0000-0000-000000000002','e0000000-0000-0000-0000-000000000001','Kết cấu thép',2,'Dầm thép I400','cây',15.00,3800000.00,57000000.00),
('e1000000-0000-0000-0000-000000000003','e0000000-0000-0000-0000-000000000001','Lắp đặt',3,'Lắp dựng tại công trường','gói',1.00,35000000.00,35000000.00),
('e1000000-0000-0000-0000-000000000004','e0000000-0000-0000-0000-000000000002','Nội thất gỗ',1,'Tủ bếp trên+dưới','bộ',10.00,12000000.00,120000000.00),
('e1000000-0000-0000-0000-000000000005','e0000000-0000-0000-0000-000000000002','Nội thất gỗ',2,'Vách ngăn CNC','m²',25.00,2400000.00,60000000.00),
('e1000000-0000-0000-0000-000000000006','e0000000-0000-0000-0000-000000000003','Gia công',1,'Khung máy CNC','bộ',5.00,18000000.00,90000000.00),
('e1000000-0000-0000-0000-000000000007','e0000000-0000-0000-0000-000000000004','Tủ bếp',1,'Tủ bếp gỗ sồi','bộ',3.00,15000000.00,45000000.00);

-- ─── quote_payment_steps ───
INSERT INTO `quote_payment_steps` (`id`,`quote_id`,`step_order`,`percentage`,`description`) VALUES
('e2000000-0000-0000-0000-000000000001','e0000000-0000-0000-0000-000000000001',1,30.00,'Tạm ứng khi ký hợp đồng'),
('e2000000-0000-0000-0000-000000000002','e0000000-0000-0000-0000-000000000001',2,25.00,'Khi tập kết vật tư'),
('e2000000-0000-0000-0000-000000000003','e0000000-0000-0000-0000-000000000001',3,35.00,'Khi lắp dựng xong'),
('e2000000-0000-0000-0000-000000000004','e0000000-0000-0000-0000-000000000001',4,10.00,'Sau nghiệm thu'),
('e2000000-0000-0000-0000-000000000005','e0000000-0000-0000-0000-000000000002',1,50.00,'Tạm ứng'),
('e2000000-0000-0000-0000-000000000006','e0000000-0000-0000-0000-000000000002',2,50.00,'Sau bàn giao');

-- ─── tasks (gắn quote_item = hạng mục) ───
INSERT INTO `tasks` (`id`,`quote_item_id`,`project_id`,`site_id`,`title`,`task_date`,`status`,`priority`,`sort_order`) VALUES
('f0000000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000003','Gia công cột thép H350','2026-06-20','in_progress','high',1),
('f0000000-0000-0000-0000-000000000002','e1000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000003','Gia công dầm thép I400','2026-06-20','unassigned','medium',2),
('f0000000-0000-0000-0000-000000000003','e1000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000003','Lắp dựng tại công trường','2026-06-20','in_progress','high',3),
('f0000000-0000-0000-0000-000000000004','e1000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000005','Sản xuất tủ bếp','2026-06-18','completed','medium',1),
('f0000000-0000-0000-0000-000000000005','e1000000-0000-0000-0000-000000000006','d0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000001','Gia công khung máy CNC','2026-06-21','unassigned','low',1);

-- ─── task_assignments (A2 = ca tăng ca: bắt đầu 17:15, +2h kết thúc 19:15) ───
INSERT INTO `task_assignments` (`id`,`task_id`,`worker_id`,`assigned_at`,`started_at`,`ended_at`,`is_active`,`is_overtime`,`ot_end_at`,`transferred_from_task_id`) VALUES
('f1000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002','2026-06-20 08:00:00','2026-06-20 08:00:00',NULL,1,0,NULL,NULL),
('f1000000-0000-0000-0000-000000000002','f0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000003','2026-06-20 17:15:00','2026-06-20 17:15:00',NULL,1,1,'2026-06-20 19:15:00',NULL),
('f1000000-0000-0000-0000-000000000003','f0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000009','2026-06-20 09:30:00','2026-06-20 09:30:00',NULL,1,0,NULL,'f0000000-0000-0000-0000-000000000002'),
('f1000000-0000-0000-0000-000000000004','f0000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000005','2026-06-18 08:00:00','2026-06-18 08:00:00','2026-06-18 17:00:00',0,0,NULL,NULL);

-- ─── timesheet_entries ───
INSERT INTO `timesheet_entries` (`id`,`worker_id`,`work_date`,`site_id`,`regular_hours`,`overtime_hours`,`day_type`,`contract_type`,`rate_normal`,`rate_overtime`,`pay_amount`,`status`) VALUES
('a1000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002','2026-06-20','a0000000-0000-0000-0000-000000000003',8.00,0.00,'workday','official',45000.00,67500.00,360000.00,'approved'),
('a1000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000003','2026-06-20','a0000000-0000-0000-0000-000000000003',8.00,2.00,'workday','piece_rate',50000.00,75000.00,550000.00,'pending_approval'),
('a1000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000005','2026-06-18','a0000000-0000-0000-0000-000000000005',8.00,0.00,'workday','probation',37500.00,56250.00,300000.00,'approved'),
('a1000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000004','2026-06-20',NULL,0.00,0.00,'leave_paid','official',NULL,NULL,0.00,'approved');

SET FOREIGN_KEY_CHECKS = 1;

-- HẾT. Kiểm tra nhanh: SELECT COUNT(*) FROM sites; -- (5)
