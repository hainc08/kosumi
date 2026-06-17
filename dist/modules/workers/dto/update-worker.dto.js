"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateWorkerDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_worker_dto_1 = require("./create-worker.dto");
class UpdateWorkerDto extends (0, swagger_1.PartialType)(create_worker_dto_1.CreateWorkerDto) {
}
exports.UpdateWorkerDto = UpdateWorkerDto;
//# sourceMappingURL=update-worker.dto.js.map