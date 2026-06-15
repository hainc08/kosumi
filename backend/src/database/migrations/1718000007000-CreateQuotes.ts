import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm'

export class CreateQuotes1718000007000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.createTable(new Table({
      name: 'quotes',
      columns: [
        { name: 'id', type: 'char', length: '36', isPrimary: true },
        { name: 'code', type: 'varchar', length: '20', isUnique: true },
        { name: 'project_id', type: 'char', length: '36' },
        { name: 'customer_id', type: 'char', length: '36', isNullable: true },
        { name: 'contact_id', type: 'char', length: '36', isNullable: true },
        { name: 'title', type: 'varchar', length: '300' },
        { name: 'quote_date', type: 'date' },
        { name: 'valid_until', type: 'date', isNullable: true },
        { name: 'status', type: 'enum', enum: ['draft', 'pending', 'approved', 'rejected', 'po_received'], default: "'draft'" },
        { name: 'reject_reason', type: 'text', isNullable: true },
        { name: 'tax_rate', type: 'decimal', precision: 5, scale: 2, default: 8 },
        { name: 'validity_days', type: 'int' },
        { name: 'delivery_days', type: 'int' },
        { name: 'payment_terms', type: 'varchar', length: '50' },
        { name: 'warranty_note', type: 'text', isNullable: true },
        { name: 'contractor_note', type: 'text', isNullable: true },
        { name: 'notes', type: 'text', isNullable: true },
        { name: 'deleted_at', type: 'datetime', isNullable: true },
        { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
      ],
    }), true)
    await q.createIndex('quotes', new TableIndex({ name: 'idx_quotes_status', columnNames: ['status'] }))
    await q.createIndex('quotes', new TableIndex({ name: 'idx_quotes_project_id', columnNames: ['project_id'] }))
    await q.createIndex('quotes', new TableIndex({ name: 'idx_quotes_customer_id', columnNames: ['customer_id'] }))
    await q.createForeignKey('quotes', new TableForeignKey({
      columnNames: ['project_id'],
      referencedTableName: 'projects',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }))
    await q.createForeignKey('quotes', new TableForeignKey({
      columnNames: ['customer_id'],
      referencedTableName: 'customers',
      referencedColumnNames: ['id'],
      onDelete: 'SET NULL',
    }))
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.dropTable('quotes')
  }
}
