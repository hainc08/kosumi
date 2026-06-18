import { MigrationInterface, QueryRunner } from 'typeorm'

/** Đổi customers.type sang 5 loại mới (map dữ liệu cũ) + thêm cột industry (ngành nghề tự nhập). */
export class AlterCustomersTypeAndIndustry1718000015000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    // 1) Nới enum gồm cả cũ + mới để UPDATE không bị truncate.
    await q.query("ALTER TABLE `customers` MODIFY COLUMN `type` ENUM('business','studio','foreign','state','domestic','household','individual') NOT NULL")
    // 2) Map dữ liệu cũ.
    await q.query("UPDATE `customers` SET `type`='domestic' WHERE `type`='business'")
    await q.query("UPDATE `customers` SET `type`='household' WHERE `type`='studio'")
    // 3) Thu về 5 giá trị mới.
    await q.query("ALTER TABLE `customers` MODIFY COLUMN `type` ENUM('domestic','foreign','state','household','individual') NOT NULL")
    // 4) Thêm cột ngành nghề.
    await q.query("ALTER TABLE `customers` ADD COLUMN `industry` varchar(200) NULL AFTER `type`")
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.query("ALTER TABLE `customers` DROP COLUMN `industry`")
    await q.query("ALTER TABLE `customers` MODIFY COLUMN `type` ENUM('business','studio','foreign','state','domestic','household','individual') NOT NULL")
    await q.query("UPDATE `customers` SET `type`='business' WHERE `type`='domestic'")
    await q.query("UPDATE `customers` SET `type`='studio' WHERE `type`='household'")
    await q.query("ALTER TABLE `customers` MODIFY COLUMN `type` ENUM('business','studio','foreign','state') NOT NULL")
  }
}
