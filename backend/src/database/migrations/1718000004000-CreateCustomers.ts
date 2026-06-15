import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

export class CreateCustomers1718000004000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.createTable(new Table({
      name: 'customers',
      columns: [
        { name: 'id', type: 'char', length: '36', isPrimary: true },
        { name: 'code', type: 'varchar', length: '20', isUnique: true },
        { name: 'name', type: 'varchar', length: '200' },
        { name: 'type', type: 'enum', enum: ['business', 'studio', 'foreign', 'state'] },
        { name: 'tax_code', type: 'varchar', length: '50', isNullable: true },
        { name: 'address', type: 'text', isNullable: true },
        { name: 'website', type: 'varchar', length: '200', isNullable: true },
        { name: 'status', type: 'enum', enum: ['active', 'inactive', 'pending'], default: "'active'" },
        { name: 'default_validity_days', type: 'int', default: 10 },
        { name: 'default_delivery_days', type: 'int', default: 50 },
        { name: 'default_payment_terms', type: 'varchar', length: '50', default: "'30-25-35-10'" },
        { name: 'default_warranty_note', type: 'text', isNullable: true },
        { name: 'default_special_note', type: 'text', isNullable: true },
        { name: 'notes', type: 'text', isNullable: true },
        { name: 'deleted_at', type: 'datetime', isNullable: true },
        { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
      ],
    }), true)
    await q.createIndex('customers', new TableIndex({ name: 'idx_customers_status', columnNames: ['status'] }))
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.dropTable('customers')
  }
}
