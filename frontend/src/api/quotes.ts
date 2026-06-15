import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mockRequest } from './client'
import { apiGet, apiPost, apiPut, apiPatch } from './http'
import { db, nextId } from '@/mocks/db'
import { createProjectInDb } from './projects'
import type { Quote, QuoteStatus, QuoteItem, QuotePaymentStep, PaymentTermsPreset } from '@/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export interface QuoteFilters { search?: string; status?: string; customerId?: string; projectId?: string }
export interface QuoteFormValues {
  projectId: string; customerId?: string; contactId?: string
  newProjectName?: string   // khi tạo dự án mới từ tên gói thầu (projectId rỗng)
  title: string; quoteDate: string; validUntil?: string
  taxRate: number; validityDays: number; deliveryDays: number
  paymentTerms: PaymentTermsPreset | string
  warrantyNote?: string; contractorNote?: string; notes?: string
  items: Omit<QuoteItem, 'id'>[]
  paymentSteps: Omit<QuotePaymentStep, 'id'>[]
}

const now = () => new Date().toISOString()

function addDays(iso: string, days: number): string {
  const d = iso ? new Date(iso) : new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function nextQuoteCode(existing: string[]): string {
  const nums = existing.map((c) => parseInt(c.replace(/^WS/, ''), 10)).filter((n) => !Number.isNaN(n))
  const max = nums.length ? Math.max(...nums) : 80 // start at 80
  return 'WS' + String(max + 1).padStart(4, '0')
}

/** Xem trước mã báo giá kế tiếp (không tăng counter) — để hiển thị read-only trong form. */
export function peekNextQuoteCode(): string {
  return nextQuoteCode(db.quotes.map((q) => q.code))
}

// Hàm tính toán summary cho Quote từ in-memory db
function enrichQuoteWithSummary(q: Quote): Quote {
  const items = db.quoteItems.filter((qi) => qi.quoteId === q.id)
  const paymentSteps = db.quotePaymentSteps.filter((qps) => qps.quoteId === q.id)
  const project = db.projects.find(p => p.id === q.projectId)
  const customer = db.customers.find(c => c.id === q.customerId)
  
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const taxAmount = subtotal * (q.taxRate / 100)
  const totalAmount = subtotal + taxAmount

  return {
    ...q,
    items,
    paymentSteps,
    project: project ? { id: project.id, name: project.name } : undefined,
    customer: customer ? { id: customer.id, name: customer.name } : undefined,
    subtotal,
    taxAmount,
    totalAmount,
    itemCount: items.length,
    sectionCount: new Set(items.map(i => i.sectionName).filter(Boolean)).size,
  }
}

export function filterQuotes(list: Quote[], f: QuoteFilters): Quote[] {
  return list.filter((q) => {
    if (f.status && q.status !== f.status) return false
    if (f.customerId && q.customerId !== f.customerId) return false
    if (f.projectId && q.projectId !== f.projectId) return false
    if (f.search) {
      const s = f.search.toLowerCase()
      if (!q.title.toLowerCase().includes(s) && !q.code.toLowerCase().includes(s)) return false
    }
    return true
  }).map(enrichQuoteWithSummary)
}

export function createQuoteInDb(v: QuoteFormValues): Quote {
  const id = nextId('quote')
  const code = nextQuoteCode(db.quotes.map((q) => q.code))

  // Tạo nhanh dự án mới từ tên gói thầu khi không chọn dự án có sẵn
  let projectId = v.projectId
  if (!projectId && v.newProjectName) {
    const project = createProjectInDb({
      name: v.newProjectName, customerId: v.customerId, projectType: 'other',
      deadline: addDays(v.quoteDate, 60), status: 'planning', progressPct: 0,
    })
    projectId = project.id
  }

  const quote: Quote = {
    id, code,
    projectId, customerId: v.customerId ?? null, contactId: v.contactId ?? null,
    title: v.title, quoteDate: v.quoteDate, validUntil: v.validUntil ?? null,
    status: 'draft', rejectReason: null, taxRate: v.taxRate,
    validityDays: v.validityDays, deliveryDays: v.deliveryDays, paymentTerms: v.paymentTerms,
    warrantyNote: v.warrantyNote ?? null, contractorNote: v.contractorNote ?? null, notes: v.notes ?? null,
    createdAt: now(), updatedAt: now()
  }
  db.quotes.unshift(quote)

  // Add items
  v.items.forEach((item, index) => {
    db.quoteItems.push({
      ...item,
      id: nextId('qi'),
      quoteId: id,
      sortOrder: item.sortOrder || index + 1,
      amount: item.quantity * item.unitPrice
    })
  })

  // Add payment steps
  v.paymentSteps.forEach((step, index) => {
    db.quotePaymentSteps.push({
      ...step,
      id: nextId('qps'),
      quoteId: id,
      stepOrder: step.stepOrder || index + 1,
    })
  })

  return enrichQuoteWithSummary(quote)
}

export function updateQuoteInDb(id: string, v: QuoteFormValues): Quote | undefined {
  const q = db.quotes.find((x) => x.id === id)
  if (!q) return undefined

  Object.assign(q, {
    projectId: v.projectId, customerId: v.customerId ?? null, contactId: v.contactId ?? null,
    title: v.title, quoteDate: v.quoteDate, validUntil: v.validUntil ?? null,
    taxRate: v.taxRate, validityDays: v.validityDays, deliveryDays: v.deliveryDays,
    paymentTerms: v.paymentTerms, warrantyNote: v.warrantyNote ?? null, 
    contractorNote: v.contractorNote ?? null, notes: v.notes ?? null,
    updatedAt: now()
  })

  // Thay thế toàn bộ items
  db.quoteItems = db.quoteItems.filter((qi) => qi.quoteId !== id)
  v.items.forEach((item, index) => {
    db.quoteItems.push({
      ...item,
      id: nextId('qi'),
      quoteId: id,
      sortOrder: item.sortOrder || index + 1,
      amount: item.quantity * item.unitPrice
    })
  })

  // Thay thế payment steps
  db.quotePaymentSteps = db.quotePaymentSteps.filter((qps) => qps.quoteId !== id)
  v.paymentSteps.forEach((step, index) => {
    db.quotePaymentSteps.push({
      ...step,
      id: nextId('qps'),
      quoteId: id,
      stepOrder: step.stepOrder || index + 1,
    })
  })

  return enrichQuoteWithSummary(q)
}

export function duplicateQuoteInDb(id: string): Quote | undefined {
  const source = db.quotes.find((q) => q.id === id)
  if (!source) return undefined
  
  const sourceItems = db.quoteItems.filter((qi) => qi.quoteId === id)
  const sourceSteps = db.quotePaymentSteps.filter((qps) => qps.quoteId === id)

  const newId = nextId('quote')
  const newCode = nextQuoteCode(db.quotes.map((q) => q.code))

  const newQuote: Quote = {
    ...source,
    id: newId,
    code: newCode,
    status: 'draft',
    title: `${source.title} (Copy)`,
    quoteDate: now().split('T')[0],
    createdAt: now(),
    updatedAt: now()
  }
  db.quotes.unshift(newQuote)

  sourceItems.forEach(item => {
    db.quoteItems.push({ ...item, id: nextId('qi'), quoteId: newId })
  })
  
  sourceSteps.forEach(step => {
    db.quotePaymentSteps.push({ ...step, id: nextId('qps'), quoteId: newId })
  })

  return enrichQuoteWithSummary(newQuote)
}

export function updateQuoteStatusInDb(id: string, status: QuoteStatus, rejectReason?: string): Quote | undefined {
  const q = db.quotes.find((x) => x.id === id)
  if (!q) return undefined
  q.status = status
  if (status === 'rejected') {
    q.rejectReason = rejectReason || null
  } else {
    q.rejectReason = null
  }
  q.updatedAt = now()
  return enrichQuoteWithSummary(q)
}

// ─── HOOKS ───────────────────────────────────────────────────────────────────

export function useQuotes(filters: QuoteFilters = {}) {
  return useQuery<Quote[]>({
    queryKey: ['quotes', filters],
    queryFn: () => USE_MOCK
      ? mockRequest(() => filterQuotes(db.quotes, filters))
      : apiGet<Quote[]>('/quotes', { params: filters }),
  })
}

export function useQuote(id: string | null) {
  return useQuery<Quote | undefined>({
    queryKey: ['quotes', id],
    queryFn: () => USE_MOCK
      ? mockRequest(() => {
          const q = db.quotes.find((x) => x.id === id)
          return q ? enrichQuoteWithSummary(q) : undefined
        })
      : apiGet<Quote>(`/quotes/${id}`),
    enabled: !!id,
  })
}

/** Mã báo giá kế tiếp (async) — dùng để hiển thị read-only trong form tạo mới. */
export function useNextQuoteCode() {
  return useQuery<string>({
    queryKey: ['quotes', 'next-code'],
    queryFn: () => USE_MOCK
      ? mockRequest(() => peekNextQuoteCode())
      : apiGet<string>('/quotes/next-code'),
  })
}

export function useCreateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: QuoteFormValues) => USE_MOCK
      ? mockRequest(() => createQuoteInDb(v))
      : apiPost<Quote>('/quotes', v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotes'] })
      qc.invalidateQueries({ queryKey: ['projects'] }) // có thể vừa tạo dự án mới
    },
  })
}

export function useUpdateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: QuoteFormValues }) => USE_MOCK
      ? mockRequest(() => updateQuoteInDb(id, values))
      : apiPut<Quote>(`/quotes/${id}`, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
  })
}

export function useUpdateQuoteStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, rejectReason }: { id: string; status: QuoteStatus; rejectReason?: string }) => USE_MOCK
      ? mockRequest(() => updateQuoteStatusInDb(id, status, rejectReason))
      : apiPatch<Quote>(`/quotes/${id}/status`, { status, rejectReason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
  })
}

export function useDuplicateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => USE_MOCK
      ? mockRequest(() => duplicateQuoteInDb(id))
      : apiPost<Quote>(`/quotes/${id}/duplicate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
  })
}
