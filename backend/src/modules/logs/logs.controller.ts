import { Body, Controller, ForbiddenException, Get, Post, Query, Req } from '@nestjs/common'
import { LogsService } from './logs.service'
import { ClientLogBatchDto } from './dto/client-log.dto'

@Controller('logs')
export class LogsController {
  constructor(private readonly svc: LogsService) {}

  @Post('client')
  client(@Body() dto: ClientLogBatchDto, @Req() req: { ip?: string; socket?: { remoteAddress?: string }; headers: Record<string, string> }) {
    return this.svc.ingest(dto.events ?? [], {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    })
  }

  @Get('tail')
  tail(@Query('token') token: string, @Query('lines') lines: string) {
    const configured = process.env.LOG_VIEW_TOKEN
    if (configured) {
      if (token !== configured) throw new ForbiddenException('Sai token xem log')
    } else if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Cần đặt LOG_VIEW_TOKEN để xem log ở production')
    }
    const n = Math.min(Math.max(Number(lines) || 200, 1), 2000)
    return this.svc.tail(n)
  }
}
