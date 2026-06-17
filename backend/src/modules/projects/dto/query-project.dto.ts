import { Transform } from 'class-transformer'
import { IsEnum, IsOptional, IsString } from 'class-validator'

/** Chuỗi rỗng từ query string (?status=&siteId=) → undefined để @IsOptional bỏ qua. */
const EmptyToUndefined = () => Transform(({ value }) => (value === '' ? undefined : value))

export class QueryProjectDto {
  @IsOptional() @IsString() search?: string
  @IsOptional() @EmptyToUndefined() @IsEnum(['planning', 'in_progress', 'near_deadline', 'completed', 'paused', 'cancelled']) status?: string
  @IsOptional() @EmptyToUndefined() @IsString() siteId?: string
  @IsOptional() @EmptyToUndefined() @IsString() quoteCode?: string
}
