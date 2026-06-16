"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateWorkers1718000002000 = void 0;
const typeorm_1 = require("typeorm");
class CreateWorkers1718000002000 {
    async up(q) {
        await q.createTable(new typeorm_1.Table({
            name: 'workers',
            columns: [
                { name: 'id', type: 'char', length: '36', isPrimary: true },
                { name: 'code', type: 'varchar', length: '20', isUnique: true },
                { name: 'full_name', type: 'varchar', length: '200' },
                { name: 'gender', type: 'enum', enum: ['male', 'female'] },
                { name: 'date_of_birth', type: 'date', isNullable: true },
                { name: 'id_number', type: 'varchar', length: '20', isNullable: true },
                { name: 'phone', type: 'varchar', length: '20', isNullable: true },
                { name: 'address', type: 'text', isNullable: true },
                { name: 'position', type: 'enum', enum: ['team_leader', 'senior_worker', 'worker', 'apprentice', 'technician', 'supervisor', 'other'] },
                { name: 'experience_years', type: 'int', default: 0 },
                { name: 'status', type: 'enum', enum: ['working', 'on_leave', 'absent', 'resigned'], default: "'working'" },
                { name: 'notes', type: 'text', isNullable: true },
                { name: 'site_id', type: 'char', length: '36', isNullable: true },
                { name: 'deleted_at', type: 'datetime', isNullable: true },
                { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
                { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
            ],
        }), true);
        await q.createIndex('workers', new typeorm_1.TableIndex({ name: 'idx_workers_status', columnNames: ['status'] }));
        await q.createIndex('workers', new typeorm_1.TableIndex({ name: 'idx_workers_site_id', columnNames: ['site_id'] }));
        await q.createForeignKey('workers', new typeorm_1.TableForeignKey({
            columnNames: ['site_id'],
            referencedTableName: 'sites',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
        }));
    }
    async down(q) {
        await q.dropTable('workers');
    }
}
exports.CreateWorkers1718000002000 = CreateWorkers1718000002000;
//# sourceMappingURL=1718000002000-CreateWorkers.js.map