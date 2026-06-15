import { IsNotEmpty, IsString } from 'class-validator'

export class TransferWorkerDto {
  @IsString() @IsNotEmpty() workerId: string
  @IsString() @IsNotEmpty() fromTaskId: string
  @IsString() @IsNotEmpty() toTaskId: string
}
