import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

export class CreateSites1718000001000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.createTable(new Table({
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
    }), true)
    await q.createIndex('sites', new TableIndex({ name: 'idx_sites_status', columnNames: ['status'] }))
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.dropTable('sites')
  }
}
