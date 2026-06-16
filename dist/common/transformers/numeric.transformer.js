"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColumnNumericTransformer = void 0;
class ColumnNumericTransformer {
    to(v) { return v; }
    from(v) { return v === null ? null : Number(v); }
}
exports.ColumnNumericTransformer = ColumnNumericTransformer;
//# sourceMappingURL=numeric.transformer.js.map