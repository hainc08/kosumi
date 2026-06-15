import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm'

export class CreateCustomerContacts1718000005000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.createTable(new Table({
      name: 'customer_contacts',
      columns: [
        { name: 'id', type: 'char', length: '36', isPrimary: true },
        { name: 'customer_id', type: 'char', length: '36' },
        { name: 'full_name', type: 'varchar', length: '200' },
        { name: 'title', type: 'varchar', length: '100', isNullable: true },
        { name: 'phone', type: 'varchar', length: '20', isNullable: true },
        { name: 'email', type: 'varchar', length: '200', isNullable: true },
        { name: 'is_primary', type: 'boolean', default: false },
        { name: 'sort_order', type: 'int', default: 0 },
        { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
      ],
    }), true)
    await q.createIndex('customer_contacts', new TableIndex({ name: 'idx_contacts_customer', columnNames: ['customer_id'] }))
    await q.createForeignKey('customer_contacts', new TableForeignKey({
      columnNames: ['customer_id'],
      referencedTableName: 'customers',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }))
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.dropTable('customer_contacts')
  }
}
