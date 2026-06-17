import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { Request, Response } from 'express'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { appLog } from '../logger/app-logger'

/** Tóm tắt response để log: mảng → độ dài, object → các khóa cấp 1. */
function summarize(data: unknown): Record<string, unknown> {
  if (Array.isArray(data)) return { kind: 'array', length: data.length }
  if (data && typeof data === 'object') {
    const inner = (data as Record<string, unknown>).data
    if (Array.isArray(inner)) return { kind: 'array', length: inner.length }
    if (inner && typeof inner === 'object') return { kind: 'object', keys: Object.keys(inner).slice(0, 20) }
    return { kind: 'object', keys: Object.keys(data as object).slice(0, 20) }
  }
  return { kind: typeof data }
}

/**
 * Log mỗi HTTP request: gắn requestId (cũng trả về header X-Request-Id để đối chiếu
 * với log phía frontend), đo thời lượng, ghi method/url/status/body (đã che) + tóm tắt kết quả.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = ctx.switchToHttp()
    const req = http.getRequest<Request & { requestId?: string }>()
    const res = http.getResponse<Response>()

    const requestId = (req.headers['x-request-id'] as string) || randomUUID()
    req.requestId = requestId
    res.setHeader('X-Request-Id', requestId)

    // Bỏ qua chính endpoint nhận log của FE để không tự sinh nhiễu.
    if (req.originalUrl.startsWith('/api/logs/client')) return next.handle()

    const startedAt = Date.now()
    const base = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.socket?.remoteAddress,
    }

    // Chỉ log body cho các method ghi dữ liệu (POST/PUT/PATCH) để khỏi ồn.
    const writeMethod = ['POST', 'PUT', 'PATCH'].includes(req.method)
    appLog.info('HTTP', `→ ${req.method} ${req.originalUrl}`, {
      ...base,
      query: req.query && Object.keys(req.query).length ? req.query : undefined,
      body: writeMethod ? req.body : undefined,
    })

    return next.handle().pipe(
      tap({
        next: (data) => {
          appLog.info('HTTP', `← ${req.method} ${req.originalUrl} ${res.statusCode}`, {
            ...base,
            status: res.statusCode,
            durationMs: Date.now() - startedAt,
            result: summarize(data),
          })
        },
        error: (err) => {
          appLog.error('HTTP', `✗ ${req.method} ${req.originalUrl}`, {
            ...base,
            status: (err as { status?: number })?.status,
            durationMs: Date.now() - startedAt,
            error: (err as Error)?.message,
          })
        },
      }),
    )
  }
}
