"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedTimesheet = seedTimesheet;
const typeorm_1 = require("typeorm");
const timesheet_entry_entity_1 = require("../../modules/timesheet/entities/timesheet-entry.entity");
const worker_entity_1 = require("../../modules/workers/entities/worker.entity");
const worker_contract_entity_1 = require("../../modules/workers/entities/worker-contract.entity");
const pay_calculator_util_1 = require("../../common/utils/pay-calculator.util");
const YEAR_MONTH = '2026-06';
const WORKDAYS = ['01', '02', '03', '04', '05', '08', '09', '10', '11', '12'].map((d) => `${YEAR_MONTH}-${d}`);
const SCENARIOS = {
    CN001: { days: {} },
    CN002: { days: { 5: 'leave_paid' } },
    CN003: { days: { 0: 'leave_paid', 1: 'leave_paid', 2: 'leave_paid', 3: 'leave_paid', 4: 'leave_paid', 5: 'leave_paid', 6: 'leave_paid', 7: 'leave_paid', 8: 'leave_paid', 9: 'leave_paid' } },
    CN004: { days: {} },
    CN005: { days: {} },
    CN006: { days: {} },
    CN007: { days: { 9: 'holiday' } },
    CN008: { days: { 6: 'absent', 7: 'absent' } },
};
async function seedTimesheet(ds) {
    const entryRepo = ds.getRepository(timesheet_entry_entity_1.TimesheetEntry);
    if (await entryRepo.count() > 0)
        return;
    const workerRepo = ds.getRepository(worker_entity_1.Worker);
    const contractRepo = ds.getRepository(worker_contract_entity_1.WorkerContract);
    const codes = Object.keys(SCENARIOS);
    const workers = await workerRepo.find({ where: { code: (0, typeorm_1.In)(codes) } });
    const workersByCode = new Map(workers.map((w) => [w.code, w]));
    const entries = [];
    for (const code of codes) {
        const w = workersByCode.get(code);
        if (!w)
            continue;
        if (w.status === 'resigned')
            continue;
        const c = await contractRepo.findOne({ where: { workerId: w.id, isActive: true } });
        if (!c)
            continue;
        const sc = SCENARIOS[code] ?? { days: {} };
        const status = code === 'CN006' || code === 'CN008' ? 'pending_approval' : 'approved';
        WORKDAYS.forEach((date, idx) => {
            const dayType = sc.days[idx] ?? 'workday';
            const isWork = dayType === 'workday';
            const regularHours = isWork ? 8 : dayType === 'leave_paid' || dayType === 'holiday' ? 8 : 0;
            const overtimeHours = 0;
            const payAmount = (0, pay_calculator_util_1.computeDayPay)({
                contractType: c.contractType,
                dayType,
                regularHours: isWork ? 8 : 0,
                overtimeHours,
                baseSalary: c.baseSalary,
                allowanceResponsibility: c.allowanceResponsibility,
                allowanceAttendance: c.allowanceAttendance,
            });
            entries.push({
                workerId: w.id,
                workDate: date,
                siteId: w.siteId ?? null,
                regularHours,
                overtimeHours,
                dayType,
                contractType: c.contractType,
                rateNormal: null,
                rateOvertime: null,
                payAmount,
                status,
                approvedBy: null,
                approvedAt: status === 'approved' ? new Date() : null,
                notes: null,
            });
        });
    }
    if (entries.length) {
        await entryRepo.save(entries.map((e) => entryRepo.create(e)));
    }
}
//# sourceMappingURL=timesheet.seed.js.map