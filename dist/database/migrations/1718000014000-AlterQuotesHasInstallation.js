"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlterQuotesHasInstallation1718000014000 = void 0;
class AlterQuotesHasInstallation1718000014000 {
    async up(q) {
        await q.query("ALTER TABLE `quotes` ADD `has_installation` tinyint(1) NOT NULL DEFAULT 0 AFTER `payment_terms`");
    }
    async down(q) {
        await q.query("ALTER TABLE `quotes` DROP COLUMN `has_installation`");
    }
}
exports.AlterQuotesHasInstallation1718000014000 = AlterQuotesHasInstallation1718000014000;
//# sourceMappingURL=1718000014000-AlterQuotesHasInstallation.js.map