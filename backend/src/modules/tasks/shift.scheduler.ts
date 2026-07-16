import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { TasksService } from './tasks.service'
import { SHIFT_END_HOUR, SHIFT_END_MIN } from './shift'

/**
 * Scheduler nền (không dùng @nestjs/schedule): mỗi 60s quét OT hết hạn;
 * khi vừa qua mốc 17:00 thì tự tan ca. Logic thật nằm trong TasksService.
 */
@Injectable()
export class ShiftScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ShiftScheduler.name)
  private timer: ReturnType<typeof setInterval> | null = null
  private lastClockOutDay = ''

  constructor(private readonly svc: TasksService) {}

  onModuleInit(): void {
    this.timer = setInterval(() => { void this.tick(new Date()) }, 60_000)
  }
  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  async tick(now: Date): Promise<void> {
    try {
      await this.svc.sweepExpiredOvertime(now)
      const r = await this.svc.sweepStaleAssignments(now)
      if (r.ended > 0) this.logger.log(`Auto Tan ca: đóng ${r.ended} lượt giao việc quá hạn 17:00`)
    } catch (e) {
      this.logger.error('Lỗi scheduler ca làm', e as Error)
    }
  }
}
