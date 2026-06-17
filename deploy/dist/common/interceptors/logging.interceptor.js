"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const operators_1 = require("rxjs/operators");
const app_logger_1 = require("../logger/app-logger");
function summarize(data) {
    if (Array.isArray(data))
        return { kind: 'array', length: data.length };
    if (data && typeof data === 'object') {
        const inner = data.data;
        if (Array.isArray(inner))
            return { kind: 'array', length: inner.length };
        if (inner && typeof inner === 'object')
            return { kind: 'object', keys: Object.keys(inner).slice(0, 20) };
        return { kind: 'object', keys: Object.keys(data).slice(0, 20) };
    }
    return { kind: typeof data };
}
let LoggingInterceptor = class LoggingInterceptor {
    intercept(ctx, next) {
        const http = ctx.switchToHttp();
        const req = http.getRequest();
        const res = http.getResponse();
        const requestId = req.headers['x-request-id'] || (0, crypto_1.randomUUID)();
        req.requestId = requestId;
        res.setHeader('X-Request-Id', requestId);
        if (req.originalUrl.startsWith('/api/logs/client'))
            return next.handle();
        const startedAt = Date.now();
        const base = {
            requestId,
            method: req.method,
            url: req.originalUrl,
            ip: req.ip || req.socket?.remoteAddress,
        };
        const writeMethod = ['POST', 'PUT', 'PATCH'].includes(req.method);
        app_logger_1.appLog.info('HTTP', `→ ${req.method} ${req.originalUrl}`, {
            ...base,
            query: req.query && Object.keys(req.query).length ? req.query : undefined,
            body: writeMethod ? req.body : undefined,
        });
        return next.handle().pipe((0, operators_1.tap)({
            next: (data) => {
                app_logger_1.appLog.info('HTTP', `← ${req.method} ${req.originalUrl} ${res.statusCode}`, {
                    ...base,
                    status: res.statusCode,
                    durationMs: Date.now() - startedAt,
                    result: summarize(data),
                });
            },
            error: (err) => {
                app_logger_1.appLog.error('HTTP', `✗ ${req.method} ${req.originalUrl}`, {
                    ...base,
                    status: err?.status,
                    durationMs: Date.now() - startedAt,
                    error: err?.message,
                });
            },
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map