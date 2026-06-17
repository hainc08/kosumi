"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateQuoteItems1718000008000 = void 0;
const typeorm_1 = require("typeorm");
class CreateQuoteItems1718000008000 {
    async up(q) {
        await q.createTable(new typeorm_1.Table({
            name: 'quote_items',
            columns: [
                { name: 'id', type: 'char', length: '36', isPrimary: true },
                { name: 'quote_id', type: 'char', length: '36' },
                { name: 'section_name', type: 'varchar', length: '200', isNullable: true },
                { name: 'section_name_en', type: 'varchar', length: '200', isNullable: true },
                { name: 'sort_order', type: 'int' },
                { name: 'item_name', type: 'varchar', length: '300' },
                { name: 'description', type: 'text', isNullable: true },
                { name: 'unit', type: 'varchar', length: '50' },
                { name: 'quantity', type: 'decimal', precision: 15, scale: 2 },
                { name: 'unit_price', type: 'decimal', precision: 15, scale: 2 },
                { name: 'amount', type: 'decimal', precision: 15, scale: 2 },
                { name: 'notes', type: 'text', isNullable: true },
                { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
                { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
            ],
        }), true);
        await q.createIndex('quote_items', new typeorm_1.TableIndex({ name: 'idx_quote_items_quote', columnNames: ['quote_id'] }));
        await q.createForeignKey('quote_items', new typeorm_1.TableForeignKey({
            columnNames: ['quote_id'],
            referencedTableName: 'quotes',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
        }));
    }
    async down(q) {
        await q.dropTable('quote_items');
    }
}
exports.CreateQuoteItems1718000008000 = CreateQuoteItems1718000008000;
//# sourceMappingURL=1718000008000-CreateQuoteItems.js.map