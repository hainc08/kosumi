"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateQuotePaymentSteps1718000009000 = void 0;
const typeorm_1 = require("typeorm");
class CreateQuotePaymentSteps1718000009000 {
    async up(q) {
        await q.createTable(new typeorm_1.Table({
            name: 'quote_payment_steps',
            columns: [
                { name: 'id', type: 'char', length: '36', isPrimary: true },
                { name: 'quote_id', type: 'char', length: '36' },
                { name: 'step_order', type: 'int' },
                { name: 'percentage', type: 'decimal', precision: 5, scale: 2 },
                { name: 'description', type: 'varchar', length: '300' },
                { name: 'description_en', type: 'varchar', length: '300', isNullable: true },
                { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
                { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
            ],
        }), true);
        await q.createIndex('quote_payment_steps', new typeorm_1.TableIndex({ name: 'idx_quote_steps_quote', columnNames: ['quote_id'] }));
        await q.createForeignKey('quote_payment_steps', new typeorm_1.TableForeignKey({
            columnNames: ['quote_id'],
            referencedTableName: 'quotes',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
        }));
    }
    async down(q) {
        await q.dropTable('quote_payment_steps');
    }
}
exports.CreateQuotePaymentSteps1718000009000 = CreateQuotePaymentSteps1718000009000;
//# sourceMappingURL=1718000009000-CreateQuotePaymentSteps.js.map