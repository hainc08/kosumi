import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator'

export class CreateProjectDto {
  @IsString() @IsNotEmpty() name: string
  @IsOptional() @IsString() customerId?: string
  @IsEnum(['commercial', 'apartment', 'industrial', 'art', 'other']) projectType: string
  @IsOptional() @IsString() siteId?: string
  @IsOptional() @IsNumber() contractValue?: number
  @IsOptional() @IsDateString() startDate?: string
  @IsDateString() deadline: string
  @IsOptional() @IsInt() @Min(0) @Max(100) progressPct?: number
  @IsOptional() @IsEnum(['planning', 'in_progress', 'near_deadline', 'completed', 'paused', 'cancelled']) status?: string
  @IsOptional() @IsString() description?: string
}
