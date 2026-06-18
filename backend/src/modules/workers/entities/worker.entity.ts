import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { ALL_POSITIONS } from '../worker-positions'

@Entity('workers')
export class Worker {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ unique: true, length: 20 }) code: string
  @Column({ name: 'full_name', length: 200 }) fullName: string
  @Column({ type: 'enum', enum: ['male', 'female'] }) gender: string
  @Column({ name: 'date_of_birth', type: 'date', nullable: true }) dateOfBirth: string | null
  @Column({ name: 'id_number', type: 'varchar', length: 20, nullable: true }) idNumber: string | null
  @Column({ type: 'varchar', length: 20, nullable: true }) phone: string | null
  @Column({ type: 'text', nullable: true }) address: string | null
  @Column({ type: 'enum', enum: ALL_POSITIONS }) position: string
  @Column({ name: 'specialty', type: 'varchar', length: 200, nullable: true }) specialty: string | null
  @Column({ type: 'enum', enum: ['working', 'on_leave', 'absent', 'resigned'], default: 'working' }) status: string
  @Column({ type: 'text', nullable: true }) notes: string | null
  @Column({ name: 'site_id', type: 'char', length: 36, nullable: true }) siteId: string | null
  @DeleteDateColumn({ name: 'deleted_at' }) deletedAt: Date | null
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date
}
