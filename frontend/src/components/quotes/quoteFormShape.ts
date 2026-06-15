import { z } from 'zod'
import type { Quote, PaymentTermsPreset } from '@/types'
import type { QuoteFormValues } from '@/api/quotes'

export interface QuoteItemFormShape {
  id?: string
  sectionName: string
  itemName: string
  description: string
  unit: string
  quantity: string
  unitPrice: string
  notes: string
}

export interface QuotePaymentStepFormShape {
  id?: string
  stepOrder: number
  percentage: string
  description: string
}

export interface QuoteFormShape {
  projectId: string
  customerId: string
  contactId: string
  title: string
  quoteDate: string
  validUntil: string
  taxRate: string
  validityDays: string
  deliveryDays: string
  paymentTerms: PaymentTermsPreset | string
  warrantyNote: string
  contractorNote: string
  notes: string
  items: QuoteItemFormShape[]
  paymentSteps: QuotePaymentStepFormShape[]
}


export const quoteSchema = z.object({
  projectId: z.string().min(1, 'Bắt buộc chọn dự án'),
  customerId: z.string(),
  contactId: z.string(),
  title: z.string().min(1, 'Bắt buộc nhập đầu mục / tên gói thầu'),
  quoteDate: z.string().min(1, 'Bắt buộc nhập ngày báo giá'),
  validUntil: z.string(),
  taxRate: z.string().refine((v) => !Number.isNaN(Number(v)), 'VAT phải là số'),
  validityDays: z.string().refine((v) => !Number.isNaN(Number(v)), 'Hiệu lực phải là số'),
  deliveryDays: z.string().refine((v) => !Number.isNaN(Number(v)), 'Thời gian giao hàng phải là số'),
  paymentTerms: z.string().min(1, 'Bắt buộc chọn/nhập điều khoản thanh toán'),
  warrantyNote: z.string(),
  contractorNote: z.string(),
  notes: z.string(),
  items: z.array(
    z.object({
      id: z.string().optional(),
      sectionName: z.string(),
      itemName: z.string().min(1, 'Bắt buộc nhập tên hạng mục'),
      description: z.string(),
      unit: z.string().min(1, 'Bắt buộc nhập ĐVT'),
      quantity: z.string().refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Số lượng phải > 0'),
      unitPrice: z.string().refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, 'Đơn giá phải >= 0'),
      notes: z.string(),
    })
  ).min(1, 'Báo giá phải có ít nhất 1 hạng mục'),
  paymentSteps: z.array(
    z.object({
      id: z.string().optional(),
      stepOrder: z.number(),
      percentage: z.string().refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Phần trăm phải > 0'),
      description: z.string().min(1, 'Bắt buộc nhập mô tả đợt thanh toán'),
    })
  ).min(1, 'Phải có ít nhất 1 đợt thanh toán'),
})

export function emptyQuoteForm(projectId?: string, customerId?: string): QuoteFormShape {
  const d = new Date()
  const dStr = d.toISOString().split('T')[0]
  d.setDate(d.getDate() + 10)
  const vStr = d.toISOString().split('T')[0]

  return {
    projectId: projectId || '',
    customerId: customerId || '',
    contactId: '',
    title: '',
    quoteDate: dStr,
    validUntil: vStr,
    taxRate: '8',
    validityDays: '10',
    deliveryDays: '50',
    paymentTerms: '30-25-35-10',
    warrantyNote: '',
    contractorNote: '',
    notes: '',
    items: [{ sectionName: '', itemName: '', description: '', unit: '', quantity: '1', unitPrice: '0', notes: '' }],
    paymentSteps: [
      { stepOrder: 1, percentage: '30', description: 'Tạm ứng khi ký hợp đồng' },
      { stepOrder: 2, percentage: '70', description: 'Thanh toán khi nghiệm thu bàn giao' }
    ]
  }
}

export function quoteToForm(q: Quote): QuoteFormShape {
  return {
    projectId: q.projectId,
    customerId: q.customerId ?? '',
    contactId: q.contactId ?? '',
    title: q.title,
    quoteDate: q.quoteDate,
    validUntil: q.validUntil ?? '',
    taxRate: String(q.taxRate),
    validityDays: String(q.validityDays),
    deliveryDays: String(q.deliveryDays),
    paymentTerms: q.paymentTerms,
    warrantyNote: q.warrantyNote ?? '',
    contractorNote: q.contractorNote ?? '',
    notes: q.notes ?? '',
    items: (q.items || []).map((i) => ({
      id: i.id,
      sectionName: i.sectionName ?? '',
      itemName: i.itemName,
      description: i.description ?? '',
      unit: i.unit,
      quantity: String(i.quantity),
      unitPrice: String(i.unitPrice),
      notes: i.notes ?? '',
    })),
    paymentSteps: (q.paymentSteps || []).map((s) => ({
      id: s.id,
      stepOrder: s.stepOrder,
      percentage: String(s.percentage),
      description: s.description,
    })),
  }
}

export function formToValues(v: QuoteFormShape): QuoteFormValues {
  return {
    projectId: v.projectId,
    customerId: v.customerId || undefined,
    contactId: v.contactId || undefined,
    title: v.title,
    quoteDate: v.quoteDate,
    validUntil: v.validUntil || undefined,
    taxRate: Number(v.taxRate),
    validityDays: Number(v.validityDays),
    deliveryDays: Number(v.deliveryDays),
    paymentTerms: v.paymentTerms,
    warrantyNote: v.warrantyNote || undefined,
    contractorNote: v.contractorNote || undefined,
    notes: v.notes || undefined,
    items: v.items.map((i, idx) => ({
      sectionName: i.sectionName || null,
      sectionNameEn: null,
      sortOrder: idx + 1,
      itemName: i.itemName,
      description: i.description || null,
      unit: i.unit,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      amount: Number(i.quantity) * Number(i.unitPrice),
      notes: i.notes || undefined,
    })),
    paymentSteps: v.paymentSteps.map((s, idx) => ({
      stepOrder: idx + 1,
      percentage: Number(s.percentage),
      description: s.description,
    }))
  }
}
