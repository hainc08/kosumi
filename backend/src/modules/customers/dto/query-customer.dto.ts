import { Transform } from 'class-transformer'
import { IsEnum, IsOptional, IsString } from 'class-validator'

/** Chuỗi rỗng từ query string (?type=&status=) → undefined để @IsOptional bỏ qua. */
const EmptyToUndefined = () => Transform(({ value }) => (value === '' ? undefined : value))

export class QueryCustomerDto {
  @IsOptional() @IsString() search?: string
  @IsOptional() @EmptyToUndefined() @IsEnum(['business', 'studio', 'foreign', 'state']) type?: string
  @IsOptional() @EmptyToUndefined() @IsEnum(['active', 'inactive', 'pending']) status?: string
}
