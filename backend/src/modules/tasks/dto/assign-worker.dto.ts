import { IsNotEmpty, IsString } from 'class-validator'

export class AssignWorkerDto {
  @IsString() @IsNotEmpty() workerId: string
}
