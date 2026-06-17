import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Đổi cột workers.experience_years (int "số năm kinh nghiệm") thành specialty
 * (varchar "chuyên môn"). Dữ liệu số năm cũ bị bỏ.
 */
export class AlterWorkersSpecialty1718000013000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `workers` ADD `specialty` varchar(200) NULL")
    await queryRunner.query("ALTER TABLE `workers` DROP COLUMN `experience_years`")
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `workers` ADD `experience_years` int NOT NULL DEFAULT 0")
    await queryRunner.query("ALTER TABLE `workers` DROP COLUMN `specialty`")
  }
}
