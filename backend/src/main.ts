import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api')
  app.enableCors({ origin: /^http:\/\/localhost:\d+$/ }) // mọi cổng localhost (vite có thể nhảy 5173/5174/5175...)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalInterceptors(new ResponseInterceptor())
  app.useGlobalFilters(new HttpExceptionFilter())
  const cfg = new DocumentBuilder().setTitle('WorkShop Pro API').setVersion('1.0').build()
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, cfg))
  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
