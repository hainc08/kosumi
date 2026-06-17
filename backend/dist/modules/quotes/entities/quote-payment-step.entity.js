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
exports.QuotePaymentStep = void 0;
const typeorm_1 = require("typeorm");
const numeric_transformer_1 = require("../../../common/transformers/numeric.transformer");
let QuotePaymentStep = class QuotePaymentStep {
    id;
    quoteId;
    stepOrder;
    percentage;
    description;
    descriptionEn;
    createdAt;
    updatedAt;
};
exports.QuotePaymentStep = QuotePaymentStep;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], QuotePaymentStep.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quote_id', type: 'char', length: 36 }),
    __metadata("design:type", String)
], QuotePaymentStep.prototype, "quoteId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'step_order', type: 'int' }),
    __metadata("design:type", Number)
], QuotePaymentStep.prototype, "stepOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, transformer: new numeric_transformer_1.ColumnNumericTransformer() }),
    __metadata("design:type", Number)
], QuotePaymentStep.prototype, "percentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300 }),
    __metadata("design:type", String)
], QuotePaymentStep.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'description_en', type: 'varchar', length: 300, nullable: true }),
    __metadata("design:type", Object)
], QuotePaymentStep.prototype, "descriptionEn", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], QuotePaymentStep.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], QuotePaymentStep.prototype, "updatedAt", void 0);
exports.QuotePaymentStep = QuotePaymentStep = __decorate([
    (0, typeorm_1.Entity)('quote_payment_steps')
], QuotePaymentStep);
//# sourceMappingURL=quote-payment-step.entity.js.map