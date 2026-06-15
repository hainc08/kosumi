import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { ColumnNumericTransformer } from '../../../common/transformers/numeric.transformer'

@Entity('quote_items')
export class QuoteItem {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ name: 'quote_id', type: 'char', length: 36 }) quoteId: string
  @Column({ name: 'section_name', type: 'varchar', length: 200, nullable: true }) sectionName: string | null
  @Column({ name: 'section_name_en', type: 'varchar', length: 200, nullable: true }) sectionNameEn: string | null
  @Column({ name: 'sort_order', type: 'int' }) sortOrder: number
  @Column({ name: 'item_name', length: 300 }) itemName: string
  @Column({ type: 'text', nullable: true }) description: string | null
  @Column({ length: 50 }) unit: string
  @Column({ type: 'decimal', precision: 15, scale: 2, transformer: new ColumnNumericTransformer() }) quantity: number
  @Column({ name: 'unit_price', type: 'decimal', precision: 15, scale: 2, transformer: new ColumnNumericTransformer() }) unitPrice: number
  @Column({ type: 'decimal', precision: 15, scale: 2, transformer: new ColumnNumericTransformer() }) amount: number
  @Column({ type: 'text', nullable: true }) notes: string | null
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date
}
