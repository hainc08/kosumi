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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const customer_entity_1 = require("./entities/customer.entity");
const customer_contact_entity_1 = require("./entities/customer-contact.entity");
const project_entity_1 = require("../projects/entities/project.entity");
const quote_entity_1 = require("../quotes/entities/quote.entity");
const code_util_1 = require("../../common/utils/code.util");
const ZERO_AGG = { projectCount: 0, quoteCount: 0, totalContractValue: 0 };
let CustomersService = class CustomersService {
    repo;
    contactRepo;
    dataSource;
    constructor(repo, contactRepo, dataSource) {
        this.repo = repo;
        this.contactRepo = contactRepo;
        this.dataSource = dataSource;
    }
    async loadAggregates(ids) {
        const map = new Map();
        for (const id of ids)
            map.set(id, { projectCount: 0, quoteCount: 0, totalContractValue: 0 });
        if (ids.length === 0)
            return map;
        const [projRows, quoteRows] = await Promise.all([
            this.dataSource.getRepository(project_entity_1.Project).createQueryBuilder('p')
                .select('p.customerId', 'cid')
                .addSelect('COUNT(*)', 'cnt')
                .addSelect('COALESCE(SUM(p.contract_value), 0)', 'total')
                .where('p.customerId IN (:...ids)', { ids })
                .andWhere('p.deletedAt IS NULL')
                .groupBy('p.customerId')
                .getRawMany(),
            this.dataSource.getRepository(quote_entity_1.Quote).createQueryBuilder('q')
                .select('q.customerId', 'cid')
                .addSelect('COUNT(*)', 'cnt')
                .where('q.customerId IN (:...ids)', { ids })
                .andWhere('q.deletedAt IS NULL')
                .groupBy('q.customerId')
                .getRawMany(),
        ]);
        for (const r of projRows) {
            const a = map.get(r.cid);
            if (a) {
                a.projectCount = Number(r.cnt);
                a.totalContractValue = Number(r.total);
            }
        }
        for (const r of quoteRows) {
            const a = map.get(r.cid);
            if (a)
                a.quoteCount = Number(r.cnt);
        }
        return map;
    }
    enrich(customer, contacts, agg) {
        const sorted = [...contacts].sort((a, b) => a.sortOrder - b.sortOrder);
        const primary = sorted.find((c) => c.isPrimary);
        return {
            ...customer,
            contacts: sorted,
            primaryContact: primary
                ? { fullName: primary.fullName, phone: primary.phone, email: primary.email }
                : undefined,
            projectCount: agg.projectCount,
            quoteCount: agg.quoteCount,
            totalContractValue: agg.totalContractValue,
        };
    }
    async findAll(q) {
        const qb = this.repo.createQueryBuilder('c').where('c.deleted_at IS NULL');
        if (q.search) {
            qb.andWhere('(c.name LIKE :s OR c.code LIKE :s OR c.tax_code LIKE :s OR EXISTS (SELECT 1 FROM customer_contacts cc WHERE cc.customer_id = c.id AND cc.full_name LIKE :s))', { s: `%${q.search}%` });
        }
        if (q.type)
            qb.andWhere('c.type = :type', { type: q.type });
        if (q.status)
            qb.andWhere('c.status = :status', { status: q.status });
        const customers = await qb.orderBy('c.created_at', 'DESC').getMany();
        if (customers.length === 0)
            return [];
        const ids = customers.map((c) => c.id);
        const [contacts, aggById] = await Promise.all([
            this.contactRepo.find({ where: { customerId: (0, typeorm_2.In)(ids) } }),
            this.loadAggregates(ids),
        ]);
        const byCustomer = new Map();
        for (const ct of contacts) {
            const list = byCustomer.get(ct.customerId) ?? [];
            list.push(ct);
            byCustomer.set(ct.customerId, list);
        }
        return customers.map((c) => this.enrich(c, byCustomer.get(c.id) ?? [], aggById.get(c.id) ?? ZERO_AGG));
    }
    async findOne(id) {
        const customer = await this.repo.findOne({ where: { id } });
        if (!customer)
            throw new common_1.NotFoundException('Không tìm thấy khách hàng');
        const [contacts, aggById] = await Promise.all([
            this.contactRepo.find({ where: { customerId: id } }),
            this.loadAggregates([id]),
        ]);
        return this.enrich(customer, contacts, aggById.get(id) ?? ZERO_AGG);
    }
    buildContactEntities(customerId, raw) {
        const list = raw ?? [];
        return list.map((c, i) => this.contactRepo.create({
            customerId,
            fullName: c.fullName,
            title: c.title ?? null,
            phone: c.phone ?? null,
            email: c.email ?? null,
            isPrimary: i === 0,
            sortOrder: i,
        }));
    }
    async create(dto) {
        const result = await this.dataSource.transaction(async (m) => {
            const count = await m.count(customer_entity_1.Customer, { withDeleted: true });
            const customer = m.create(customer_entity_1.Customer, {
                name: dto.name,
                type: dto.type,
                industry: dto.industry ?? null,
                taxCode: dto.taxCode ?? null,
                address: dto.address ?? null,
                website: dto.website ?? null,
                status: dto.status ?? 'active',
                defaultValidityDays: dto.defaultValidityDays ?? 10,
                defaultDeliveryDays: dto.defaultDeliveryDays ?? 50,
                defaultPaymentTerms: dto.defaultPaymentTerms ?? '30-25-35-10',
                defaultWarrantyNote: dto.defaultWarrantyNote ?? null,
                defaultSpecialNote: dto.defaultSpecialNote ?? null,
                notes: dto.notes ?? null,
                code: (0, code_util_1.makeCode)('KH', count + 1),
            });
            const saved = await m.save(customer);
            const contacts = this.buildContactEntities(saved.id, dto.contacts);
            const savedContacts = contacts.length ? await m.save(customer_contact_entity_1.CustomerContact, contacts) : [];
            return { customer: saved, contacts: savedContacts };
        });
        return this.enrich(result.customer, result.contacts, ZERO_AGG);
    }
    async update(id, dto) {
        const customer = await this.repo.findOne({ where: { id } });
        if (!customer)
            throw new common_1.NotFoundException('Không tìm thấy khách hàng');
        const { contacts, ...customerFields } = dto;
        Object.assign(customer, customerFields);
        const result = await this.dataSource.transaction(async (m) => {
            const saved = await m.save(customer_entity_1.Customer, customer);
            await m.delete(customer_contact_entity_1.CustomerContact, { customerId: id });
            const newContacts = this.buildContactEntities(id, contacts);
            const savedContacts = newContacts.length ? await m.save(customer_contact_entity_1.CustomerContact, newContacts) : [];
            return { customer: saved, contacts: savedContacts };
        });
        const aggById = await this.loadAggregates([id]);
        return this.enrich(result.customer, result.contacts, aggById.get(id) ?? ZERO_AGG);
    }
    async remove(id) {
        const customer = await this.repo.findOne({ where: { id } });
        if (!customer)
            throw new common_1.NotFoundException('Không tìm thấy khách hàng');
        await this.repo.softDelete(id);
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(1, (0, typeorm_1.InjectRepository)(customer_contact_entity_1.CustomerContact)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], CustomersService);
//# sourceMappingURL=customers.service.js.map