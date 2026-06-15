import { Transform } from 'class-transformer'
import { IsEnum, IsOptional, IsString } from 'class-validator'

/** Chuỗi rỗng từ query string (?status=&customerId=&projectId=) → undefined để @IsOptional bỏ qua. */
const EmptyToUndefined = () => Transform(({ value }) => (value === '' ? undefined : value))

export class QueryQuoteDto {
  @IsOptional() @IsString() search?: string
  @IsOptional() @EmptyToUndefined() @IsEnum(['draft', 'pending', 'approved', 'rejected', 'po_received']) status?: string
  @IsOptional() @EmptyToUndefined() @IsString() customerId?: string
  @IsOptional() @EmptyToUndefined() @IsString() projectId?: string
}
