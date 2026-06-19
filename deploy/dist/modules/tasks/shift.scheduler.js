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
var ShiftScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftScheduler = void 0;
const common_1 = require("@nestjs/common");
const tasks_service_1 = require("./tasks.service");
const shift_1 = require("./shift");
let ShiftScheduler = ShiftScheduler_1 = class ShiftScheduler {
    svc;
    logger = new common_1.Logger(ShiftScheduler_1.name);
    timer = null;
    lastClockOutDay = '';
    constructor(svc) {
        this.svc = svc;
    }
    onModuleInit() {
        this.timer = setInterval(() => { void this.tick(new Date()); }, 60_000);
    }
    onModuleDestroy() {
        if (this.timer)
            clearInterval(this.timer);
        this.timer = null;
    }
    async tick(now) {
        try {
            await this.svc.sweepExpiredOvertime(now);
            const today = now.toISOString().slice(0, 10);
            const pastShiftEnd = now.getHours() > shift_1.SHIFT_END_HOUR || (now.getHours() === shift_1.SHIFT_END_HOUR && now.getMinutes() >= shift_1.SHIFT_END_MIN);
            if (pastShiftEnd && this.lastClockOutDay !== today) {
                this.lastClockOutDay = today;
                const r = await this.svc.endOfShiftClockOut(now);
                if (r.ended > 0)
                    this.logger.log(`Tan ca 17:00: đóng ${r.ended} lượt giao việc`);
            }
        }
        catch (e) {
            this.logger.error('Lỗi scheduler ca làm', e);
        }
    }
};
exports.ShiftScheduler = ShiftScheduler;
exports.ShiftScheduler = ShiftScheduler = ShiftScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tasks_service_1.TasksService])
], ShiftScheduler);
//# sourceMappingURL=shift.scheduler.js.map