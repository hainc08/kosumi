import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ unique: true, length: 20 }) code: string
  @Column({ length: 200 }) name: string
  @Column({ type: 'enum', enum: ['domestic', 'foreign', 'state', 'household', 'individual'] }) type: string
  @Column({ type: 'varchar', length: 200, nullable: true }) industry: string | null
  @Column({ name: 'tax_code', type: 'varchar', length: 50, nullable: true }) taxCode: string | null
  @Column({ type: 'text', nullable: true }) address: string | null
  @Column({ type: 'varchar', length: 200, nullable: true }) website: string | null
  @Column({ type: 'enum', enum: ['active', 'inactive', 'pending'], default: 'active' }) status: string
  @Column({ name: 'default_validity_days', type: 'int', default: 10 }) defaultValidityDays: number
  @Column({ name: 'default_delivery_days', type: 'int', default: 50 }) defaultDeliveryDays: number
  @Column({ name: 'default_payment_terms', type: 'varchar', length: 50, default: '30-25-35-10' }) defaultPaymentTerms: string
  @Column({ name: 'default_warranty_note', type: 'text', nullable: true }) defaultWarrantyNote: string | null
  @Column({ name: 'default_special_note', type: 'text', nullable: true }) defaultSpecialNote: string | null
  @Column({ type: 'text', nullable: true }) notes: string | null
  @DeleteDateColumn({ name: 'deleted_at' }) deletedAt: Date | null
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date
}
