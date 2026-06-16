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
exports.Site = void 0;
const typeorm_1 = require("typeorm");
const numeric_transformer_1 = require("../../../common/transformers/numeric.transformer");
let Site = class Site {
    id;
    code;
    name;
    type;
    industrialZone;
    address;
    city;
    managerId;
    phone;
    areaM2;
    status;
    notes;
    deletedAt;
    createdAt;
    updatedAt;
};
exports.Site = Site;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Site.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 20 }),
    __metadata("design:type", String)
], Site.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], Site.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['factory', 'construction', 'warehouse'] }),
    __metadata("design:type", String)
], Site.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'industrial_zone', type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", Object)
], Site.prototype, "industrialZone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Site.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], Site.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'manager_id', type: 'char', length: 36, nullable: true }),
    __metadata("design:type", Object)
], Site.prototype, "managerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], Site.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'area_m2', type: 'decimal', precision: 10, scale: 2, nullable: true, transformer: new numeric_transformer_1.ColumnNumericTransformer() }),
    __metadata("design:type", Object)
], Site.prototype, "areaM2", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['active', 'paused', 'preparing'], default: 'active' }),
    __metadata("design:type", String)
], Site.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Site.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Object)
], Site.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Site.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Site.prototype, "updatedAt", void 0);
exports.Site = Site = __decorate([
    (0, typeorm_1.Entity)('sites')
], Site);
//# sourceMappingURL=site.entity.js.map