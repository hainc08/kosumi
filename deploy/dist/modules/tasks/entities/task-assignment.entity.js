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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskAssignment = void 0;
const typeorm_1 = require("typeorm");
let TaskAssignment = class TaskAssignment {
    id;
    taskId;
    workerId;
    assignedAt;
    startedAt;
    endedAt;
    isActive;
    isOvertime;
    otEndAt;
    transferredFromTaskId;
    createdAt;
    updatedAt;
};
exports.TaskAssignment = TaskAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TaskAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'task_id', type: 'char', length: 36 }),
    __metadata("design:type", String)
], TaskAssignment.prototype, "taskId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'worker_id', type: 'char', length: 36 }),
    __metadata("design:type", String)
], TaskAssignment.prototype, "workerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assigned_at', type: 'datetime' }),
    __metadata("design:type", Date)
], TaskAssignment.prototype, "assignedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'started_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], TaskAssignment.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ended_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], TaskAssignment.prototype, "endedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], TaskAssignment.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_overtime', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], TaskAssignment.prototype, "isOvertime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ot_end_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], TaskAssignment.prototype, "otEndAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'transferred_from_task_id', type: 'char', length: 36, nullable: true }),
    __metadata("design:type", Object)
], TaskAssignment.prototype, "transferredFromTaskId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], TaskAssignment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], TaskAssignment.prototype, "updatedAt", void 0);
exports.TaskAssignment = TaskAssignment = __decorate([
    (0, typeorm_1.Entity)('task_assignments')
], TaskAssignment);
//# sourceMappingURL=task-assignment.entity.js.map