import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, In, Repository } from 'typeorm'
import { Quote } from './entities/quote.entity'
import { QuoteItem } from './entities/quote-item.entity'
import { QuotePaymentStep } from './entities/quote-payment-step.entity'
import { Project } from '../projects/entities/project.entity'
import { Customer } from '../customers/entities/customer.entity'
import { CreateQuoteDto } from './dto/create-quote.dto'
import { UpdateQuoteDto } from './dto/update-quote.dto'
import { QueryQuoteDto } from './dto/query-quote.dto'
import { makeCode, nextQuoteCode, addDays } from '../../common/utils/code.util'

export type QuoteWithRelations = Quote & {
  items: QuoteItem[]
  paymentSteps: QuotePaymentStep[]
  project?: { id: string; name: string }
  customer?: { id: string; name: string }
  subtotal: number
  taxAmount: number
  totalAmount: number
  itemCount: number
  sectionCount: number
}

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(Quote) private repo: Repository<Quote>,
    @InjectRepository(QuoteItem) private itemRepo: Repository<QuoteItem>,
    @InjectRepository(QuotePaymentStep) private stepRepo: Repository<QuotePaymentStep>,
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    private dataSource: DataSource,
  ) {}

  /** Gắn items/paymentSteps (sắp theo order), project/customer mini-object và tổng tiền tính toán cho 1 quote. */
  private enrich(
    quote: Quote,
    items: QuoteItem[],
    steps: QuotePaymentStep[],
    project?: { id: string; name: string },
    customer?: { id: string; name: string },
  ): QuoteWithRelations {
    const sortedItems = [...items].sort((a, b) => a.sortOrder - b.sortOrder)
    const sortedSteps = [...steps].sort((a, b) => a.stepOrder - b.stepOrder)

    // Cộng amount ĐÃ LƯU (đã làm tròn 2 chữ số) thay vì tính lại quantity*unitPrice
    // bằng float — tránh sai số kiểu 237799999.99999997.
    const round2 = (n: number) => Math.round(n * 100) / 100
    const subtotal = round2(sortedItems.reduce((sum, i) => sum + i.amount, 0))
    const taxAmount = round2(subtotal * (quote.taxRate / 100))
    const totalAmount = round2(subtotal + taxAmount)

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
      sectionCount: new Set(sortedItems.map((i) => i.sectionName).filter((s): s is string => !!s)).size,
    }
  }

  /** Tải project/customer mini-object cho nhiều quote bằng 2 batch query (tránh N+1). */
  private async loadRelations(quotes: Quote[]): Promise<{
    projectById: Map<string, { id: string; name: string }>
    customerById: Map<string, { id: string; name: string }>
  }> {
    const projectIds = [...new Set(quotes.map((q) => q.projectId).filter((id): id is string => !!id))]
    const customerIds = [...new Set(quotes.map((q) => q.customerId).filter((id): id is string => !!id))]

    const [projects, customers] = await Promise.all([
      projectIds.length ? this.projectRepo.find({ where: { id: In(projectIds) } }) : Promise.resolve([]),
      customerIds.length ? this.customerRepo.find({ where: { id: In(customerIds) } }) : Promise.resolve([]),
    ])

    return {
      projectById: new Map(projects.map((p) => [p.id, { id: p.id, name: p.name }])),
      customerById: new Map(customers.map((c) => [c.id, { id: c.id, name: c.name }])),
    }
  }

  /** Mã báo giá kế tiếp (MAX-based, tính trên cả bản đã xóa mềm). */
  async nextCode(): Promise<string> {
    const all = await this.repo.find({ withDeleted: true, select: ['code'] })
    return nextQuoteCode(all.map((q) => q.code))
  }

  async findAll(q: QueryQuoteDto): Promise<QuoteWithRelations[]> {
    const qb = this.repo.createQueryBuilder('q').where('q.deleted_at IS NULL')
    if (q.search) qb.andWhere('(q.title LIKE :s OR q.code LIKE :s)', { s: `%${q.search}%` })
    if (q.status) qb.andWhere('q.status = :status', { status: q.status })
    if (q.customerId) qb.andWhere('q.customer_id = :customerId', { customerId: q.customerId })
    if (q.projectId) qb.andWhere('q.project_id = :projectId', { projectId: q.projectId })
    const quotes = await qb.orderBy('q.created_at', 'DESC').getMany()
    if (quotes.length === 0) return []

    const ids = quotes.map((q) => q.id)
    const [items, steps, { projectById, customerById }] = await Promise.all([
      this.itemRepo.find({ where: { quoteId: In(ids) } }),
      this.stepRepo.find({ where: { quoteId: In(ids) } }),
      this.loadRelations(quotes),
    ])

    const itemsByQuote = new Map<string, QuoteItem[]>()
    for (const i of items) {
      const list = itemsByQuote.get(i.quoteId) ?? []
      list.push(i)
      itemsByQuote.set(i.quoteId, list)
    }
    const stepsByQuote = new Map<string, QuotePaymentStep[]>()
    for (const s of steps) {
      const list = stepsByQuote.get(s.quoteId) ?? []
      list.push(s)
      stepsByQuote.set(s.quoteId, list)
    }

    return quotes.map((quote) =>
      this.enrich(
        quote,
        itemsByQuote.get(quote.id) ?? [],
        stepsByQuote.get(quote.id) ?? [],
        quote.projectId ? projectById.get(quote.projectId) : undefined,
        quote.customerId ? customerById.get(quote.customerId) : undefined,
      ),
    )
  }

  async findOne(id: string): Promise<QuoteWithRelations> {
    const quote = await this.repo.findOne({ where: { id } })
    if (!quote) throw new NotFoundException('Không tìm thấy báo giá')
    const [items, steps, { projectById, customerById }] = await Promise.all([
      this.itemRepo.find({ where: { quoteId: id } }),
      this.stepRepo.find({ where: { quoteId: id } }),
      this.loadRelations([quote]),
    ])
    return this.enrich(
      quote,
      items,
      steps,
      quote.projectId ? projectById.get(quote.projectId) : undefined,
      quote.customerId ? customerById.get(quote.customerId) : undefined,
    )
  }

  private buildItemEntities(quoteId: string, raw: CreateQuoteDto['items']): QuoteItem[] {
    return raw.map((i, index) =>
      this.itemRepo.create({
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
      }),
    )
  }

  private buildStepEntities(quoteId: string, raw: CreateQuoteDto['paymentSteps']): QuotePaymentStep[] {
    return raw.map((s, index) =>
      this.stepRepo.create({
        quoteId,
        stepOrder: s.stepOrder || index + 1,
        percentage: s.percentage,
        description: s.description,
        descriptionEn: s.descriptionEn ?? null,
      }),
    )
  }

  async create(dto: CreateQuoteDto): Promise<QuoteWithRelations> {
    const result = await this.dataSource.transaction(async (m) => {
      const allCodes = await m.find(Quote, { withDeleted: true, select: ['code'] })
      const code = nextQuoteCode(allCodes.map((q) => q.code))

      // Tạo nhanh dự án mới từ tên gói thầu khi không chọn dự án có sẵn
      let projectId = dto.projectId
      if (!projectId && dto.newProjectName) {
        const count = await m.count(Project, { withDeleted: true })
        const project = m.create(Project, {
          name: dto.newProjectName,
          customerId: dto.customerId ?? null,
          projectType: 'other',
          siteId: null,
          contractValue: null,
          startDate: null,
          deadline: addDays(dto.quoteDate, 60),
          actualEndDate: null,
          progressPct: 0,
          status: 'planning',
          description: null,
          managerId: null,
          code: makeCode('PRJ', count + 1),
        })
        const savedProject = await m.save(project)
        projectId = savedProject.id
      }

      const quote = m.create(Quote, {
        code,
        projectId: projectId as string,
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
      })
      const savedQuote = await m.save(quote)

      const items = this.buildItemEntities(savedQuote.id, dto.items ?? [])
      const savedItems = items.length ? await m.save(QuoteItem, items) : []

      const steps = this.buildStepEntities(savedQuote.id, dto.paymentSteps ?? [])
      const savedSteps = steps.length ? await m.save(QuotePaymentStep, steps) : []

      return { quote: savedQuote, items: savedItems, steps: savedSteps }
    })

    return this.findOne(result.quote.id)
  }

  async update(id: string, dto: UpdateQuoteDto): Promise<QuoteWithRelations> {
    const quote = await this.repo.findOne({ where: { id } })
    if (!quote) throw new NotFoundException('Không tìm thấy báo giá')

    const { items, paymentSteps, ...quoteFields } = dto
    Object.assign(quote, {
      ...quoteFields,
      validUntil: quoteFields.validUntil ?? quote.validUntil,
    })
    if ('customerId' in quoteFields) quote.customerId = quoteFields.customerId ?? null
    if ('contactId' in quoteFields) quote.contactId = quoteFields.contactId ?? null
    if ('warrantyNote' in quoteFields) quote.warrantyNote = quoteFields.warrantyNote ?? null
    if ('contractorNote' in quoteFields) quote.contractorNote = quoteFields.contractorNote ?? null
    if ('notes' in quoteFields) quote.notes = quoteFields.notes ?? null

    await this.dataSource.transaction(async (m) => {
      const savedQuote = await m.save(Quote, quote)

      // FE luôn gửi lại toàn bộ items/paymentSteps → thay thế hoàn toàn.
      if (items) {
        await m.delete(QuoteItem, { quoteId: id })
        const newItems = this.buildItemEntities(id, items as CreateQuoteDto['items'])
        if (newItems.length) await m.save(QuoteItem, newItems)
      }
      if (paymentSteps) {
        await m.delete(QuotePaymentStep, { quoteId: id })
        const newSteps = this.buildStepEntities(id, paymentSteps as CreateQuoteDto['paymentSteps'])
        if (newSteps.length) await m.save(QuotePaymentStep, newSteps)
      }

      return savedQuote
    })

    return this.findOne(id)
  }

  async updateStatus(id: string, status: string, rejectReason?: string): Promise<QuoteWithRelations> {
    const quote = await this.repo.findOne({ where: { id } })
    if (!quote) throw new NotFoundException('Không tìm thấy báo giá')
    quote.status = status
    quote.rejectReason = status === 'rejected' ? (rejectReason ?? null) : null
    await this.repo.save(quote)
    return this.findOne(id)
  }

  async duplicate(id: string): Promise<QuoteWithRelations> {
    const source = await this.repo.findOne({ where: { id } })
    if (!source) throw new NotFoundException('Không tìm thấy báo giá')
    const [sourceItems, sourceSteps] = await Promise.all([
      this.itemRepo.find({ where: { quoteId: id } }),
      this.stepRepo.find({ where: { quoteId: id } }),
    ])

    const result = await this.dataSource.transaction(async (m) => {
      const allCodes = await m.find(Quote, { withDeleted: true, select: ['code'] })
      const code = nextQuoteCode(allCodes.map((q) => q.code))

      const clone = m.create(Quote, {
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
      })
      const savedClone = await m.save(clone)

      const newItems = sourceItems.map((i) =>
        this.itemRepo.create({
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
        }),
      )
      if (newItems.length) await m.save(QuoteItem, newItems)

      const newSteps = sourceSteps.map((s) =>
        this.stepRepo.create({
          quoteId: savedClone.id,
          stepOrder: s.stepOrder,
          percentage: s.percentage,
          description: s.description,
          descriptionEn: s.descriptionEn,
        }),
      )
      if (newSteps.length) await m.save(QuotePaymentStep, newSteps)

      return savedClone
    })

    return this.findOne(result.id)
  }

  async remove(id: string): Promise<void> {
    const quote = await this.repo.findOne({ where: { id } })
    if (!quote) throw new NotFoundException('Không tìm thấy báo giá')
    await this.repo.softDelete(id)
  }
}
