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
exports.TasksController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const tasks_service_1 = require("./tasks.service");
const assign_worker_dto_1 = require("./dto/assign-worker.dto");
const transfer_worker_dto_1 = require("./dto/transfer-worker.dto");
let TasksController = class TasksController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    activeTasks() { return this.svc.activeTasksAll(); }
    availableWorkers(siteId) {
        return this.svc.availableWorkers(siteId);
    }
    completed() { return this.svc.completedTasks(); }
    clockOut() { return this.svc.endOfShiftClockOut(new Date()); }
    tasks(quoteId, projectId) {
        if (projectId)
            return this.svc.tasksForProject(projectId);
        return this.svc.tasksForQuote(quoteId);
    }
    generateFromQuote(quoteId) {
        return this.svc.generateFromQuote(quoteId);
    }
    generateForProject(projectId) {
        return this.svc.generateForProject(projectId);
    }
    transfer(dto) {
        return this.svc.transfer(dto.workerId, dto.fromTaskId, dto.toTaskId);
    }
    saveAssignments(body) {
        return this.svc.saveAssignments(body.draft, body.otHours);
    }
    assign(id, dto) {
        return this.svc.assign(id, dto.workerId, dto.otHours);
    }
    unassign(id, dto) {
        return this.svc.unassign(id, dto.workerId);
    }
    complete(id) {
        return this.svc.completeTask(id);
    }
    cancel(id) {
        return this.svc.cancelTask(id);
    }
};
exports.TasksController = TasksController;
__decorate([
    (0, common_1.Get)('active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "activeTasks", null);
__decorate([
    (0, common_1.Get)('available-workers'),
    __param(0, (0, common_1.Query)('siteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "availableWorkers", null);
__decorate([
    (0, common_1.Get)('completed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "completed", null);
__decorate([
    (0, common_1.Post)('clock-out'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "clockOut", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('quoteId')),
    __param(1, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "tasks", null);
__decorate([
    (0, common_1.Post)('generate-from-quote'),
    __param(0, (0, common_1.Query)('quoteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "generateFromQuote", null);
__decorate([
    (0, common_1.Post)('generate-for-project'),
    __param(0, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "generateForProject", null);
__decorate([
    (0, common_1.Post)('transfer'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [transfer_worker_dto_1.TransferWorkerDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "transfer", null);
__decorate([
    (0, common_1.Post)('assignments/bulk'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "saveAssignments", null);
__decorate([
    (0, common_1.Post)(':id/assign'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_worker_dto_1.AssignWorkerDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "assign", null);
__decorate([
    (0, common_1.Post)(':id/unassign'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_worker_dto_1.AssignWorkerDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "unassign", null);
__decorate([
    (0, common_1.Post)(':id/complete'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "complete", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "cancel", null);
exports.TasksController = TasksController = __decorate([
    (0, common_1.Controller)('tasks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [tasks_service_1.TasksService])
], TasksController);
//# sourceMappingURL=tasks.controller.js.map