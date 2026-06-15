import { IsNotEmpty, IsString } from 'class-validator'

export class ApproveMonthDto {
  @IsNotEmpty() @IsString() workerId: string
  @IsNotEmpty() @IsString() yearMonth: string
}
