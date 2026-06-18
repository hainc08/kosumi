import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'

export class AssignWorkerDto {
  @IsString() @IsNotEmpty() workerId: string
  @IsOptional() @IsNumber() otHours?: number
}
