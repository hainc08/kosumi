import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { ColumnNumericTransformer } from '../../../common/transformers/numeric.transformer'

@Entity('sites')
export class Site {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ unique: true, length: 20 }) code: string
  @Column({ length: 200 }) name: string
  @Column({ type: 'enum', enum: ['factory', 'construction', 'warehouse'] }) type: string
  @Column({ name: 'industrial_zone', length: 200, nullable: true }) industrialZone: string | null
  @Column({ type: 'text' }) address: string
  @Column({ length: 100, nullable: true }) city: string | null
  @Column({ name: 'manager_id', type: 'char', length: 36, nullable: true }) managerId: string | null
  @Column({ length: 20, nullable: true }) phone: string | null
  @Column({ name: 'area_m2', type: 'decimal', precision: 10, scale: 2, nullable: true, transformer: new ColumnNumericTransformer() }) areaM2: number | null
  @Column({ type: 'enum', enum: ['active', 'paused', 'preparing'], default: 'active' }) status: string
  @Column({ type: 'text', nullable: true }) notes: string | null
  @DeleteDateColumn({ name: 'deleted_at' }) deletedAt: Date | null
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date
}
