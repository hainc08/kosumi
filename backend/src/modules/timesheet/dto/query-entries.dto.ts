import { Transform } from 'class-transformer'
import { IsOptional, IsString } from 'class-validator'

/** Chuỗi rỗng từ query string (?workerId=&yearMonth=) → undefined để @IsOptional bỏ qua. */
const EmptyToUndefined = () => Transform(({ value }) => (value === '' ? undefined : value))

export class QueryEntriesDto {
  @IsOptional() @EmptyToUndefined() @IsString() workerId?: string
  @IsOptional() @EmptyToUndefined() @IsString() yearMonth?: string
}
