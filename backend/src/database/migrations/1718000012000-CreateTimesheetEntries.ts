import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm'

export class CreateTimesheetEntries1718000012000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.createTable(new Table({
      name: 'timesheet_entries',
      columns: [
        { name: 'id', type: 'char', length: '36', isPrimary: true },
        { name: 'worker_id', type: 'char', length: '36' },
        { name: 'work_date', type: 'date' },
        { name: 'site_id', type: 'char', length: '36', isNullable: true },
        { name: 'regular_hours', type: 'decimal', precision: 5, scale: 2, default: 0 },
        { name: 'overtime_hours', type: 'decimal', precision: 5, scale: 2, default: 0 },
        { name: 'day_type', type: 'enum', enum: ['workday', 'leave_paid', 'leave_unpaid', 'holiday', 'absent'] },
        { name: 'contract_type', type: 'enum', enum: ['piece_rate', 'official', 'probation'] },
        { name: 'rate_normal', type: 'decimal', precision: 15, scale: 2, isNullable: true },
        { name: 'rate_overtime', type: 'decimal', precision: 15, scale: 2, isNullable: true },
        { name: 'pay_amount', type: 'decimal', precision: 15, scale: 2, default: 0 },
        { name: 'status', type: 'enum', enum: ['draft', 'pending_approval', 'approved', 'rejected'], default: "'draft'" },
        { name: 'approved_by', type: 'char', length: '36', isNullable: true },
        { name: 'approved_at', type: 'datetime', isNullable: true },
        { name: 'notes', type: 'text', isNullable: true },
        { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
      ],
    }), true)
    await q.createIndex('timesheet_entries', new TableIndex({ name: 'uq_timesheet_worker_date', columnNames: ['worker_id', 'work_date'], isUnique: true }))
    await q.createIndex('timesheet_entries', new TableIndex({ name: 'idx_timesheet_worker', columnNames: ['worker_id'] }))
    await q.createForeignKey('timesheet_entries', new TableForeignKey({
      columnNames: ['worker_id'],
      referencedTableName: 'workers',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }))
    await q.createForeignKey('timesheet_entries', new TableForeignKey({
      columnNames: ['site_id'],
      referencedTableName: 'sites',
      referencedColumnNames: ['id'],
      onDelete: 'SET NULL',
    }))
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.dropTable('timesheet_entries')
  }
}
