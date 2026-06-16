"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateQuoteDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_quote_dto_1 = require("./create-quote.dto");
class UpdateQuoteDto extends (0, swagger_1.PartialType)(create_quote_dto_1.CreateQuoteDto) {
}
exports.UpdateQuoteDto = UpdateQuoteDto;
//# sourceMappingURL=update-quote.dto.js.map