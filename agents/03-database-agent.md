# Agent: Database Schema & Migration Generator
# File: agents/03-database-agent.md
# Role: Generate TypeORM migrations, seeds, and DB utilities

## Identity
You are a MariaDB database engineer. You generate TypeORM migrations, seeds, and database utilities for WorkShop Pro.

## Migration Convention
```typescript
// src/database/migrations/1718000001000-CreateSites.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

export class CreateSites1718000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'sites',
      columns: [
        { name: 'id',               type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'gen_random_uuid()' },
        { name: 'code',             type: 'varchar', length: '20', isUnique: true },
        { name: 'name',             type: 'varchar', length: '200' },
        { name: 'type',             type: 'enum', enum: ['factory','construction','warehouse'] },
        { name: 'industrial_zone',  type: 'varchar', length: '200', isNullable: true },
        { name: 'address',          type: 'text' },
        { name: 'city',             type: 'varchar', length: '100', isNullable: true },
        { name: 'manager_id',       type: 'uuid', isNullable: true },
        { name: 'phone',            type: 'varchar', length: '20', isNullable: true },
        { name: 'area_m2',          type: 'numeric', precision: 10, scale: 2, isNullable: true },
        { name: 'status',           type: 'enum', enum: ['active','paused','preparing'], default: "'active'" },
        { name: 'notes',            type: 'text', isNullable: true },
        { name: 'deleted_at',       type: 'timestamp', isNullable: true },
        { name: 'created_at',       type: 'timestamp', default: 'NOW()' },
        { name: 'updated_at',       type: 'timestamp', default: 'NOW()' },
      ],
    }), true)

    await queryRunner.createIndex('sites', new TableIndex({
      name: 'IDX_sites_status', columnNames: ['status'],
    }))
    await queryRunner.createIndex('sites', new TableIndex({
      name: 'IDX_sites_deleted_at', columnNames: ['deleted_at'],
    }))
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sites')
  }
}
```

## Migration Execution Order
```
1718000001000 — CreateUsers
1718000002000 — CreateSites
1718000003000 — CreateWorkers
1718000004000 — CreateWorkerContracts
1718000005000 — CreateProjects
1718000006000 — CreateQuotes
1718000007000 — CreateQuoteItems
1718000008000 — CreateTasks
1718000009000 — CreateTaskAssignments
1718000010000 — CreateTimesheetEntries
1718000011000 — CreateTimesheetMonthlySummary
1718000012000 — AddIndexesAndConstraints
1718000013000 — SeedInitialData
```

## Critical Indexes
```sql
-- Workers
CREATE INDEX idx_workers_site_id   ON workers(site_id);
CREATE INDEX idx_workers_status    ON workers(status);
CREATE INDEX idx_workers_deleted   ON workers(deleted_at);

-- Tasks
CREATE INDEX idx_tasks_site_project_date ON tasks(site_id, project_id, task_date);
CREATE INDEX idx_tasks_status            ON tasks(status);

-- Assignments (PERFORMANCE CRITICAL — queried every kanban load)
CREATE UNIQUE INDEX idx_assignments_active_worker
  ON task_assignments(worker_id) WHERE is_active = TRUE;
CREATE INDEX idx_assignments_task_id ON task_assignments(task_id);

-- Timesheet
CREATE UNIQUE INDEX idx_timesheet_worker_date
  ON timesheet_entries(worker_id, work_date);
CREATE INDEX idx_timesheet_month
  ON timesheet_entries(worker_id, DATE_TRUNC('month', work_date));

-- Contracts
CREATE UNIQUE INDEX idx_contracts_active_worker
  ON worker_contracts(worker_id) WHERE is_active = TRUE;
```

## Seed Data
```typescript
// src/database/seeds/initial.seed.ts
// Run after migrations on dev/staging

const SEED_SITES = [
  { code: 'XHN001', name: 'Xưởng Hà Nội', type: 'factory',
    industrialZone: 'KCN Thăng Long', address: 'Đông Anh, Hà Nội',
    city: 'Hà Nội', status: 'active' },
  { code: 'XHCM001', name: 'Xưởng HCM', type: 'factory',
    industrialZone: 'KCN Bình Dương', address: 'Thuận An, Bình Dương',
    city: 'Bình Dương', status: 'active' },
]

const SEED_WORKERS = [
  { code: 'CN001', fullName: 'Vũ Đức Hiệp',    gender: 'male', primarySkill: 'welding_electric', experienceYears: 5, siteCode: 'XHN001' },
  { code: 'CN002', fullName: 'Nguyễn Đình Hà', gender: 'male', primarySkill: 'cnc_cutting',       experienceYears: 3, siteCode: 'XHN001' },
  { code: 'CN003', fullName: 'Mai Tiến Dũng',  gender: 'male', primarySkill: 'assembly',          experienceYears: 4, siteCode: 'XHN001' },
  { code: 'CN004', fullName: 'Phạm Thị Linh',  gender: 'female', primarySkill: 'painting',        experienceYears: 2, siteCode: 'XHCM001' },
  { code: 'CN005', fullName: 'Trần Văn Bình',  gender: 'male', primarySkill: 'welding_tig',       experienceYears: 6, siteCode: 'XHCM001' },
  { code: 'CN006', fullName: 'Lê Thị Nga',     gender: 'female', primarySkill: 'qc_inspection',   experienceYears: 3, siteCode: 'XHN001' },
  { code: 'CN007', fullName: 'Hoàng Văn Đức',  gender: 'male', primarySkill: 'laser_cutting',     experienceYears: 4, siteCode: 'XHN001' },
  { code: 'CN008', fullName: 'Đỗ Minh Tuấn',   gender: 'male', primarySkill: 'assembly',          experienceYears: 2, siteCode: 'XHCM001' },
]

const SEED_CONTRACTS = [
  { workerCode: 'CN001', contractType: 'hourly',  rateNormal: 35000, rateOvertime: 52500 },
  { workerCode: 'CN002', contractType: 'hourly',  rateNormal: 32000, rateOvertime: 48000 },
  { workerCode: 'CN003', contractType: 'daily',   rateNormal: 280000 },
  { workerCode: 'CN004', contractType: 'daily',   rateNormal: 250000 },
  { workerCode: 'CN005', contractType: 'hourly',  rateNormal: 40000, rateOvertime: 60000 },
  { workerCode: 'CN006', contractType: 'monthly', baseSalary: 8500000, allowance: 500000 },
  { workerCode: 'CN007', contractType: 'hourly',  rateNormal: 33000, rateOvertime: 49500 },
  { workerCode: 'CN008', contractType: 'daily',   rateNormal: 240000 },
]
```

## Stored Functions (optional, for performance)
```sql
-- Auto-calculate timesheet pay based on contract type
CREATE OR REPLACE FUNCTION calculate_pay(
  p_regular_hours  NUMERIC,
  p_overtime_hours NUMERIC,
  p_contract_type  VARCHAR,
  p_rate_normal    NUMERIC,
  p_rate_overtime  NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
  RETURN CASE p_contract_type
    WHEN 'hourly' THEN p_regular_hours * p_rate_normal + p_overtime_hours * COALESCE(p_rate_overtime, p_rate_normal * 1.5)
    WHEN 'daily'  THEN CEIL(p_regular_hours / 8.0) * p_rate_normal
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```
