import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/mocks/db'
import { seedQuotes, seedQuoteItems, seedQuotePaymentSteps } from '@/mocks/seed/quotes'
import { createQuoteInDb, filterQuotes, duplicateQuoteInDb, updateQuoteStatusInDb } from '@/api/quotes'

beforeEach(() => { 
  db.quotes = structuredClone(seedQuotes) 
  db.quoteItems = structuredClone(seedQuoteItems)
  db.quotePaymentSteps = structuredClone(seedQuotePaymentSteps)
})

describe('quotes mock logic', () => {
  it('createQuoteInDb tạo báo giá với item và tính toán đúng tổng tiền', () => {
    const before = db.quotes.length
    const q = createQuoteInDb({
      projectId: 'proj-1',
      title: 'Test Quote',
      quoteDate: '2026-06-15',
      taxRate: 10,
      validityDays: 15,
      deliveryDays: 30,
      paymentTerms: '50-50',
      items: [
        { sectionName: '', itemName: 'Item 1', description: '', unit: 'cái', quantity: 2, unitPrice: 50000, notes: '' },
        { sectionName: '', itemName: 'Item 2', description: '', unit: 'bộ', quantity: 1, unitPrice: 200000, notes: '' }
      ],
      paymentSteps: [
        { stepOrder: 1, percentage: 50, description: 'Tạm ứng' },
        { stepOrder: 2, percentage: 50, description: 'Bàn giao' }
      ]
    })
    
    expect(db.quotes.length).toBe(before + 1)
    expect(q.code).toMatch(/^WS\d{4}$/)
    expect(q.status).toBe('draft')
    
    // Subtotal = 2 * 50k + 1 * 200k = 300,000
    // Tax = 10% = 30,000
    // Total = 330,000
    expect(q.subtotal).toBe(300000)
    expect(q.taxAmount).toBe(30000)
    expect(q.totalAmount).toBe(330000)
    expect(q.itemCount).toBe(2)
  })

  it('filterQuotes lọc theo status và enrich summary', () => {
    const drafts = filterQuotes(db.quotes, { status: 'draft' })
    expect(drafts.length).toBeGreaterThan(0)
    expect(drafts[0].subtotal).toBeDefined()
    expect(drafts[0].taxAmount).toBeDefined()
  })

  it('duplicateQuoteInDb copy đúng item và step, set status = draft', () => {
    const original = db.quotes.find(q => q.id === 'quote-1')!
    const newQuote = duplicateQuoteInDb('quote-1')
    
    expect(newQuote).toBeDefined()
    expect(newQuote!.id).not.toBe('quote-1')
    expect(newQuote!.code).not.toBe(original.code)
    expect(newQuote!.title).toContain('(Copy)')
    expect(newQuote!.status).toBe('draft')
    
    // Check items copied
    const newItems = db.quoteItems.filter(i => i.quoteId === newQuote!.id)
    const originalItems = db.quoteItems.filter(i => i.quoteId === 'quote-1')
    expect(newItems.length).toBe(originalItems.length)
    // Subtotal cho quote-1 là: 356,250,000 + 237,800,000 + 138,000,000 = 732,050,000
    expect(newQuote!.subtotal).toBe(732050000)
  })

  it('updateQuoteStatusInDb cập nhật trạng thái và lý do từ chối', () => {
    const q = updateQuoteStatusInDb('quote-2', 'rejected', 'Giá quá cao')
    expect(q?.status).toBe('rejected')
    expect(q?.rejectReason).toBe('Giá quá cao')

    // Chuyển lại approved thì phải mất reason
    const q2 = updateQuoteStatusInDb('quote-2', 'approved')
    expect(q2?.status).toBe('approved')
    expect(q2?.rejectReason).toBeNull()
  })
})
