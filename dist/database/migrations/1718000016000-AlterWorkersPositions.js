"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlterWorkersPositions1718000016000 = void 0;
class AlterWorkersPositions1718000016000 {
    async up(q) {
        await q.query("ALTER TABLE `workers` MODIFY COLUMN `position` ENUM('team_leader','senior_worker','worker','apprentice','technician','supervisor','other','foreman','deputy_foreman','deputy_leader','director','deputy_director','chief_accountant','accountant','storekeeper','sales') NOT NULL");
        await q.query("UPDATE `workers` SET `position`='worker' WHERE `position` IN ('senior_worker','apprentice','technician')");
        await q.query("UPDATE `workers` SET `position`='foreman' WHERE `position`='supervisor'");
        await q.query("ALTER TABLE `workers` MODIFY COLUMN `position` ENUM('foreman','deputy_foreman','team_leader','deputy_leader','worker','director','deputy_director','chief_accountant','accountant','storekeeper','sales','other') NOT NULL");
    }
    async down(q) {
        await q.query("ALTER TABLE `workers` MODIFY COLUMN `position` ENUM('team_leader','senior_worker','worker','apprentice','technician','supervisor','other','foreman','deputy_foreman','deputy_leader','director','deputy_director','chief_accountant','accountant','storekeeper','sales') NOT NULL");
        await q.query("UPDATE `workers` SET `position`='supervisor' WHERE `position` IN ('foreman','deputy_foreman')");
        await q.query("UPDATE `workers` SET `position`='team_leader' WHERE `position`='deputy_leader'");
        await q.query("UPDATE `workers` SET `position`='other' WHERE `position` IN ('director','deputy_director','chief_accountant','accountant','storekeeper','sales')");
        await q.query("ALTER TABLE `workers` MODIFY COLUMN `position` ENUM('team_leader','senior_worker','worker','apprentice','technician','supervisor','other') NOT NULL");
    }
}
exports.AlterWorkersPositions1718000016000 = AlterWorkersPositions1718000016000;
//# sourceMappingURL=1718000016000-AlterWorkersPositions.js.map