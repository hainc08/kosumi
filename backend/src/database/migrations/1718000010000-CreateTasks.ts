import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm'

export class CreateTasks1718000010000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.createTable(new Table({
      name: 'tasks',
      columns: [
        { name: 'id', type: 'char', length: '36', isPrimary: true },
        { name: 'quote_item_id', type: 'char', length: '36', isNullable: true },
        { name: 'project_id', type: 'char', length: '36' },
        { name: 'site_id', type: 'char', length: '36' },
        { name: 'title', type: 'varchar', length: '300' },
        { name: 'description', type: 'text', isNullable: true },
        { name: 'task_date', type: 'date' },
        { name: 'status', type: 'enum', enum: ['unassigned', 'in_progress', 'paused', 'completed', 'cancelled'], default: "'unassigned'" },
        { name: 'priority', type: 'enum', enum: ['high', 'medium', 'low'], default: "'medium'" },
        { name: 'sort_order', type: 'int', default: 0 },
        { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
      ],
    }), true)
    await q.createIndex('tasks', new TableIndex({ name: 'idx_tasks_status', columnNames: ['status'] }))
    await q.createIndex('tasks', new TableIndex({ name: 'idx_tasks_site_project_date', columnNames: ['site_id', 'project_id', 'task_date'] }))
    await q.createForeignKey('tasks', new TableForeignKey({
      columnNames: ['quote_item_id'],
      referencedTableName: 'quote_items',
      referencedColumnNames: ['id'],
      onDelete: 'SET NULL',
    }))
    await q.createForeignKey('tasks', new TableForeignKey({
      columnNames: ['project_id'],
      referencedTableName: 'projects',
      referencedColumnNames: ['id'],
    }))
    await q.createForeignKey('tasks', new TableForeignKey({
      columnNames: ['site_id'],
      referencedTableName: 'sites',
      referencedColumnNames: ['id'],
    }))
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.dropTable('tasks')
  }
}
