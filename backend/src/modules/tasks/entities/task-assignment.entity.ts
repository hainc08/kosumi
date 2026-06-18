import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('task_assignments')
export class TaskAssignment {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ name: 'task_id', type: 'char', length: 36 }) taskId: string
  @Column({ name: 'worker_id', type: 'char', length: 36 }) workerId: string
  @Column({ name: 'assigned_at', type: 'datetime' }) assignedAt: Date
  @Column({ name: 'started_at', type: 'datetime', nullable: true }) startedAt: Date | null
  @Column({ name: 'ended_at', type: 'datetime', nullable: true }) endedAt: Date | null
  @Column({ name: 'is_active', type: 'boolean', default: true }) isActive: boolean
  @Column({ name: 'is_overtime', type: 'boolean', default: false }) isOvertime: boolean
  @Column({ name: 'ot_end_at', type: 'datetime', nullable: true }) otEndAt: Date | null
  @Column({ name: 'transferred_from_task_id', type: 'char', length: 36, nullable: true }) transferredFromTaskId: string | null
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date
}
