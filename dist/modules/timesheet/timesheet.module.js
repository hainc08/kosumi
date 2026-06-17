"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimesheetModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const timesheet_entry_entity_1 = require("./entities/timesheet-entry.entity");
const worker_entity_1 = require("../workers/entities/worker.entity");
const worker_contract_entity_1 = require("../workers/entities/worker-contract.entity");
const timesheet_service_1 = require("./timesheet.service");
const timesheet_controller_1 = require("./timesheet.controller");
let TimesheetModule = class TimesheetModule {
};
exports.TimesheetModule = TimesheetModule;
exports.TimesheetModule = TimesheetModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([timesheet_entry_entity_1.TimesheetEntry, worker_entity_1.Worker, worker_contract_entity_1.WorkerContract])],
        controllers: [timesheet_controller_1.TimesheetController],
        providers: [timesheet_service_1.TimesheetService],
    })
], TimesheetModule);
//# sourceMappingURL=timesheet.module.js.map