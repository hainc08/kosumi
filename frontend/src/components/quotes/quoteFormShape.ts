import { z } from 'zod'
import type { Quote, PaymentTermsPreset } from '@/types'
import type { QuoteFormValues } from '@/api/quotes'

/** Hạng mục (line item) bên trong 1 đầu mục. */
export interface QuoteLineFormShape {
  id?: string
  itemName: string
  description: string
  unit: string
  quantity: string
  unitPrice: string
}

/** Đầu mục (section) chứa nhiều hạng mục. */
export interface QuoteSectionFormShape {
  id?: string
  name: string
  nameEn: string
  items: QuoteLineFormShape[]
}

export interface QuotePaymentStepFormShape {
  id?: string
  stepOrder: number
  percentage: string
  description: string
}

export interface QuoteFormShape {
  hasProject: boolean      // ✔ "Dự án đã có" → chọn dự án; ✘ → tạo dự án mới từ tên gói thầu
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
  sections: QuoteSectionFormShape[]
  paymentSteps: QuotePaymentStepFormShape[]
}

const lineSchema = z.object({
  id: z.string().optional(),
  itemName: z.string().min(1, 'Bắt buộc nhập tên danh mục'),
  description: z.string(),
  unit: z.string().min(1, 'Bắt buộc nhập ĐVT'),
  quantity: z.string().refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Số lượng phải > 0'),
  unitPrice: z.string().refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, 'Đơn giá phải >= 0'),
})

export const quoteSchema = z.object({
  hasProject: z.boolean(),
  projectId: z.string(),
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
  sections: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1, 'Bắt buộc nhập tên đầu mục'),
      nameEn: z.string(),
      items: z.array(lineSchema).min(1, 'Mỗi đầu mục cần ít nhất 1 hạng mục'),
    })
  ).min(1, 'Báo giá phải có ít nhất 1 đầu mục'),
  paymentSteps: z.array(
    z.object({
      id: z.string().optional(),
      stepOrder: z.number(),
      percentage: z.string().refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Phần trăm phải > 0'),
      description: z.string().min(1, 'Bắt buộc nhập mô tả đợt thanh toán'),
    })
  ).min(1, 'Phải có ít nhất 1 đợt thanh toán'),
}).superRefine((v, ctx) => {
  if (v.hasProject) {
    if (!v.projectId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['projectId'], message: 'Bắt buộc chọn dự án' })
  } else {
    // Tạo dự án mới từ tên gói thầu → cần khách hàng để gắn dự án
    if (!v.customerId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customerId'], message: 'Chọn khách hàng cho dự án mới' })
  }
})

/** Ngày hiện tại (yyyy-mm-dd) và cộng thêm ngày. */
export function todayStr(): string { return new Date().toISOString().split('T')[0] }
export function addDaysStr(iso: string, days: number): string {
  const d = iso ? new Date(iso) : new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function emptyQuoteForm(projectId?: string, customerId?: string): QuoteFormShape {
  const quoteDate = todayStr()
  return {
    hasProject: true,
    projectId: projectId || '',
    customerId: customerId || '',
    contactId: '',
    title: '',
    quoteDate,
    validUntil: addDaysStr(quoteDate, 30),
    taxRate: '8',
    validityDays: '30',
    deliveryDays: '50',
    paymentTerms: '30-25-35-10',
    warrantyNote: '',
    contractorNote: '',
    notes: '',
    sections: [
      { name: '', nameEn: '', items: [{ itemName: '', description: '', unit: '', quantity: '1', unitPrice: '0' }] },
    ],
    paymentSteps: [
      { stepOrder: 1, percentage: '30', description: 'Tạm ứng khi ký hợp đồng' },
      { stepOrder: 2, percentage: '70', description: 'Thanh toán khi nghiệm thu bàn giao' },
    ],
  }
}

export function quoteToForm(q: Quote): QuoteFormShape {
  // Gom QuoteItem cùng sectionName lại thành đầu mục
  const map = new Map<string, QuoteSectionFormShape>()
  const order: string[] = []
  for (const it of q.items ?? []) {
    const key = it.sectionName ?? ''
    if (!map.has(key)) { map.set(key, { name: it.sectionName ?? '', nameEn: it.sectionNameEn ?? '', items: [] }); order.push(key) }
    map.get(key)!.items.push({
      id: it.id, itemName: it.itemName, description: it.description ?? '',
      unit: it.unit, quantity: String(it.quantity), unitPrice: String(it.unitPrice),
    })
  }
  const sections = order.map((k) => map.get(k)!)

  return {
    hasProject: !!q.projectId,
    projectId: q.projectId ?? '',
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
    sections: sections.length ? sections : emptyQuoteForm().sections,
    paymentSteps: (q.paymentSteps || []).map((s) => ({
      id: s.id, stepOrder: s.stepOrder, percentage: String(s.percentage), description: s.description,
    })),
  }
}

export function formToValues(v: QuoteFormShape): QuoteFormValues {
  let sortOrder = 0
  const items = v.sections.flatMap((sec) =>
    sec.items.map((line) => {
      sortOrder += 1
      return {
        sectionName: sec.name || null,
        sectionNameEn: sec.nameEn || null,
        sortOrder,
        itemName: line.itemName,
        description: line.description || null,
        unit: line.unit,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
        amount: Number(line.quantity) * Number(line.unitPrice),
        notes: undefined,
      }
    })
  )

  return {
    projectId: v.hasProject ? v.projectId : '',
    newProjectName: v.hasProject ? undefined : v.title,
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
    items,
    paymentSteps: v.paymentSteps.map((s, idx) => ({
      stepOrder: idx + 1, percentage: Number(s.percentage), description: s.description,
    })),
  }
}
