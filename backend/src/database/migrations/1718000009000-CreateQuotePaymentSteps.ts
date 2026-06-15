import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm'

export class CreateQuotePaymentSteps1718000009000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.createTable(new Table({
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
    }), true)
    await q.createIndex('quote_payment_steps', new TableIndex({ name: 'idx_quote_steps_quote', columnNames: ['quote_id'] }))
    await q.createForeignKey('quote_payment_steps', new TableForeignKey({
      columnNames: ['quote_id'],
      referencedTableName: 'quotes',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }))
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.dropTable('quote_payment_steps')
  }
}
