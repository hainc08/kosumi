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
exports.QuotesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const quote_entity_1 = require("./entities/quote.entity");
const quote_item_entity_1 = require("./entities/quote-item.entity");
const quote_payment_step_entity_1 = require("./entities/quote-payment-step.entity");
const project_entity_1 = require("../projects/entities/project.entity");
const customer_entity_1 = require("../customers/entities/customer.entity");
const code_util_1 = require("../../common/utils/code.util");
let QuotesService = class QuotesService {
    repo;
    itemRepo;
    stepRepo;
    projectRepo;
    customerRepo;
    dataSource;
    constructor(repo, itemRepo, stepRepo, projectRepo, customerRepo, dataSource) {
        this.repo = repo;
        this.itemRepo = itemRepo;
        this.stepRepo = stepRepo;
        this.projectRepo = projectRepo;
        this.customerRepo = customerRepo;
        this.dataSource = dataSource;
    }
    enrich(quote, items, steps, project, customer) {
        const sortedItems = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
        const sortedSteps = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);
        const round2 = (n) => Math.round(n * 100) / 100;
        const subtotal = round2(sortedItems.reduce((sum, i) => sum + i.amount, 0));
        const taxAmount = round2(subtotal * (quote.taxRate / 100));
        const totalAmount = round2(subtotal + taxAmount);
        return {
            ...quote,
            items: sortedItems,
            paymentSteps: sortedSteps,
            project,
            customer,
            subtotal,
            taxAmount,
            totalAmount,
            itemCount: sortedItems.length,
            sectionCount: new Set(sortedItems.map((i) => i.sectionName).filter((s) => !!s)).size,
        };
    }
    async loadRelations(quotes) {
        const projectIds = [...new Set(quotes.map((q) => q.projectId).filter((id) => !!id))];
        const customerIds = [...new Set(quotes.map((q) => q.customerId).filter((id) => !!id))];
        const [projects, customers] = await Promise.all([
            projectIds.length ? this.projectRepo.find({ where: { id: (0, typeorm_2.In)(projectIds) } }) : Promise.resolve([]),
            customerIds.length ? this.customerRepo.find({ where: { id: (0, typeorm_2.In)(customerIds) } }) : Promise.resolve([]),
        ]);
        return {
            projectById: new Map(projects.map((p) => [p.id, { id: p.id, name: p.name }])),
            customerById: new Map(customers.map((c) => [c.id, { id: c.id, name: c.name }])),
        };
    }
    async nextCode() {
        const all = await this.repo.find({ withDeleted: true, select: ['code'] });
        return (0, code_util_1.nextQuoteCode)(all.map((q) => q.code));
    }
    async findAll(q) {
        const qb = this.repo.createQueryBuilder('q').where('q.deleted_at IS NULL');
        if (q.search)
            qb.andWhere('(q.title LIKE :s OR q.code LIKE :s)', { s: `%${q.search}%` });
        if (q.status)
            qb.andWhere('q.status = :status', { status: q.status });
        if (q.customerId)
            qb.andWhere('q.customer_id = :customerId', { customerId: q.customerId });
        if (q.projectId)
            qb.andWhere('q.project_id = :projectId', { projectId: q.projectId });
        const quotes = await qb.orderBy('q.created_at', 'DESC').getMany();
        if (quotes.length === 0)
            return [];
        const ids = quotes.map((q) => q.id);
        const [items, steps, { projectById, customerById }] = await Promise.all([
            this.itemRepo.find({ where: { quoteId: (0, typeorm_2.In)(ids) } }),
            this.stepRepo.find({ where: { quoteId: (0, typeorm_2.In)(ids) } }),
            this.loadRelations(quotes),
        ]);
        const itemsByQuote = new Map();
        for (const i of items) {
            const list = itemsByQuote.get(i.quoteId) ?? [];
            list.push(i);
            itemsByQuote.set(i.quoteId, list);
        }
        const stepsByQuote = new Map();
        for (const s of steps) {
            const list = stepsByQuote.get(s.quoteId) ?? [];
            list.push(s);
            stepsByQuote.set(s.quoteId, list);
        }
        return quotes.map((quote) => this.enrich(quote, itemsByQuote.get(quote.id) ?? [], stepsByQuote.get(quote.id) ?? [], quote.projectId ? projectById.get(quote.projectId) : undefined, quote.customerId ? customerById.get(quote.customerId) : undefined));
    }
    async findOne(id) {
        const quote = await this.repo.findOne({ where: { id } });
        if (!quote)
            throw new common_1.NotFoundException('Không tìm thấy báo giá');
        const [items, steps, { projectById, customerById }] = await Promise.all([
            this.itemRepo.find({ where: { quoteId: id } }),
            this.stepRepo.find({ where: { quoteId: id } }),
            this.loadRelations([quote]),
        ]);
        return this.enrich(quote, items, steps, quote.projectId ? projectById.get(quote.projectId) : undefined, quote.customerId ? customerById.get(quote.customerId) : undefined);
    }
    buildItemEntities(quoteId, raw) {
        return raw.map((i, index) => this.itemRepo.create({
            quoteId,
            sectionName: i.sectionName ?? null,
            sectionNameEn: i.sectionNameEn ?? null,
            sortOrder: i.sortOrder || index + 1,
            itemName: i.itemName,
            description: i.description ?? null,
            unit: i.unit,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            amount: i.quantity * i.unitPrice,
            notes: i.notes ?? null,
        }));
    }
    buildStepEntities(quoteId, raw) {
        return raw.map((s, index) => this.stepRepo.create({
            quoteId,
            stepOrder: s.stepOrder || index + 1,
            percentage: s.percentage,
            description: s.description,
            descriptionEn: s.descriptionEn ?? null,
        }));
    }
    async create(dto) {
        const result = await this.dataSource.transaction(async (m) => {
            const allCodes = await m.find(quote_entity_1.Quote, { withDeleted: true, select: ['code'] });
            const code = (0, code_util_1.nextQuoteCode)(allCodes.map((q) => q.code));
            let projectId = dto.projectId;
            if (!projectId && dto.newProjectName) {
                const count = await m.count(project_entity_1.Project, { withDeleted: true });
                const project = m.create(project_entity_1.Project, {
                    name: dto.newProjectName,
                    customerId: dto.customerId ?? null,
                    projectType: 'other',
                    siteId: null,
                    contractValue: null,
                    startDate: null,
                    deadline: (0, code_util_1.addDays)(dto.quoteDate, 60),
                    actualEndDate: null,
                    progressPct: 0,
                    status: 'planning',
                    description: null,
                    managerId: null,
                    code: (0, code_util_1.makeCode)('PRJ', count + 1),
                });
                const savedProject = await m.save(project);
                projectId = savedProject.id;
            }
            const quote = m.create(quote_entity_1.Quote, {
                code,
                projectId: projectId,
                customerId: dto.customerId ?? null,
                contactId: dto.contactId ?? null,
                title: dto.title,
                quoteDate: dto.quoteDate,
                validUntil: dto.validUntil ?? null,
                status: 'draft',
                rejectReason: null,
                taxRate: dto.taxRate,
                validityDays: dto.validityDays,
                deliveryDays: dto.deliveryDays,
                paymentTerms: dto.paymentTerms,
                warrantyNote: dto.warrantyNote ?? null,
                contractorNote: dto.contractorNote ?? null,
                notes: dto.notes ?? null,
            });
            const savedQuote = await m.save(quote);
            const items = this.buildItemEntities(savedQuote.id, dto.items ?? []);
            const savedItems = items.length ? await m.save(quote_item_entity_1.QuoteItem, items) : [];
            const steps = this.buildStepEntities(savedQuote.id, dto.paymentSteps ?? []);
            const savedSteps = steps.length ? await m.save(quote_payment_step_entity_1.QuotePaymentStep, steps) : [];
            return { quote: savedQuote, items: savedItems, steps: savedSteps };
        });
        return this.findOne(result.quote.id);
    }
    async update(id, dto) {
        const quote = await this.repo.findOne({ where: { id } });
        if (!quote)
            throw new common_1.NotFoundException('Không tìm thấy báo giá');
        const { items, paymentSteps, ...quoteFields } = dto;
        Object.assign(quote, {
            ...quoteFields,
            validUntil: quoteFields.validUntil ?? quote.validUntil,
        });
        if ('customerId' in quoteFields)
            quote.customerId = quoteFields.customerId ?? null;
        if ('contactId' in quoteFields)
            quote.contactId = quoteFields.contactId ?? null;
        if ('warrantyNote' in quoteFields)
            quote.warrantyNote = quoteFields.warrantyNote ?? null;
        if ('contractorNote' in quoteFields)
            quote.contractorNote = quoteFields.contractorNote ?? null;
        if ('notes' in quoteFields)
            quote.notes = quoteFields.notes ?? null;
        await this.dataSource.transaction(async (m) => {
            const savedQuote = await m.save(quote_entity_1.Quote, quote);
            if (items) {
                await m.delete(quote_item_entity_1.QuoteItem, { quoteId: id });
                const newItems = this.buildItemEntities(id, items);
                if (newItems.length)
                    await m.save(quote_item_entity_1.QuoteItem, newItems);
            }
            if (paymentSteps) {
                await m.delete(quote_payment_step_entity_1.QuotePaymentStep, { quoteId: id });
                const newSteps = this.buildStepEntities(id, paymentSteps);
                if (newSteps.length)
                    await m.save(quote_payment_step_entity_1.QuotePaymentStep, newSteps);
            }
            return savedQuote;
        });
        return this.findOne(id);
    }
    async updateStatus(id, status, rejectReason) {
        const quote = await this.repo.findOne({ where: { id } });
        if (!quote)
            throw new common_1.NotFoundException('Không tìm thấy báo giá');
        quote.status = status;
        quote.rejectReason = status === 'rejected' ? (rejectReason ?? null) : null;
        await this.repo.save(quote);
        return this.findOne(id);
    }
    async duplicate(id) {
        const source = await this.repo.findOne({ where: { id } });
        if (!source)
            throw new common_1.NotFoundException('Không tìm thấy báo giá');
        const [sourceItems, sourceSteps] = await Promise.all([
            this.itemRepo.find({ where: { quoteId: id } }),
            this.stepRepo.find({ where: { quoteId: id } }),
        ]);
        const result = await this.dataSource.transaction(async (m) => {
            const allCodes = await m.find(quote_entity_1.Quote, { withDeleted: true, select: ['code'] });
            const code = (0, code_util_1.nextQuoteCode)(allCodes.map((q) => q.code));
            const clone = m.create(quote_entity_1.Quote, {
                code,
                projectId: source.projectId,
                customerId: source.customerId,
                contactId: source.contactId,
                title: `${source.title} (Copy)`,
                quoteDate: new Date().toISOString().split('T')[0],
                validUntil: source.validUntil,
                status: 'draft',
                rejectReason: null,
                taxRate: source.taxRate,
                validityDays: source.validityDays,
                deliveryDays: source.deliveryDays,
                paymentTerms: source.paymentTerms,
                warrantyNote: source.warrantyNote,
                contractorNote: source.contractorNote,
                notes: source.notes,
            });
            const savedClone = await m.save(clone);
            const newItems = sourceItems.map((i) => this.itemRepo.create({
                quoteId: savedClone.id,
                sectionName: i.sectionName,
                sectionNameEn: i.sectionNameEn,
                sortOrder: i.sortOrder,
                itemName: i.itemName,
                description: i.description,
                unit: i.unit,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                amount: i.amount,
                notes: i.notes,
            }));
            if (newItems.length)
                await m.save(quote_item_entity_1.QuoteItem, newItems);
            const newSteps = sourceSteps.map((s) => this.stepRepo.create({
                quoteId: savedClone.id,
                stepOrder: s.stepOrder,
                percentage: s.percentage,
                description: s.description,
                descriptionEn: s.descriptionEn,
            }));
            if (newSteps.length)
                await m.save(quote_payment_step_entity_1.QuotePaymentStep, newSteps);
            return savedClone;
        });
        return this.findOne(result.id);
    }
    async remove(id) {
        const quote = await this.repo.findOne({ where: { id } });
        if (!quote)
            throw new common_1.NotFoundException('Không tìm thấy báo giá');
        await this.repo.softDelete(id);
    }
};
exports.QuotesService = QuotesService;
exports.QuotesService = QuotesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(quote_entity_1.Quote)),
    __param(1, (0, typeorm_1.InjectRepository)(quote_item_entity_1.QuoteItem)),
    __param(2, (0, typeorm_1.InjectRepository)(quote_payment_step_entity_1.QuotePaymentStep)),
    __param(3, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(4, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], QuotesService);
//# sourceMappingURL=quotes.service.js.map