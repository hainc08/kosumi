import { DataSource } from 'typeorm'
import { Quote } from '../../modules/quotes/entities/quote.entity'
import { QuoteItem } from '../../modules/quotes/entities/quote-item.entity'
import { QuotePaymentStep } from '../../modules/quotes/entities/quote-payment-step.entity'
import { Project } from '../../modules/projects/entities/project.entity'
import { Customer } from '../../modules/customers/entities/customer.entity'
import { CustomerContact } from '../../modules/customers/entities/customer-contact.entity'

export async function seedQuotes(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(Quote)
  const itemRepo = ds.getRepository(QuoteItem)
  const stepRepo = ds.getRepository(QuotePaymentStep)
  if (await repo.count({ withDeleted: true }) > 0) return

  const projectRepo = ds.getRepository(Project)
  const customerRepo = ds.getRepository(Customer)
  const contactRepo = ds.getRepository(CustomerContact)

  const projects = await projectRepo.find({ order: { code: 'ASC' } })
  const customers = await customerRepo.find({ order: { code: 'ASC' } })

  // Mapping theo prototype: prj-1→projects[0], prj-2→projects[1], prj-3→projects[2]
  // cust-1→customers[0], cust-2→customers[1], cust-3→customers[2]
  const projectByMock: Record<string, string | undefined> = {
    'prj-1': projects[0]?.id,
    'prj-2': projects[1]?.id,
    'prj-3': projects[2]?.id,
  }
  const customerByMock: Record<string, string | undefined> = {
    'cust-1': customers[0]?.id,
    'cust-2': customers[1]?.id,
    'cust-3': customers[2]?.id,
  }

  // ct-1 = primary contact (sortOrder 0) của cust-1
  let contact1Id: string | null = null
  if (customerByMock['cust-1']) {
    const primary = await contactRepo.findOne({ where: { customerId: customerByMock['cust-1'], sortOrder: 0 } })
    contact1Id = primary?.id ?? null
  }

  // Ported from frontend/src/mocks/seed/quotes.ts
  const quotesData: { mockId: string; quote: Partial<Quote> }[] = [
    {
      mockId: 'quote-1',
      quote: {
        code: 'WS0087',
        projectId: projectByMock['prj-1']!,
        customerId: customerByMock['cust-1'] ?? null,
        contactId: contact1Id,
        title: 'Gói thầu cơ khí nhà xưởng',
        quoteDate: '2026-06-01',
        validUntil: '2026-06-15',
        status: 'approved',
        rejectReason: null,
        taxRate: 8,
        validityDays: 14,
        deliveryDays: 45,
        paymentTerms: '30-25-35-10',
        warrantyNote: 'Bảo hành 12 tháng theo tiêu chuẩn nhà sản xuất.',
        contractorNote: 'Mặt bằng thi công và điện nước do chủ đầu tư cung cấp.',
        notes: 'Kèm theo bản vẽ thi công.',
      },
    },
    {
      mockId: 'quote-2',
      quote: {
        code: 'WS0088',
        projectId: projectByMock['prj-2']!,
        customerId: customerByMock['cust-2'] ?? null,
        contactId: null,
        title: 'Lan can ban công khu A',
        quoteDate: '2026-06-10',
        validUntil: '2026-06-20',
        status: 'pending',
        rejectReason: null,
        taxRate: 8,
        validityDays: 10,
        deliveryDays: 30,
        paymentTerms: '30-70',
        warrantyNote: 'Bảo hành 24 tháng với kết cấu thép.',
        contractorNote: null,
        notes: null,
      },
    },
    {
      mockId: 'quote-3',
      quote: {
        code: 'WS0089',
        projectId: projectByMock['prj-3']!,
        customerId: customerByMock['cust-3'] ?? null,
        contactId: null,
        title: 'Sản xuất quầy bar Inox',
        quoteDate: '2026-06-12',
        validUntil: '2026-06-19',
        status: 'draft',
        rejectReason: null,
        taxRate: 8,
        validityDays: 7,
        deliveryDays: 15,
        paymentTerms: '100-prepay',
        warrantyNote: 'Bảo hành rỉ sét 12 tháng.',
        contractorNote: null,
        notes: null,
      },
    },
  ]

  // Ported from frontend/src/mocks/seed/quotes.ts (seedQuoteItems)
  const itemsByMock: Record<string, Partial<QuoteItem>[]> = {
    'quote-1': [
      {
        sectionName: 'Kết cấu thép chính', sectionNameEn: 'Main Steel Structure', sortOrder: 1,
        itemName: 'Cột thép I300x150x6.5x9', description: 'Bao gồm bản mã và bu lông neo',
        unit: 'tấn', quantity: 12.5, unitPrice: 28500000, amount: 356250000, notes: null,
      },
      {
        sectionName: 'Kết cấu thép chính', sectionNameEn: 'Main Steel Structure', sortOrder: 2,
        itemName: 'Kèo thép mái nhà xưởng', description: null,
        unit: 'tấn', quantity: 8.2, unitPrice: 29000000, amount: 237800000, notes: null,
      },
      {
        sectionName: 'Hệ bao che', sectionNameEn: 'Enclosure System', sortOrder: 3,
        itemName: 'Tôn lợp mái 0.45mm', description: 'Tôn Hoa Sen',
        unit: 'm2', quantity: 1200, unitPrice: 115000, amount: 138000000, notes: null,
      },
    ],
    'quote-2': [
      {
        sectionName: null, sectionNameEn: null, sortOrder: 1,
        itemName: 'Lan can ban công thép sơn tĩnh điện', description: 'Thép hộp 40x40 dày 1.4mm',
        unit: 'md', quantity: 250, unitPrice: 850000, amount: 212500000, notes: null,
      },
    ],
    'quote-3': [
      {
        sectionName: 'Quầy Bar', sectionNameEn: 'Bar Counter', sortOrder: 1,
        itemName: 'Module quầy Inox 304', description: 'Kích thước: 2400x700x850mm',
        unit: 'bộ', quantity: 2, unitPrice: 24000000, amount: 48000000, notes: null,
      },
    ],
  }

  // Ported from frontend/src/mocks/seed/quotes.ts (seedQuotePaymentSteps) — chỉ quote-1 có payment steps trong mock
  const stepsByMock: Record<string, Partial<QuotePaymentStep>[]> = {
    'quote-1': [
      { stepOrder: 1, percentage: 30, description: 'Tạm ứng khi ký hợp đồng', descriptionEn: null },
      { stepOrder: 2, percentage: 25, description: 'Tạm ứng đợt 2 khi tập kết vật tư', descriptionEn: null },
      { stepOrder: 3, percentage: 35, description: 'Thanh toán khi nghiệm thu bàn giao', descriptionEn: null },
      { stepOrder: 4, percentage: 10, description: 'Thanh toán sau khi hết hạn bảo hành', descriptionEn: null },
    ],
    'quote-2': [],
    'quote-3': [],
  }

  for (const { mockId, quote } of quotesData) {
    if (!quote.projectId) continue // bỏ qua nếu thiếu project tương ứng
    const saved = await repo.save(repo.create(quote))

    const items = itemsByMock[mockId] ?? []
    if (items.length) {
      await itemRepo.save(items.map((i) => itemRepo.create({ ...i, quoteId: saved.id })))
    }

    const steps = stepsByMock[mockId] ?? []
    if (steps.length) {
      await stepRepo.save(steps.map((s) => stepRepo.create({ ...s, quoteId: saved.id })))
    }
  }
}
