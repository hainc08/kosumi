"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateWorkerContracts1718000003000 = void 0;
const typeorm_1 = require("typeorm");
class CreateWorkerContracts1718000003000 {
    async up(q) {
        await q.createTable(new typeorm_1.Table({
            name: 'worker_contracts',
            columns: [
                { name: 'id', type: 'char', length: '36', isPrimary: true },
                { name: 'worker_id', type: 'char', length: '36' },
                { name: 'contract_type', type: 'enum', enum: ['piece_rate', 'official', 'probation'] },
                { name: 'start_date', type: 'date' },
                { name: 'end_date', type: 'date', isNullable: true },
                { name: 'base_salary', type: 'decimal', precision: 15, scale: 2, isNullable: true },
                { name: 'allowance_responsibility', type: 'decimal', precision: 15, scale: 2, isNullable: true },
                { name: 'allowance_attendance', type: 'decimal', precision: 15, scale: 2, isNullable: true },
                { name: 'rate_per_unit', type: 'decimal', precision: 15, scale: 2, isNullable: true },
                { name: 'unit_name', type: 'varchar', length: '50', isNullable: true },
                { name: 'is_active', type: 'boolean', default: true },
                { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
                { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
            ],
        }), true);
        await q.createIndex('worker_contracts', new typeorm_1.TableIndex({ name: 'idx_contracts_worker', columnNames: ['worker_id'] }));
        await q.createForeignKey('worker_contracts', new typeorm_1.TableForeignKey({
            columnNames: ['worker_id'],
            referencedTableName: 'workers',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
        }));
    }
    async down(q) {
        await q.dropTable('worker_contracts');
    }
}
exports.CreateWorkerContracts1718000003000 = CreateWorkerContracts1718000003000;
//# sourceMappingURL=1718000003000-CreateWorkerContracts.js.map