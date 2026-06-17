import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { Request, Response } from 'express'
import { appLog } from '../logger/app-logger'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp()
    const res = http.getResponse<Response>()
    const req = http.getRequest<Request & { requestId?: string }>()

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const payload = exception instanceof HttpException ? exception.getResponse() : { message: 'Lỗi máy chủ' }
    const body = typeof payload === 'string' ? { message: payload } : payload

    // Ghi log lỗi: 5xx kèm stack (lỗi không lường trước), 4xx chỉ cảnh báo gọn.
    const meta = {
      requestId: req?.requestId,
      method: req?.method,
      url: req?.originalUrl,
      status,
      body: ['POST', 'PUT', 'PATCH'].includes(req?.method ?? '') ? req?.body : undefined,
      response: body,
      stack: status >= 500 && exception instanceof Error ? exception.stack : undefined,
    }
    if (status >= 500) appLog.error('EXCEPTION', `${req?.method} ${req?.originalUrl} → ${status}`, meta)
    else appLog.warn('EXCEPTION', `${req?.method} ${req?.originalUrl} → ${status}`, meta)

    res.status(status).json({ statusCode: status, requestId: req?.requestId, ...(body as object) })
  }
}
