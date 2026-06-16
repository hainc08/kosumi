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
exports.TimesheetController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const timesheet_service_1 = require("./timesheet.service");
const query_summaries_dto_1 = require("./dto/query-summaries.dto");
const approve_month_dto_1 = require("./dto/approve-month.dto");
let TimesheetController = class TimesheetController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    months() { return this.svc.availableMonths(); }
    summaries(q) { return this.svc.summaries(q); }
    entries(workerId, yearMonth) {
        return this.svc.entriesFor(workerId, yearMonth);
    }
    approve(dto) {
        return this.svc.approveMonth(dto.workerId, dto.yearMonth);
    }
};
exports.TimesheetController = TimesheetController;
__decorate([
    (0, common_1.Get)('months'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TimesheetController.prototype, "months", null);
__decorate([
    (0, common_1.Get)('summaries'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_summaries_dto_1.QuerySummariesDto]),
    __metadata("design:returntype", void 0)
], TimesheetController.prototype, "summaries", null);
__decorate([
    (0, common_1.Get)('entries'),
    __param(0, (0, common_1.Query)('workerId')),
    __param(1, (0, common_1.Query)('yearMonth')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TimesheetController.prototype, "entries", null);
__decorate([
    (0, common_1.Post)('approve'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [approve_month_dto_1.ApproveMonthDto]),
    __metadata("design:returntype", void 0)
], TimesheetController.prototype, "approve", null);
exports.TimesheetController = TimesheetController = __decorate([
    (0, common_1.Controller)('timesheet'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [timesheet_service_1.TimesheetService])
], TimesheetController);
//# sourceMappingURL=timesheet.controller.js.map