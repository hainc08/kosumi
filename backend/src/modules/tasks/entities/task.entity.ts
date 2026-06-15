import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ name: 'quote_item_id', type: 'char', length: 36, nullable: true }) quoteItemId: string | null
  @Column({ name: 'project_id', type: 'char', length: 36 }) projectId: string
  @Column({ name: 'site_id', type: 'char', length: 36 }) siteId: string
  @Column({ length: 300 }) title: string
  @Column({ type: 'text', nullable: true }) description: string | null
  @Column({ name: 'task_date', type: 'date' }) taskDate: string
  @Column({ type: 'enum', enum: ['unassigned', 'in_progress', 'paused', 'completed', 'cancelled'], default: 'unassigned' }) status: string
  @Column({ type: 'enum', enum: ['high', 'medium', 'low'], default: 'medium' }) priority: string
  @Column({ name: 'sort_order', type: 'int', default: 0 }) sortOrder: number
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date
}
