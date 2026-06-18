import { MigrationInterface, QueryRunner } from 'typeorm'

/** Đổi workers.position sang 12 chức vụ (2 nhóm) + map dữ liệu cũ. */
export class AlterWorkersPositions1718000016000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query("ALTER TABLE `workers` MODIFY COLUMN `position` ENUM('team_leader','senior_worker','worker','apprentice','technician','supervisor','other','foreman','deputy_foreman','deputy_leader','director','deputy_director','chief_accountant','accountant','storekeeper','sales') NOT NULL")
    await q.query("UPDATE `workers` SET `position`='worker' WHERE `position` IN ('senior_worker','apprentice','technician')")
    await q.query("UPDATE `workers` SET `position`='foreman' WHERE `position`='supervisor'")
    await q.query("ALTER TABLE `workers` MODIFY COLUMN `position` ENUM('foreman','deputy_foreman','team_leader','deputy_leader','worker','director','deputy_director','chief_accountant','accountant','storekeeper','sales','other') NOT NULL")
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.query("ALTER TABLE `workers` MODIFY COLUMN `position` ENUM('team_leader','senior_worker','worker','apprentice','technician','supervisor','other','foreman','deputy_foreman','deputy_leader','director','deputy_director','chief_accountant','accountant','storekeeper','sales') NOT NULL")
    await q.query("UPDATE `workers` SET `position`='supervisor' WHERE `position` IN ('foreman','deputy_foreman')")
    await q.query("UPDATE `workers` SET `position`='team_leader' WHERE `position`='deputy_leader'")
    await q.query("UPDATE `workers` SET `position`='other' WHERE `position` IN ('director','deputy_director','chief_accountant','accountant','storekeeper','sales')")
    await q.query("ALTER TABLE `workers` MODIFY COLUMN `position` ENUM('team_leader','senior_worker','worker','apprentice','technician','supervisor','other') NOT NULL")
  }
}
