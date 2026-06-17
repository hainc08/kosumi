import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateWorkerDto {
  // ─── worker ──────────────────────────────────────────────
  @IsString() @IsNotEmpty() fullName: string
  @IsEnum(['male', 'female']) gender: string
  @IsOptional() @IsDateString() dateOfBirth?: string
  @IsOptional() @IsString() idNumber?: string
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsString() address?: string
  @IsEnum(['team_leader', 'senior_worker', 'worker', 'apprentice', 'technician', 'supervisor', 'other']) position: string
  @IsOptional() @IsString() specialty?: string
  @IsOptional() @IsString() notes?: string
  @IsOptional() @IsString() siteId?: string

  // ─── active contract ────────────────────────────────────
  @IsEnum(['piece_rate', 'official', 'probation']) contractType: string
  @IsDateString() startDate: string
  @IsOptional() @IsNumber() baseSalary?: number
  @IsOptional() @IsNumber() allowanceResponsibility?: number
  @IsOptional() @IsNumber() allowanceAttendance?: number
  @IsOptional() @IsNumber() ratePerUnit?: number
  @IsOptional() @IsString() unitName?: string
}
