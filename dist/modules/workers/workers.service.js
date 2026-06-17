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
exports.WorkersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const worker_entity_1 = require("./entities/worker.entity");
const worker_contract_entity_1 = require("./entities/worker-contract.entity");
const code_util_1 = require("../../common/utils/code.util");
const worker_display_util_1 = require("../../common/utils/worker-display.util");
let WorkersService = class WorkersService {
    repo;
    contractRepo;
    dataSource;
    constructor(repo, contractRepo, dataSource) {
        this.repo = repo;
        this.contractRepo = contractRepo;
        this.dataSource = dataSource;
    }
    async enrich(workers) {
        if (workers.length === 0)
            return [];
        const ids = workers.map((w) => w.id);
        const contracts = await this.contractRepo.find({ where: { workerId: (0, typeorm_2.In)(ids), isActive: true } });
        const byWorker = new Map();
        for (const c of contracts)
            byWorker.set(c.workerId, c);
        return workers.map((w) => ({
            ...w,
            activeContract: byWorker.get(w.id) ?? null,
            initials: (0, worker_display_util_1.deriveInitials)(w.fullName),
            avatarColor: (0, worker_display_util_1.avatarColorFor)(w.id),
        }));
    }
    async enrichOne(worker) {
        const [result] = await this.enrich([worker]);
        return result;
    }
    async findAll(q) {
        const qb = this.repo.createQueryBuilder('w').where('w.deleted_at IS NULL');
        if (q.search)
            qb.andWhere('(w.full_name LIKE :s OR w.code LIKE :s)', { s: `%${q.search}%` });
        if (q.status)
            qb.andWhere('w.status = :status', { status: q.status });
        if (q.position)
            qb.andWhere('w.position = :position', { position: q.position });
        if (q.siteId)
            qb.andWhere('w.site_id = :siteId', { siteId: q.siteId });
        const workers = await qb.orderBy('w.created_at', 'DESC').getMany();
        return this.enrich(workers);
    }
    async findOne(id) {
        const worker = await this.repo.findOne({ where: { id } });
        if (!worker)
            throw new common_1.NotFoundException('Không tìm thấy nhân viên');
        return this.enrichOne(worker);
    }
    async create(dto) {
        const worker = await this.dataSource.transaction(async (m) => {
            const count = await m.count(worker_entity_1.Worker, { withDeleted: true });
            const worker = m.create(worker_entity_1.Worker, {
                fullName: dto.fullName,
                gender: dto.gender,
                dateOfBirth: dto.dateOfBirth ?? null,
                idNumber: dto.idNumber ?? null,
                phone: dto.phone ?? null,
                address: dto.address ?? null,
                position: dto.position,
                specialty: dto.specialty ?? null,
                notes: dto.notes ?? null,
                siteId: dto.siteId ?? null,
                status: 'working',
                code: (0, code_util_1.makeCode)('CN', count + 1),
            });
            const saved = await m.save(worker);
            const contract = m.create(worker_contract_entity_1.WorkerContract, {
                workerId: saved.id,
                contractType: dto.contractType,
                startDate: dto.startDate,
                endDate: null,
                baseSalary: dto.baseSalary ?? null,
                allowanceResponsibility: dto.allowanceResponsibility ?? null,
                allowanceAttendance: dto.allowanceAttendance ?? null,
                ratePerUnit: dto.ratePerUnit ?? null,
                unitName: dto.unitName ?? null,
                isActive: true,
            });
            await m.save(contract);
            return saved;
        });
        return this.enrichOne(worker);
    }
    async update(id, dto) {
        const worker = await this.repo.findOne({ where: { id } });
        if (!worker)
            throw new common_1.NotFoundException('Không tìm thấy nhân viên');
        const { contractType, startDate, baseSalary, allowanceResponsibility, allowanceAttendance, ratePerUnit, unitName, ...workerFields } = dto;
        Object.assign(worker, workerFields);
        await this.repo.save(worker);
        const activeContract = await this.contractRepo.findOne({ where: { workerId: id, isActive: true } });
        if (activeContract) {
            if (contractType !== undefined)
                activeContract.contractType = contractType;
            if (startDate !== undefined)
                activeContract.startDate = startDate;
            if (baseSalary !== undefined)
                activeContract.baseSalary = baseSalary;
            if (allowanceResponsibility !== undefined)
                activeContract.allowanceResponsibility = allowanceResponsibility;
            if (allowanceAttendance !== undefined)
                activeContract.allowanceAttendance = allowanceAttendance;
            if (ratePerUnit !== undefined)
                activeContract.ratePerUnit = ratePerUnit;
            if (unitName !== undefined)
                activeContract.unitName = unitName;
            await this.contractRepo.save(activeContract);
        }
        return this.enrichOne(worker);
    }
    async setStatus(id, status) {
        const worker = await this.repo.findOne({ where: { id } });
        if (!worker)
            throw new common_1.NotFoundException('Không tìm thấy nhân viên');
        worker.status = status;
        await this.repo.save(worker);
        return this.enrichOne(worker);
    }
    async remove(id) {
        const worker = await this.repo.findOne({ where: { id } });
        if (!worker)
            throw new common_1.NotFoundException('Không tìm thấy nhân viên');
        await this.repo.softDelete(id);
    }
};
exports.WorkersService = WorkersService;
exports.WorkersService = WorkersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(worker_entity_1.Worker)),
    __param(1, (0, typeorm_1.InjectRepository)(worker_contract_entity_1.WorkerContract)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], WorkersService);
//# sourceMappingURL=workers.service.js.map