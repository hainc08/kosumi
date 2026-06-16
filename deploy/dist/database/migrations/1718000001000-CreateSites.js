"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSites1718000001000 = void 0;
const typeorm_1 = require("typeorm");
class CreateSites1718000001000 {
    async up(q) {
        await q.createTable(new typeorm_1.Table({
            name: 'sites',
            columns: [
                { name: 'id', type: 'char', length: '36', isPrimary: true },
                { name: 'code', type: 'varchar', length: '20', isUnique: true },
                { name: 'name', type: 'varchar', length: '200' },
                { name: 'type', type: 'enum', enum: ['factory', 'construction', 'warehouse'] },
                { name: 'industrial_zone', type: 'varchar', length: '200', isNullable: true },
                { name: 'address', type: 'text' },
                { name: 'city', type: 'varchar', length: '100', isNullable: true },
                { name: 'manager_id', type: 'char', length: '36', isNullable: true },
                { name: 'phone', type: 'varchar', length: '20', isNullable: true },
                { name: 'area_m2', type: 'decimal', precision: 10, scale: 2, isNullable: true },
                { name: 'status', type: 'enum', enum: ['active', 'paused', 'preparing'], default: "'active'" },
                { name: 'notes', type: 'text', isNullable: true },
                { name: 'deleted_at', type: 'datetime', isNullable: true },
                { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
                { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
            ],
        }), true);
        await q.createIndex('sites', new typeorm_1.TableIndex({ name: 'idx_sites_status', columnNames: ['status'] }));
    }
    async down(q) {
        await q.dropTable('sites');
    }
}
exports.CreateSites1718000001000 = CreateSites1718000001000;
//# sourceMappingURL=1718000001000-CreateSites.js.map