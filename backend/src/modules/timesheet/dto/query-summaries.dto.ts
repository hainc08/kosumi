import { Transform } from 'class-transformer'
import { IsOptional, IsString } from 'class-validator'

/** Chuỗi rỗng từ query string (?yearMonth=&siteId=&search=) → undefined để @IsOptional bỏ qua. */
const EmptyToUndefined = () => Transform(({ value }) => (value === '' ? undefined : value))

export class QuerySummariesDto {
  @IsOptional() @EmptyToUndefined() @IsString() yearMonth?: string
  @IsOptional() @EmptyToUndefined() @IsString() siteId?: string
  @IsOptional() @EmptyToUndefined() @IsString() search?: string
}
