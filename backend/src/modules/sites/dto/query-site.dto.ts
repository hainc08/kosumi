import { Transform } from 'class-transformer'
import { IsEnum, IsOptional, IsString } from 'class-validator'

/** Chuỗi rỗng từ query string (?status=&type=) → undefined để @IsOptional bỏ qua. */
const EmptyToUndefined = () => Transform(({ value }) => (value === '' ? undefined : value))

export class QuerySiteDto {
  @IsOptional() @IsString() search?: string
  @IsOptional() @EmptyToUndefined() @IsEnum(['factory', 'construction', 'warehouse']) type?: string
  @IsOptional() @EmptyToUndefined() @IsEnum(['active', 'paused', 'preparing']) status?: string
}
