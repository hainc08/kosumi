"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlterWorkersSpecialty1718000013000 = void 0;
class AlterWorkersSpecialty1718000013000 {
    async up(queryRunner) {
        await queryRunner.query("ALTER TABLE `workers` ADD `specialty` varchar(200) NULL");
        await queryRunner.query("ALTER TABLE `workers` DROP COLUMN `experience_years`");
    }
    async down(queryRunner) {
        await queryRunner.query("ALTER TABLE `workers` ADD `experience_years` int NOT NULL DEFAULT 0");
        await queryRunner.query("ALTER TABLE `workers` DROP COLUMN `specialty`");
    }
}
exports.AlterWorkersSpecialty1718000013000 = AlterWorkersSpecialty1718000013000;
//# sourceMappingURL=1718000013000-AlterWorkersSpecialty.js.map