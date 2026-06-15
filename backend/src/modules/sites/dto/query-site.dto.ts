import { IsEnum, IsOptional, IsString } from 'class-validator'
export class QuerySiteDto {
  @IsOptional() @IsString() search?: string
  @IsOptional() @IsEnum(['factory', 'construction', 'warehouse']) type?: string
  @IsOptional() @IsEnum(['active', 'paused', 'preparing']) status?: string
}
