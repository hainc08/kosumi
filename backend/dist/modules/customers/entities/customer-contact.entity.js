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
exports.CustomerContact = void 0;
const typeorm_1 = require("typeorm");
let CustomerContact = class CustomerContact {
    id;
    customerId;
    fullName;
    title;
    phone;
    email;
    isPrimary;
    sortOrder;
    createdAt;
    updatedAt;
};
exports.CustomerContact = CustomerContact;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CustomerContact.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'customer_id', type: 'char', length: 36 }),
    __metadata("design:type", String)
], CustomerContact.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'full_name', length: 200 }),
    __metadata("design:type", String)
], CustomerContact.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], CustomerContact.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], CustomerContact.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", Object)
], CustomerContact.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_primary', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], CustomerContact.prototype, "isPrimary", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_order', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CustomerContact.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], CustomerContact.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], CustomerContact.prototype, "updatedAt", void 0);
exports.CustomerContact = CustomerContact = __decorate([
    (0, typeorm_1.Entity)('customer_contacts')
], CustomerContact);
//# sourceMappingURL=customer-contact.entity.js.map