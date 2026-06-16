"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedWorkers = seedWorkers;
const worker_entity_1 = require("../../modules/workers/entities/worker.entity");
const worker_contract_entity_1 = require("../../modules/workers/entities/worker-contract.entity");
const site_entity_1 = require("../../modules/sites/entities/site.entity");
const code_util_1 = require("../../common/utils/code.util");
async function seedWorkers(ds) {
    const repo = ds.getRepository(worker_entity_1.Worker);
    const contractRepo = ds.getRepository(worker_contract_entity_1.WorkerContract);
    if (await repo.count({ withDeleted: true }) > 0)
        return;
    const siteRepo = ds.getRepository(site_entity_1.Site);
    const sites = await siteRepo.find();
    const siteIdByCode = new Map(sites.map((s) => [s.code, s.id]));
    const data = [
        {
            worker: {
                fullName: 'Nguyễn Văn Hùng', gender: 'male', dateOfBirth: '1990-05-12',
                idNumber: '001090012345', phone: '0901234567', address: 'Đông Anh, Hà Nội',
                position: 'senior_worker', experienceYears: 8, status: 'working', notes: null,
                siteId: siteIdByCode.get('CS001') ?? null,
            },
            contract: {
                contractType: 'official', startDate: '2026-01-12', endDate: null, baseSalary: 12000000,
                allowanceResponsibility: 800000, allowanceAttendance: 500000,
                ratePerUnit: null, unitName: null, isActive: true,
            },
        },
        {
            worker: {
                fullName: 'Trần Thị Mai', gender: 'female', dateOfBirth: '1995-09-03',
                idNumber: '001195067890', phone: '0912345678', address: 'Long Biên, Hà Nội',
                position: 'worker', experienceYears: 4, status: 'working', notes: null,
                siteId: siteIdByCode.get('CS002') ?? null,
            },
            contract: {
                contractType: 'official', startDate: '2026-02-02', endDate: null, baseSalary: 9000000,
                allowanceResponsibility: null, allowanceAttendance: 300000,
                ratePerUnit: null, unitName: null, isActive: true,
            },
        },
        {
            worker: {
                fullName: 'Lê Văn Tâm', gender: 'male', dateOfBirth: '1988-12-20',
                idNumber: '001088054321', phone: '0987654321', address: 'Gia Lâm, Hà Nội',
                position: 'team_leader', experienceYears: 10, status: 'on_leave', notes: 'Nghỉ phép năm',
                siteId: siteIdByCode.get('CS001') ?? null,
            },
            contract: {
                contractType: 'official', startDate: '2026-01-15', endDate: null, baseSalary: 15000000,
                allowanceResponsibility: 2000000, allowanceAttendance: 500000,
                ratePerUnit: null, unitName: null, isActive: true,
            },
        },
        {
            worker: {
                fullName: 'Phạm Đình Quân', gender: 'male', dateOfBirth: '1992-03-08',
                idNumber: '001092011223', phone: '0934567890', address: 'Sóc Sơn, Hà Nội',
                position: 'worker', experienceYears: 6, status: 'working', notes: null,
                siteId: siteIdByCode.get('CS001') ?? null,
            },
            contract: {
                contractType: 'probation', startDate: '2026-04-01', endDate: '2026-07-01', baseSalary: 7000000,
                allowanceResponsibility: null, allowanceAttendance: 300000,
                ratePerUnit: null, unitName: null, isActive: true,
            },
        },
        {
            worker: {
                fullName: 'Hoàng Thị Lan', gender: 'female', dateOfBirth: '1997-07-25',
                idNumber: '001197078899', phone: '0945678901', address: 'Hoàng Mai, Hà Nội',
                position: 'apprentice', experienceYears: 3, status: 'working', notes: null,
                siteId: siteIdByCode.get('CS002') ?? null,
            },
            contract: {
                contractType: 'probation', startDate: '2026-02-10', endDate: '2026-05-10', baseSalary: 5500000,
                allowanceResponsibility: null, allowanceAttendance: 200000,
                ratePerUnit: null, unitName: null, isActive: true,
            },
        },
        {
            worker: {
                fullName: 'Đỗ Minh Khang', gender: 'male', dateOfBirth: '1985-11-02',
                idNumber: '001085033445', phone: '0956789012', address: 'Bình Tân, TP.HCM',
                position: 'supervisor', experienceYears: 12, status: 'working', notes: null,
                siteId: siteIdByCode.get('CS003') ?? null,
            },
            contract: {
                contractType: 'official', startDate: '2026-01-18', endDate: null, baseSalary: 18000000,
                allowanceResponsibility: 3000000, allowanceAttendance: 500000,
                ratePerUnit: null, unitName: null, isActive: true,
            },
        },
        {
            worker: {
                fullName: 'Vũ Thị Hồng', gender: 'female', dateOfBirth: '1993-04-17',
                idNumber: '001193044556', phone: '0967890123', address: 'Bình Tân, TP.HCM',
                position: 'technician', experienceYears: 5, status: 'working', notes: null,
                siteId: siteIdByCode.get('CS003') ?? null,
            },
            contract: {
                contractType: 'official', startDate: '2026-02-15', endDate: null, baseSalary: 13000000,
                allowanceResponsibility: 1000000, allowanceAttendance: 500000,
                ratePerUnit: null, unitName: null, isActive: true,
            },
        },
        {
            worker: {
                fullName: 'Bùi Văn Sơn', gender: 'male', dateOfBirth: '1991-08-30',
                idNumber: '001091055667', phone: '0978901234', address: 'Long Biên, Hà Nội',
                position: 'worker', experienceYears: 7, status: 'absent', notes: 'Nghỉ không phép 1 ngày',
                siteId: siteIdByCode.get('CS002') ?? null,
            },
            contract: {
                contractType: 'piece_rate', startDate: '2026-02-20', endDate: null, baseSalary: null,
                allowanceResponsibility: null, allowanceAttendance: null,
                ratePerUnit: 150000, unitName: 'm²', isActive: true,
            },
        },
    ];
    for (let i = 0; i < data.length; i++) {
        const { worker, contract } = data[i];
        const saved = await repo.save(repo.create({ ...worker, code: (0, code_util_1.makeCode)('CN', i + 1) }));
        await contractRepo.save(contractRepo.create({ ...contract, workerId: saved.id }));
    }
}
//# sourceMappingURL=workers.seed.js.map