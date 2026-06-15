import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { ColumnNumericTransformer } from '../../../common/transformers/numeric.transformer'

@Entity('timesheet_entries')
export class TimesheetEntry {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ name: 'worker_id', type: 'char', length: 36 }) workerId: string
  @Column({ name: 'work_date', type: 'date' }) workDate: string
  @Column({ name: 'site_id', type: 'char', length: 36, nullable: true }) siteId: string | null
  @Column({ name: 'regular_hours', type: 'decimal', precision: 5, scale: 2, transformer: new ColumnNumericTransformer() }) regularHours: number
  @Column({ name: 'overtime_hours', type: 'decimal', precision: 5, scale: 2, transformer: new ColumnNumericTransformer() }) overtimeHours: number
  @Column({ name: 'day_type', type: 'enum', enum: ['workday', 'leave_paid', 'leave_unpaid', 'holiday', 'absent'] }) dayType: string
  @Column({ name: 'contract_type', type: 'enum', enum: ['piece_rate', 'official', 'probation'] }) contractType: string
  @Column({ name: 'rate_normal', type: 'decimal', precision: 15, scale: 2, nullable: true, transformer: new ColumnNumericTransformer() }) rateNormal: number | null
  @Column({ name: 'rate_overtime', type: 'decimal', precision: 15, scale: 2, nullable: true, transformer: new ColumnNumericTransformer() }) rateOvertime: number | null
  @Column({ name: 'pay_amount', type: 'decimal', precision: 15, scale: 2, transformer: new ColumnNumericTransformer() }) payAmount: number
  @Column({ type: 'enum', enum: ['draft', 'pending_approval', 'approved', 'rejected'], default: 'draft' }) status: string
  @Column({ name: 'approved_by', type: 'char', length: 36, nullable: true }) approvedBy: string | null
  @Column({ name: 'approved_at', type: 'datetime', nullable: true }) approvedAt: Date | null
  @Column({ type: 'text', nullable: true }) notes: string | null
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date
}
