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
exports.SitesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const site_entity_1 = require("./entities/site.entity");
const worker_entity_1 = require("../workers/entities/worker.entity");
const project_entity_1 = require("../projects/entities/project.entity");
const code_util_1 = require("../../common/utils/code.util");
const ZERO_AGG = { workerCount: 0, projectCount: 0 };
let SitesService = class SitesService {
    repo;
    dataSource;
    constructor(repo, dataSource) {
        this.repo = repo;
        this.dataSource = dataSource;
    }
    async loadAggregates(ids) {
        const map = new Map();
        for (const id of ids)
            map.set(id, { workerCount: 0, projectCount: 0 });
        if (ids.length === 0)
            return map;
        const [workerRows, projRows] = await Promise.all([
            this.dataSource.getRepository(worker_entity_1.Worker).createQueryBuilder('w')
                .select('w.siteId', 'sid')
                .addSelect('COUNT(*)', 'cnt')
                .where('w.siteId IN (:...ids)', { ids })
                .andWhere('w.deletedAt IS NULL')
                .groupBy('w.siteId')
                .getRawMany(),
            this.dataSource.getRepository(project_entity_1.Project).createQueryBuilder('p')
                .select('p.siteId', 'sid')
                .addSelect('COUNT(*)', 'cnt')
                .where('p.siteId IN (:...ids)', { ids })
                .andWhere('p.deletedAt IS NULL')
                .groupBy('p.siteId')
                .getRawMany(),
        ]);
        for (const r of workerRows) {
            const a = map.get(r.sid);
            if (a)
                a.workerCount = Number(r.cnt);
        }
        for (const r of projRows) {
            const a = map.get(r.sid);
            if (a)
                a.projectCount = Number(r.cnt);
        }
        return map;
    }
    enrich(site, agg) {
        return { ...site, workerCount: agg.workerCount, projectCount: agg.projectCount };
    }
    async findAll(q) {
        const qb = this.repo.createQueryBuilder('s').where('s.deleted_at IS NULL');
        if (q.search)
            qb.andWhere('(s.name LIKE :s OR s.code LIKE :s)', { s: `%${q.search}%` });
        if (q.type)
            qb.andWhere('s.type = :type', { type: q.type });
        if (q.status)
            qb.andWhere('s.status = :status', { status: q.status });
        const sites = await qb.orderBy('s.created_at', 'DESC').getMany();
        if (sites.length === 0)
            return [];
        const aggById = await this.loadAggregates(sites.map((s) => s.id));
        return sites.map((s) => this.enrich(s, aggById.get(s.id) ?? ZERO_AGG));
    }
    async findOne(id) {
        const site = await this.repo.findOne({ where: { id } });
        if (!site)
            throw new common_1.NotFoundException('Không tìm thấy công trường');
        return site;
    }
    async findOneWithCounts(id) {
        const site = await this.findOne(id);
        const aggById = await this.loadAggregates([id]);
        return this.enrich(site, aggById.get(id) ?? ZERO_AGG);
    }
    async create(dto) {
        const saved = await this.dataSource.transaction(async (m) => {
            const count = await m.count(site_entity_1.Site, { withDeleted: true });
            const site = m.create(site_entity_1.Site, { ...dto, code: (0, code_util_1.makeCode)('CS', count + 1) });
            return m.save(site);
        });
        return this.enrich(saved, ZERO_AGG);
    }
    async update(id, dto) {
        const site = await this.findOne(id);
        Object.assign(site, dto);
        await this.repo.save(site);
        return this.findOneWithCounts(id);
    }
    async setStatus(id, status) {
        const site = await this.findOne(id);
        site.status = status;
        await this.repo.save(site);
        return this.findOneWithCounts(id);
    }
    async remove(id) {
        await this.findOne(id);
        await this.repo.softDelete(id);
    }
};
exports.SitesService = SitesService;
exports.SitesService = SitesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(site_entity_1.Site)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], SitesService);
//# sourceMappingURL=sites.service.js.map