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
exports.Quote = void 0;
const typeorm_1 = require("typeorm");
const numeric_transformer_1 = require("../../../common/transformers/numeric.transformer");
let Quote = class Quote {
    id;
    code;
    projectId;
    customerId;
    contactId;
    title;
    quoteDate;
    validUntil;
    status;
    rejectReason;
    taxRate;
    validityDays;
    deliveryDays;
    paymentTerms;
    warrantyNote;
    contractorNote;
    notes;
    deletedAt;
    createdAt;
    updatedAt;
};
exports.Quote = Quote;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Quote.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 20 }),
    __metadata("design:type", String)
], Quote.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id', type: 'char', length: 36 }),
    __metadata("design:type", String)
], Quote.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'customer_id', type: 'char', length: 36, nullable: true }),
    __metadata("design:type", Object)
], Quote.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_id', type: 'char', length: 36, nullable: true }),
    __metadata("design:type", Object)
], Quote.prototype, "contactId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300 }),
    __metadata("design:type", String)
], Quote.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quote_date', type: 'date' }),
    __metadata("design:type", String)
], Quote.prototype, "quoteDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'valid_until', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], Quote.prototype, "validUntil", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['draft', 'pending', 'approved', 'rejected', 'po_received'], default: 'draft' }),
    __metadata("design:type", String)
], Quote.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reject_reason', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Quote.prototype, "rejectReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2, default: 8, transformer: new numeric_transformer_1.ColumnNumericTransformer() }),
    __metadata("design:type", Number)
], Quote.prototype, "taxRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'validity_days', type: 'int' }),
    __metadata("design:type", Number)
], Quote.prototype, "validityDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delivery_days', type: 'int' }),
    __metadata("design:type", Number)
], Quote.prototype, "deliveryDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_terms', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], Quote.prototype, "paymentTerms", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'warranty_note', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Quote.prototype, "warrantyNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contractor_note', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Quote.prototype, "contractorNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Quote.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Object)
], Quote.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Quote.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Quote.prototype, "updatedAt", void 0);
exports.Quote = Quote = __decorate([
    (0, typeorm_1.Entity)('quotes')
], Quote);
//# sourceMappingURL=quote.entity.js.map