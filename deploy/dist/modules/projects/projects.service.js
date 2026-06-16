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
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_entity_1 = require("./entities/project.entity");
const site_entity_1 = require("../sites/entities/site.entity");
const customer_entity_1 = require("../customers/entities/customer.entity");
const code_util_1 = require("../../common/utils/code.util");
let ProjectsService = class ProjectsService {
    repo;
    siteRepo;
    customerRepo;
    dataSource;
    constructor(repo, siteRepo, customerRepo, dataSource) {
        this.repo = repo;
        this.siteRepo = siteRepo;
        this.customerRepo = customerRepo;
        this.dataSource = dataSource;
    }
    async enrich(project) {
        const [site, customer] = await Promise.all([
            project.siteId ? this.siteRepo.findOne({ where: { id: project.siteId } }) : Promise.resolve(null),
            project.customerId ? this.customerRepo.findOne({ where: { id: project.customerId } }) : Promise.resolve(null),
        ]);
        return {
            ...project,
            site: site ? { id: site.id, name: site.name } : undefined,
            customer: customer ? { id: customer.id, name: customer.name } : undefined,
            quoteCount: 0,
            workerCount: 0,
        };
    }
    async enrichMany(projects) {
        if (projects.length === 0)
            return [];
        const siteIds = [...new Set(projects.map((p) => p.siteId).filter((id) => !!id))];
        const customerIds = [...new Set(projects.map((p) => p.customerId).filter((id) => !!id))];
        const [sites, customers] = await Promise.all([
            siteIds.length ? this.siteRepo.find({ where: { id: (0, typeorm_2.In)(siteIds) } }) : Promise.resolve([]),
            customerIds.length ? this.customerRepo.find({ where: { id: (0, typeorm_2.In)(customerIds) } }) : Promise.resolve([]),
        ]);
        const siteById = new Map(sites.map((s) => [s.id, s]));
        const customerById = new Map(customers.map((c) => [c.id, c]));
        return projects.map((p) => {
            const site = p.siteId ? siteById.get(p.siteId) : undefined;
            const customer = p.customerId ? customerById.get(p.customerId) : undefined;
            return {
                ...p,
                site: site ? { id: site.id, name: site.name } : undefined,
                customer: customer ? { id: customer.id, name: customer.name } : undefined,
                quoteCount: 0,
                workerCount: 0,
            };
        });
    }
    async findAll(q) {
        const qb = this.repo.createQueryBuilder('p').where('p.deleted_at IS NULL');
        if (q.search)
            qb.andWhere('(p.name LIKE :s OR p.code LIKE :s)', { s: `%${q.search}%` });
        if (q.status)
            qb.andWhere('p.status = :status', { status: q.status });
        if (q.siteId)
            qb.andWhere('p.site_id = :siteId', { siteId: q.siteId });
        const projects = await qb.orderBy('p.created_at', 'DESC').getMany();
        return this.enrichMany(projects);
    }
    async findOne(id) {
        const project = await this.repo.findOne({ where: { id } });
        if (!project)
            throw new common_1.NotFoundException('Không tìm thấy dự án');
        return this.enrich(project);
    }
    async create(dto) {
        const saved = await this.dataSource.transaction(async (m) => {
            const count = await m.count(project_entity_1.Project, { withDeleted: true });
            const project = m.create(project_entity_1.Project, {
                name: dto.name,
                customerId: dto.customerId ?? null,
                projectType: dto.projectType,
                siteId: dto.siteId ?? null,
                contractValue: dto.contractValue ?? null,
                startDate: dto.startDate ?? null,
                deadline: dto.deadline,
                actualEndDate: null,
                progressPct: dto.progressPct ?? 0,
                status: dto.status ?? 'planning',
                description: dto.description ?? null,
                managerId: null,
                code: (0, code_util_1.makeCode)('PRJ', count + 1),
            });
            return m.save(project);
        });
        return this.enrich(saved);
    }
    async update(id, dto) {
        const project = await this.repo.findOne({ where: { id } });
        if (!project)
            throw new common_1.NotFoundException('Không tìm thấy dự án');
        Object.assign(project, dto);
        const saved = await this.repo.save(project);
        return this.enrich(saved);
    }
    async setStatus(id, status) {
        const project = await this.repo.findOne({ where: { id } });
        if (!project)
            throw new common_1.NotFoundException('Không tìm thấy dự án');
        project.status = status;
        const saved = await this.repo.save(project);
        return this.enrich(saved);
    }
    async remove(id) {
        const project = await this.repo.findOne({ where: { id } });
        if (!project)
            throw new common_1.NotFoundException('Không tìm thấy dự án');
        await this.repo.softDelete(id);
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(site_entity_1.Site)),
    __param(2, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map