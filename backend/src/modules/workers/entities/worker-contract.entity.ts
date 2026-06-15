import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { ColumnNumericTransformer } from '../../../common/transformers/numeric.transformer'

@Entity('worker_contracts')
export class WorkerContract {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ name: 'worker_id', type: 'char', length: 36 }) workerId: string
  @Column({ name: 'contract_type', type: 'enum', enum: ['piece_rate', 'official', 'probation'] }) contractType: string
  @Column({ name: 'start_date', type: 'date' }) startDate: string
  @Column({ name: 'end_date', type: 'date', nullable: true }) endDate: string | null
  @Column({ name: 'base_salary', type: 'decimal', precision: 15, scale: 2, nullable: true, transformer: new ColumnNumericTransformer() }) baseSalary: number | null
  @Column({ name: 'allowance_responsibility', type: 'decimal', precision: 15, scale: 2, nullable: true, transformer: new ColumnNumericTransformer() }) allowanceResponsibility: number | null
  @Column({ name: 'allowance_attendance', type: 'decimal', precision: 15, scale: 2, nullable: true, transformer: new ColumnNumericTransformer() }) allowanceAttendance: number | null
  @Column({ name: 'rate_per_unit', type: 'decimal', precision: 15, scale: 2, nullable: true, transformer: new ColumnNumericTransformer() }) ratePerUnit: number | null
  @Column({ name: 'unit_name', type: 'varchar', length: 50, nullable: true }) unitName: string | null
  @Column({ name: 'is_active', type: 'boolean', default: true }) isActive: boolean
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date
}
