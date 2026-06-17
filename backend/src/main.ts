import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { appLog } from './common/logger/app-logger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api')
  app.enableCors({ origin: /^http:\/\/localhost:\d+$/, credentials: true }) // mọi cổng localhost (vite có thể nhảy 5173/5174/5175...)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  // Thứ tự: LoggingInterceptor (ngoài) bọc ResponseInterceptor (trong) → log thấy payload cuối.
  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseInterceptor())
  app.useGlobalFilters(new HttpExceptionFilter())
  const cfg = new DocumentBuilder().setTitle('WorkShop Pro API').setVersion('1.0').build()
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, cfg))
  const port = process.env.PORT ?? 3000
  await app.listen(port)
  appLog.info('BOOT', `API khởi động tại cổng ${port}`, { nodeEnv: process.env.NODE_ENV, logLevel: process.env.LOG_LEVEL })
}

process.on('unhandledRejection', (reason) => {
  appLog.error('PROCESS', 'unhandledRejection', { reason: reason instanceof Error ? reason.stack : String(reason) })
})
process.on('uncaughtException', (err) => {
  appLog.error('PROCESS', 'uncaughtException', { error: err.message, stack: err.stack })
})

bootstrap()
