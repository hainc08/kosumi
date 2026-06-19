"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlterTaskAssignmentsOvertime1718000017000 = void 0;
class AlterTaskAssignmentsOvertime1718000017000 {
    async up(q) {
        await q.query("ALTER TABLE `task_assignments` ADD `is_overtime` tinyint(1) NOT NULL DEFAULT 0 AFTER `is_active`");
        await q.query("ALTER TABLE `task_assignments` ADD `ot_end_at` datetime NULL AFTER `is_overtime`");
    }
    async down(q) {
        await q.query("ALTER TABLE `task_assignments` DROP COLUMN `ot_end_at`");
        await q.query("ALTER TABLE `task_assignments` DROP COLUMN `is_overtime`");
    }
}
exports.AlterTaskAssignmentsOvertime1718000017000 = AlterTaskAssignmentsOvertime1718000017000;
//# sourceMappingURL=1718000017000-AlterTaskAssignmentsOvertime.js.map