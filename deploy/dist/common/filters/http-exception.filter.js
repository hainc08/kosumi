"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const app_logger_1 = require("../logger/app-logger");
let HttpExceptionFilter = class HttpExceptionFilter {
    catch(exception, host) {
        const http = host.switchToHttp();
        const res = http.getResponse();
        const req = http.getRequest();
        const status = exception instanceof common_1.HttpException ? exception.getStatus() : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const payload = exception instanceof common_1.HttpException ? exception.getResponse() : { message: 'Lỗi máy chủ' };
        const body = typeof payload === 'string' ? { message: payload } : payload;
        const meta = {
            requestId: req?.requestId,
            method: req?.method,
            url: req?.originalUrl,
            status,
            body: ['POST', 'PUT', 'PATCH'].includes(req?.method ?? '') ? req?.body : undefined,
            response: body,
            stack: status >= 500 && exception instanceof Error ? exception.stack : undefined,
        };
        if (status >= 500)
            app_logger_1.appLog.error('EXCEPTION', `${req?.method} ${req?.originalUrl} → ${status}`, meta);
        else
            app_logger_1.appLog.warn('EXCEPTION', `${req?.method} ${req?.originalUrl} → ${status}`, meta);
        res.status(status).json({ statusCode: status, requestId: req?.requestId, ...body });
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map