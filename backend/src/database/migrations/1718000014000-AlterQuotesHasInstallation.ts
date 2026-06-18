import { MigrationInterface, QueryRunner } from 'typeorm'

/** Thêm cột quotes.has_installation (cờ "có lắp đặt" nhập trên báo giá). */
export class AlterQuotesHasInstallation1718000014000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query("ALTER TABLE `quotes` ADD `has_installation` tinyint(1) NOT NULL DEFAULT 0 AFTER `payment_terms`")
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.query("ALTER TABLE `quotes` DROP COLUMN `has_installation`")
  }
}
