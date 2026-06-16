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
exports.Worker = void 0;
const typeorm_1 = require("typeorm");
let Worker = class Worker {
    id;
    code;
    fullName;
    gender;
    dateOfBirth;
    idNumber;
    phone;
    address;
    position;
    experienceYears;
    status;
    notes;
    siteId;
    deletedAt;
    createdAt;
    updatedAt;
};
exports.Worker = Worker;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Worker.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 20 }),
    __metadata("design:type", String)
], Worker.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'full_name', length: 200 }),
    __metadata("design:type", String)
], Worker.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['male', 'female'] }),
    __metadata("design:type", String)
], Worker.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'date_of_birth', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], Worker.prototype, "dateOfBirth", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'id_number', type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], Worker.prototype, "idNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], Worker.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Worker.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['team_leader', 'senior_worker', 'worker', 'apprentice', 'technician', 'supervisor', 'other'] }),
    __metadata("design:type", String)
], Worker.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'experience_years', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Worker.prototype, "experienceYears", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['working', 'on_leave', 'absent', 'resigned'], default: 'working' }),
    __metadata("design:type", String)
], Worker.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Worker.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'site_id', type: 'char', length: 36, nullable: true }),
    __metadata("design:type", Object)
], Worker.prototype, "siteId", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Object)
], Worker.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Worker.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Worker.prototype, "updatedAt", void 0);
exports.Worker = Worker = __decorate([
    (0, typeorm_1.Entity)('workers')
], Worker);
//# sourceMappingURL=worker.entity.js.map