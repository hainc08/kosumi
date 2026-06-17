"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const response_interceptor_1 = require("./common/interceptors/response.interceptor");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const app_logger_1 = require("./common/logger/app-logger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.enableCors({ origin: /^http:\/\/localhost:\d+$/ });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor(), new response_interceptor_1.ResponseInterceptor());
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    const cfg = new swagger_1.DocumentBuilder().setTitle('WorkShop Pro API').setVersion('1.0').build();
    swagger_1.SwaggerModule.setup('api/docs', app, swagger_1.SwaggerModule.createDocument(app, cfg));
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    app_logger_1.appLog.info('BOOT', `API khởi động tại cổng ${port}`, { nodeEnv: process.env.NODE_ENV, logLevel: process.env.LOG_LEVEL });
}
process.on('unhandledRejection', (reason) => {
    app_logger_1.appLog.error('PROCESS', 'unhandledRejection', { reason: reason instanceof Error ? reason.stack : String(reason) });
});
process.on('uncaughtException', (err) => {
    app_logger_1.appLog.error('PROCESS', 'uncaughtException', { error: err.message, stack: err.stack });
});
bootstrap();
//# sourceMappingURL=main.js.map