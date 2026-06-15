-- WorkShop Pro (KosumiApp) — Database Schema (MariaDB)
-- Sinh tự động từ SHOW CREATE TABLE. Deploy: chạy nguyên file này trên DB staging trống.
-- Engine: MariaDB 10.11+ / 12.x. Charset utf8mb4.

SET FOREIGN_KEY_CHECKS = 0;

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
  UNIQUE KEY `UQ_dde6621eadc0c9c9621360ec668` (`code`),
  KEY `idx_sites_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── customers ───
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` char(36) NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(200) NOT NULL,
  `type` enum('business','studio','foreign','state') NOT NULL,
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
  UNIQUE KEY `UQ_f2eee14aa1fe3e956fe193c142f` (`code`),
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
  `position` enum('team_leader','senior_worker','worker','apprentice','technician','supervisor','other') NOT NULL,
  `experience_years` int(11) NOT NULL DEFAULT 0,
  `status` enum('working','on_leave','absent','resigned') NOT NULL DEFAULT 'working',
  `notes` text DEFAULT NULL,
  `site_id` char(36) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_5c7c285f4c82664c533f8ec66ac` (`code`),
  KEY `idx_workers_status` (`status`),
  KEY `idx_workers_site_id` (`site_id`),
  CONSTRAINT `FK_f06ca6d15de612fc339464c3114` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`) ON DELETE SET NULL
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
  CONSTRAINT `FK_19763088cae4df7ea40a435b224` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`) ON DELETE CASCADE
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
  CONSTRAINT `FK_76ca61fed7339b9f358599f9fda` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
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
  UNIQUE KEY `UQ_d95a87318392465ab663a32cc4f` (`code`),
  KEY `idx_projects_status` (`status`),
  KEY `idx_projects_site_id` (`site_id`),
  KEY `idx_projects_customer_id` (`customer_id`),
  CONSTRAINT `FK_8ee9cae5efccf846467e1cb005c` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_fab3bdce6bafb21d73f6d84f185` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`) ON DELETE SET NULL
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
  `warranty_note` text DEFAULT NULL,
  `contractor_note` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_55d9738ea10e8be70e7d177eda2` (`code`),
  KEY `idx_quotes_status` (`status`),
  KEY `idx_quotes_project_id` (`project_id`),
  KEY `idx_quotes_customer_id` (`customer_id`),
  CONSTRAINT `FK_48f2dd2ff22c259c8a028267f76` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_a11bdb4a739328d1009c0b47e83` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL
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
  CONSTRAINT `FK_c11d594b8cf436caaee20122fd8` FOREIGN KEY (`quote_id`) REFERENCES `quotes` (`id`) ON DELETE CASCADE
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
  CONSTRAINT `FK_903118ddf00b44f68f51e0328fc` FOREIGN KEY (`quote_id`) REFERENCES `quotes` (`id`) ON DELETE CASCADE
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
  KEY `FK_b77f96d586a56e7e8e476dc7a4a` (`quote_item_id`),
  KEY `FK_9eecdb5b1ed8c7c2a1b392c28d4` (`project_id`),
  CONSTRAINT `FK_9eecdb5b1ed8c7c2a1b392c28d4` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `FK_b77f96d586a56e7e8e476dc7a4a` FOREIGN KEY (`quote_item_id`) REFERENCES `quote_items` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_e19820760cd36e8fa8ae3d0abc4` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`)
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
  `transferred_from_task_id` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_assignments_task` (`task_id`),
  KEY `idx_assignments_worker` (`worker_id`),
  CONSTRAINT `FK_778cf218117dd77f61e21f5debf` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_b389f4488d0a8241c3c98273966` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
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
  KEY `FK_ea55af8b9c0b5fa200680540715` (`site_id`),
  CONSTRAINT `FK_72fcf01d4f127ddec1618e7a54e` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_ea55af8b9c0b5fa200680540715` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
