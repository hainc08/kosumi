import { MigrationInterface, QueryRunner } from 'typeorm'

/** Thêm cờ tăng ca + mốc tự kết thúc OT cho task_assignments. */
export class AlterTaskAssignmentsOvertime1718000017000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query("ALTER TABLE `task_assignments` ADD `is_overtime` tinyint(1) NOT NULL DEFAULT 0 AFTER `is_active`")
    await q.query("ALTER TABLE `task_assignments` ADD `ot_end_at` datetime NULL AFTER `is_overtime`")
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.query("ALTER TABLE `task_assignments` DROP COLUMN `ot_end_at`")
    await q.query("ALTER TABLE `task_assignments` DROP COLUMN `is_overtime`")
  }
}
