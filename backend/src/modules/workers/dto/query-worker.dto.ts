import { Transform } from 'class-transformer'
import { IsEnum, IsOptional, IsString } from 'class-validator'

/** Chuỗi rỗng từ query string (?status=&position=) → undefined để @IsOptional bỏ qua. */
const EmptyToUndefined = () => Transform(({ value }) => (value === '' ? undefined : value))

export class QueryWorkerDto {
  @IsOptional() @IsString() search?: string
  @IsOptional() @EmptyToUndefined() @IsEnum(['working', 'on_leave', 'absent', 'resigned']) status?: string
  @IsOptional() @EmptyToUndefined() @IsEnum(['team_leader', 'senior_worker', 'worker', 'apprentice', 'technician', 'supervisor', 'other']) position?: string
  @IsOptional() @EmptyToUndefined() @IsString() siteId?: string
}
