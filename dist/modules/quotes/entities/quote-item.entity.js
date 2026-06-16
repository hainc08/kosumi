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
exports.QuoteItem = void 0;
const typeorm_1 = require("typeorm");
const numeric_transformer_1 = require("../../../common/transformers/numeric.transformer");
let QuoteItem = class QuoteItem {
    id;
    quoteId;
    sectionName;
    sectionNameEn;
    sortOrder;
    itemName;
    description;
    unit;
    quantity;
    unitPrice;
    amount;
    notes;
    createdAt;
    updatedAt;
};
exports.QuoteItem = QuoteItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], QuoteItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quote_id', type: 'char', length: 36 }),
    __metadata("design:type", String)
], QuoteItem.prototype, "quoteId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'section_name', type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", Object)
], QuoteItem.prototype, "sectionName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'section_name_en', type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", Object)
], QuoteItem.prototype, "sectionNameEn", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_order', type: 'int' }),
    __metadata("design:type", Number)
], QuoteItem.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'item_name', length: 300 }),
    __metadata("design:type", String)
], QuoteItem.prototype, "itemName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], QuoteItem.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], QuoteItem.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, transformer: new numeric_transformer_1.ColumnNumericTransformer() }),
    __metadata("design:type", Number)
], QuoteItem.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unit_price', type: 'decimal', precision: 15, scale: 2, transformer: new numeric_transformer_1.ColumnNumericTransformer() }),
    __metadata("design:type", Number)
], QuoteItem.prototype, "unitPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, transformer: new numeric_transformer_1.ColumnNumericTransformer() }),
    __metadata("design:type", Number)
], QuoteItem.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], QuoteItem.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], QuoteItem.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], QuoteItem.prototype, "updatedAt", void 0);
exports.QuoteItem = QuoteItem = __decorate([
    (0, typeorm_1.Entity)('quote_items')
], QuoteItem);
//# sourceMappingURL=quote-item.entity.js.map