import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { ColumnNumericTransformer } from '../../../common/transformers/numeric.transformer'

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ unique: true, length: 20 }) code: string
  @Column({ length: 200 }) name: string
  @Column({ name: 'customer_id', type: 'char', length: 36, nullable: true }) customerId: string | null
  @Column({ name: 'project_type', type: 'enum', enum: ['commercial', 'apartment', 'industrial', 'art', 'other'] }) projectType: string
  @Column({ name: 'site_id', type: 'char', length: 36, nullable: true }) siteId: string | null
  @Column({ name: 'contract_value', type: 'decimal', precision: 15, scale: 2, nullable: true, transformer: new ColumnNumericTransformer() }) contractValue: number | null
  @Column({ name: 'start_date', type: 'date', nullable: true }) startDate: string | null
  @Column({ type: 'date' }) deadline: string
  @Column({ name: 'actual_end_date', type: 'date', nullable: true }) actualEndDate: string | null
  @Column({ name: 'progress_pct', type: 'int', default: 0 }) progressPct: number
  @Column({ type: 'enum', enum: ['planning', 'in_progress', 'near_deadline', 'completed', 'paused', 'cancelled'], default: 'planning' }) status: string
  @Column({ type: 'text', nullable: true }) description: string | null
  @Column({ name: 'manager_id', type: 'char', length: 36, nullable: true }) managerId: string | null
  @DeleteDateColumn({ name: 'deleted_at' }) deletedAt: Date | null
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date
}
