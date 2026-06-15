import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm'

export class CreateProjects1718000006000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.createTable(new Table({
      name: 'projects',
      columns: [
        { name: 'id', type: 'char', length: '36', isPrimary: true },
        { name: 'code', type: 'varchar', length: '20', isUnique: true },
        { name: 'name', type: 'varchar', length: '200' },
        { name: 'customer_id', type: 'char', length: '36', isNullable: true },
        { name: 'project_type', type: 'enum', enum: ['commercial', 'apartment', 'industrial', 'art', 'other'] },
        { name: 'site_id', type: 'char', length: '36', isNullable: true },
        { name: 'contract_value', type: 'decimal', precision: 15, scale: 2, isNullable: true },
        { name: 'start_date', type: 'date', isNullable: true },
        { name: 'deadline', type: 'date' },
        { name: 'actual_end_date', type: 'date', isNullable: true },
        { name: 'progress_pct', type: 'int', default: 0 },
        { name: 'status', type: 'enum', enum: ['planning', 'in_progress', 'near_deadline', 'completed', 'paused', 'cancelled'], default: "'planning'" },
        { name: 'description', type: 'text', isNullable: true },
        { name: 'manager_id', type: 'char', length: '36', isNullable: true },
        { name: 'deleted_at', type: 'datetime', isNullable: true },
        { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
      ],
    }), true)
    await q.createIndex('projects', new TableIndex({ name: 'idx_projects_status', columnNames: ['status'] }))
    await q.createIndex('projects', new TableIndex({ name: 'idx_projects_site_id', columnNames: ['site_id'] }))
    await q.createIndex('projects', new TableIndex({ name: 'idx_projects_customer_id', columnNames: ['customer_id'] }))
    await q.createForeignKey('projects', new TableForeignKey({
      columnNames: ['site_id'],
      referencedTableName: 'sites',
      referencedColumnNames: ['id'],
      onDelete: 'SET NULL',
    }))
    await q.createForeignKey('projects', new TableForeignKey({
      columnNames: ['customer_id'],
      referencedTableName: 'customers',
      referencedColumnNames: ['id'],
      onDelete: 'SET NULL',
    }))
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.dropTable('projects')
  }
}
