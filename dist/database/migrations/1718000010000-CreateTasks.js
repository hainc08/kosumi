"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTasks1718000010000 = void 0;
const typeorm_1 = require("typeorm");
class CreateTasks1718000010000 {
    async up(q) {
        await q.createTable(new typeorm_1.Table({
            name: 'tasks',
            columns: [
                { name: 'id', type: 'char', length: '36', isPrimary: true },
                { name: 'quote_item_id', type: 'char', length: '36', isNullable: true },
                { name: 'project_id', type: 'char', length: '36' },
                { name: 'site_id', type: 'char', length: '36' },
                { name: 'title', type: 'varchar', length: '300' },
                { name: 'description', type: 'text', isNullable: true },
                { name: 'task_date', type: 'date' },
                { name: 'status', type: 'enum', enum: ['unassigned', 'in_progress', 'paused', 'completed', 'cancelled'], default: "'unassigned'" },
                { name: 'priority', type: 'enum', enum: ['high', 'medium', 'low'], default: "'medium'" },
                { name: 'sort_order', type: 'int', default: 0 },
                { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
                { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
            ],
        }), true);
        await q.createIndex('tasks', new typeorm_1.TableIndex({ name: 'idx_tasks_status', columnNames: ['status'] }));
        await q.createIndex('tasks', new typeorm_1.TableIndex({ name: 'idx_tasks_site_project_date', columnNames: ['site_id', 'project_id', 'task_date'] }));
        await q.createForeignKey('tasks', new typeorm_1.TableForeignKey({
            columnNames: ['quote_item_id'],
            referencedTableName: 'quote_items',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
        }));
        await q.createForeignKey('tasks', new typeorm_1.TableForeignKey({
            columnNames: ['project_id'],
            referencedTableName: 'projects',
            referencedColumnNames: ['id'],
        }));
        await q.createForeignKey('tasks', new typeorm_1.TableForeignKey({
            columnNames: ['site_id'],
            referencedTableName: 'sites',
            referencedColumnNames: ['id'],
        }));
    }
    async down(q) {
        await q.dropTable('tasks');
    }
}
exports.CreateTasks1718000010000 = CreateTasks1718000010000;
//# sourceMappingURL=1718000010000-CreateTasks.js.map