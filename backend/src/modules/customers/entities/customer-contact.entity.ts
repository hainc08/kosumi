import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('customer_contacts')
export class CustomerContact {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ name: 'customer_id', type: 'char', length: 36 }) customerId: string
  @Column({ name: 'full_name', length: 200 }) fullName: string
  @Column({ type: 'varchar', length: 100, nullable: true }) title: string | null
  @Column({ type: 'varchar', length: 20, nullable: true }) phone: string | null
  @Column({ type: 'varchar', length: 200, nullable: true }) email: string | null
  @Column({ name: 'is_primary', type: 'boolean', default: false }) isPrimary: boolean
  @Column({ name: 'sort_order', type: 'int', default: 0 }) sortOrder: number
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date
}
