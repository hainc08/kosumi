import { Type } from 'class-transformer'
import { IsArray, IsBoolean, IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator'
import { CreateQuoteItemDto } from './create-quote-item.dto'
import { CreateQuotePaymentStepDto } from './create-quote-payment-step.dto'

export class CreateQuoteDto {
  // Có thể rỗng khi tạo dự án mới (xem newProjectName)
  @IsOptional() @IsString() projectId?: string
  @IsOptional() @IsString() customerId?: string
  @IsOptional() @IsString() contactId?: string
  @IsOptional() @IsString() newProjectName?: string

  @IsString() @IsNotEmpty() title: string
  @IsDateString() quoteDate: string
  @IsOptional() @IsDateString() validUntil?: string
  @IsNumber() taxRate: number
  @IsInt() validityDays: number
  @IsInt() deliveryDays: number
  @IsString() paymentTerms: string
  @IsOptional() @IsBoolean() hasInstallation?: boolean
  @IsOptional() @IsString() warrantyNote?: string
  @IsOptional() @IsString() contractorNote?: string
  @IsOptional() @IsString() notes?: string

  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateQuoteItemDto)
  items: CreateQuoteItemDto[]

  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateQuotePaymentStepDto)
  paymentSteps: CreateQuotePaymentStepDto[]
}
