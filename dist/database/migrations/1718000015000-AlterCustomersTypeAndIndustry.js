"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlterCustomersTypeAndIndustry1718000015000 = void 0;
class AlterCustomersTypeAndIndustry1718000015000 {
    async up(q) {
        await q.query("ALTER TABLE `customers` MODIFY COLUMN `type` ENUM('business','studio','foreign','state','domestic','household','individual') NOT NULL");
        await q.query("UPDATE `customers` SET `type`='domestic' WHERE `type`='business'");
        await q.query("UPDATE `customers` SET `type`='household' WHERE `type`='studio'");
        await q.query("ALTER TABLE `customers` MODIFY COLUMN `type` ENUM('domestic','foreign','state','household','individual') NOT NULL");
        await q.query("ALTER TABLE `customers` ADD COLUMN `industry` varchar(200) NULL AFTER `type`");
    }
    async down(q) {
        await q.query("ALTER TABLE `customers` DROP COLUMN `industry`");
        await q.query("ALTER TABLE `customers` MODIFY COLUMN `type` ENUM('business','studio','foreign','state','domestic','household','individual') NOT NULL");
        await q.query("UPDATE `customers` SET `type`='business' WHERE `type`='domestic'");
        await q.query("UPDATE `customers` SET `type`='studio' WHERE `type`='household'");
        await q.query("ALTER TABLE `customers` MODIFY COLUMN `type` ENUM('business','studio','foreign','state') NOT NULL");
    }
}
exports.AlterCustomersTypeAndIndustry1718000015000 = AlterCustomersTypeAndIndustry1718000015000;
//# sourceMappingURL=1718000015000-AlterCustomersTypeAndIndustry.js.map