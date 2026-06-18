import { Quote, QuoteItem, QuotePaymentStep } from '@/types'

export const seedQuotes: Quote[] = [
  {
    id: 'quote-1',
    code: 'WS0087',
    projectId: 'prj-1', // Aeon Mall Bình Tân
    customerId: 'cust-1', // Aeon
    contactId: 'ct-1',
    title: 'Gói thầu cơ khí nhà xưởng',
    quoteDate: '2026-06-01',
    validUntil: '2026-06-15',
    status: 'approved',
    rejectReason: null,
    taxRate: 8,
    validityDays: 14,
    deliveryDays: 45,
    paymentTerms: '30-25-35-10',
    hasInstallation: true,
    warrantyNote: 'Bảo hành 12 tháng theo tiêu chuẩn nhà sản xuất.',
    contractorNote: 'Mặt bằng thi công và điện nước do chủ đầu tư cung cấp.',
    notes: 'Kèm theo bản vẽ thi công.',
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-06-05T10:00:00.000Z'
  },
  {
    id: 'quote-2',
    code: 'WS0088',
    projectId: 'prj-2', // Nội thất Vinhomes
    customerId: 'cust-2', // Studio Kiến trúc Minh Anh
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
    hasInstallation: true,
    warrantyNote: 'Bảo hành 24 tháng với kết cấu thép.',
    contractorNote: null,
    notes: null,
    createdAt: '2026-06-10T09:30:00.000Z',
    updatedAt: '2026-06-10T09:30:00.000Z'
  },
  {
    id: 'quote-3',
    code: 'WS0089',
    projectId: 'prj-3', // Kết cấu thép Samsung Yên Phong
    customerId: 'cust-3', // Samsung Engineering Vietnam
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
    hasInstallation: false,
    warrantyNote: 'Bảo hành rỉ sét 12 tháng.',
    contractorNote: null,
    notes: null,
    createdAt: '2026-06-12T14:15:00.000Z',
    updatedAt: '2026-06-12T14:15:00.000Z'
  }
]

export const seedQuoteItems: QuoteItem[] = [
  // Items for WS0087
  {
    id: 'qi-1',
    quoteId: 'quote-1',
    sectionName: 'Kết cấu thép chính',
    sectionNameEn: 'Main Steel Structure',
    sortOrder: 1,
    itemName: 'Cột thép I300x150x6.5x9',
    description: 'Bao gồm bản mã và bu lông neo',
    unit: 'tấn',
    quantity: 12.5,
    unitPrice: 28500000,
    amount: 356250000
  },
  {
    id: 'qi-2',
    quoteId: 'quote-1',
    sectionName: 'Kết cấu thép chính',
    sectionNameEn: 'Main Steel Structure',
    sortOrder: 2,
    itemName: 'Kèo thép mái nhà xưởng',
    description: null,
    unit: 'tấn',
    quantity: 8.2,
    unitPrice: 29000000,
    amount: 237800000
  },
  {
    id: 'qi-3',
    quoteId: 'quote-1',
    sectionName: 'Hệ bao che',
    sectionNameEn: 'Enclosure System',
    sortOrder: 3,
    itemName: 'Tôn lợp mái 0.45mm',
    description: 'Tôn Hoa Sen',
    unit: 'm2',
    quantity: 1200,
    unitPrice: 115000,
    amount: 138000000
  },
  
  // Items for WS0088
  {
    id: 'qi-4',
    quoteId: 'quote-2',
    sectionName: null,
    sectionNameEn: null,
    sortOrder: 1,
    itemName: 'Lan can ban công thép sơn tĩnh điện',
    description: 'Thép hộp 40x40 dày 1.4mm',
    unit: 'md',
    quantity: 250,
    unitPrice: 850000,
    amount: 212500000
  },
  
  // Items for WS0089
  {
    id: 'qi-5',
    quoteId: 'quote-3',
    sectionName: 'Quầy Bar',
    sectionNameEn: 'Bar Counter',
    sortOrder: 1,
    itemName: 'Module quầy Inox 304',
    description: 'Kích thước: 2400x700x850mm',
    unit: 'bộ',
    quantity: 2,
    unitPrice: 24000000,
    amount: 48000000
  }
] as (QuoteItem & { quoteId: string })[];

export const seedQuotePaymentSteps: QuotePaymentStep[] = [
  // Steps for quote-1
  {
    id: 'qps-1',
    quoteId: 'quote-1',
    stepOrder: 1,
    percentage: 30,
    description: 'Tạm ứng khi ký hợp đồng',
  },
  {
    id: 'qps-2',
    quoteId: 'quote-1',
    stepOrder: 2,
    percentage: 25,
    description: 'Tạm ứng đợt 2 khi tập kết vật tư',
  },
  {
    id: 'qps-3',
    quoteId: 'quote-1',
    stepOrder: 3,
    percentage: 35,
    description: 'Thanh toán khi nghiệm thu bàn giao',
  },
  {
    id: 'qps-4',
    quoteId: 'quote-1',
    stepOrder: 4,
    percentage: 10,
    description: 'Thanh toán sau khi hết hạn bảo hành',
  }
] as (QuotePaymentStep & { quoteId: string })[];
