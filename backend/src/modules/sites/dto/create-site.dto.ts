import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateSiteDto {
  @IsString() @IsNotEmpty() name: string
  @IsEnum(['factory', 'construction', 'warehouse']) type: string
  @IsString() @IsNotEmpty() address: string
  @IsOptional() @IsString() industrialZone?: string
  @IsOptional() @IsString() city?: string
  @IsOptional() @IsString() managerId?: string
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsNumber() areaM2?: number
  @IsOptional() @IsEnum(['active', 'paused', 'preparing']) status?: string
  @IsOptional() @IsString() notes?: string
}
