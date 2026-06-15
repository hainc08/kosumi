import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateQuoteItemDto {
  @IsOptional() @IsString() sectionName?: string
  @IsOptional() @IsString() sectionNameEn?: string
  @IsOptional() @IsInt() sortOrder?: number
  @IsString() @IsNotEmpty() itemName: string
  @IsOptional() @IsString() description?: string
  @IsString() @IsNotEmpty() unit: string
  @IsNumber() quantity: number
  @IsNumber() unitPrice: number
  @IsOptional() @IsString() notes?: string
}
