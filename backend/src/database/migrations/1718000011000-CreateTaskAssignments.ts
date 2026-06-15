import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm'

export class CreateTaskAssignments1718000011000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.createTable(new Table({
      name: 'task_assignments',
      columns: [
        { name: 'id', type: 'char', length: '36', isPrimary: true },
        { name: 'task_id', type: 'char', length: '36' },
        { name: 'worker_id', type: 'char', length: '36' },
        { name: 'assigned_at', type: 'datetime' },
        { name: 'started_at', type: 'datetime', isNullable: true },
        { name: 'ended_at', type: 'datetime', isNullable: true },
        { name: 'is_active', type: 'boolean', default: true },
        { name: 'transferred_from_task_id', type: 'char', length: '36', isNullable: true },
        { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
      ],
    }), true)
    await q.createIndex('task_assignments', new TableIndex({ name: 'idx_assignments_task', columnNames: ['task_id'] }))
    await q.createIndex('task_assignments', new TableIndex({ name: 'idx_assignments_worker', columnNames: ['worker_id'] }))
    await q.createForeignKey('task_assignments', new TableForeignKey({
      columnNames: ['task_id'],
      referencedTableName: 'tasks',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }))
    await q.createForeignKey('task_assignments', new TableForeignKey({
      columnNames: ['worker_id'],
      referencedTableName: 'workers',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }))
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.dropTable('task_assignments')
  }
}
