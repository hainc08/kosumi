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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimesheetService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const timesheet_entry_entity_1 = require("./entities/timesheet-entry.entity");
const worker_entity_1 = require("../workers/entities/worker.entity");
const worker_contract_entity_1 = require("../workers/entities/worker-contract.entity");
let TimesheetService = class TimesheetService {
    repo;
    workerRepo;
    contractRepo;
    constructor(repo, workerRepo, contractRepo) {
        this.repo = repo;
        this.workerRepo = workerRepo;
        this.contractRepo = contractRepo;
    }
    async availableMonths() {
        const rows = await this.repo
            .createQueryBuilder('t')
            .select("DATE_FORMAT(t.work_date, '%Y-%m')", 'ym')
            .distinct(true)
            .orderBy('ym', 'DESC')
            .getRawMany();
        return rows.map((r) => r.ym);
    }
    async summaries(q) {
        const ym = q.yearMonth || (await this.availableMonths())[0];
        if (!ym)
            return [];
        const entries = await this.repo
            .createQueryBuilder('t')
            .where("DATE_FORMAT(t.work_date, '%Y-%m') = :ym", { ym })
            .getMany();
        if (entries.length === 0)
            return [];
        const byWorker = new Map();
        for (const e of entries) {
            const arr = byWorker.get(e.workerId) ?? [];
            arr.push(e);
            byWorker.set(e.workerId, arr);
        }
        const workerIds = [...byWorker.keys()];
        const [workers, contracts] = await Promise.all([
            this.workerRepo.find({ where: { id: (0, typeorm_2.In)(workerIds) } }),
            this.contractRepo.find({ where: { workerId: (0, typeorm_2.In)(workerIds), isActive: true } }),
        ]);
        const workerById = new Map(workers.map((w) => [w.id, w]));
        const contractByWorker = new Map(contracts.map((c) => [c.workerId, c]));
        const rows = [];
        for (const [workerId, workerEntries] of byWorker) {
            const w = workerById.get(workerId);
            if (!w)
                continue;
            if (q.search &&
                !w.fullName.toLowerCase().includes(q.search.toLowerCase()) &&
                !w.code.toLowerCase().includes(q.search.toLowerCase()))
                continue;
            const c = contractByWorker.get(workerId);
            const anyPending = workerEntries.some((e) => e.status === 'pending_approval' || e.status === 'draft');
            const allowanceSum = (c?.allowanceResponsibility ?? 0) + (c?.allowanceAttendance ?? 0);
            rows.push({
                workerId,
                yearMonth: ym,
                totalWorkdays: workerEntries.filter((e) => e.dayType === 'workday').length,
                totalRegularHours: workerEntries.reduce((s, e) => s + e.regularHours, 0),
                totalOtHours: workerEntries.reduce((s, e) => s + e.overtimeHours, 0),
                totalLeaveDays: workerEntries.filter((e) => e.dayType === 'leave_paid' || e.dayType === 'leave_unpaid').length,
                totalAbsentDays: workerEntries.filter((e) => e.dayType === 'absent').length,
                totalPay: workerEntries.reduce((s, e) => s + e.payAmount, 0),
                baseSalary: c?.baseSalary ?? null,
                allowance: allowanceSum || null,
                status: anyPending ? 'submitted' : 'approved',
                worker: { id: w.id, code: w.code, fullName: w.fullName },
            });
        }
        return rows.sort((a, b) => a.worker.code.localeCompare(b.worker.code));
    }
    async entriesFor(workerId, yearMonth) {
        return this.repo
            .createQueryBuilder('t')
            .where('t.worker_id = :workerId', { workerId })
            .andWhere("DATE_FORMAT(t.work_date, '%Y-%m') = :ym", { ym: yearMonth })
            .orderBy('t.work_date', 'ASC')
            .getMany();
    }
    async approveMonth(workerId, yearMonth) {
        const result = await this.repo
            .createQueryBuilder()
            .update(timesheet_entry_entity_1.TimesheetEntry)
            .set({ status: 'approved', approvedAt: () => 'NOW()', updatedAt: () => 'NOW()' })
            .where('worker_id = :workerId', { workerId })
            .andWhere("DATE_FORMAT(work_date, '%Y-%m') = :ym", { ym: yearMonth })
            .andWhere('status != :approved', { approved: 'approved' })
            .execute();
        return { updated: result.affected ?? 0 };
    }
};
exports.TimesheetService = TimesheetService;
exports.TimesheetService = TimesheetService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(timesheet_entry_entity_1.TimesheetEntry)),
    __param(1, (0, typeorm_1.InjectRepository)(worker_entity_1.Worker)),
    __param(2, (0, typeorm_1.InjectRepository)(worker_contract_entity_1.WorkerContract)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TimesheetService);
//# sourceMappingURL=timesheet.service.js.map