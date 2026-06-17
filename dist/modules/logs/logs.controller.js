"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogsController = void 0;
const common_1 = require("@nestjs/common");
const logs_service_1 = require("./logs.service");
const client_log_dto_1 = require("./dto/client-log.dto");
let LogsController = class LogsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    client(dto, req) {
        return this.svc.ingest(dto.events ?? [], {
            ip: req.ip || req.socket?.remoteAddress,
            userAgent: req.headers['user-agent'],
        });
    }
    tail(token, lines) {
        const configured = process.env.LOG_VIEW_TOKEN;
        if (configured) {
            if (token !== configured)
                throw new common_1.ForbiddenException('Sai token xem log');
        }
        else if (process.env.NODE_ENV === 'production') {
            throw new common_1.ForbiddenException('Cần đặt LOG_VIEW_TOKEN để xem log ở production');
        }
        const n = Math.min(Math.max(Number(lines) || 200, 1), 2000);
        return this.svc.tail(n);
    }
};
exports.LogsController = LogsController;
__decorate([
    (0, common_1.Post)('client'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [client_log_dto_1.ClientLogBatchDto, Object]),
    __metadata("design:returntype", void 0)
], LogsController.prototype, "client", null);
__decorate([
    (0, common_1.Get)('tail'),
    __param(0, (0, common_1.Query)('token')),
    __param(1, (0, common_1.Query)('lines')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LogsController.prototype, "tail", null);
exports.LogsController = LogsController = __decorate([
    (0, common_1.Controller)('logs'),
    __metadata("design:paramtypes", [logs_service_1.LogsService])
], LogsController);
//# sourceMappingURL=logs.controller.js.map