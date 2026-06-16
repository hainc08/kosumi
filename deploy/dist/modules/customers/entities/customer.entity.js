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
exports.Customer = void 0;
const typeorm_1 = require("typeorm");
let Customer = class Customer {
    id;
    code;
    name;
    type;
    taxCode;
    address;
    website;
    status;
    defaultValidityDays;
    defaultDeliveryDays;
    defaultPaymentTerms;
    defaultWarrantyNote;
    defaultSpecialNote;
    notes;
    deletedAt;
    createdAt;
    updatedAt;
};
exports.Customer = Customer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Customer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 20 }),
    __metadata("design:type", String)
], Customer.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], Customer.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['business', 'studio', 'foreign', 'state'] }),
    __metadata("design:type", String)
], Customer.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tax_code', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], Customer.prototype, "taxCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Customer.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", Object)
], Customer.prototype, "website", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['active', 'inactive', 'pending'], default: 'active' }),
    __metadata("design:type", String)
], Customer.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_validity_days', type: 'int', default: 10 }),
    __metadata("design:type", Number)
], Customer.prototype, "defaultValidityDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_delivery_days', type: 'int', default: 50 }),
    __metadata("design:type", Number)
], Customer.prototype, "defaultDeliveryDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_payment_terms', type: 'varchar', length: 50, default: '30-25-35-10' }),
    __metadata("design:type", String)
], Customer.prototype, "defaultPaymentTerms", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_warranty_note', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Customer.prototype, "defaultWarrantyNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_special_note', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Customer.prototype, "defaultSpecialNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Customer.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Object)
], Customer.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Customer.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Customer.prototype, "updatedAt", void 0);
exports.Customer = Customer = __decorate([
    (0, typeorm_1.Entity)('customers')
], Customer);
//# sourceMappingURL=customer.entity.js.map