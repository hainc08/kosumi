"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogsService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const app_logger_1 = require("../../common/logger/app-logger");
let LogsService = class LogsService {
    ingest(events, ctx) {
        for (const e of events) {
            const level = ['debug', 'info', 'warn', 'error'].includes(e.level ?? '')
                ? e.level
                : 'info';
            app_logger_1.appLog[level]('CLIENT', e.event, {
                sessionId: e.sessionId,
                clientTs: e.ts,
                url: e.url,
                data: e.data,
                ip: ctx.ip,
                userAgent: ctx.userAgent,
            });
        }
        return { received: events.length };
    }
    tail(lines) {
        const file = app_logger_1.LOGGER_CONFIG.fileForToday();
        try {
            const content = (0, fs_1.readFileSync)(file, 'utf8');
            const all = content.split('\n').filter(Boolean);
            return { file, lines: all.slice(-lines) };
        }
        catch {
            return { file, lines: [] };
        }
    }
};
exports.LogsService = LogsService;
exports.LogsService = LogsService = __decorate([
    (0, common_1.Injectable)()
], LogsService);
//# sourceMappingURL=logs.service.js.map