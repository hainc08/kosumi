import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { ColumnNumericTransformer } from '../../../common/transformers/numeric.transformer'

@Entity('quotes')
export class Quote {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ unique: true, length: 20 }) code: string
  @Column({ name: 'project_id', type: 'char', length: 36 }) projectId: string
  @Column({ name: 'customer_id', type: 'char', length: 36, nullable: true }) customerId: string | null
  @Column({ name: 'contact_id', type: 'char', length: 36, nullable: true }) contactId: string | null
  @Column({ length: 300 }) title: string
  @Column({ name: 'quote_date', type: 'date' }) quoteDate: string
  @Column({ name: 'valid_until', type: 'date', nullable: true }) validUntil: string | null
  @Column({ type: 'enum', enum: ['draft', 'pending', 'approved', 'rejected', 'po_received'], default: 'draft' }) status: string
  @Column({ name: 'reject_reason', type: 'text', nullable: true }) rejectReason: string | null
  @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2, default: 8, transformer: new ColumnNumericTransformer() }) taxRate: number
  @Column({ name: 'validity_days', type: 'int' }) validityDays: number
  @Column({ name: 'delivery_days', type: 'int' }) deliveryDays: number
  @Column({ name: 'payment_terms', type: 'varchar', length: 50 }) paymentTerms: string
  @Column({ name: 'has_installation', type: 'boolean', default: false }) hasInstallation: boolean
  @Column({ name: 'warranty_note', type: 'text', nullable: true }) warrantyNote: string | null
  @Column({ name: 'contractor_note', type: 'text', nullable: true }) contractorNote: string | null
  @Column({ type: 'text', nullable: true }) notes: string | null
  @DeleteDateColumn({ name: 'deleted_at' }) deletedAt: Date | null
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date
}
