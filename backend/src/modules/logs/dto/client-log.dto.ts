import { Allow, IsArray, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

/** 1 sự kiện log gửi từ trình duyệt. `data` để mở (Allow) cho linh hoạt. */
export class ClientLogEvent {
  @IsOptional() @IsString() level?: 'debug' | 'info' | 'warn' | 'error' | string
  @IsString() event: string
  @IsOptional() @IsString() sessionId?: string
  @IsOptional() @IsString() ts?: string
  @IsOptional() @IsString() url?: string
  @Allow() data?: unknown
}

export class ClientLogBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClientLogEvent)
  events: ClientLogEvent[]
}
