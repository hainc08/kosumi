import { Injectable } from '@nestjs/common'
import { readFileSync } from 'fs'
import { appLog, LOGGER_CONFIG } from '../../common/logger/app-logger'
import { ClientLogEvent } from './dto/client-log.dto'

@Injectable()
export class LogsService {
  /** Ghi các sự kiện từ FE vào cùng file log (scope=CLIENT) để điều tra xuyên FE↔BE. */
  ingest(events: ClientLogEvent[], ctx: { ip?: string; userAgent?: string }) {
    for (const e of events) {
      const level = ['debug', 'info', 'warn', 'error'].includes(e.level ?? '')
        ? (e.level as 'debug' | 'info' | 'warn' | 'error')
        : 'info'
      appLog[level]('CLIENT', e.event, {
        sessionId: e.sessionId,
        clientTs: e.ts,
        url: e.url,
        data: e.data,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      })
    }
    return { received: events.length }
  }

  /** Đọc N dòng cuối của file log hôm nay (để xem nhanh không cần vào server). */
  tail(lines: number): { file: string; lines: string[] } {
    const file = LOGGER_CONFIG.fileForToday()
    try {
      const content = readFileSync(file, 'utf8')
      const all = content.split('\n').filter(Boolean)
      return { file, lines: all.slice(-lines) }
    } catch {
      return { file, lines: [] }
    }
  }
}
