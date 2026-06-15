import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateQuotePaymentStepDto {
  @IsOptional() @IsInt() stepOrder?: number
  @IsNumber() percentage: number
  @IsString() @IsNotEmpty() description: string
  @IsOptional() @IsString() descriptionEn?: string
}
