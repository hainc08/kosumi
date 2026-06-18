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
const quote_entity_1 = require("../quotes/entities/quote.entity");
const task_entity_1 = require("../tasks/entities/task.entity");
const task_assignment_entity_1 = require("../tasks/entities/task-assignment.entity");
const code_util_1 = require("../../common/utils/code.util");
const ZERO_AGG = { quoteCount: 0, workerCount: 0, hasInstallation: false, quotes: [] };
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
    async loadAggregates(ids) {
        const map = new Map();
        for (const id of ids)
            map.set(id, { quoteCount: 0, workerCount: 0, hasInstallation: false, quotes: [] });
        if (ids.length === 0)
            return map;
        const [quoteRows, workerRows] = await Promise.all([
            this.dataSource.getRepository(quote_entity_1.Quote).createQueryBuilder('q')
                .select('q.id', 'id')
                .addSelect('q.code', 'code')
                .addSelect('q.title', 'title')
                .addSelect('q.status', 'status')
                .addSelect('q.hasInstallation', 'has_installation')
                .addSelect('q.projectId', 'pid')
                .where('q.projectId IN (:...ids)', { ids })
                .andWhere('q.deletedAt IS NULL')
                .orderBy('q.code', 'ASC')
                .getRawMany(),
            this.dataSource.getRepository(task_assignment_entity_1.TaskAssignment).createQueryBuilder('ta')
                .innerJoin(task_entity_1.Task, 't', 't.id = ta.task_id')
                .select('t.project_id', 'pid')
                .addSelect('COUNT(DISTINCT ta.worker_id)', 'cnt')
                .where('t.project_id IN (:...ids)', { ids })
                .andWhere('ta.isActive = :active', { active: true })
                .groupBy('t.project_id')
                .getRawMany(),
        ]);
        for (const r of quoteRows) {
            const a = map.get(r.pid);
            if (a) {
                a.quotes.push({ id: r.id, code: r.code, title: r.title, status: r.status });
                a.quoteCount += 1;
                if (Number(r.has_installation) === 1)
                    a.hasInstallation = true;
            }
        }
        for (const r of workerRows) {
            const a = map.get(r.pid);
            if (a)
                a.workerCount = Number(r.cnt);
        }
        return map;
    }
    async enrich(project) {
        const [site, customer, aggById] = await Promise.all([
            project.siteId ? this.siteRepo.findOne({ where: { id: project.siteId } }) : Promise.resolve(null),
            project.customerId ? this.customerRepo.findOne({ where: { id: project.customerId } }) : Promise.resolve(null),
            this.loadAggregates([project.id]),
        ]);
        const agg = aggById.get(project.id) ?? ZERO_AGG;
        return {
            ...project,
            site: site ? { id: site.id, name: site.name } : undefined,
            customer: customer ? { id: customer.id, name: customer.name } : undefined,
            quoteCount: agg.quoteCount,
            workerCount: agg.workerCount,
            hasInstallation: agg.hasInstallation,
            quotes: agg.quotes,
        };
    }
    async enrichMany(projects) {
        if (projects.length === 0)
            return [];
        const siteIds = [...new Set(projects.map((p) => p.siteId).filter((id) => !!id))];
        const customerIds = [...new Set(projects.map((p) => p.customerId).filter((id) => !!id))];
        const [sites, customers, aggById] = await Promise.all([
            siteIds.length ? this.siteRepo.find({ where: { id: (0, typeorm_2.In)(siteIds) } }) : Promise.resolve([]),
            customerIds.length ? this.customerRepo.find({ where: { id: (0, typeorm_2.In)(customerIds) } }) : Promise.resolve([]),
            this.loadAggregates(projects.map((p) => p.id)),
        ]);
        const siteById = new Map(sites.map((s) => [s.id, s]));
        const customerById = new Map(customers.map((c) => [c.id, c]));
        return projects.map((p) => {
            const site = p.siteId ? siteById.get(p.siteId) : undefined;
            const customer = p.customerId ? customerById.get(p.customerId) : undefined;
            const agg = aggById.get(p.id) ?? ZERO_AGG;
            return {
                ...p,
                site: site ? { id: site.id, name: site.name } : undefined,
                customer: customer ? { id: customer.id, name: customer.name } : undefined,
                quoteCount: agg.quoteCount,
                workerCount: agg.workerCount,
                hasInstallation: agg.hasInstallation,
                quotes: agg.quotes,
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
        if (q.quoteCode) {
            qb.andWhere('EXISTS (SELECT 1 FROM quotes qq WHERE qq.project_id = p.id AND qq.deleted_at IS NULL AND qq.code LIKE :qc)', { qc: `%${q.quoteCode}%` });
        }
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