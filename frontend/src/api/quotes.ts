import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mockRequest } from './client'
import { db, nextId } from '@/mocks/db'
import type { Quote, QuoteStatus, QuoteItem, QuotePaymentStep, PaymentTermsPreset } from '@/types'

export interface QuoteFilters { search?: string; status?: string; customerId?: string; projectId?: string }
export interface QuoteFormValues {
  projectId: string; customerId?: string; contactId?: string
  title: string; quoteDate: string; validUntil?: string
  taxRate: number; validityDays: number; deliveryDays: number
  paymentTerms: PaymentTermsPreset | string
  warrantyNote?: string; contractorNote?: string; notes?: string
  items: Omit<QuoteItem, 'id'>[]
  paymentSteps: Omit<QuotePaymentStep, 'id'>[]
}

const now = () => new Date().toISOString()

function nextQuoteCode(existing: string[]): string {
  const nums = existing.map((c) => parseInt(c.replace(/^WS/, ''), 10)).filter((n) => !Number.isNaN(n))
  const max = nums.length ? Math.max(...nums) : 80 // start at 80
  return 'WS' + String(max + 1).padStart(4, '0')
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
  
  const quote: Quote = {
    id, code,
    projectId: v.projectId, customerId: v.customerId ?? null, contactId: v.contactId ?? null,
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
    queryFn: () => mockRequest(() => filterQuotes(db.quotes, filters)),
  })
}

export function useQuote(id: string | null) {
  return useQuery<Quote | undefined>({
    queryKey: ['quotes', id],
    queryFn: () => mockRequest(() => {
      const q = db.quotes.find((x) => x.id === id)
      return q ? enrichQuoteWithSummary(q) : undefined
    }),
    enabled: !!id,
  })
}

export function useCreateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: QuoteFormValues) => mockRequest(() => createQuoteInDb(v)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
  })
}

export function useUpdateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: QuoteFormValues }) =>
      mockRequest(() => updateQuoteInDb(id, values)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
  })
}

export function useUpdateQuoteStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, rejectReason }: { id: string; status: QuoteStatus; rejectReason?: string }) =>
      mockRequest(() => updateQuoteStatusInDb(id, status, rejectReason)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
  })
}

export function useDuplicateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mockRequest(() => duplicateQuoteInDb(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
  })
}
