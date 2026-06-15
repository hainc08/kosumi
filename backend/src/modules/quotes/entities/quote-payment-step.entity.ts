import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { ColumnNumericTransformer } from '../../../common/transformers/numeric.transformer'

@Entity('quote_payment_steps')
export class QuotePaymentStep {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ name: 'quote_id', type: 'char', length: 36 }) quoteId: string
  @Column({ name: 'step_order', type: 'int' }) stepOrder: number
  @Column({ type: 'decimal', precision: 5, scale: 2, transformer: new ColumnNumericTransformer() }) percentage: number
  @Column({ length: 300 }) description: string
  @Column({ name: 'description_en', type: 'varchar', length: 300, nullable: true }) descriptionEn: string | null
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date
}
