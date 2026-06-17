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
exports.TimesheetEntry = void 0;
const typeorm_1 = require("typeorm");
const numeric_transformer_1 = require("../../../common/transformers/numeric.transformer");
let TimesheetEntry = class TimesheetEntry {
    id;
    workerId;
    workDate;
    siteId;
    regularHours;
    overtimeHours;
    dayType;
    contractType;
    rateNormal;
    rateOvertime;
    payAmount;
    status;
    approvedBy;
    approvedAt;
    notes;
    createdAt;
    updatedAt;
};
exports.TimesheetEntry = TimesheetEntry;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TimesheetEntry.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'worker_id', type: 'char', length: 36 }),
    __metadata("design:type", String)
], TimesheetEntry.prototype, "workerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'work_date', type: 'date' }),
    __metadata("design:type", String)
], TimesheetEntry.prototype, "workDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'site_id', type: 'char', length: 36, nullable: true }),
    __metadata("design:type", Object)
], TimesheetEntry.prototype, "siteId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'regular_hours', type: 'decimal', precision: 5, scale: 2, transformer: new numeric_transformer_1.ColumnNumericTransformer() }),
    __metadata("design:type", Number)
], TimesheetEntry.prototype, "regularHours", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'overtime_hours', type: 'decimal', precision: 5, scale: 2, transformer: new numeric_transformer_1.ColumnNumericTransformer() }),
    __metadata("design:type", Number)
], TimesheetEntry.prototype, "overtimeHours", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'day_type', type: 'enum', enum: ['workday', 'leave_paid', 'leave_unpaid', 'holiday', 'absent'] }),
    __metadata("design:type", String)
], TimesheetEntry.prototype, "dayType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contract_type', type: 'enum', enum: ['piece_rate', 'official', 'probation'] }),
    __metadata("design:type", String)
], TimesheetEntry.prototype, "contractType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rate_normal', type: 'decimal', precision: 15, scale: 2, nullable: true, transformer: new numeric_transformer_1.ColumnNumericTransformer() }),
    __metadata("design:type", Object)
], TimesheetEntry.prototype, "rateNormal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rate_overtime', type: 'decimal', precision: 15, scale: 2, nullable: true, transformer: new numeric_transformer_1.ColumnNumericTransformer() }),
    __metadata("design:type", Object)
], TimesheetEntry.prototype, "rateOvertime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pay_amount', type: 'decimal', precision: 15, scale: 2, transformer: new numeric_transformer_1.ColumnNumericTransformer() }),
    __metadata("design:type", Number)
], TimesheetEntry.prototype, "payAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['draft', 'pending_approval', 'approved', 'rejected'], default: 'draft' }),
    __metadata("design:type", String)
], TimesheetEntry.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'approved_by', type: 'char', length: 36, nullable: true }),
    __metadata("design:type", Object)
], TimesheetEntry.prototype, "approvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'approved_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], TimesheetEntry.prototype, "approvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], TimesheetEntry.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], TimesheetEntry.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], TimesheetEntry.prototype, "updatedAt", void 0);
exports.TimesheetEntry = TimesheetEntry = __decorate([
    (0, typeorm_1.Entity)('timesheet_entries')
], TimesheetEntry);
//# sourceMappingURL=timesheet-entry.entity.js.map