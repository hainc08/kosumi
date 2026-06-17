"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTaskAssignments1718000011000 = void 0;
const typeorm_1 = require("typeorm");
class CreateTaskAssignments1718000011000 {
    async up(q) {
        await q.createTable(new typeorm_1.Table({
            name: 'task_assignments',
            columns: [
                { name: 'id', type: 'char', length: '36', isPrimary: true },
                { name: 'task_id', type: 'char', length: '36' },
                { name: 'worker_id', type: 'char', length: '36' },
                { name: 'assigned_at', type: 'datetime' },
                { name: 'started_at', type: 'datetime', isNullable: true },
                { name: 'ended_at', type: 'datetime', isNullable: true },
                { name: 'is_active', type: 'boolean', default: true },
                { name: 'transferred_from_task_id', type: 'char', length: '36', isNullable: true },
                { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
                { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
            ],
        }), true);
        await q.createIndex('task_assignments', new typeorm_1.TableIndex({ name: 'idx_assignments_task', columnNames: ['task_id'] }));
        await q.createIndex('task_assignments', new typeorm_1.TableIndex({ name: 'idx_assignments_worker', columnNames: ['worker_id'] }));
        await q.createForeignKey('task_assignments', new typeorm_1.TableForeignKey({
            columnNames: ['task_id'],
            referencedTableName: 'tasks',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
        }));
        await q.createForeignKey('task_assignments', new typeorm_1.TableForeignKey({
            columnNames: ['worker_id'],
            referencedTableName: 'workers',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
        }));
    }
    async down(q) {
        await q.dropTable('task_assignments');
    }
}
exports.CreateTaskAssignments1718000011000 = CreateTaskAssignments1718000011000;
//# sourceMappingURL=1718000011000-CreateTaskAssignments.js.map