import { Body, Controller, ForbiddenException, Get, Post, Query, Req } from '@nestjs/common'
import type { Request } from 'express'
import { LogsService } from './logs.service'
import { ClientLogBatchDto } from './dto/client-log.dto'

@Controller('logs')
export class LogsController {
  constructor(private svc: LogsService) {}

  /** FE gửi log thao tác/lỗi về đây (công khai — không cần auth để bắt cả lỗi sớm). */
  @Post('client')
  client(@Body() dto: ClientLogBatchDto, @Req() req: Request) {
    return this.svc.ingest(dto.events ?? [], {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    })
  }

  /**
   * Xem nhanh N dòng log cuối (mặc định 200). Bảo vệ bằng token:
   *  - Có LOG_VIEW_TOKEN  → bắt buộc ?token= khớp.
   *  - Không cấu hình     → chỉ cho phép ngoài production.
   */
  @Get('tail')
  tail(@Query('token') token?: string, @Query('lines') lines?: string) {
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
