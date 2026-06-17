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
exports.WorkerContract = void 0;
const typeorm_1 = require("typeorm");
const numeric_transformer_1 = require("../../../common/transformers/numeric.transformer");
let WorkerContract = class WorkerContract {
    id;
    workerId;
    contractType;
    startDate;
    endDate;
    baseSalary;
    allowanceResponsibility;
    allowanceAttendance;
    ratePerUnit;
    unitName;
    isActive;
    createdAt;
    updatedAt;
};
exports.WorkerContract = WorkerContract;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WorkerContract.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'worker_id', type: 'char', length: 36 }),
    __metadata("design:type", String)
], WorkerContract.prototype, "workerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contract_type', type: 'enum', enum: ['piece_rate', 'official', 'probation'] }),
    __metadata("design:type", String)
], WorkerContract.prototype, "contractType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_date', type: 'date' }),
    __metadata("design:type", String)
], WorkerContract.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'end_date', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], WorkerContract.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'base_salary', type: 'decimal', precision: 15, scale: 2, nullable: true, transformer: new numeric_transformer_1.ColumnNumericTransformer() }),
    __metadata("design:type", Object)
], WorkerContract.prototype, "baseSalary", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'allowance_responsibility', type: 'decimal', precision: 15, scale: 2, nullable: true, transformer: new numeric_transformer_1.ColumnNumericTransformer() }),
    __metadata("design:type", Object)
], WorkerContract.prototype, "allowanceResponsibility", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'allowance_attendance', type: 'decimal', precision: 15, scale: 2, nullable: true, transformer: new numeric_transformer_1.ColumnNumericTransformer() }),
    __metadata("design:type", Object)
], WorkerContract.prototype, "allowanceAttendance", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rate_per_unit', type: 'decimal', precision: 15, scale: 2, nullable: true, transformer: new numeric_transformer_1.ColumnNumericTransformer() }),
    __metadata("design:type", Object)
], WorkerContract.prototype, "ratePerUnit", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unit_name', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], WorkerContract.prototype, "unitName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], WorkerContract.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], WorkerContract.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], WorkerContract.prototype, "updatedAt", void 0);
exports.WorkerContract = WorkerContract = __decorate([
    (0, typeorm_1.Entity)('worker_contracts')
], WorkerContract);
//# sourceMappingURL=worker-contract.entity.js.map