import { Type } from 'class-transformer'
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator'
import { CreateCustomerContactDto } from './create-customer-contact.dto'

export class CreateCustomerDto {
  @IsString() @IsNotEmpty() name: string
  @IsEnum(['domestic', 'foreign', 'state', 'household', 'individual']) type: string
  @IsOptional() @IsString() industry?: string
  @IsOptional() @IsString() taxCode?: string
  @IsOptional() @IsString() address?: string
  @IsOptional() @IsString() website?: string
  @IsOptional() @IsEnum(['active', 'inactive', 'pending']) status?: string
  @IsOptional() @IsInt() defaultValidityDays?: number
  @IsOptional() @IsInt() defaultDeliveryDays?: number
  @IsOptional() @IsString() defaultPaymentTerms?: string
  @IsOptional() @IsString() defaultWarrantyNote?: string
  @IsOptional() @IsString() defaultSpecialNote?: string
  @IsOptional() @IsString() notes?: string

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateCustomerContactDto)
  contacts?: CreateCustomerContactDto[]
}
