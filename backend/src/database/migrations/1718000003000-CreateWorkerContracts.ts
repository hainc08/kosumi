import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm'

export class CreateWorkerContracts1718000003000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.createTable(new Table({
      name: 'worker_contracts',
      columns: [
        { name: 'id', type: 'char', length: '36', isPrimary: true },
        { name: 'worker_id', type: 'char', length: '36' },
        { name: 'contract_type', type: 'enum', enum: ['piece_rate', 'official', 'probation'] },
        { name: 'start_date', type: 'date' },
        { name: 'end_date', type: 'date', isNullable: true },
        { name: 'base_salary', type: 'decimal', precision: 15, scale: 2, isNullable: true },
        { name: 'allowance_responsibility', type: 'decimal', precision: 15, scale: 2, isNullable: true },
        { name: 'allowance_attendance', type: 'decimal', precision: 15, scale: 2, isNullable: true },
        { name: 'rate_per_unit', type: 'decimal', precision: 15, scale: 2, isNullable: true },
        { name: 'unit_name', type: 'varchar', length: '50', isNullable: true },
        { name: 'is_active', type: 'boolean', default: true },
        { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
      ],
    }), true)
    await q.createIndex('worker_contracts', new TableIndex({ name: 'idx_contracts_worker', columnNames: ['worker_id'] }))
    await q.createForeignKey('worker_contracts', new TableForeignKey({
      columnNames: ['worker_id'],
      referencedTableName: 'workers',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }))
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.dropTable('worker_contracts')
  }
}
