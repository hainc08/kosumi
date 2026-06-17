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
exports.Project = void 0;
const typeorm_1 = require("typeorm");
const numeric_transformer_1 = require("../../../common/transformers/numeric.transformer");
let Project = class Project {
    id;
    code;
    name;
    customerId;
    projectType;
    siteId;
    contractValue;
    startDate;
    deadline;
    actualEndDate;
    progressPct;
    status;
    description;
    managerId;
    deletedAt;
    createdAt;
    updatedAt;
};
exports.Project = Project;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Project.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 20 }),
    __metadata("design:type", String)
], Project.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], Project.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'customer_id', type: 'char', length: 36, nullable: true }),
    __metadata("design:type", Object)
], Project.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_type', type: 'enum', enum: ['commercial', 'apartment', 'industrial', 'art', 'other'] }),
    __metadata("design:type", String)
], Project.prototype, "projectType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'site_id', type: 'char', length: 36, nullable: true }),
    __metadata("design:type", Object)
], Project.prototype, "siteId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contract_value', type: 'decimal', precision: 15, scale: 2, nullable: true, transformer: new numeric_transformer_1.ColumnNumericTransformer() }),
    __metadata("design:type", Object)
], Project.prototype, "contractValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_date', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], Project.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], Project.prototype, "deadline", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actual_end_date', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], Project.prototype, "actualEndDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'progress_pct', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Project.prototype, "progressPct", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['planning', 'in_progress', 'near_deadline', 'completed', 'paused', 'cancelled'], default: 'planning' }),
    __metadata("design:type", String)
], Project.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Project.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'manager_id', type: 'char', length: 36, nullable: true }),
    __metadata("design:type", Object)
], Project.prototype, "managerId", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Object)
], Project.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Project.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Project.prototype, "updatedAt", void 0);
exports.Project = Project = __decorate([
    (0, typeorm_1.Entity)('projects')
], Project);
//# sourceMappingURL=project.entity.js.map